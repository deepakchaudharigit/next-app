/**
 * Web Vitals Analytics API
 * Collects and stores Web Vitals performance metrics
 */

import { NextRequest, NextResponse } from 'next/server'
import { cache, CACHE_PREFIXES, CACHE_TTL } from '@/lib/cache/redis'
import { performanceMonitor } from '@/lib/monitoring/performance'

interface WebVitalsPayload {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  id: string
  timestamp: number
  url: string
  userAgent: string
}

export async function POST(req: NextRequest) {
  try {
    const payload: WebVitalsPayload = await req.json()
    
    // Validate payload
    if (!payload.name || typeof payload.value !== 'number') {
      return NextResponse.json(
        { success: false, message: 'Invalid payload' },
        { status: 400 }
      )
    }
    
    // Record metric in performance monitor
    performanceMonitor.recordMetric(
      `web_vitals_${payload.name.toLowerCase()}`,
      payload.value,
      getMetricUnit(payload.name),
      {
        rating: payload.rating,
        url: payload.url,
        userAgent: payload.userAgent
      }
    )
    
    // Store in cache for aggregation
    const cacheKey = `${payload.name}:${Date.now()}`
    await cache.set(
      cacheKey,
      payload,
      {
        prefix: CACHE_PREFIXES.API_RESPONSE + 'web-vitals:',
        ttl: CACHE_TTL.DAILY
      }
    )
    
    // Aggregate metrics for dashboard
    await aggregateWebVitals(payload)
    
    return NextResponse.json({
      success: true,
      message: 'Web Vitals metric recorded'
    })
    
  } catch (error) {
    console.error('Web Vitals API error:', error)
    
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const timeRange = url.searchParams.get('timeRange') || '24h'
    const metricName = url.searchParams.get('metric')
    
    // Get aggregated metrics from cache
    const cacheKey = `aggregated:${timeRange}${metricName ? `:${metricName}` : ''}`
    const cachedMetrics = await cache.get(
      cacheKey,
      CACHE_PREFIXES.API_RESPONSE + 'web-vitals:'
    )
    
    if (cachedMetrics) {
      return NextResponse.json({
        success: true,
        data: cachedMetrics,
        cached: true
      })
    }
    
    // If not cached, generate fresh metrics
    const metrics = await generateWebVitalsReport(timeRange, metricName)
    
    // Cache the result
    await cache.set(
      cacheKey,
      metrics,
      {
        prefix: CACHE_PREFIXES.API_RESPONSE + 'web-vitals:',
        ttl: CACHE_TTL.MEDIUM
      }
    )
    
    return NextResponse.json({
      success: true,
      data: metrics,
      cached: false
    })
    
  } catch (error) {
    console.error('Web Vitals GET API error:', error)
    
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Get metric unit based on metric name
 */
function getMetricUnit(metricName: string): string {
  const units = {
    CLS: 'score',
    FID: 'ms',
    FCP: 'ms',
    LCP: 'ms',
    TTFB: 'ms',
    PLT: 'ms',
    DCL: 'ms',
    DNS: 'ms',
    TCP: 'ms',
    SRT: 'ms',
    FP: 'ms',
    RSC: 'count',
    RSZ: 'kb',
    SLW: 'count'
  }
  
  return units[metricName as keyof typeof units] || 'ms'
}

/**
 * Aggregate Web Vitals metrics for dashboard
 */
async function aggregateWebVitals(payload: WebVitalsPayload): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0]
    const aggregateKey = `daily:${today}:${payload.name}`
    
    // Get existing aggregate
    const existing = await cache.get<{
      count: number
      total: number
      average: number
      good: number
      needsImprovement: number
      poor: number
      lastUpdated: number
    }>(aggregateKey, CACHE_PREFIXES.API_RESPONSE + 'web-vitals:')
    
    const aggregate = existing || {
      count: 0,
      total: 0,
      average: 0,
      good: 0,
      needsImprovement: 0,
      poor: 0,
      lastUpdated: Date.now()
    }
    
    // Update aggregate
    aggregate.count++
    aggregate.total += payload.value
    aggregate.average = aggregate.total / aggregate.count
    aggregate.lastUpdated = Date.now()
    
    // Update rating counts
    switch (payload.rating) {
      case 'good':
        aggregate.good++
        break
      case 'needs-improvement':
        aggregate.needsImprovement++
        break
      case 'poor':
        aggregate.poor++
        break
    }
    
    // Store updated aggregate
    await cache.set(
      aggregateKey,
      aggregate,
      {
        prefix: CACHE_PREFIXES.API_RESPONSE + 'web-vitals:',
        ttl: CACHE_TTL.DAILY
      }
    )
    
  } catch (error) {
    console.error('Error aggregating Web Vitals:', error)
  }
}

