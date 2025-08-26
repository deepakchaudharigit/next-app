import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@lib/nextauth'
import { loginSchema } from '@lib/validations'
import { logAuditEvent } from '@lib/auth-utils'
import { prisma } from '@lib/prisma'
import { verifyPassword } from '@lib/auth'
import { ZodError } from 'zod'

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json()
    
    // Validate input
    const validatedData = loginSchema.parse(body)
    const { email, password } = validatedData

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true,
      }
    })

    if (!user) {
      // Log failed login attempt
      try {
        await logAuditEvent(
          'unknown',
          'login_failed',
          'auth',
          { 
            email,
            error: 'User not found',
            method: 'api_signin'
          },
          req
        )
      } catch (auditError) {
        console.warn('Failed to log audit event:', auditError)
      }

      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid credentials'
        },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password)
    
    if (!isValidPassword) {
      // Log failed login attempt
      try {
        await logAuditEvent(
          user.id,
          'login_failed',
          'auth',
          { 
            email,
            error: 'Invalid password',
            method: 'api_signin'
          },
          req
        )
      } catch (auditError) {
        console.warn('Failed to log audit event:', auditError)
      }

      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid credentials'
        },
        { status: 401 }
      )
    }

    // Log successful login
    try {
      await logAuditEvent(
        user.id,
        'login_success',
        'auth',
        { 
          email: user.email,
          method: 'api_signin'
        },
        req
      )
    } catch (auditError) {
      console.warn('Failed to log audit event:', auditError)
    }

    // Note: This endpoint validates credentials but doesn't create a session
    // The client should use NextAuth signIn after successful validation
    // or we need to manually create the session
    
    return NextResponse.json({
      success: true,
      message: 'Credentials validated successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      note: 'Use NextAuth signIn on client-side to create session'
    })

  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid input data', 
          errors: error.issues 
        },
        { status: 400 }
      )
    }

    console.error('Signin API error:', error instanceof Error ? error.message : 'Unknown error')
    
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle GET requests - return signin form info or current session
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (session?.user) {
      return NextResponse.json({
        success: true,
        message: 'Already signed in',
        user: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          role: session.user.role,
        },
      })
    }

    return NextResponse.json({
      success: false,
      message: 'Not signed in',
      requiresAuth: true,
    })
  } catch (error: unknown) {
    console.error('Signin GET error:', error instanceof Error ? error.message : 'Unknown error')
    
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}