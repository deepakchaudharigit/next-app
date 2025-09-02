/**
 * Cache Management API
 * Provides cache statistics, management, and control endpoints
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth-utils'
import { cache } from '@/lib/cache/redis'
import { cacheInvalidation } from '@/lib/cache/middleware'

export const GET = withAdminAuth(async (req: NextRequest) => {
  try {
    const url = new URL(req.url)
    const action = url.searchParams.get('action')
    
    switch (action) {
      case 'stats':
        return await getCacheStats()
      case 'health':
        return await getCacheHealth()
      default:
        return await getCacheOverview()
    }
  } catch (error) {
    console.error('Cache API GET error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
})

export const POST = withAdminAuth(async (req: NextRequest) => {
  try {
    const { action, pattern, key } = await req.json()
    
    switch (action) {
      case 'clear':
        return await clearCache(pattern)
      case 'invalidate':
        return await invalidateCache(key)
      case 'warm':
        return await warmCache()
      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Cache API POST error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
})

export const DELETE = withAdminAuth(async (req: NextRequest) => {
  try {
    const url = new URL(req.url)
    const pattern = url.searchParams.get('pattern')
    
    if (pattern) {
      const deletedCount = await cache.delPattern(pattern)
      return NextResponse.json({
        success: true,
        message: `Deleted ${deletedCount} cache entries`,
        deletedCount
      })
    }
    
    // Clear all cache
    const cleared = await cache.clear()
    return NextResponse.json({
      success: true,
      message: cleared ? 'All cache cleared' : 'Failed to clear cache'
    })
  } catch (error) {
    console.error('Cache API DELETE error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
})

/**
 * Get cache statistics
 */
async function getCacheStats(): Promise<NextResponse> {
  const stats = await cache.getStats()
  
  if (!stats) {
    return NextResponse.json({
      success: false,
      message: 'Cache not available'
    }, { status: 503 })
  }
  
  return NextResponse.json({
    success: true,
    data: {
      ...stats,
      hitRate: stats.hits + stats.misses > 0 
        ? Math.round((stats.hits / (stats.hits + stats.misses)) * 100)
        : 0
    }
  })
}

/**
 * Get cache health status
 */
async function getCacheHealth(): Promise<NextResponse> {
  const isAvailable = cache.isAvailable()
  const stats = await cache.getStats()
  
  const health = {
    status: isAvailable ? 'healthy' : 'unhealthy',
    connected: isAvailable,
    uptime: stats?.connected ? 'connected' : 'disconnected',
    memory: stats?.memory || 'unknown',
    keys: stats?.keys || 0,
    performance: {
      hits: stats?.hits || 0,
      misses: stats?.misses || 0,
      hitRate: stats && (stats.hits + stats.misses > 0)
        ? Math.round((stats.hits / (stats.hits + stats.misses)) * 100)
        : 0
    }
  }
  
  return NextResponse.json({
    success: true,
    data: health
  })
}

/**
 * Get cache overview
 */
async function getCacheOverview(): Promise<NextResponse> {
  const stats = await cache.getStats()
  const isAvailable = cache.isAvailable()
  
  return NextResponse.json({
    success: true,
    data: {
      available: isAvailable,
      stats: stats || null,
      endpoints: {
        stats: '/api/cache?action=stats',
        health: '/api/cache?action=health',
        clear: 'POST /api/cache { action: "clear", pattern?: string }',
        invalidate: 'POST /api/cache { action: "invalidate", key: string }',
        warm: 'POST /api/cache { action: "warm" }',
        delete: 'DELETE /api/cache?pattern=pattern'
      }
    }
  })
}

/**
 * Clear cache by pattern
 */
async function clearCache(pattern?: string): Promise<NextResponse> {
  try {
    if (pattern) {
      const deletedCount = await cache.delPattern(pattern)
      return NextResponse.json({
        success: true,
        message: `Cleared ${deletedCount} cache entries matching pattern: ${pattern}`,
        deletedCount
      })
    }
    
    const cleared = await cache.clear()
    return NextResponse.json({
      success: true,
      message: cleared ? 'All cache cleared successfully' : 'Failed to clear cache'
    })
  } catch (error) {
    console.error('Clear cache error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to clear cache' },
      { status: 500 }
    )
  }
}

/**
 * Invalidate specific cache key
 */
async function invalidateCache(key: string): Promise<NextResponse> {
  try {
    const deleted = await cache.del(key)
    return NextResponse.json({
      success: true,
      message: deleted ? `Cache key '${key}' invalidated` : `Cache key '${key}' not found`
    })
  } catch (error) {
    console.error('Invalidate cache error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to invalidate cache' },
      { status: 500 }
    )
  }
}

/**
 * Warm cache with frequently accessed data
 */
async function warmCache(): Promise<NextResponse> {
  try {
    const warmedItems = []
    
    // Warm dashboard stats for common time ranges
    const timeRanges = ['1h', '24h', '7d', '30d']
    for (const timeRange of timeRanges) {
      try {
        const response = await fetch(`${process.env.NEXTAUTH_URL}/api/dashboard/stats?timeRange=${timeRange}`)
        if (response.ok) {
          warmedItems.push(`dashboard:stats:${timeRange}`)
        }
      } catch (error) {
        console.error(`Failed to warm dashboard stats for ${timeRange}:`, error)
      }
    }
    
    // Warm user data for active users (if needed)
    // This would require additional logic to identify active users
    
    return NextResponse.json({
      success: true,
      message: `Cache warmed successfully. Warmed ${warmedItems.length} items.`,
      warmedItems
    })
  } catch (error) {
    console.error('Warm cache error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to warm cache' },
      { status: 500 }
    )
  }
}