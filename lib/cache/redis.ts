/**
 * Redis Caching System
 * Provides high-performance caching for the NPCL Dashboard
 */

import Redis from 'ioredis'
import { serverEnv, isDevelopment } from '@config/env.server'

// Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: 30000,
  connectTimeout: 10000,
  commandTimeout: 5000,
}

// Create Redis instance with error handling
let redis: Redis | null = null

const createRedisClient = (): Redis | null => {
  try {
    const client = new Redis(redisConfig)
    
    client.on('connect', () => {
      if (isDevelopment) {
        console.log('🔗 Redis connected successfully')
      }
    })
    
    client.on('error', (error) => {
      console.error('❌ Redis connection error:', error)
    })
    
    client.on('close', () => {
      if (isDevelopment) {
        console.log('🔌 Redis connection closed')
      }
    })
    
    return client
  } catch (error) {
    console.error('❌ Failed to create Redis client:', error)
    return null
  }
}

// Initialize Redis client
if (typeof window === 'undefined') {
  redis = createRedisClient()
}

// Cache key prefixes for different data types
export const CACHE_PREFIXES = {
  USER: 'user:',
  SESSION: 'session:',
  DASHBOARD_STATS: 'dashboard:stats:',
  API_RESPONSE: 'api:',
  POWER_UNITS: 'power:units:',
  REPORTS: 'reports:',
  AUDIT_LOGS: 'audit:',
} as const

// Cache TTL (Time To Live) in seconds
export const CACHE_TTL = {
  SHORT: 60,           // 1 minute
  MEDIUM: 300,         // 5 minutes
  LONG: 1800,          // 30 minutes
  VERY_LONG: 3600,     // 1 hour
  DAILY: 86400,        // 24 hours
} as const

// Cache interface
export interface CacheOptions {
  ttl?: number
  prefix?: string
  compress?: boolean
}

// Main cache class
export class CacheManager {
  private client: Redis | null
  
  constructor() {
    this.client = redis
  }
  
  /**
   * Check if Redis is available
   */
  isAvailable(): boolean {
    return this.client !== null && this.client.status === 'ready'
  }
  
  /**
   * Generate cache key with prefix
   */
  private generateKey(key: string, prefix?: string): string {
    return prefix ? `${prefix}${key}` : key
  }
  
  /**
   * Set cache value
   */
  async set<T>(
    key: string, 
    value: T, 
    options: CacheOptions = {}
  ): Promise<boolean> {
    if (!this.isAvailable()) {
      if (isDevelopment) {
        console.warn('⚠️ Redis not available, skipping cache set')
      }
      return false
    }
    
    try {
      const cacheKey = this.generateKey(key, options.prefix)
      const serializedValue = JSON.stringify(value)
      const ttl = options.ttl || CACHE_TTL.MEDIUM
      
      await this.client!.setex(cacheKey, ttl, serializedValue)
      
      if (isDevelopment) {
        console.log(`✅ Cache set: ${cacheKey} (TTL: ${ttl}s)`)
      }
      
      return true
    } catch (error) {
      console.error('❌ Cache set error:', error)
      return false
    }
  }
  
  /**
   * Get cache value
   */
  async get<T>(key: string, prefix?: string): Promise<T | null> {
    if (!this.isAvailable()) {
      if (isDevelopment) {
        console.warn('⚠️ Redis not available, skipping cache get')
      }
      return null
    }
    
    try {
      const cacheKey = this.generateKey(key, prefix)
      const cachedValue = await this.client!.get(cacheKey)
      
      if (cachedValue === null) {
        if (isDevelopment) {
          console.log(`❌ Cache miss: ${cacheKey}`)
        }
        return null
      }
      
      if (isDevelopment) {
        console.log(`✅ Cache hit: ${cacheKey}`)
      }
      
      return JSON.parse(cachedValue) as T
    } catch (error) {
      console.error('❌ Cache get error:', error)
      return null
    }
  }
  
  /**
   * Delete cache value
   */
  async del(key: string, prefix?: string): Promise<boolean> {
    if (!this.isAvailable()) {
      return false
    }
    
    try {
      const cacheKey = this.generateKey(key, prefix)
      const result = await this.client!.del(cacheKey)
      
      if (isDevelopment) {
        console.log(`🗑️ Cache deleted: ${cacheKey}`)
      }
      
      return result > 0
    } catch (error) {
      console.error('❌ Cache delete error:', error)
      return false
    }
  }
  
  /**
   * Delete multiple cache keys by pattern
   */
  async delPattern(pattern: string): Promise<number> {
    if (!this.isAvailable()) {
      return 0
    }
    
    try {
      const keys = await this.client!.keys(pattern)
      if (keys.length === 0) {
        return 0
      }
      
      const result = await this.client!.del(...keys)
      
      if (isDevelopment) {
        console.log(`🗑️ Cache pattern deleted: ${pattern} (${result} keys)`)
      }
      
      return result
    } catch (error) {
      console.error('❌ Cache pattern delete error:', error)
      return 0
    }
  }
  
