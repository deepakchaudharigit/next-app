import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@lib/prisma'
import { hashPassword } from '@lib/auth'
import { resetPasswordSchema } from '@lib/validations'
import { logAuditEvent } from '@lib/auth-utils'
import { ZodError } from 'zod'

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json()
    
    // Validate input
    const validatedData = resetPasswordSchema.parse(body)
    const { token, newPassword } = validatedData

    // Find valid reset token
    const passwordReset = await prisma.passwordReset.findFirst({
      where: {
        token,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    })

    if (!passwordReset) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword)

    // Update user password and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: passwordReset.userId },
        data: { password: hashedPassword },
      }),
      prisma.passwordReset.update({
        where: { id: passwordReset.id },
        data: { used: true },
      }),
      // Invalidate all existing sessions for this user
      prisma.userSession.deleteMany({
        where: { userId: passwordReset.userId },
      }),
    ])

    // Log audit event
    await logAuditEvent(
      passwordReset.userId,
      'password_reset',
      'user',
      { email: passwordReset.user.email },
      req
    )

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully',
    })
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, message: 'Invalid input data', errors: error.issues },
        { status: 400 }
      )
    }

    console.error('Reset password error:', error instanceof Error ? error.message : 'Unknown error')

    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to verify reset token
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Reset token is required' },
        { status: 400 }
      )
    }

    console.log('Verifying token:', token)
    console.log('Current time:', new Date().toISOString())

    // First, check if token exists at all
    const tokenExists = await prisma.passwordReset.findFirst({
      where: { token },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    })

    if (!tokenExists) {
      console.log('Token not found in database')
      return NextResponse.json(
        { success: false, message: 'Reset token not found' },
        { status: 400 }
      )
    }

    console.log('Token found:', {
      id: tokenExists.id,
      used: tokenExists.used,
      expiresAt: tokenExists.expiresAt.toISOString(),
      createdAt: tokenExists.createdAt.toISOString(),
      email: tokenExists.user.email
    })

    // Check if token has been used
    if (tokenExists.used) {
      console.log('Token has already been used')
      return NextResponse.json(
        { success: false, message: 'Reset token has already been used' },
        { status: 400 }
      )
    }

    // Check if token has expired
    const now = new Date()
    if (tokenExists.expiresAt <= now) {
      console.log('Token has expired:', {
        expiresAt: tokenExists.expiresAt.toISOString(),
        now: now.toISOString()
      })
      return NextResponse.json(
        { success: false, message: 'Reset token has expired' },
        { status: 400 }
      )
    }

    console.log('Token is valid')
    return NextResponse.json({
      success: true,
      message: 'Token is valid',
      data: {
        email: tokenExists.user.email,
      },
    })
  } catch (error: unknown) {
    console.error('Verify reset token error:', error instanceof Error ? error.message : 'Unknown error')
    
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}