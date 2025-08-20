import { prisma } from '@lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { voicebotCallsQuerySchema } from '@lib/validations'
import { ZodError } from 'zod'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    
    // Convert URLSearchParams to object for Zod validation
    const queryParams = Object.fromEntries(searchParams.entries())
    
    // Validate query parameters
    const validationResult = voicebotCallsQuerySchema.safeParse(queryParams)
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
    
    const {
      page,
      limit,
      language,
      cli,
      callResolutionStatus,
      durationMin,
      durationMax,
      dateFrom,
      dateTo,
    } = validationResult.data
    
    const offset = (page - 1) * limit

    // Dynamically build 'where' object only when filters are defined
    const where: {
      durationSeconds?: { gte?: number; lte?: number }
      language?: string
      cli?: string
      callResolutionStatus?: string
      receivedAt?: { gte: Date; lte: Date }
    } = {}

    if ((durationMin !== undefined && !isNaN(durationMin)) || (durationMax !== undefined && !isNaN(durationMax))) {
      where.durationSeconds = {
        ...(durationMin === undefined || isNaN(durationMin) ? {} : { gte: durationMin }),
        ...(durationMax === undefined || isNaN(durationMax) ? {} : { lte: durationMax }),
      }
    }

    if (language) where.language = language
    if (cli) where.cli = cli
    if (callResolutionStatus) where.callResolutionStatus = callResolutionStatus

    if (dateFrom && dateTo) {
      where.receivedAt = {
        gte: new Date(dateFrom),
        lte: new Date(dateTo),
      }
    }

    // Optional: debug filter output
    // // console.log('🔍 WHERE FILTER:', where)

    // Query data and count
    const [totalRecords, calls] = await Promise.all([
      prisma.voicebotCall.count({ where }),
      prisma.voicebotCall.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { receivedAt: 'desc' },
        select: {
          id: true,
          cli: true,
          receivedAt: true,
          language: true,
          queryType: true,
          ticketsIdentified: true,
          transferredToIvr: true,
        },
      }),
    ])

    const totalPages = Math.ceil(totalRecords / limit)

    return NextResponse.json({
      success: true,
      data: calls,
      meta: {
        page,
        totalPages,
        totalRecords,
        perPage: limit,
      },
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
    
    console.error('Error fetching voicebot calls:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
