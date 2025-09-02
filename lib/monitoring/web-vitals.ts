/**
 * Web Vitals Performance Monitoring
 * Tracks Core Web Vitals and other performance metrics
 */

import { getCLS, getFID, getFCP, getLCP, getTTFB, Metric } from 'web-vitals'

export interface WebVitalsMetric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  id: string
  timestamp: number
  url: string
  userAgent: string
}

export interface PerformanceReport {
  metrics: WebVitalsMetric[]
  pageLoadTime: number
  domContentLoaded: number
  firstPaint: number
  firstContentfulPaint: number
  largestContentfulPaint: number
  cumulativeLayoutShift: number
  firstInputDelay: number
  timeToFirstByte: number
  timestamp: number
  url: string
  userAgent: string
}

class WebVitalsMonitor {
  private metrics: WebVitalsMetric[] = []
  private isInitialized = false

  /**
   * Initialize Web Vitals monitoring
   */
  init(): void {
    if (this.isInitialized || typeof window === 'undefined') {
      return
    }

    this.isInitialized = true

    // Track Core Web Vitals
    getCLS(this.onMetric.bind(this))
    getFID(this.onMetric.bind(this))
    getFCP(this.onMetric.bind(this))
    getLCP(this.onMetric.bind(this))
    getTTFB(this.onMetric.bind(this))

    // Track additional performance metrics
    this.trackAdditionalMetrics()

    console.log('🎯 Web Vitals monitoring initialized')
  }

