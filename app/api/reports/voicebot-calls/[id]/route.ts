import { prisma } from '@lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Handles GET requests for a specific voicebot call record by ID.
 * The function signature is adjusted to include the 'request' object
 * to satisfy the Next.js App Router's type checking requirements,
 * which often resolves "invalid GET export" errors.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // Extract and validate the ID parameter
    const { id } = await context.params

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Missing or invalid ID parameter' },
        { status: 400 }
      )
    }

    // Find the voicebot call by ID
    const call = await prisma.voicebotCall.findUnique({
      where: { id },
    })

    // If no record is found
    if (!call) {
      return NextResponse.json(
        { success: false, message: 'Record not found' },
        { status: 404 }
      )
    }

    // Return the found record in the correct structure
    return NextResponse.json({
      success: true,
      data: call,
    })
  } catch (error: unknown) {
    console.error('❌ Error fetching voicebot call by ID:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    )
  }
}
