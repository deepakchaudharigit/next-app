/**
 * Performance Monitor Dashboard Component
 * Displays real-time performance metrics and Web Vitals
 */

'use client'

import { useState, useEffect } from 'react'
import { webVitalsMonitor } from '@/lib/monitoring/web-vitals'

interface PerformanceMetrics {
  webVitals: {
    CLS: { value: number; rating: string }
    FID: { value: number; rating: string }
    FCP: { value: number; rating: string }
    LCP: { value: number; rating: string }
    TTFB: { value: number; rating: string }
  }
  performance: {
    score: number
    recommendations: string[]
  }
  system: {
    memoryUsage: number
    loadTime: number
    resourceCount: number
  }
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    loadPerformanceMetrics()
    
    // Update metrics every 30 seconds
    const interval = setInterval(loadPerformanceMetrics, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const loadPerformanceMetrics = async () => {
    try {
      // Get Web Vitals from monitor
      const summary = webVitalsMonitor.getPerformanceSummary()
      const report = webVitalsMonitor.getPerformanceReport()
      
      // Get system metrics from API
      const response = await fetch('/api/analytics/web-vitals?timeRange=1h')
      const apiData = await response.json()
      
      const performanceMetrics: PerformanceMetrics = {
        webVitals: summary.metrics as any,
        performance: {
          score: summary.score,
          recommendations: summary.recommendations
        },
        system: {
          memoryUsage: report?.pageLoadTime || 0,
          loadTime: report?.pageLoadTime || 0,
          resourceCount: 0
        }
      }
      
      setMetrics(performanceMetrics)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to load performance metrics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'good': return 'text-green-600 bg-green-100'
      case 'needs-improvement': return 'text-yellow-600 bg-yellow-100'
      case 'poor': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const formatMetricValue = (name: string, value: number) => {
    switch (name) {
      case 'CLS':
        return value.toFixed(3)
      case 'FID':
      case 'FCP':
      case 'LCP':
      case 'TTFB':
        return `${Math.round(value)}ms`
      default:
        return value.toString()
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-gray-500">
          <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p>Performance metrics not available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Performance Score */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Performance Score</h3>
          <button
            onClick={loadPerformanceMetrics}
            className="text-sm text-indigo-600 hover:text-indigo-500"
          >
            Refresh
          </button>
        </div>
        
        <div className="text-center">
          <div className={`text-4xl font-bold ${getScoreColor(metrics.performance.score)}`}>
            {metrics.performance.score}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Overall Performance Score
          </div>
        </div>
        
        {lastUpdated && (
          <div className="text-xs text-gray-400 text-center mt-2">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Core Web Vitals */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Core Web Vitals</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(metrics.webVitals).map(([name, data]) => (
            <div key={name} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">{name}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRatingColor(data.rating)}`}>
                  {data.rating.replace('-', ' ')}
                </span>
              </div>
              
              <div className="text-2xl font-bold text-gray-900">
                {formatMetricValue(name, data.value)}
              </div>
              
              <div className="text-xs text-gray-500 mt-1">
                {getMetricDescription(name)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Recommendations */}
      {metrics.performance.recommendations.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Recommendations</h3>
          
          <div className="space-y-3">
            {metrics.performance.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-sm text-gray-700">{recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Metrics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">System Metrics</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {Math.round(metrics.system.loadTime)}ms
            </div>
            <div className="text-sm text-gray-500">Page Load Time</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {metrics.system.resourceCount}
            </div>
            <div className="text-sm text-gray-500">Resources Loaded</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {Math.round(metrics.system.memoryUsage)}MB
            </div>
            <div className="text-sm text-gray-500">Memory Usage</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function getMetricDescription(name: string): string {
  const descriptions = {
    CLS: 'Cumulative Layout Shift',
    FID: 'First Input Delay',
    FCP: 'First Contentful Paint',
    LCP: 'Largest Contentful Paint',
    TTFB: 'Time to First Byte'
  }
  
  return descriptions[name as keyof typeof descriptions] || name
}

export default PerformanceMonitor