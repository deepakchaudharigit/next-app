/**
 * Advanced Rate Limiting System
 * Implements multiple rate limiting strategies for different use cases
 */

import { advancedCache } from '@/lib/cache/advanced-cache'

export interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  keyGenerator?: (identifier: string) => string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  message?: string
  headers?: boolean
  onLimitReached?: (identifier: string) => void
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: Date
  totalRequests: number
}

export interface RateLimitStats {
  identifier: string
  requests: number
  blocked: number
  lastRequest: Date
  resetTime: Date
}

class RateLimiter {
  private stats = new Map<string, RateLimitStats>()

  // Token bucket algorithm
  async checkTokenBucket(
    identifier: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const key = this.generateKey(identifier, config, 'token-bucket')
    const now = Date.now()
    
    // Get current bucket state
    const bucketData = await advancedCache.get<{
      tokens: number
      lastRefill: number
    }>(key) || {
      tokens: config.maxRequests,
      lastRefill: now
    }

    // Calculate tokens to add based on time passed
    const timePassed = now - bucketData.lastRefill
    const tokensToAdd = Math.floor(timePassed / config.windowMs * config.maxRequests)
    
    // Refill bucket
    const newTokens = Math.min(config.maxRequests, bucketData.tokens + tokensToAdd)
    
    if (newTokens > 0) {
      // Allow request and consume token
      const updatedBucket = {
        tokens: newTokens - 1,
        lastRefill: now
      }
      
      await advancedCache.set(key, updatedBucket, {
        ttl: Math.ceil(config.windowMs / 1000) * 2
      })

      this.updateStats(identifier, false)

      return {
        allowed: true,
        remaining: updatedBucket.tokens,
        resetTime: new Date(now + config.windowMs),
        totalRequests: config.maxRequests - updatedBucket.tokens
      }
    } else {
      // Rate limit exceeded
      this.updateStats(identifier, true)
      
      if (config.onLimitReached) {
        config.onLimitReached(identifier)
      }

      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(now + config.windowMs),
        totalRequests: config.maxRequests
      }
    }
  }

  // Sliding window algorithm
  async checkSlidingWindow(
    identifier: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const key = this.generateKey(identifier, config, 'sliding-window')
    const now = Date.now()
    const windowStart = now - config.windowMs

    // Get request timestamps within the window
    const requests = await advancedCache.get<number[]>(key) || []
    
    // Filter requests within the current window
    const validRequests = requests.filter(timestamp => timestamp > windowStart)
    
    if (validRequests.length < config.maxRequests) {
      // Allow request
      validRequests.push(now)
      
      await advancedCache.set(key, validRequests, {
        ttl: Math.ceil(config.windowMs / 1000) * 2
      })

      this.updateStats(identifier, false)

      return {
        allowed: true,
        remaining: config.maxRequests - validRequests.length,
        resetTime: new Date(validRequests[0] + config.windowMs),
        totalRequests: validRequests.length
      }
    } else {
      // Rate limit exceeded
      this.updateStats(identifier, true)
      
      if (config.onLimitReached) {
        config.onLimitReached(identifier)
      }

      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(validRequests[0] + config.windowMs),
        totalRequests: validRequests.length
      }
    }
  }

  // Fixed window algorithm
  async checkFixedWindow(
    identifier: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const key = this.generateKey(identifier, config, 'fixed-window')
    const now = Date.now()
    const windowStart = Math.floor(now / config.windowMs) * config.windowMs

    const windowData = await advancedCache.get<{
      count: number
      windowStart: number
    }>(key) || {
      count: 0,
      windowStart
    }

    // Reset if new window
    if (windowData.windowStart !== windowStart) {
      windowData.count = 0
      windowData.windowStart = windowStart
    }

    if (windowData.count < config.maxRequests) {
      // Allow request
      windowData.count++
      
      await advancedCache.set(key, windowData, {
        ttl: Math.ceil(config.windowMs / 1000) * 2
      })

      this.updateStats(identifier, false)

      return {
        allowed: true,
        remaining: config.maxRequests - windowData.count,
        resetTime: new Date(windowStart + config.windowMs),
        totalRequests: windowData.count
      }
    } else {
      // Rate limit exceeded
      this.updateStats(identifier, true)
      
      if (config.onLimitReached) {
        config.onLimitReached(identifier)
      }

      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(windowStart + config.windowMs),
        totalRequests: windowData.count
      }
    }
  }

  // Adaptive rate limiting based on system load
  async checkAdaptive(
    identifier: string,
    config: RateLimitConfig,
    systemLoad: number = 0.5
  ): Promise<RateLimitResult> {
    // Adjust limits based on system load
    const adjustedConfig = {
      ...config,
      maxRequests: Math.floor(config.maxRequests * (1 - systemLoad * 0.5))
    }

    return this.checkTokenBucket(identifier, adjustedConfig)
  }

  // Distributed rate limiting (for multiple instances)
  async checkDistributed(
    identifier: string,
    config: RateLimitConfig,
    instanceId: string
  ): Promise<RateLimitResult> {
    const globalKey = this.generateKey(identifier, config, 'distributed')
    const instanceKey = `${globalKey}:${instanceId}`
    
    // Get global and instance counts
    const globalCount = await advancedCache.get<number>(globalKey) || 0
    const instanceCount = await advancedCache.get<number>(instanceKey) || 0
    
    // Calculate fair share per instance (assuming max 10 instances)
    const maxInstances = 10
    const instanceLimit = Math.ceil(config.maxRequests / maxInstances)
    
    if (globalCount < config.maxRequests && instanceCount < instanceLimit) {
      // Allow request
      await Promise.all([
        advancedCache.set(globalKey, globalCount + 1, {
          ttl: Math.ceil(config.windowMs / 1000)
        }),
        advancedCache.set(instanceKey, instanceCount + 1, {
          ttl: Math.ceil(config.windowMs / 1000)
        })
      ])

      this.updateStats(identifier, false)

      return {
        allowed: true,
        remaining: Math.min(
          config.maxRequests - globalCount - 1,
          instanceLimit - instanceCount - 1
        ),
        resetTime: new Date(Date.now() + config.windowMs),
        totalRequests: globalCount + 1
      }
    } else {
      // Rate limit exceeded
      this.updateStats(identifier, true)
      
      if (config.onLimitReached) {
        config.onLimitReached(identifier)
      }

      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(Date.now() + config.windowMs),
        totalRequests: globalCount
      }
    }
  }

  private generateKey(
    identifier: string,
    config: RateLimitConfig,
    algorithm: string
  ): string {
    const baseKey = config.keyGenerator 
      ? config.keyGenerator(identifier)
      : `rate-limit:${algorithm}:${identifier}`
    
    return baseKey
  }

  private updateStats(identifier: string, blocked: boolean) {
    const stats = this.stats.get(identifier) || {
      identifier,
      requests: 0,
      blocked: 0,
      lastRequest: new Date(),
      resetTime: new Date()
    }

    stats.requests++
    if (blocked) {
      stats.blocked++
    }
    stats.lastRequest = new Date()

    this.stats.set(identifier, stats)
  }

  // Get statistics for an identifier
  getStats(identifier?: string): RateLimitStats | Map<string, RateLimitStats> {
    if (identifier) {
      return this.stats.get(identifier) || {
        identifier,
        requests: 0,
        blocked: 0,
        lastRequest: new Date(),
        resetTime: new Date()
      }
    }

    return new Map(this.stats)
  }

  // Clear statistics
  clearStats(identifier?: string) {
    if (identifier) {
      this.stats.delete(identifier)
    } else {
      this.stats.clear()
    }
  }

  // Whitelist/blacklist functionality
  private whitelist = new Set<string>()
  private blacklist = new Set<string>()

  addToWhitelist(identifier: string) {
    this.whitelist.add(identifier)
  }

  removeFromWhitelist(identifier: string) {
    this.whitelist.delete(identifier)
  }

  addToBlacklist(identifier: string) {
    this.blacklist.add(identifier)
  }

  removeFromBlacklist(identifier: string) {
    this.blacklist.delete(identifier)
  }

  isWhitelisted(identifier: string): boolean {
    return this.whitelist.has(identifier)
  }

  isBlacklisted(identifier: string): boolean {
    return this.blacklist.has(identifier)
  }

  // Check rate limit with whitelist/blacklist
  async checkWithLists(
    identifier: string,
    config: RateLimitConfig,
    algorithm: 'token-bucket' | 'sliding-window' | 'fixed-window' = 'token-bucket'
  ): Promise<RateLimitResult> {
    // Check blacklist first
    if (this.isBlacklisted(identifier)) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(Date.now() + config.windowMs),
        totalRequests: config.maxRequests
      }
    }

    // Check whitelist
    if (this.isWhitelisted(identifier)) {
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetTime: new Date(Date.now() + config.windowMs),
        totalRequests: 0
      }
    }

    // Apply normal rate limiting
    switch (algorithm) {
      case 'sliding-window':
        return this.checkSlidingWindow(identifier, config)
      case 'fixed-window':
        return this.checkFixedWindow(identifier, config)
      default:
        return this.checkTokenBucket(identifier, config)
    }
  }
}