  /**
   * Handle metric collection
   */
  private onMetric(metric: Metric): void {
    const webVitalsMetric: WebVitalsMetric = {
      name: metric.name,
      value: metric.value,
      rating: this.getRating(metric.name, metric.value),
      delta: metric.delta,
      id: metric.id,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent
    }

    this.metrics.push(webVitalsMetric)

    // Send to analytics
    this.sendToAnalytics(webVitalsMetric)

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Web Vital: ${metric.name}`, {
        value: metric.value,
        rating: webVitalsMetric.rating,
        delta: metric.delta
      })
    }
  }

  /**
   * Get performance rating based on metric name and value
   */
  private getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = {
      CLS: { good: 0.1, poor: 0.25 },
      FID: { good: 100, poor: 300 },
      FCP: { good: 1800, poor: 3000 },
      LCP: { good: 2500, poor: 4000 },
      TTFB: { good: 800, poor: 1800 }
    }

    const threshold = thresholds[name as keyof typeof thresholds]
    if (!threshold) return 'good'

    if (value <= threshold.good) return 'good'
    if (value <= threshold.poor) return 'needs-improvement'
    return 'poor'
  }

  /**
   * Track additional performance metrics
   */
  private trackAdditionalMetrics(): void {
    if (typeof window === 'undefined' || !window.performance) {
      return
    }

    // Wait for page load to complete
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        const paint = performance.getEntriesByType('paint')

        if (navigation) {
          // Page Load Time
          this.recordCustomMetric('PLT', navigation.loadEventEnd - navigation.fetchStart)
          
          // DOM Content Loaded
          this.recordCustomMetric('DCL', navigation.domContentLoadedEventEnd - navigation.fetchStart)
          
          // DNS Lookup Time
          this.recordCustomMetric('DNS', navigation.domainLookupEnd - navigation.domainLookupStart)
          
          // TCP Connection Time
          this.recordCustomMetric('TCP', navigation.connectEnd - navigation.connectStart)
          
          // Server Response Time
          this.recordCustomMetric('SRT', navigation.responseEnd - navigation.requestStart)
        }

        // Paint metrics
        paint.forEach(entry => {
          if (entry.name === 'first-paint') {
            this.recordCustomMetric('FP', entry.startTime)
          }
        })

        // Resource loading metrics
        this.trackResourceMetrics()
      }, 0)
    })
  }

  /**
   * Record custom metric
   */
  private recordCustomMetric(name: string, value: number): void {
    const metric: WebVitalsMetric = {
      name,
      value,
      rating: this.getCustomRating(name, value),
      delta: value,
      id: `${name}-${Date.now()}`,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent
    }

    this.metrics.push(metric)
    this.sendToAnalytics(metric)
  }

  /**
   * Get rating for custom metrics
   */
  private getCustomRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const customThresholds = {
      PLT: { good: 3000, poor: 5000 },
      DCL: { good: 2000, poor: 4000 },
      DNS: { good: 100, poor: 300 },
      TCP: { good: 100, poor: 300 },
      SRT: { good: 500, poor: 1000 },
      FP: { good: 1000, poor: 2000 }
    }

    const threshold = customThresholds[name as keyof typeof customThresholds]
    if (!threshold) return 'good'

    if (value <= threshold.good) return 'good'
    if (value <= threshold.poor) return 'needs-improvement'
    return 'poor'
  }

  /**
   * Track resource loading performance
   */
  private trackResourceMetrics(): void {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
    
    const resourceStats = {
      totalResources: resources.length,
      totalSize: 0,
      slowResources: 0,
      failedResources: 0
    }

    resources.forEach(resource => {
      const loadTime = resource.responseEnd - resource.startTime
      
      if (loadTime > 1000) {
        resourceStats.slowResources++
      }

      if (resource.transferSize) {
        resourceStats.totalSize += resource.transferSize
      }
    })

    // Record resource metrics
    this.recordCustomMetric('RSC', resourceStats.totalResources)
    this.recordCustomMetric('RSZ', resourceStats.totalSize / 1024) // KB
    this.recordCustomMetric('SLW', resourceStats.slowResources)
  }

  /**
   * Send metrics to analytics service
   */
  private sendToAnalytics(metric: WebVitalsMetric): void {
    // Send to your analytics service
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', metric.name, {
        event_category: 'Web Vitals',
        value: Math.round(metric.value),
        metric_rating: metric.rating,
        custom_parameter_1: metric.url
      })
    }

    // Send to custom analytics endpoint
    this.sendToCustomAnalytics(metric)
  }

  /**
   * Send to custom analytics endpoint
   */
  private async sendToCustomAnalytics(metric: WebVitalsMetric): Promise<void> {
    try {
      await fetch('/api/analytics/web-vitals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(metric)
      })
    } catch (error) {
      console.error('Failed to send web vitals to analytics:', error)
    }
  }

  /**
   * Get current performance report
   */
  getPerformanceReport(): PerformanceReport | null {
    if (typeof window === 'undefined' || !window.performance) {
      return null
    }

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    const paint = performance.getEntriesByType('paint')

    if (!navigation) {
      return null
    }

    const firstPaint = paint.find(entry => entry.name === 'first-paint')?.startTime || 0
    const firstContentfulPaint = paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0

    return {
      metrics: this.metrics,
      pageLoadTime: navigation.loadEventEnd - navigation.fetchStart,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
      firstPaint,
      firstContentfulPaint,
      largestContentfulPaint: this.getMetricValue('LCP'),
      cumulativeLayoutShift: this.getMetricValue('CLS'),
      firstInputDelay: this.getMetricValue('FID'),
      timeToFirstByte: this.getMetricValue('TTFB'),
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent
    }
  }

  /**
   * Get metric value by name
   */
  private getMetricValue(name: string): number {
    const metric = this.metrics.find(m => m.name === name)
    return metric ? metric.value : 0
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    score: number
    metrics: Record<string, { value: number; rating: string }>
    recommendations: string[]
  } {
    const coreMetrics = ['CLS', 'FID', 'FCP', 'LCP', 'TTFB']
    const summary = {
      score: 0,
      metrics: {} as Record<string, { value: number; rating: string }>,
      recommendations: [] as string[]
    }

    let totalScore = 0
    let metricCount = 0

    coreMetrics.forEach(metricName => {
      const metric = this.metrics.find(m => m.name === metricName)
      if (metric) {
        summary.metrics[metricName] = {
          value: metric.value,
          rating: metric.rating
        }

        // Calculate score (good = 100, needs-improvement = 50, poor = 0)
        const score = metric.rating === 'good' ? 100 : metric.rating === 'needs-improvement' ? 50 : 0
        totalScore += score
        metricCount++

        // Add recommendations
        if (metric.rating !== 'good') {
          summary.recommendations.push(this.getRecommendation(metricName, metric.rating))
        }
      }
    })

    summary.score = metricCount > 0 ? Math.round(totalScore / metricCount) : 0

    return summary
  }

  /**
   * Get performance recommendations
   */
  private getRecommendation(metricName: string, rating: string): string {
    const recommendations = {
      CLS: {
        'needs-improvement': 'Consider optimizing layout shifts by setting dimensions for images and ads',
        'poor': 'Critical: Fix layout shifts by reserving space for dynamic content and avoiding inserting content above existing content'
      },
      FID: {
        'needs-improvement': 'Optimize JavaScript execution and consider code splitting',
        'poor': 'Critical: Reduce JavaScript execution time and break up long tasks'
      },
      FCP: {
        'needs-improvement': 'Optimize resource loading and consider preloading critical resources',
        'poor': 'Critical: Optimize server response time and eliminate render-blocking resources'
      },
      LCP: {
        'needs-improvement': 'Optimize largest contentful element loading and consider image optimization',
        'poor': 'Critical: Optimize server response time and preload largest contentful element'
      },
      TTFB: {
        'needs-improvement': 'Optimize server response time and consider CDN usage',
        'poor': 'Critical: Optimize server performance and database queries'
      }
    }

    return recommendations[metricName as keyof typeof recommendations]?.[rating as 'needs-improvement' | 'poor'] || 'Optimize this metric for better performance'
  }

  /**
   * Clear metrics
   */
  clearMetrics(): void {
    this.metrics = []
  }

  /**
   * Get all metrics
   */
  getMetrics(): WebVitalsMetric[] {
    return [...this.metrics]
  }
}

// Create singleton instance
export const webVitalsMonitor = new WebVitalsMonitor()

// Auto-initialize in browser
if (typeof window !== 'undefined') {
  // Initialize after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      webVitalsMonitor.init()
    })
  } else {
    webVitalsMonitor.init()
  }
}

// Export for manual initialization
export default webVitalsMonitor