/**
 * Generate Web Vitals report
 */
async function generateWebVitalsReport(
  timeRange: string,
  metricName?: string | null
): Promise<{
  summary: Record<string, {
    average: number
    count: number
    distribution: { good: number; needsImprovement: number; poor: number }
  }>
  trends: Array<{ date: string; metrics: Record<string, number> }>
  performance_score: number
}> {
  const days = getTimeRangeDays(timeRange)
  const endDate = new Date()
  const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000))
  
  const summary: Record<string, {
    average: number
    count: number
    distribution: { good: number; needsImprovement: number; poor: number }
  }> = {}
  
  const trends: Array<{ date: string; metrics: Record<string, number> }> = []
  
  const metrics = metricName ? [metricName] : ['CLS', 'FID', 'FCP', 'LCP', 'TTFB']
  
  // Generate summary for each metric
  for (const metric of metrics) {
    let totalCount = 0
    let totalValue = 0
    let goodCount = 0
    let needsImprovementCount = 0
    let poorCount = 0
    
    // Aggregate data for the time range
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0]
      const aggregateKey = `daily:${dateKey}:${metric}`
      
      const dayData = await cache.get<{
        count: number
        total: number
        good: number
        needsImprovement: number
        poor: number
      }>(aggregateKey, CACHE_PREFIXES.API_RESPONSE + 'web-vitals:')
      
      if (dayData) {
        totalCount += dayData.count
        totalValue += dayData.total
        goodCount += dayData.good
        needsImprovementCount += dayData.needsImprovement
        poorCount += dayData.poor
      }
    }
    
    summary[metric] = {
      average: totalCount > 0 ? totalValue / totalCount : 0,
      count: totalCount,
      distribution: {
        good: goodCount,
        needsImprovement: needsImprovementCount,
        poor: poorCount
      }
    }
  }
  
  // Calculate performance score
  const performanceScore = calculatePerformanceScore(summary)
  
  return {
    summary,
    trends,
    performance_score: performanceScore
  }
}

/**
 * Get number of days for time range
 */
function getTimeRangeDays(timeRange: string): number {
  switch (timeRange) {
    case '1h': return 1/24
    case '24h': return 1
    case '7d': return 7
    case '30d': return 30
    default: return 1
  }
}

/**
 * Calculate overall performance score
 */
function calculatePerformanceScore(summary: Record<string, {
  average: number
  count: number
  distribution: { good: number; needsImprovement: number; poor: number }
}>): number {
  const coreMetrics = ['CLS', 'FID', 'FCP', 'LCP', 'TTFB']
  let totalScore = 0
  let metricCount = 0
  
  coreMetrics.forEach(metric => {
    const data = summary[metric]
    if (data && data.count > 0) {
      const { good, needsImprovement, poor } = data.distribution
      const total = good + needsImprovement + poor
      
      if (total > 0) {
        // Calculate weighted score (good = 100, needs improvement = 50, poor = 0)
        const score = ((good * 100) + (needsImprovement * 50) + (poor * 0)) / total
        totalScore += score
        metricCount++
      }
    }
  })
  
  return metricCount > 0 ? Math.round(totalScore / metricCount) : 0
}