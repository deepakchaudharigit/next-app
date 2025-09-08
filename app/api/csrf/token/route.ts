/**
 * CSRF Token API Endpoint
 * Provides CSRF tokens for client-side requests
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateCSRFToken } from '@/lib/security/csrf-protection'
import { withApiRateLimit } from '@/lib/security/rate-limiting-middleware'

export async function GET(req: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await withApiRateLimit(req)
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    // Generate CSRF token
    const { token, cookie } = await generateCSRFToken(req)

    const response = NextResponse.json({
      success: true,
      data: {
        csrfToken: token
      }
    })

    // Set CSRF token cookie
    response.headers.set('Set-Cookie', cookie)

    return response

  } catch (error) {
    console.error('CSRF token generation error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CSRF_TOKEN_ERROR',
          message: 'Failed to generate CSRF token'
        }
      },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await withApiRateLimit(req)
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    // Refresh CSRF token
    const { token, cookie } = await generateCSRFToken(req)

    const response = NextResponse.json({
      success: true,
      data: {
        csrfToken: token,
        message: 'CSRF token refreshed'
      }
    })

    // Set new CSRF token cookie
    response.headers.set('Set-Cookie', cookie)

    return response

  } catch (error) {
    console.error('CSRF token refresh error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CSRF_TOKEN_REFRESH_ERROR',
          message: 'Failed to refresh CSRF token'
        }
      },
      { status: 500 }
    )
  }
}