/**
 * Advanced Caching Strategy
 * Multi-layer caching with intelligent invalidation and warming
 */

import { cache as redisCache } from './redis'
import { withRedisRetry } from '@/lib/resilience/retry'
import { redisCircuitBreaker } from '@/lib/resilience/circuit-breaker'

interface CacheConfig {
  ttl: number
  staleWhileRevalidate?: number
  tags?: string[]
  version?: string
  compress?: boolean
  serialize?: (data: any) => string
  deserialize?: (data: string) => any
}

interface CacheStats {
  hits: number
  misses: number
  sets: number
  deletes: number
  errors: number
  hitRate: number
  avgResponseTime: number
}

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
  version?: string
  tags?: string[]
}

class AdvancedCache {
  private memoryCache = new Map<string, CacheEntry<any>>()
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0,
    hitRate: 0,
    avgResponseTime: 0
  }
  private responseTimes: number[] = []

  // Multi-layer get with fallback
  async get<T>(
    key: string,
    config?: Partial<CacheConfig>
  ): Promise<T | null> {
    const startTime = Date.now()

    try {
      // Layer 1: Memory cache (fastest)
      const memoryResult = this.getFromMemory<T>(key)
      if (memoryResult !== null) {
        this.recordHit(startTime)
        return memoryResult
      }

      // Layer 2: Redis cache
      const redisResult = await this.getFromRedis<T>(key, config)
      if (redisResult !== null) {
        // Store in memory for faster future access
        this.setInMemory(key, redisResult, config)
        this.recordHit(startTime)
        return redisResult
      }

      this.recordMiss(startTime)
      return null

    } catch (error) {
      this.recordError()
      console.error(`Cache get error for key ${key}:`, error)
      return null
    }
  }

  // Multi-layer set
  async set<T>(
    key: string,
    data: T,
    config: CacheConfig
  ): Promise<boolean> {
    try {
      // Set in memory cache
      this.setInMemory(key, data, config)

      // Set in Redis cache
      await this.setInRedis(key, data, config)

      this.stats.sets++
      return true

    } catch (error) {
      this.recordError()
      console.error(`Cache set error for key ${key}:`, error)
      return false
    }
  }

  // Get or set pattern with data loader
  async getOrSet<T>(
    key: string,
    loader: () => Promise<T>,
    config: CacheConfig
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key, config)
    if (cached !== null) {
      return cached
    }

    // Load data
    const data = await loader()

    // Cache the result
    await this.set(key, data, config)

    return data
  }

  // Stale-while-revalidate pattern
  async getStaleWhileRevalidate<T>(
    key: string,
    loader: () => Promise<T>,
    config: CacheConfig & { staleWhileRevalidate: number }
  ): Promise<T> {
    const cached = await this.get<T>(key, config)
    
    if (cached !== null) {
      // Check if data is stale
      const entry = this.memoryCache.get(key) || await this.getRedisEntry<T>(key)
      
      if (entry && this.isStale(entry, config.staleWhileRevalidate)) {
        // Return stale data immediately, revalidate in background
        this.revalidateInBackground(key, loader, config)
      }
      
      return cached
    }

    // No cached data, load synchronously
    return this.getOrSet(key, loader, config)
  }

  // Batch operations
  async mget<T>(keys: string[]): Promise<Map<string, T | null>> {
    const results = new Map<string, T | null>()

    // Try memory cache first
    const memoryResults = new Map<string, T | null>()
    const redisKeys: string[] = []

    for (const key of keys) {
      const memoryResult = this.getFromMemory<T>(key)
      if (memoryResult !== null) {
        memoryResults.set(key, memoryResult)
      } else {
        redisKeys.push(key)
      }
    }

    // Get remaining from Redis
    if (redisKeys.length > 0) {
      const redisResults = await this.mgetFromRedis<T>(redisKeys)
      
      // Merge results
      for (const [key, value] of redisResults) {
        results.set(key, value)
        
        // Cache in memory for future access
        if (value !== null) {
          this.setInMemory(key, value)
        }
      }
    }

    // Add memory results
    for (const [key, value] of memoryResults) {
      results.set(key, value)
    }

    return results
  }

  async mset<T>(entries: Map<string, { data: T; config: CacheConfig }>): Promise<boolean> {
    try {
      // Set in memory
      for (const [key, { data, config }] of entries) {
        this.setInMemory(key, data, config)
      }

      // Set in Redis
      await this.msetInRedis(entries)

      this.stats.sets += entries.size
      return true

    } catch (error) {
      this.recordError()
      console.error('Cache mset error:', error)
      return false
    }
  }

  // Tag-based invalidation
  async invalidateByTags(tags: string[]): Promise<number> {
    let invalidated = 0

    try {
      // Invalidate from memory cache
      for (const [key, entry] of this.memoryCache) {
        if (entry.tags && entry.tags.some(tag => tags.includes(tag))) {
          this.memoryCache.delete(key)
          invalidated++
        }
      }

      // Invalidate from Redis cache
      const redisInvalidated = await this.invalidateRedisByTags(tags)
      invalidated += redisInvalidated

      this.stats.deletes += invalidated
      return invalidated

    } catch (error) {
      this.recordError()
      console.error('Cache invalidation error:', error)
      return 0
    }
  }

  // Pattern-based invalidation
  async invalidateByPattern(pattern: string): Promise<number> {
    try {
      let invalidated = 0

      // Invalidate from memory cache
      const regex = new RegExp(pattern.replace(/\*/g, '.*'))
      for (const key of this.memoryCache.keys()) {
        if (regex.test(key)) {
          this.memoryCache.delete(key)
          invalidated++
        }
      }

      // Invalidate from Redis cache
      const redisInvalidated = await redisCache.delPattern(pattern)
      invalidated += redisInvalidated

      this.stats.deletes += invalidated
      return invalidated

    } catch (error) {
      this.recordError()
      console.error('Cache pattern invalidation error:', error)
      return 0
    }
  }

  // Cache warming
  async warmCache(warmers: Array<{ key: string; loader: () => Promise<any>; config: CacheConfig }>) {
    console.log(`🔥 Warming cache with ${warmers.length} entries...`)

    const results = await Promise.allSettled(
      warmers.map(async ({ key, loader, config }) => {
        try {
          const data = await loader()
          await this.set(key, data, config)
          return { key, success: true }
        } catch (error) {
          console.error(`Failed to warm cache for key ${key}:`, error)
          return { key, success: false, error }
        }
      })
    )

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length
    console.log(`✅ Cache warming completed: ${successful}/${warmers.length} successful`)

    return { total: warmers.length, successful, failed: warmers.length - successful }
  }

  // Memory cache operations
  private getFromMemory<T>(key: string): T | null {
    const entry = this.memoryCache.get(key)
    
    if (!entry) return null
    
    // Check if expired
    if (Date.now() > entry.timestamp + entry.ttl * 1000) {
      this.memoryCache.delete(key)
      return null
    }
    
    return entry.data
  }

  private setInMemory<T>(key: string, data: T, config?: Partial<CacheConfig>) {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: config?.ttl || 300, // 5 minutes default
      version: config?.version,
      tags: config?.tags
    }

    this.memoryCache.set(key, entry)

    // Limit memory cache size
    if (this.memoryCache.size > 1000) {
      const oldestKey = this.memoryCache.keys().next().value
      this.memoryCache.delete(oldestKey)
    }
  }

  // Redis cache operations
  private async getFromRedis<T>(key: string, config?: Partial<CacheConfig>): Promise<T | null> {
    return redisCircuitBreaker.execute(async () => {
      return withRedisRetry(async () => {
        const data = await redisCache.get<T>(key)
        return data
      }, `redis-get-${key}`)
    })
  }

  private async setInRedis<T>(key: string, data: T, config: CacheConfig): Promise<void> {
    return redisCircuitBreaker.execute(async () => {
      return withRedisRetry(async () => {
        await redisCache.set(key, data, { ttl: config.ttl })
        
        // Store tags for invalidation
        if (config.tags) {
          for (const tag of config.tags) {
            await redisCache.sadd(`tag:${tag}`, key)
            await redisCache.expire(`tag:${tag}`, config.ttl)
          }
        }
      }, `redis-set-${key}`)
    })
  }

  private async getRedisEntry<T>(key: string): Promise<CacheEntry<T> | null> {
    // This would require storing metadata with the cached data
    // For now, return null
    return null
  }

  private async mgetFromRedis<T>(keys: string[]): Promise<Map<string, T | null>> {
    return redisCircuitBreaker.execute(async () => {
      return withRedisRetry(async () => {
        const results = new Map<string, T | null>()
        
        // Redis mget implementation would go here
        // For now, get individually
        for (const key of keys) {
          const value = await redisCache.get<T>(key)
          results.set(key, value)
        }
        
        return results
      }, 'redis-mget')
    })
  }

  private async msetInRedis<T>(entries: Map<string, { data: T; config: CacheConfig }>): Promise<void> {
    return redisCircuitBreaker.execute(async () => {
      return withRedisRetry(async () => {
        // Set each entry individually
        for (const [key, { data, config }] of entries) {
          await redisCache.set(key, data, { ttl: config.ttl })
        }
      }, 'redis-mset')
    })
  }

  private async invalidateRedisByTags(tags: string[]): Promise<number> {
    return redisCircuitBreaker.execute(async () => {
      return withRedisRetry(async () => {
        let invalidated = 0
        
        for (const tag of tags) {
          const keys = await redisCache.smembers(`tag:${tag}`)
          if (keys.length > 0) {
            await redisCache.del(...keys)
            await redisCache.del(`tag:${tag}`)
            invalidated += keys.length
          }
        }
        
        return invalidated
      }, 'redis-invalidate-tags')
    })
  }

  private isStale(entry: CacheEntry<any>, staleTime: number): boolean {
    return Date.now() > entry.timestamp + staleTime * 1000
  }

  private async revalidateInBackground<T>(
    key: string,
    loader: () => Promise<T>,
    config: CacheConfig
  ) {
    // Don't await this - run in background
    setTimeout(async () => {
      try {
        const data = await loader()
        await this.set(key, data, config)
      } catch (error) {
        console.error(`Background revalidation failed for key ${key}:`, error)
      }
    }, 0)
  }

  // Statistics tracking
  private recordHit(startTime: number) {
    this.stats.hits++
    this.recordResponseTime(startTime)
    this.updateHitRate()
  }

  private recordMiss(startTime: number) {
    this.stats.misses++
    this.recordResponseTime(startTime)
    this.updateHitRate()
  }

  private recordError() {
    this.stats.errors++
  }

  private recordResponseTime(startTime: number) {
    const responseTime = Date.now() - startTime
    this.responseTimes.push(responseTime)
    
    // Keep only last 1000 response times
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-1000)
    }
    
    this.stats.avgResponseTime = this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length
  }

  private updateHitRate() {
    const total = this.stats.hits + this.stats.misses
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0
  }

  // Public statistics
  getStats(): CacheStats {
    return { ...this.stats }
  }

  // Clear all caches
  async clear(): Promise<void> {
    this.memoryCache.clear()
    await redisCache.clear()
    
    // Reset stats
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      hitRate: 0,
      avgResponseTime: 0
    }
    this.responseTimes = []
  }
}

// Global advanced cache instance
export const advancedCache = new AdvancedCache()

// Utility functions
export async function getCached<T>(
  key: string,
  loader: () => Promise<T>,
  config: CacheConfig
): Promise<T> {
  return advancedCache.getOrSet(key, loader, config)
}

export async function getStale<T>(
  key: string,
  loader: () => Promise<T>,
  config: CacheConfig & { staleWhileRevalidate: number }
): Promise<T> {
  return advancedCache.getStaleWhileRevalidate(key, loader, config)
}

export async function invalidateCache(pattern: string): Promise<number> {
  return advancedCache.invalidateByPattern(pattern)
}

export async function invalidateTags(tags: string[]): Promise<number> {
  return advancedCache.invalidateByTags(tags)
}