import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@lib/prisma'
import { verifyPassword } from '@lib/auth'
import { loginSchema } from '@lib/validations'
import { logAuditEvent } from '@lib/auth-utils'
import { ZodError } from 'zod'
import { cookies } from 'next/headers'
import { SignJWT } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'fallback-secret')

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
        isDeleted: true,
      }
    })

    if (!user || user.isDeleted) {
      // Log failed login attempt
      try {
        await logAuditEvent(
          'unknown',
          'login_failed',
          'auth',
          { 
            email,
            error: 'User not found',
            method: 'api_login'
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
            method: 'api_login'
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

    // Create session token
    const sessionToken = await new SignJWT({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET)

    // Store session in database
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    await prisma.userSession.create({
      data: {
        userId: user.id,
        token: sessionToken,
        expiresAt,
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
      }
    })

    // Log successful login
    try {
      await logAuditEvent(
        user.id,
        'login_success',
        'auth',
        { 
          email: user.email,
          method: 'api_login'
        },
        req
      )
    } catch (auditError) {
      console.warn('Failed to log audit event:', auditError)
    }

    // Set session cookie
    const response = NextResponse.json({
      success: true,
      message: 'Logged in successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })

    // Set secure cookie
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 24 * 60 * 60, // 24 hours
    }

    response.cookies.set('auth-token', sessionToken, cookieOptions)

    return response

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

    console.error('Login API error:', error instanceof Error ? error.message : 'Unknown error')
    
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle GET requests - return current session status
export async function GET(req: NextRequest) {
  try {
    const authToken = req.cookies.get('auth-token')?.value

    if (!authToken) {
      return NextResponse.json({
        success: false,
        message: 'Not authenticated',
        authenticated: false,
      })
    }

    // Verify token and get session
    const session = await prisma.userSession.findFirst({
      where: {
        token: authToken,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isDeleted: true,
          },
        },
      },
    })

    if (!session || session.user.isDeleted) {
      return NextResponse.json({
        success: false,
        message: 'Invalid or expired session',
        authenticated: false,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Authenticated',
      authenticated: true,
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
      },
    })
  } catch (error: unknown) {
    console.error('Login GET error:', error instanceof Error ? error.message : 'Unknown error')
    
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}