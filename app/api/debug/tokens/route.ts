import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@lib/prisma'

// Debug endpoint to check password reset tokens
export async function GET(_req: NextRequest) {
  try {
    // Only enable in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, message: 'Debug endpoint not available in production' },
        { status: 403 }
      )
    }

    const tokens = await prisma.passwordReset.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    })

    const now = new Date()
    const tokensWithStatus = tokens.map(token => ({
      id: token.id,
      token: token.token.substring(0, 10) + '...', // Only show first 10 chars for security
      email: token.user.email,
      used: token.used,
      expired: token.expiresAt <= now,
      expiresAt: token.expiresAt.toISOString(),
      createdAt: token.createdAt.toISOString(),
    }))

    return NextResponse.json({
      success: true,
      data: {
        currentTime: now.toISOString(),
        tokens: tokensWithStatus,
      },
    })
  } catch (error: unknown) {
    console.error('Debug tokens error:', error instanceof Error ? error.message : 'Unknown error')
    
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}