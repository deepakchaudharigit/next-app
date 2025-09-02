/**
 * Middleware Configuration
 * Handles route protection, authentication checks, and role-based access control for the NPCL Dashboard application.
 */

import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import { UserRole } from './types/auth'

export default withAuth(
  function middleware(req) {
    // Performance optimization: Add cache headers for static assets
    const response = NextResponse.next()
    
    // Add performance headers
    response.headers.set('X-DNS-Prefetch-Control', 'on')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    
    // BFCache optimization - avoid no-store for navigation
    if (req.nextUrl.pathname.startsWith('/dashboard') || req.nextUrl.pathname === '/') {
      response.headers.set('Cache-Control', 'private, max-age=0, must-revalidate')
    }
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

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