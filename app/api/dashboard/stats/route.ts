import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@lib/auth-utils'
import { prisma } from '@lib/prisma'
import { dashboardStatsQuerySchema } from '@lib/validations'
import { ZodError } from 'zod'

export const GET = withAuth(async (req: NextRequest, sessionUser) => {
  try {
    const { searchParams } = new URL(req.url)
    
    // Convert URLSearchParams to object for Zod validation
    const queryParams = Object.fromEntries(searchParams.entries())
    
    // Validate query parameters
    const validationResult = dashboardStatsQuerySchema.safeParse(queryParams)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid query parameters',
          errors: validationResult.error.issues,
        },
        { status: 400 }
      )
    }
    
    const { timeRange, includeOffline } = validationResult.data
    
    // Calculate time window based on timeRange
    const now = new Date()
    let startTime: Date
    
    switch (timeRange) {
      case '1h':
        startTime = new Date(now.getTime() - 60 * 60 * 1000)
        break
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    }
    
    // Get dashboard statistics
    const [
      totalUsers,
      totalReports,
      recentAuditLogs,
      voicebotCallsCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.report.count({
        where: {
          createdAt: {
            gte: startTime,
          },
        },
      }),
      prisma.auditLog.count({
        where: {
          timestamp: {
            gte: startTime,
          },
        },
      }),
      prisma.voicebotCall.count({
        where: {
          receivedAt: {
            gte: startTime,
          },
        },
      }),
    ])
    
    // Get recent activity
    const recentActivity = await prisma.auditLog.findMany({
      take: 10,
      orderBy: {
        timestamp: 'desc',
      },
      select: {
        id: true,
        action: true,
        resource: true,
        timestamp: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })
    
    const stats = {
      totalUsers,
      totalReports,
      recentAuditLogs,
      voicebotCallsCount,
      timeRange,
      recentActivity,
    }
    
    return NextResponse.json({
      success: true,
      message: 'Dashboard stats retrieved successfully',
      data: stats,
    })
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid query parameters',
          errors: error.issues,
        },
        { status: 400 }
      )
    }
    
    console.error('Dashboard stats error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
})