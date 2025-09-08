/**
 * Secure API Wrapper
 * Wraps API routes with comprehensive security features
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuthRateLimit, withApiRateLimit } from './rate-limiting-middleware'
import { withCSRFProtection } from './csrf-protection'
import { validateRequestForSQLInjection } from './sql-injection-prevention'
import { errorHandler } from '@/lib/resilience/error-handler'
import { performanceMonitor } from '@/lib/monitoring/performance'

interface SecureAPIOptions {
  requireAuth?: boolean
  requireCSRF?: boolean
  rateLimit?: 'auth' | 'api' | 'none'
  validateSQL?: boolean
  allowedMethods?: string[]
  requiredRole?: 'ADMIN' | 'OPERATOR' | 'VIEWER'
}

export function withSecurity(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: SecureAPIOptions = {}
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now()
    
    try {
      // 1. Method validation
      if (options.allowedMethods && !options.allowedMethods.includes(req.method)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'METHOD_NOT_ALLOWED',
              message: `Method ${req.method} not allowed`
            }
          },
          { status: 405 }
        )
      }

      // 2. SQL Injection validation
      if (options.validateSQL !== false) {
        const sqlValidation = validateRequestForSQLInjection({
          body: await req.clone().json().catch(() => ({})),
          query: Object.fromEntries(req.nextUrl.searchParams)
        })

        if (!sqlValidation.isValid) {
          const criticalThreats = sqlValidation.threats.filter(
            t => t.threats.some(threat => threat.severity === 'critical')
          )

          if (criticalThreats.length > 0) {
            console.error('🚨 SQL injection blocked in API:', {
              path: req.nextUrl.pathname,
              method: req.method,
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
      }

      // 3. Rate limiting
      if (options.rateLimit === 'auth') {
        const rateLimitResponse = await withAuthRateLimit(req)
        if (rateLimitResponse) return rateLimitResponse
      } else if (options.rateLimit === 'api' || options.rateLimit === undefined) {
        const rateLimitResponse = await withApiRateLimit(req)
        if (rateLimitResponse) return rateLimitResponse
      }

      // 4. CSRF protection
      if (options.requireCSRF !== false && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        const csrfResponse = await withCSRFProtection(req)
        if (csrfResponse) return csrfResponse
      }

      // 5. Authentication check
      if (options.requireAuth !== false) {
        const authHeader = req.headers.get('authorization')
        const sessionCookie = req.cookies.get('next-auth.session-token')?.value

        if (!authHeader && !sessionCookie) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'AUTHENTICATION_REQUIRED',
                message: 'Authentication required'
              }
            },
            { status: 401 }
          )
        }
      }

      // 6. Role-based authorization
      if (options.requiredRole) {
        const userRole = req.headers.get('x-user-role')
        
        if (!userRole) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'ROLE_REQUIRED',
                message: 'User role information required'
              }
            },
            { status: 403 }
          )
        }

        const roleHierarchy = { 'VIEWER': 1, 'OPERATOR': 2, 'ADMIN': 3 }
        const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0
        const requiredLevel = roleHierarchy[options.requiredRole] || 0

        if (userLevel < requiredLevel) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'INSUFFICIENT_PERMISSIONS',
                message: `${options.requiredRole} role required`
              }
            },
            { status: 403 }
          )
        }
      }

      // 7. Execute the handler
      const response = await handler(req)

      // 8. Track performance
      performanceMonitor.trackRequest(req, startTime, response.status)

      // 9. Add security headers to response
      response.headers.set('X-Content-Type-Options', 'nosniff')
      response.headers.set('X-Frame-Options', 'DENY')
      response.headers.set('X-XSS-Protection', '1; mode=block')

      return response

    } catch (error) {
      // Handle errors with comprehensive error handler
      return errorHandler.handleApiError(error, req)
    }
  }
}

// Convenience wrappers for common security configurations
export function withAuthSecurity(handler: (req: NextRequest) => Promise<NextResponse>) {
  return withSecurity(handler, {
    requireAuth: true,
    requireCSRF: true,
    rateLimit: 'auth',
    validateSQL: true,
    allowedMethods: ['POST']
  })
}

export function withAdminSecurity(handler: (req: NextRequest) => Promise<NextResponse>) {
  return withSecurity(handler, {
    requireAuth: true,
    requireCSRF: true,
    rateLimit: 'api',
    validateSQL: true,
    requiredRole: 'ADMIN'
  })
}

export function withOperatorSecurity(handler: (req: NextRequest) => Promise<NextResponse>) {
  return withSecurity(handler, {
    requireAuth: true,
    requireCSRF: true,
    rateLimit: 'api',
    validateSQL: true,
    requiredRole: 'OPERATOR'
  })
}

export function withPublicSecurity(handler: (req: NextRequest) => Promise<NextResponse>) {
  return withSecurity(handler, {
    requireAuth: false,
    requireCSRF: false,
    rateLimit: 'api',
    validateSQL: true
  })
}

// Enhanced validation schemas with SQL injection protection
export function createSecureValidationSchema<T>(
  baseSchema: T,
  additionalValidation?: (data: any) => { isValid: boolean; errors?: string[] }
): T {
  // This would wrap the base schema with additional SQL injection validation
  // Implementation depends on your validation library (Zod, Joi, etc.)
  return baseSchema
}

// Secure request body parser
export async function parseSecureRequestBody(req: NextRequest): Promise<{
  data: any
  isValid: boolean
  errors: string[]
}> {
  try {
    const body = await req.json()
    
    // Validate for SQL injection
    const sqlValidation = validateRequestForSQLInjection({ body })
    
    if (!sqlValidation.isValid) {
      const errors = sqlValidation.threats.flatMap(t => 
        t.threats.map(threat => `${t.field}: ${threat.description}`)
      )
      
      return {
        data: sqlValidation.sanitizedBody || body,
        isValid: false,
        errors
      }
    }

    return {
      data: body,
      isValid: true,
      errors: []
    }
  } catch (error) {
    return {
      data: null,
      isValid: false,
      errors: ['Invalid JSON in request body']
    }
  }
}