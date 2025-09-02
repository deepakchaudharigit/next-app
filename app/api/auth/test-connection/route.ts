import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@lib/prisma'
import { serverEnv } from '@config/env.server'

/**
 * Test Connection API Route
 * Tests database connection and environment configuration
 * 
 * GET /api/auth/test-connection
 */
export async function GET(_req: NextRequest) {
  try {
    // Test database connection
    await prisma.$connect()
    
    // Test a simple query
    const userCount = await prisma.user.count()
    
    return NextResponse.json({
      success: true,
      message: 'Connection test successful',
      data: {
        database: {
          connected: true,
          userCount,
        },
        environment: {
          nodeEnv: process.env.NODE_ENV,
          nextAuthUrl: serverEnv.NEXTAUTH_URL,
          nextAuthSecretExists: !!serverEnv.NEXTAUTH_SECRET,
          databaseUrlExists: !!process.env.DATABASE_URL,
        },
        timestamp: new Date().toISOString(),
      }
    })
  } catch (error) {
    console.error('Connection test failed:', error)
    
    return NextResponse.json(
      {
        success: false,
        message: 'Connection test failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        environment: {
          nodeEnv: process.env.NODE_ENV,
          nextAuthUrl: serverEnv.NEXTAUTH_URL,
          nextAuthSecretExists: !!serverEnv.NEXTAUTH_SECRET,
          databaseUrlExists: !!process.env.DATABASE_URL,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}