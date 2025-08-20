import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@lib/nextauth'
import { prisma } from '@lib/prisma'
import { UserRole } from '@prisma/client'

export interface AuthenticatedUser {
  id: string
  email: string
  role: UserRole
  name: string
}

/* -------------------------------------------------------------------------- */
/*                         Custom Error Classes                               */
/* -------------------------------------------------------------------------- */

export class DatabaseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DatabaseError'
  }
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthenticationError'
  }
}

/* -------------------------------------------------------------------------- */
/*                         Authenticated User Fetchers                        */
/* -------------------------------------------------------------------------- */

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return null

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, role: true, name: true },
    })

    return user
  } catch (error: unknown) {
    console.error('Authentication error:', error)
    if (isDatabaseError(error)) throw new DatabaseError('Database connection failed')
    return null
  }
}

export async function requireAuthenticatedUser(): Promise<AuthenticatedUser> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new AuthenticationError('Authentication required')

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, role: true, name: true },
    })

    if (!user) throw new AuthenticationError('User not found')
    return user
  } catch (error: unknown) {
    console.error('requireAuthenticatedUser error:', error)

    if (error instanceof AuthenticationError || error instanceof DatabaseError) throw error
    if (isDatabaseError(error)) throw new DatabaseError('Database connection failed')

    throw new AuthenticationError('Authentication failed')
  }
}

/* -------------------------------------------------------------------------- */
/*                             Error Type Checker                             */
/* -------------------------------------------------------------------------- */

function isDatabaseError(error: unknown): boolean {
  const dbCodes = [
    'P1001', 'P1002', 'P1003', 'P1008', 'P1009', 'P1010', 'P1011', 'P1012',
    'P1013', 'P1014', 'P1015', 'P1016', 'P1017', 'ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT',
  ]

  if (!error || typeof error !== 'object') return false
  
  const errorObj = error as Record<string, unknown>
  const code = errorObj.code as string
  const message = errorObj.message as string
  
  return (
    dbCodes.includes(code) ||
    (typeof message === 'string' && (
      message.includes('Database connection failed') ||
      message.includes('Connection terminated') ||
      message.includes('connect ECONNREFUSED') ||
      message.includes('timeout')
    ))
  )
}

/* -------------------------------------------------------------------------- */
/*                        Role-Based Access Utilities                         */
/* -------------------------------------------------------------------------- */

export function hasRequiredRole(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    VIEWER: 1,
    OPERATOR: 2,
    ADMIN: 3,
  }

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

/* -------------------------------------------------------------------------- */
/*                              Client IP Extraction                          */
/* -------------------------------------------------------------------------- */

export function getClientIP(req?: NextRequest): string {
  if (!req) return 'unknown'
  
  const xForwardedFor = req.headers.get('x-forwarded-for')
  if (xForwardedFor) {
    // Get the first IP from the comma-separated list
    return xForwardedFor.split(',')[0]?.trim() || 'unknown'
  }
  
  const xRealIp = req.headers.get('x-real-ip')
  if (xRealIp) {
    return xRealIp.trim()
  }
  
  return 'unknown'
}

/* -------------------------------------------------------------------------- */
/*                         Audit Logging (non-blocking)                       */
/* -------------------------------------------------------------------------- */

export async function logAuditEvent(
  userId: string,
  action: string,
  resource: string,
  details?: Record<string, unknown>,
  req?: NextRequest,
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resource,
        details: details ? JSON.stringify(details) : undefined,
        ipAddress: getClientIP(req),
        userAgent: req?.headers.get('user-agent') || 'unknown',
      },
    })
  } catch (error) {
    console.error('Audit log failed:', error)
    if (isDatabaseError(error)) throw new DatabaseError('Audit logging failed - database unavailable')
  }
}

/* -------------------------------------------------------------------------- */
/*                          Standard Error Responses                          */
/* -------------------------------------------------------------------------- */

export function createUnauthorizedResponse(message = 'Authentication required') {
  return {
    success: false,
    error: message,
    code: 'UNAUTHORIZED',
    status: 401,
  }
}

export function createForbiddenResponse(message = 'Insufficient permissions') {
  return {
    success: false,
    error: message,
    code: 'FORBIDDEN',
    status: 403,
  }
}

export function createServerErrorResponse(message = 'Internal server error') {
  return {
    success: false,
    error: message,
    code: 'INTERNAL_ERROR',
    status: 500,
  }
}

/* -------------------------------------------------------------------------- */
/*                 Higher-Order Middleware for Route Protection               */
/* -------------------------------------------------------------------------- */

export function withAuth<T extends unknown[]>(
  handler: (req: NextRequest, sessionUser: AuthenticatedUser, ...args: T) => Promise<NextResponse>
) {
  return async (req: NextRequest, ...args: T) => {
    try {
      const user = await requireAuthenticatedUser()
      return await handler(req, user, ...args)
    } catch (error) {
      const { response, status } = handleAuthError(error)
      return NextResponse.json(response, { status })
    }
  }
}

export function withAdminAuth<T extends unknown[]>(
  handler: (req: NextRequest, sessionUser: AuthenticatedUser, ...args: T) => Promise<NextResponse>
) {
  return async (req: NextRequest, ...args: T) => {
    try {
      const user = await requireAuthenticatedUser()

      if (!hasRequiredRole(user.role, UserRole.ADMIN)) {
        return NextResponse.json(createUnauthorizedResponse('Admin access required'), { status: 401 })
      }

      return await handler(req, user, ...args)
    } catch (error) {
      const { response, status } = handleAuthError(error)
      return NextResponse.json(response, { status })
    }
  }
}

/* -------------------------------------------------------------------------- */
/*                      General Auth Error Catch Utility                      */
/* -------------------------------------------------------------------------- */

export function handleAuthError(error: unknown) {
  if (error instanceof DatabaseError) {
    return { response: createServerErrorResponse(error.message), status: 500 }
  }

  if (error instanceof AuthenticationError) {
    return { response: createUnauthorizedResponse(error.message), status: 401 }
  }

  return {
    response: createServerErrorResponse('An unexpected error occurred'),
    status: 500,
  }
}
