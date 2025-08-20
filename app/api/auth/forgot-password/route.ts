import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@lib/prisma'
import { generateResetToken } from '@lib/auth'
import { sendPasswordResetEmail } from '@lib/email'
import { forgotPasswordSchema } from '@lib/validations'
import { ZodError } from 'zod'

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json()
    const { email } = forgotPasswordSchema.parse(body)

    // Look up user silently (no error if not found)
    const user = await prisma.user.findUnique({ where: { email } })

    // Always return success message to avoid email enumeration
    const genericResponse = {
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
    }

    if (!user) {
      return NextResponse.json(genericResponse)
    }

    // Generate secure reset token and expiry time
    const resetToken = generateResetToken()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

    // Invalidate old tokens (optional, for security)
    await prisma.passwordReset.deleteMany({
      where: {
        userId: user.id,
      },
    })

    // Save the new reset token
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt,
      },
    })

    // Attempt to send the reset email
    const emailSent = await sendPasswordResetEmail(email, resetToken, user.name)

    if (!emailSent) {
      console.warn(`Password reset email failed to send for ${email}`)
    }

    return NextResponse.json(genericResponse)
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid input data',
          errors: error.issues,
        },
        { status: 400 }
      )
    }

    console.error('Forgot password error:', error instanceof Error ? error.message : 'Unknown error')

    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
      },
      { status: 500 }
    )
  }
}
