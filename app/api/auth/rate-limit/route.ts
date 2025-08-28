import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@middleware/authMiddleware'
import { authRateLimiter } from '@lib/rate-limiting'
import { getClientIP } from '@lib/auth-utils'

/**
 * Rate Limiting Management API
 * GET /api/auth/rate-limit - Get rate limiting statistics
 * DELETE /api/auth/rate-limit - Reset rate limits (admin only)
 * POST /api/auth/rate-limit/reset - Reset specific rate limit (admin only)
 */

/**
 * Get rate limiting statistics
 * Requires admin authentication
 */
export async function GET(req: NextRequest) {
  const { user, response } = await requireAdmin()
  if (response) return response

  try {
    const stats = authRateLimiter.getStats()
    
    return NextResponse.json({
      success: true,
      data: {
        statistics: stats,
        configuration: {
          windowMs: 900000, // 15 minutes
          maxAttempts: 5,
          windowMinutes: 15
        },
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error getting rate limit stats:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get rate limiting statistics',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}

/**
 * Reset all rate limits
 * Requires admin authentication
 */
export async function DELETE(req: NextRequest) {
  const { user, response } = await requireAdmin()
  if (response) return response

  try {
    authRateLimiter.resetAll()
    
    // Log admin action
    const { logAuditEvent } = await import('@lib/auth-utils')
    await logAuditEvent(
      user!.id,
      'rate_limit_reset_all',
      'auth',
      { 
        adminEmail: user!.email,
        ip: getClientIP(req)
      },
      req
    )
    
    return NextResponse.json({
      success: true,
      message: 'All rate limits have been reset',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error resetting rate limits:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to reset rate limits',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}

/**
 * Reset specific rate limit
 * Requires admin authentication
 * Body: { email: string, ip?: string }
 */
export async function POST(req: NextRequest) {
  const { user, response } = await requireAdmin()
  if (response) return response

  try {
    const body = await req.json()
    const { email, ip } = body

    if (!email) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Email is required',
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      )
    }

    const targetIp = ip || 'unknown'
    authRateLimiter.reset(email.toLowerCase(), targetIp)
    
    // Log admin action
    const { logAuditEvent } = await import('@lib/auth-utils')
    await logAuditEvent(
      user!.id,
      'rate_limit_reset_specific',
      'auth',
      { 
        adminEmail: user!.email,
        targetEmail: email.toLowerCase(),
        targetIp,
        ip: getClientIP(req)
      },
      req
    )
    
    return NextResponse.json({
      success: true,
      message: `Rate limit reset for ${email}`,
      target: {
        email: email.toLowerCase(),
        ip: targetIp
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error resetting specific rate limit:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to reset rate limit',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}