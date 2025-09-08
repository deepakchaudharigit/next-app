/**
 * Performance Monitoring System
 * Tracks application performance metrics, response times, and system health
 */

import { NextRequest, NextResponse } from 'next/server'

export interface PerformanceMetric {
  name: string
  value: number
  unit: string
  timestamp: Date
  tags?: Record<string, string>
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy'
  uptime: number
  memory: {
    used: number
    total: number
    percentage: number
  }
  cpu: {
    usage: number
  }
  database: {
    status: 'connected' | 'disconnected' | 'error'
    responseTime: number
  }
  redis: {
    status: 'connected' | 'disconnected' | 'error'
    responseTime: number
  }
  activeConnections: number
  requestsPerMinute: number
  errorRate: number
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private requestCounts = new Map<string, number>()
  private errorCounts = new Map<string, number>()
  private responseTimes: number[] = []
  private startTime = Date.now()

  // Track API request performance
  trackRequest(req: NextRequest, startTime: number, statusCode: number) {
    const endTime = Date.now()
    const responseTime = endTime - startTime
    const route = this.normalizeRoute(req.nextUrl.pathname)
    
    // Track response time
    this.responseTimes.push(responseTime)
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-1000) // Keep last 1000
    }

    // Track request counts
    const currentCount = this.requestCounts.get(route) || 0
    this.requestCounts.set(route, currentCount + 1)

    // Track error counts
    if (statusCode >= 400) {
      const currentErrors = this.errorCounts.get(route) || 0
      this.errorCounts.set(route, currentErrors + 1)
    }

    // Add metric
    this.addMetric({
      name: 'api_response_time',
      value: responseTime,
      unit: 'ms',
      timestamp: new Date(),
      tags: {
        route,
        method: req.method,
        status: statusCode.toString()
      }
    })

    // Alert on slow requests
    if (responseTime > 5000) {
      this.alertSlowRequest(route, responseTime, req.method)
    }

    // Alert on high error rates
    this.checkErrorRate(route)
  }

  // Add custom metric
  addMetric(metric: PerformanceMetric) {
    this.metrics.push(metric)
    
    // Keep only last 10000 metrics
    if (this.metrics.length > 10000) {
      this.metrics = this.metrics.slice(-10000)
    }
  }

  // Get system health status
  async getSystemHealth(): Promise<SystemHealth> {
    const memoryUsage = process.memoryUsage()
    const uptime = Date.now() - this.startTime

    // Test database connection
    const dbHealth = await this.testDatabaseConnection()
    
    // Test Redis connection
    const redisHealth = await this.testRedisConnection()

    // Calculate metrics
    const avgResponseTime = this.getAverageResponseTime()
    const requestsPerMinute = this.getRequestsPerMinute()
    const errorRate = this.getErrorRate()

    // Determine overall status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
    
    if (dbHealth.status === 'error' || redisHealth.status === 'error') {
      status = 'unhealthy'
    } else if (
      avgResponseTime > 2000 || 
      errorRate > 0.05 || 
      memoryUsage.heapUsed / memoryUsage.heapTotal > 0.9
    ) {
      status = 'degraded'
    }

    return {
      status,
      uptime,
      memory: {
        used: memoryUsage.heapUsed,
        total: memoryUsage.heapTotal,
        percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
      },
      cpu: {
        usage: await this.getCPUUsage()
      },
      database: dbHealth,
      redis: redisHealth,
      activeConnections: this.getActiveConnections(),
      requestsPerMinute,
      errorRate
    }
  }

  // Get performance metrics
  getMetrics(timeRange?: { start: Date; end: Date }): PerformanceMetric[] {
    let filteredMetrics = this.metrics

    if (timeRange) {
      filteredMetrics = this.metrics.filter(
        metric => metric.timestamp >= timeRange.start && metric.timestamp <= timeRange.end
      )
    }

    return filteredMetrics
  }

  // Get aggregated metrics
  getAggregatedMetrics() {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    
    const recentMetrics = this.getMetrics({ start: oneHourAgo, end: now })
    
    return {
      averageResponseTime: this.getAverageResponseTime(),
      p95ResponseTime: this.getPercentileResponseTime(95),
      p99ResponseTime: this.getPercentileResponseTime(99),
      requestsPerMinute: this.getRequestsPerMinute(),
      errorRate: this.getErrorRate(),
      topSlowRoutes: this.getTopSlowRoutes(),
      topErrorRoutes: this.getTopErrorRoutes(),
      memoryTrend: this.getMemoryTrend(),
      totalRequests: Array.from(this.requestCounts.values()).reduce((a, b) => a + b, 0),
      totalErrors: Array.from(this.errorCounts.values()).reduce((a, b) => a + b, 0)
    }
  }

  private normalizeRoute(pathname: string): string {
    // Normalize dynamic routes
    return pathname
      .replace(/\/\d+/g, '/[id]')
      .replace(/\/[a-f0-9-]{36}/g, '/[uuid]')
      .replace(/\/[a-zA-Z0-9_-]+@[a-zA-Z0-9.-]+/g, '/[email]')
  }

  private getAverageResponseTime(): number {
    if (this.responseTimes.length === 0) return 0
    return this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length
  }

  private getPercentileResponseTime(percentile: number): number {
    if (this.responseTimes.length === 0) return 0
    
    const sorted = [...this.responseTimes].sort((a, b) => a - b)
    const index = Math.ceil((percentile / 100) * sorted.length) - 1
    return sorted[index] || 0
  }

  private getRequestsPerMinute(): number {
    const totalRequests = Array.from(this.requestCounts.values()).reduce((a, b) => a + b, 0)
    const uptimeMinutes = (Date.now() - this.startTime) / (1000 * 60)
    return uptimeMinutes > 0 ? totalRequests / uptimeMinutes : 0
  }

  private getErrorRate(): number {
    const totalRequests = Array.from(this.requestCounts.values()).reduce((a, b) => a + b, 0)
    const totalErrors = Array.from(this.errorCounts.values()).reduce((a, b) => a + b, 0)
    return totalRequests > 0 ? totalErrors / totalRequests : 0
  }

  private getTopSlowRoutes(): Array<{ route: string; avgTime: number }> {
    const routeMetrics = new Map<string, number[]>()
    
    this.metrics
      .filter(m => m.name === 'api_response_time')
      .forEach(metric => {
        const route = metric.tags?.route || 'unknown'
        if (!routeMetrics.has(route)) {
          routeMetrics.set(route, [])
        }
        routeMetrics.get(route)!.push(metric.value)
      })

    return Array.from(routeMetrics.entries())
      .map(([route, times]) => ({
        route,
        avgTime: times.reduce((a, b) => a + b, 0) / times.length
      }))
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, 10)
  }

  private getTopErrorRoutes(): Array<{ route: string; errorCount: number; errorRate: number }> {
    return Array.from(this.errorCounts.entries())
      .map(([route, errorCount]) => ({
        route,
        errorCount,
        errorRate: errorCount / (this.requestCounts.get(route) || 1)
      }))
      .sort((a, b) => b.errorRate - a.errorRate)
      .slice(0, 10)
  }

  private getMemoryTrend(): Array<{ timestamp: Date; usage: number }> {
    return this.metrics
      .filter(m => m.name === 'memory_usage')
      .slice(-100)
      .map(m => ({
        timestamp: m.timestamp,
        usage: m.value
      }))
  }

  private async testDatabaseConnection(): Promise<{ status: 'connected' | 'disconnected' | 'error'; responseTime: number }> {
    const startTime = Date.now()
    
    try {
      const { prisma } = await import('@/lib/prisma')
      await prisma.$queryRaw`SELECT 1`
      
      return {
        status: 'connected',
        responseTime: Date.now() - startTime
      }
    } catch (error) {
      return {
        status: 'error',
        responseTime: Date.now() - startTime
      }
    }
  }

  private async testRedisConnection(): Promise<{ status: 'connected' | 'disconnected' | 'error'; responseTime: number }> {
    const startTime = Date.now()
    
    try {
      const { cache } = await import('@/lib/cache/redis')
      await cache.ping()
      
      return {
        status: 'connected',
        responseTime: Date.now() - startTime
      }
    } catch (error) {
      return {
        status: 'error',
        responseTime: Date.now() - startTime
      }
    }
  }

  private async getCPUUsage(): Promise<number> {
    // Simple CPU usage estimation
    const startUsage = process.cpuUsage()
    await new Promise(resolve => setTimeout(resolve, 100))
    const endUsage = process.cpuUsage(startUsage)
    
    const totalUsage = endUsage.user + endUsage.system
    return (totalUsage / 100000) // Convert to percentage
  }

  private getActiveConnections(): number {
    // This would need to be implemented based on your server setup
    // For now, return a placeholder
    return 0
  }

  private alertSlowRequest(route: string, responseTime: number, method: string) {
    console.warn(`🐌 Slow request detected: ${method} ${route} took ${responseTime}ms`)
    
    // Here you would integrate with your alerting system
    // e.g., send to Slack, email, PagerDuty, etc.
  }

  private checkErrorRate(route: string) {
    const requests = this.requestCounts.get(route) || 0
    const errors = this.errorCounts.get(route) || 0
    
    if (requests > 10 && errors / requests > 0.1) {
      console.error(`🚨 High error rate detected: ${route} has ${(errors/requests*100).toFixed(1)}% error rate`)
    }
  }

  // Memory usage tracking
  trackMemoryUsage() {
    const memoryUsage = process.memoryUsage()
    
    this.addMetric({
      name: 'memory_usage',
      value: memoryUsage.heapUsed,
      unit: 'bytes',
      timestamp: new Date(),
      tags: {
        type: 'heap_used'
      }
    })

    // Alert on high memory usage
    if (memoryUsage.heapUsed / memoryUsage.heapTotal > 0.9) {
      console.warn(`⚠️ High memory usage: ${((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100).toFixed(1)}%`)
    }
  }

  // Start periodic monitoring
  startPeriodicMonitoring() {
    // Track memory usage every 30 seconds
    setInterval(() => {
      this.trackMemoryUsage()
    }, 30000)

    // Clean up old metrics every hour
    setInterval(() => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      this.metrics = this.metrics.filter(m => m.timestamp > oneHourAgo)
    }, 60 * 60 * 1000)
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor()

// Start monitoring when module is loaded
if (typeof window === 'undefined') {
  performanceMonitor.startPeriodicMonitoring()
}