import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@lib/prisma'
import { verifyPassword } from '@lib/auth'

/**
 * Simple Login Test API Route
 * Tests authentication without NextAuth complexity
 * 
 * POST /api/auth/test-simple-login
 * Body: { email: string, password: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Email and password are required',
          example: { email: 'admin@npcl.com', password: 'admin123' }
        },
        { status: 400 }
      )
    }

    console.log('🔍 Testing simple login for:', email)

    // Find user
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
      console.log('❌ User not found or deleted:', email)
      return NextResponse.json(
        { 
          success: false, 
          message: 'User not found',
          email: email.toLowerCase()
        },
        { status: 404 }
      )
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password)
    
    if (!isValidPassword) {
      console.log('❌ Invalid password for:', email)
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid password',
          email: user.email
        },
        { status: 401 }
      )
    }

    console.log('✅ Simple login successful for:', email)
    
    // Return success
    return NextResponse.json({
      success: true,
      message: 'Authentication successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      note: 'This is a simple test. Use NextAuth signin for actual login sessions.'
    })
  } catch (error) {
    console.error('Simple login test error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
      },
      { status: 500 }
    )
  }
}