import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@lib/nextauth'
import { prisma } from '@lib/prisma'

/**
 * Logout API Route
 * Handles server-side logout operations and audit logging
 * 
 * POST /api/auth/logout
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (session?.user?.id) {
      // Log logout event for audit purposes
      try {
        await prisma.auditLog.create({
          data: {
            userId: session.user.id,
            action: 'logout',
            resource: 'auth',
            details: { 
              method: 'api_logout',
              userAgent: req.headers.get('user-agent') || 'unknown',
              ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
            },
          }
        })
      } catch (auditError) {
        console.warn('Failed to log logout audit event:', auditError)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })
  } catch (error) {
    console.error('Logout API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Logout failed',
        error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
      },
      { status: 500 }
    )
  }
}

// Handle GET requests (redirect to POST)
export async function GET() {
  return NextResponse.json(
    { 
      success: false, 
      message: 'Use POST method for logout',
      method: 'POST'
    },
    { status: 405 }
  )
}