import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@lib/nextauth'
import { prisma } from '@lib/prisma'
import { logAuditEvent } from '@lib/auth-utils'

export async function POST(req: NextRequest) {
  try {
    // Get the current session
    const session = await getServerSession(authOptions)
    
    // Even if no session, we'll return success (idempotent logout)
    let userId: string | null = null
    let userEmail: string | null = null

    if (session?.user?.id) {
      userId = session.user.id
      userEmail = session.user.email

      // Log the logout event for audit trail
      try {
        await logAuditEvent(
          userId,
          'logout',
          'auth',
          { 
            email: userEmail,
            method: 'api_logout'
          },
          req
        )
      } catch (error) {
        console.warn('Failed to log audit event:', error)
      }

    // Clear any user sessions in the database (if you're tracking them)
    try {
      await prisma.userSession.deleteMany({
        where: { userId }
      })
    } catch (error) {
      // Non-critical error, continue with logout
      console.warn('Failed to clear user sessions:', error)
    }

    // Also clear custom auth token sessions
    const authToken = req.cookies.get('auth-token')?.value
    if (authToken) {
      try {
        await prisma.userSession.deleteMany({
          where: { token: authToken }
        })
      } catch (error) {
        console.warn('Failed to clear auth token session:', error)
      }
    }

    // Set headers to clear NextAuth cookies
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })

    // Clear NextAuth session cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/'
    }

    response.cookies.set('next-auth.session-token', '', { ...cookieOptions, maxAge: 0 })
    response.cookies.set('__Secure-next-auth.session-token', '', { ...cookieOptions, maxAge: 0 })
    response.cookies.set('next-auth.callback-url', '', { ...cookieOptions, maxAge: 0 })
    response.cookies.set('__Secure-next-auth.callback-url', '', { ...cookieOptions, maxAge: 0 })
    response.cookies.set('next-auth.csrf-token', '', { ...cookieOptions, maxAge: 0 })
    response.cookies.set('__Host-next-auth.csrf-token', '', { ...cookieOptions, maxAge: 0 })
    response.cookies.set('auth-token', '', { ...cookieOptions, maxAge: 0 })

    return response

  } catch (error: unknown) {
    console.error('Logout API error:', error instanceof Error ? error.message : 'Unknown error')
    
    return NextResponse.json(
      { success: false, message: 'Internal server error during logout' },
      { status: 500 }
    )
  }
}

// Handle GET requests (for compatibility)
export async function GET(req: NextRequest) {
  return POST(req)
}