// Global rate limiter instance
export const rateLimiter = new RateLimiter()

// Pre-configured rate limiters for different use cases
export const authRateLimiter = {
  config: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many authentication attempts',
    onLimitReached: (identifier: string) => {
      console.warn(`🚨 Auth rate limit exceeded for ${identifier}`)
    }
  },
  check: (identifier: string) => rateLimiter.checkWithLists(identifier, authRateLimiter.config)
}

export const apiRateLimiter = {
  config: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    message: 'API rate limit exceeded',
    onLimitReached: (identifier: string) => {
      console.warn(`⚠️ API rate limit exceeded for ${identifier}`)
    }
  },
  check: (identifier: string) => rateLimiter.checkWithLists(identifier, apiRateLimiter.config)
}

export const reportRateLimiter = {
  config: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    message: 'Report generation rate limit exceeded',
    onLimitReached: (identifier: string) => {
      console.warn(`📊 Report rate limit exceeded for ${identifier}`)
    }
  },
  check: (identifier: string) => rateLimiter.checkWithLists(identifier, reportRateLimiter.config)
}

// Utility functions
export function createRateLimitMiddleware(
  limiter: typeof authRateLimiter,
  getIdentifier: (req: any) => string = (req) => req.ip || 'unknown'
) {
  return async (req: any, res: any, next: any) => {
    const identifier = getIdentifier(req)
    const result = await limiter.check(identifier)

    if (!result.allowed) {
      return res.status(429).json({
        success: false,
        message: limiter.config.message,
        retryAfter: Math.ceil((result.resetTime.getTime() - Date.now()) / 1000)
      })
    }

    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', limiter.config.maxRequests)
    res.setHeader('X-RateLimit-Remaining', result.remaining)
    res.setHeader('X-RateLimit-Reset', result.resetTime.toISOString())

    next()
  }
}