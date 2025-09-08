/**
 * Enhanced Security Middleware
 * Handles authentication, RBAC, rate limiting, CSRF protection, and SQL injection prevention
 */

import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import { UserRole } from './types/auth'
import { rateLimitMiddleware } from './lib/security/rate-limiting-middleware'
import { csrfProtection } from './lib/security/csrf-protection'
import { sqlInjectionPrevention } from './lib/security/sql-injection-prevention'

export default withAuth(
  async function middleware(req) {
    const { pathname } = req.nextUrl
    
    // 1. SQL Injection Prevention - Check all inputs
    const sqlValidation = sqlInjectionPrevention.validateRequest({
      body: req.body,
      query: Object.fromEntries(req.nextUrl.searchParams)
    })
    
    if (!sqlValidation.isValid) {
      const criticalThreats = sqlValidation.threats.filter(
        t => t.threats.some(threat => threat.severity === 'critical')
      )
      
      if (criticalThreats.length > 0) {
        console.error('🚨 SQL injection attempt blocked:', {
          path: pathname,
          threats: criticalThreats
        })
        
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'SECURITY_VIOLATION',
              message: 'Request blocked due to security policy violation'
            }
          },
          { status: 403 }
        )
      }
    }
    
    // 2. Rate Limiting - Apply different limits based on route type
    let rateLimitResponse: NextResponse | null = null
    
    if (pathname.startsWith('/api/auth/')) {
      rateLimitResponse = await rateLimitMiddleware.checkAuthRateLimit(req)
    } else if (pathname.startsWith('/api/reports/')) {
      rateLimitResponse = await rateLimitMiddleware.checkReportRateLimit(req)
    } else if (pathname.startsWith('/api/')) {
      rateLimitResponse = await rateLimitMiddleware.checkApiRateLimit(req)
    }
    
    if (rateLimitResponse) {
      return rateLimitResponse
    }
    
    // 3. CSRF Protection - For state-changing requests
    const csrfResponse = await csrfProtection.protect(req)
    if (csrfResponse) {
      return csrfResponse
    }
    
    // Create response with security headers
    const response = NextResponse.next()
    
    // Security headers
    response.headers.set('X-DNS-Prefetch-Control', 'on')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    
    // Content Security Policy
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self'",
      "frame-ancestors 'none'"
    ].join('; ')
    response.headers.set('Content-Security-Policy', csp)
    
    // BFCache optimization - avoid no-store for navigation
    if (pathname.startsWith('/dashboard') || pathname === '/') {
      response.headers.set('Cache-Control', 'private, max-age=0, must-revalidate')
    }
    const token = req.nextauth.token

    // Define routes that don't require authentication
    const publicRoutes = [
      '/',
      '/auth/login',
      '/auth/register',
      '/auth/error',
      '/api/auth',
    ]

    // Check if current route is publicly accessible
    const isPublicRoute = publicRoutes.some(route => 
      pathname.startsWith(route) || pathname === route
    )

    // Allow access to public routes without authentication
    if (isPublicRoute) {
      return response
    }

    // Redirect unauthenticated users to login page
    if (!token) {
      const loginUrl = new URL('/auth/login', req.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Apply role-based access control for authenticated users
    const userRole = token.role as UserRole

    // Routes restricted to administrators only
    const adminRoutes = [
      '/admin',
      '/api/admin',
      '/api/auth/users',
      '/dashboard/users',
      '/dashboard/system-config',
    ]

    const isAdminRoute = adminRoutes.some(route => 
      pathname.startsWith(route)
    )

    if (isAdminRoute && userRole !== UserRole.ADMIN) {
      return NextResponse.redirect(new URL('/dashboard?error=unauthorized', req.url))
    }

    // Routes accessible to operators and administrators
    const operatorRoutes = [
      '/dashboard/power-units/create',
      '/dashboard/power-units/edit',
      '/dashboard/maintenance',
      '/api/dashboard/power-units',
      '/api/dashboard/maintenance',
    ]

    const isOperatorRoute = operatorRoutes.some(route => 
      pathname.startsWith(route)
    )

    if (isOperatorRoute && userRole === UserRole.VIEWER) {
      return NextResponse.redirect(new URL('/dashboard?error=insufficient-permissions', req.url))
    }

    // Add user context to API route headers for authentication
    if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
      // Inject user information into request headers for API routes
      const requestHeaders = new Headers(req.headers)
      requestHeaders.set('x-user-id', token.id)
      requestHeaders.set('x-user-role', userRole)
      requestHeaders.set('x-user-email', token.email || '')

      const apiResponse = NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
      
      // Add performance headers for API routes
      apiResponse.headers.set('Cache-Control', 'private, no-cache')
      return apiResponse
    }

    return response
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // Define publicly accessible routes
        const publicRoutes = [
          '/',
          '/auth/login',
          '/auth/register',
          '/auth/error',
          '/api/auth',
        ]

        const isPublicRoute = publicRoutes.some(route => 
          pathname.startsWith(route) || pathname === route
        )

        if (isPublicRoute) {
          return true
        }

        // Require valid token for protected routes
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    // Match all request paths except static files and assets
    // Excludes: _next/static, _next/image, favicon.ico, and public folder
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}