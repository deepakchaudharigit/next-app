/**
 * Cache Middleware for API Routes
 * Provides automatic caching for API responses
 */

import { NextRequest, NextResponse } from 'next/server'
import { cache, cacheHelpers, CACHE_TTL } from './redis'
import { isDevelopment } from '@config/env.server'

export interface CacheMiddlewareOptions {
  ttl?: number
  keyGenerator?: (req: NextRequest) => string
  shouldCache?: (req: NextRequest, res: NextResponse) => boolean
  prefix?: string
  bypassCache?: boolean
}

/**
 * Create cache key from request
 */
function createCacheKey(req: NextRequest, keyGenerator?: (req: NextRequest) => string): string {
  if (keyGenerator) {
    return keyGenerator(req)
  }
  
  const url = new URL(req.url)
  const pathname = url.pathname
  const searchParams = url.searchParams.toString()
  
  return `${pathname}${searchParams ? `?${searchParams}` : ''}`
}

/**
 * Check if response should be cached
 */
function shouldCacheResponse(
  req: NextRequest, 
  res: NextResponse, 
  shouldCache?: (req: NextRequest, res: NextResponse) => boolean
): boolean {
  if (shouldCache) {
    return shouldCache(req, res)
  }
  
  // Default caching rules
  return (
    req.method === 'GET' &&
    res.status === 200 &&
    !req.headers.get('authorization')?.includes('no-cache')
  )
}

/**
 * Cache middleware wrapper for API routes
 */
export function withCache<T extends unknown[]>(
  handler: (req: NextRequest, ...args: T) => Promise<NextResponse>,
  options: CacheMiddlewareOptions = {}
) {
  return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
    const {
      ttl = CACHE_TTL.MEDIUM,
      keyGenerator,
      shouldCache,
      prefix = 'api:',
      bypassCache = false
    } = options
    
    // Skip caching in development if specified
    if (bypassCache || (isDevelopment && req.headers.get('cache-control') === 'no-cache')) {
      return handler(req, ...args)
    }
    
    const cacheKey = createCacheKey(req, keyGenerator)
    
    // Try to get from cache first (only for GET requests)
    if (req.method === 'GET') {
      try {
        const cachedResponse = await cache.get<{
          status: number
          headers: Record<string, string>
          body: any
        }>(cacheKey, prefix)
        
        if (cachedResponse) {
          if (isDevelopment) {
            console.log(`🎯 Cache hit for: ${cacheKey}`)
          }
          
          const response = NextResponse.json(cachedResponse.body, {
            status: cachedResponse.status,
            headers: {
              ...cachedResponse.headers,
              'X-Cache': 'HIT',
              'X-Cache-Key': cacheKey
            }
          })
          
          return response
        }
      } catch (error) {
        console.error('❌ Cache retrieval error:', error)
      }
    }
    
    // Execute the original handler
    const response = await handler(req, ...args)
    
    // Cache the response if conditions are met
    if (shouldCacheResponse(req, response, shouldCache)) {
      try {
        const responseBody = await response.clone().json()
        
        const cacheData = {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          body: responseBody
        }
        
        await cache.set(cacheKey, cacheData, { prefix, ttl })
        
        if (isDevelopment) {
          console.log(`💾 Cached response for: ${cacheKey} (TTL: ${ttl}s)`)
        }
        
        // Add cache headers
        response.headers.set('X-Cache', 'MISS')
        response.headers.set('X-Cache-Key', cacheKey)
        response.headers.set('X-Cache-TTL', ttl.toString())
        
      } catch (error) {
        console.error('❌ Cache storage error:', error)
      }
    }
    
    return response
  }
}

/**
 * Specific cache middleware for dashboard stats
 */
export function withDashboardStatsCache<T extends unknown[]>(
  handler: (req: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return withCache(handler, {
    ttl: CACHE_TTL.MEDIUM,
    prefix: 'dashboard:stats:',
    keyGenerator: (req) => {
      const url = new URL(req.url)
      const timeRange = url.searchParams.get('timeRange') || '24h'
      return timeRange
    }
  })
}

/**
 * Cache middleware for user data
 */
export function withUserCache<T extends unknown[]>(
  handler: (req: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return withCache(handler, {
    ttl: CACHE_TTL.LONG,
    prefix: 'user:',
    keyGenerator: (req) => {
      const url = new URL(req.url)
      const userId = url.pathname.split('/').pop() || 'unknown'
      return userId
    }
  })
}

/**
 * Cache middleware for reports
 */
export function withReportsCache<T extends unknown[]>(
  handler: (req: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return withCache(handler, {
    ttl: CACHE_TTL.LONG,
    prefix: 'reports:',
    shouldCache: (req, res) => {
      return req.method === 'GET' && res.status === 200
    }
  })
}

/**
 * Cache invalidation helpers
 */
export const cacheInvalidation = {
  /**
   * Invalidate all dashboard stats cache
   */
  async invalidateDashboardStats(): Promise<number> {
    return cache.delPattern('dashboard:stats:*')
  },
  
  /**
   * Invalidate user cache
   */
  async invalidateUser(userId: string): Promise<boolean> {
    return cache.del(userId, 'user:')
  },
  
  /**
   * Invalidate all user cache
   */
  async invalidateAllUsers(): Promise<number> {
    return cache.delPattern('user:*')
  },
  
  /**
   * Invalidate reports cache
   */
  async invalidateReports(): Promise<number> {
    return cache.delPattern('reports:*')
  },
  
  /**
   * Invalidate API cache by pattern
   */
  async invalidateApiCache(pattern: string): Promise<number> {
    return cache.delPattern(`api:*${pattern}*`)
  }
}

/**
 * Cache warming utilities
 */
export const cacheWarming = {
  /**
   * Warm dashboard stats cache
   */
  async warmDashboardStats(): Promise<void> {
    const timeRanges = ['1h', '24h', '7d', '30d']
    
    for (const timeRange of timeRanges) {
      try {
        // This would typically call your dashboard stats API
        const response = await fetch(`/api/dashboard/stats?timeRange=${timeRange}`)
        if (response.ok) {
          const data = await response.json()
          await cacheHelpers.cacheDashboardStats(timeRange, data)
        }
      } catch (error) {
        console.error(`❌ Failed to warm cache for timeRange ${timeRange}:`, error)
      }
    }
  },
  
  /**
   * Warm frequently accessed data
   */
  async warmFrequentData(): Promise<void> {
    // Add logic to warm frequently accessed data
    console.log('🔥 Warming frequently accessed cache data...')
  }
}

export default withCache