  /**
   * Check if key exists in cache
   */
  async exists(key: string, prefix?: string): Promise<boolean> {
    if (!this.isAvailable()) {
      return false
    }
    
    try {
      const cacheKey = this.generateKey(key, prefix)
      const result = await this.client!.exists(cacheKey)
      return result === 1
    } catch (error) {
      console.error('❌ Cache exists error:', error)
      return false
    }
  }
  
  /**
   * Get cache TTL
   */
  async ttl(key: string, prefix?: string): Promise<number> {
    if (!this.isAvailable()) {
      return -1
    }
    
    try {
      const cacheKey = this.generateKey(key, prefix)
      return await this.client!.ttl(cacheKey)
    } catch (error) {
      console.error('❌ Cache TTL error:', error)
      return -1
    }
  }
  
  /**
   * Increment cache value
   */
  async incr(key: string, prefix?: string): Promise<number> {
    if (!this.isAvailable()) {
      return 0
    }
    
    try {
      const cacheKey = this.generateKey(key, prefix)
      return await this.client!.incr(cacheKey)
    } catch (error) {
      console.error('❌ Cache increment error:', error)
      return 0
    }
  }
  
  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    connected: boolean
    memory: string
    keys: number
    hits: number
    misses: number
  } | null> {
    if (!this.isAvailable()) {
      return null
    }
    
    try {
      const info = await this.client!.info('memory')
      const keyspace = await this.client!.info('keyspace')
      const stats = await this.client!.info('stats')
      
      // Parse memory usage
      const memoryMatch = info.match(/used_memory_human:(.+)/)
      const memory = memoryMatch?.[1]?.trim() || 'Unknown'
      
      // Parse key count
      const keyMatch = keyspace.match(/keys=(\d+)/)
      const keys = keyMatch?.[1] ? parseInt(keyMatch[1]) : 0
      
      // Parse hits and misses
      const hitsMatch = stats.match(/keyspace_hits:(\d+)/)
      const missesMatch = stats.match(/keyspace_misses:(\d+)/)
      const hits = hitsMatch?.[1] ? parseInt(hitsMatch[1]) : 0
      const misses = missesMatch?.[1] ? parseInt(missesMatch[1]) : 0
      
      return {
        connected: true,
        memory,
        keys,
        hits,
        misses
      }
    } catch (error) {
      console.error('❌ Cache stats error:', error)
      return null
    }
  }
  
  /**
   * Clear all cache
   */
  async clear(): Promise<boolean> {
    if (!this.isAvailable()) {
      return false
    }
    
    try {
      await this.client!.flushdb()
      
      if (isDevelopment) {
        console.log('🧹 Cache cleared')
      }
      
      return true
    } catch (error) {
      console.error('❌ Cache clear error:', error)
      return false
    }
  }
  
  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    if (this.client) {
      await this.client.quit()
      this.client = null
    }
  }
}

// Create singleton instance
export const cache = new CacheManager()

// Helper functions for common cache operations
export const cacheHelpers = {
  /**
   * Cache with fallback - get from cache or execute function and cache result
   */
  async getOrSet<T>(
    key: string,
    fallbackFn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = await cache.get<T>(key, options.prefix)
    
    if (cached !== null) {
      return cached
    }
    
    const result = await fallbackFn()
    await cache.set(key, result, options)
    
    return result
  },
  
  /**
   * Cache dashboard stats
   */
  async cacheDashboardStats<T>(
    timeRange: string,
    data: T
  ): Promise<boolean> {
    return cache.set(
      timeRange,
      data,
      {
        prefix: CACHE_PREFIXES.DASHBOARD_STATS,
        ttl: CACHE_TTL.MEDIUM
      }
    )
  },
  
  /**
   * Get cached dashboard stats
   */
  async getCachedDashboardStats<T>(timeRange: string): Promise<T | null> {
    return cache.get<T>(timeRange, CACHE_PREFIXES.DASHBOARD_STATS)
  },
  
  /**
   * Cache user data
   */
  async cacheUser<T>(userId: string, userData: T): Promise<boolean> {
    return cache.set(
      userId,
      userData,
      {
        prefix: CACHE_PREFIXES.USER,
        ttl: CACHE_TTL.LONG
      }
    )
  },
  
  /**
   * Get cached user data
   */
  async getCachedUser<T>(userId: string): Promise<T | null> {
    return cache.get<T>(userId, CACHE_PREFIXES.USER)
  },
  
  /**
   * Invalidate user cache
   */
  async invalidateUser(userId: string): Promise<boolean> {
    return cache.del(userId, CACHE_PREFIXES.USER)
  },
  
  /**
   * Cache API response
   */
  async cacheApiResponse<T>(
    endpoint: string,
    params: string,
    data: T,
    ttl: number = CACHE_TTL.SHORT
  ): Promise<boolean> {
    const key = `${endpoint}:${params}`
    return cache.set(key, data, {
      prefix: CACHE_PREFIXES.API_RESPONSE,
      ttl
    })
  },
  
  /**
   * Get cached API response
   */
  async getCachedApiResponse<T>(
    endpoint: string,
    params: string
  ): Promise<T | null> {
    const key = `${endpoint}:${params}`
    return cache.get<T>(key, CACHE_PREFIXES.API_RESPONSE)
  }
}

// Export default cache instance
export default cache