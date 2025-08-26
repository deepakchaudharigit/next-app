import { NextRequest, NextResponse } from 'next/server'

/**
 * Test endpoint to demonstrate proper logout API usage
 * This shows how to call the logout endpoint and get JSON responses
 */
export async function POST(req: NextRequest) {
  try {
    // Call our custom logout API
    const logoutResponse = await fetch(`${req.nextUrl.origin}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Forward cookies from the original request
        'Cookie': req.headers.get('cookie') || '',
      },
    })

    const logoutData = await logoutResponse.json()

    return NextResponse.json({
      success: true,
      message: 'Logout test completed',
      logoutResult: {
        status: logoutResponse.status,
        data: logoutData,
      },
    })
  } catch (error) {
    console.error('Logout test error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Logout test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}