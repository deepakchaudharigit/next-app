/**
 * Detailed Health Check API
 * Provides comprehensive system health information for monitoring
 */

import { NextResponse } from 'next/server'
import { performanceMonitor } from '@/lib/monitoring/performance'
import { alertManager } from '@/lib/monitoring/alerts'

export async function GET() {
  try {
    // Get system health
    const systemHealth = await performanceMonitor.getSystemHealth()
    
    // Get performance metrics
    const metrics = performanceMonitor.getAggregatedMetrics()
    
    // Get active alerts
    const activeAlerts = alertManager.getActiveAlerts()
    
    // Check all rules
    await alertManager.checkRules({ ...systemHealth, ...metrics })
    
    // Determine overall health status
    const overallStatus = determineOverallStatus(systemHealth, activeAlerts)
    
    const healthData = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: systemHealth.uptime,
      
      // System metrics
      system: {
        memory: systemHealth.memory,
        cpu: systemHealth.cpu,
        activeConnections: systemHealth.activeConnections
      },
      
      // Service health
      services: {
        database: systemHealth.database,
        redis: systemHealth.redis,
        email: await checkEmailService(),
        external: await checkExternalServices()
      },
      
      // Performance metrics
      performance: {
        averageResponseTime: metrics.averageResponseTime,
        p95ResponseTime: metrics.p95ResponseTime,
        p99ResponseTime: metrics.p99ResponseTime,
        requestsPerMinute: metrics.requestsPerMinute,
        errorRate: metrics.errorRate,
        totalRequests: metrics.totalRequests,
        totalErrors: metrics.totalErrors
      },
      
      // Alerts
      alerts: {
        active: activeAlerts.length,
        critical: activeAlerts.filter(a => a.severity === 'critical').length,
        high: activeAlerts.filter(a => a.severity === 'high').length,
        medium: activeAlerts.filter(a => a.severity === 'medium').length,
        low: activeAlerts.filter(a => a.severity === 'low').length,
        recent: activeAlerts.slice(0, 5).map(alert => ({
          id: alert.id,
          severity: alert.severity,
          title: alert.title,
          timestamp: alert.timestamp
        }))
      },
      
      // Top issues
      issues: {
        slowRoutes: metrics.topSlowRoutes.slice(0, 5),
        errorRoutes: metrics.topErrorRoutes.slice(0, 5)
      },
      
      // Resource usage trends
      trends: {
        memory: metrics.memoryTrend.slice(-20)
      }
    }
    
    // Return appropriate status code based on health
    const statusCode = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 200 : 503
    
    return NextResponse.json(healthData, { status: statusCode })
    
  } catch (error) {
    console.error('Health check error:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 })
  }
}

function determineOverallStatus(
  systemHealth: any, 
  activeAlerts: any[]
): 'healthy' | 'degraded' | 'unhealthy' {
  // Critical alerts make system unhealthy
  if (activeAlerts.some(alert => alert.severity === 'critical')) {
    return 'unhealthy'
  }
  
  // System health issues
  if (systemHealth.status === 'unhealthy') {
    return 'unhealthy'
  }
  
  // High alerts or degraded system health
  if (
    systemHealth.status === 'degraded' || 
    activeAlerts.some(alert => alert.severity === 'high')
  ) {
    return 'degraded'
  }
  
  return 'healthy'
}

async function checkEmailService(): Promise<{ status: string; responseTime: number }> {
  const startTime = Date.now()
  
  try {
    // Test email configuration
    if (!process.env.EMAIL_HOST) {
      return { status: 'not_configured', responseTime: 0 }
    }
    
    // You could implement a test email send here
    // For now, just check if configuration exists
    return {
      status: 'configured',
      responseTime: Date.now() - startTime
    }
  } catch (error) {
    return {
      status: 'error',
      responseTime: Date.now() - startTime
    }
  }
}

async function checkExternalServices(): Promise<Record<string, { status: string; responseTime: number }>> {
  const services: Record<string, { status: string; responseTime: number }> = {}
  
  // Add checks for external services you depend on
  // Example: payment processors, third-party APIs, etc.
  
  return services
}