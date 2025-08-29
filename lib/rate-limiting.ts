/**
 * Rate Limiting Implementation for NPCL Dashboard
 * 
 * Provides configurable rate limiting for authentication attempts and API endpoints.
 * Uses in-memory storage with sliding window algorithm for tracking attempts.
 */

import { authConfig } from '@config/auth'
import { getClientIP } from '@lib/auth-utils'
import { NextRequest } from 'next/server'

export interface RateLimitAttempt {
  attempts: number
  firstAttempt: Date
  lastAttempt: Date
  blocked: boolean
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: Date
  totalAttempts: number
  blocked: boolean
}

export interface RateLimitConfig {
  windowMs: number
  maxAttempts: number
  keyGenerator?: (identifier: string, ip: string) => string
}

class RateLimiter {
  private attempts: Map<string, RateLimitAttempt> = new Map()
  private config: RateLimitConfig
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor(config?: Partial<RateLimitConfig>) {
    this.config = {
      windowMs: authConfig.rateLimit.windowMs,
      maxAttempts: authConfig.rateLimit.maxAttempts,
      keyGenerator: (identifier: string, ip: string) => `${ip}:${identifier}`,
      ...config
    }

    // Start cleanup interval to remove expired entries
    this.startCleanup()
  }

  /**
   * Check rate limit status without incrementing the counter
   * Use this to check if a request would be blocked before processing it
   */
  checkStatus(identifier: string, ip: string = 'unknown'): RateLimitResult {
    const key = this.config.keyGenerator!(identifier, ip)
    const now = new Date()
    const windowStart = new Date(now.getTime() - this.config.windowMs)

    const attempt = this.attempts.get(key)

    // If no previous attempts or outside window, not blocked
    if (!attempt || attempt.firstAttempt < windowStart) {
      return {
        allowed: true,
        remaining: this.config.maxAttempts,
        resetTime: new Date(now.getTime() + this.config.windowMs),
        totalAttempts: 0,
        blocked: false
      }
    }

    // Check if currently blocked
    const blocked = attempt.blocked || attempt.attempts >= this.config.maxAttempts
    const resetTime = new Date(attempt.firstAttempt.getTime() + this.config.windowMs)
    const remaining = Math.max(0, this.config.maxAttempts - attempt.attempts)

    return {
      allowed: !blocked,
      remaining,
      resetTime,
      totalAttempts: attempt.attempts,
      blocked
    }
  }

  /**
   * Check if a request should be rate limited (increments counter)
   */
  checkLimit(identifier: string, ip: string = 'unknown'): RateLimitResult {
    const key = this.config.keyGenerator!(identifier, ip)
    const now = new Date()
    const windowStart = new Date(now.getTime() - this.config.windowMs)

    let attempt = this.attempts.get(key)

    // If no previous attempts or outside window, reset
    if (!attempt || attempt.firstAttempt < windowStart) {
      attempt = {
        attempts: 1,
        firstAttempt: now,
        lastAttempt: now,
        blocked: false
      }
    } else {
      // Increment attempts within window
      attempt.attempts++
      attempt.lastAttempt = now
      
      // Check if should be blocked
      if (attempt.attempts > this.config.maxAttempts) {
        attempt.blocked = true
      }
    }

    this.attempts.set(key, attempt)

    const resetTime = new Date(attempt.firstAttempt.getTime() + this.config.windowMs)
    const remaining = Math.max(0, this.config.maxAttempts - attempt.attempts)

    return {
      allowed: !attempt.blocked,
      remaining,
      resetTime,
      totalAttempts: attempt.attempts,
      blocked: attempt.blocked
    }
  }

  /**
   * Record a failed attempt (for tracking purposes)
   */
  recordFailedAttempt(identifier: string, ip: string = 'unknown'): RateLimitResult {
    return this.checkLimit(identifier, ip)
  }

  /**
   * Record a successful attempt (resets the counter)
   */
  recordSuccessfulAttempt(identifier: string, ip: string = 'unknown'): void {
    const key = this.config.keyGenerator!(identifier, ip)
    this.attempts.delete(key)
  }

  /**
   * Check if identifier is currently blocked
   */
  isBlocked(identifier: string, ip: string = 'unknown'): boolean {
    const key = this.config.keyGenerator!(identifier, ip)
    const attempt = this.attempts.get(key)
    
    if (!attempt) return false

    const now = new Date()
    const windowStart = new Date(now.getTime() - this.config.windowMs)

    // If outside window, not blocked
    if (attempt.firstAttempt < windowStart) {
      this.attempts.delete(key)
      return false
    }

    return attempt.blocked
  }

  /**
   * Reset rate limit for specific identifier
   */
  reset(identifier: string, ip: string = 'unknown'): void {
    const key = this.config.keyGenerator!(identifier, ip)
    this.attempts.delete(key)
  }

  /**
   * Reset all rate limits
   */
  resetAll(): void {
    this.attempts.clear()
  }

  /**
   * Get statistics about current rate limiting state
   */
  getStats(): {
    totalTrackedIdentifiers: number
    blockedIdentifiers: number
    totalAttempts: number
    oldestAttempt: Date | null
  } {
    const now = new Date()
    const windowStart = new Date(now.getTime() - this.config.windowMs)
    
    let blockedCount = 0
    let totalAttempts = 0
    let oldestAttempt: Date | null = null

    // Clean up expired entries and count stats
    const entries = Array.from(this.attempts.entries())
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]
      if (!entry) continue
      const [key, attempt] = entry
      if (attempt.firstAttempt < windowStart) {
        this.attempts.delete(key)
        continue
      }

      totalAttempts += attempt.attempts
      if (attempt.blocked) blockedCount++
      
      if (!oldestAttempt || attempt.firstAttempt < oldestAttempt) {
        oldestAttempt = attempt.firstAttempt
      }
    }

    return {
      totalTrackedIdentifiers: this.attempts.size,
      blockedIdentifiers: blockedCount,
      totalAttempts,
      oldestAttempt
    }
  }

  /**
   * Start cleanup interval to remove expired entries
   */
  private startCleanup(): void {
    // Clean up every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)
    
    // Use unref() to prevent the interval from keeping the process alive
    if (this.cleanupInterval && typeof this.cleanupInterval.unref === 'function') {
      this.cleanupInterval.unref()
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = new Date()
    const windowStart = new Date(now.getTime() - this.config.windowMs)

    const entries = Array.from(this.attempts.entries())
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]
      if (!entry) continue
      const [key, attempt] = entry
      if (attempt.firstAttempt < windowStart) {
        this.attempts.delete(key)
      }
    }
  }

  /**
   * Stop cleanup interval (for testing)
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }
}

// Singleton instances for different use cases
export const authRateLimiter = new RateLimiter()

/**
 * Check rate limits for authentication without incrementing counter
 * Use this to check if user is blocked before attempting authentication
 */
export async function checkAuthRateLimit(
  email: string, 
  req?: NextRequest
): Promise<RateLimitResult> {
  const ip = req ? getClientIP(req) : 'unknown'
  return authRateLimiter.checkStatus(email.toLowerCase(), ip)
}

/**
 * Record failed authentication attempt
 */
export async function recordFailedAuth(
  email: string, 
  req?: NextRequest
): Promise<RateLimitResult> {
  const ip = req ? getClientIP(req) : 'unknown'
  return authRateLimiter.recordFailedAttempt(email.toLowerCase(), ip)
}

/**
 * Record successful authentication attempt
 */
export async function recordSuccessfulAuth(
  email: string, 
  req?: NextRequest
): Promise<void> {
  const ip = req ? getClientIP(req) : 'unknown'
  authRateLimiter.recordSuccessfulAttempt(email.toLowerCase(), ip)
}

/**
 * Check if email/IP combination is currently blocked
 */
export async function isAuthBlocked(
  email: string, 
  req?: NextRequest
): Promise<boolean> {
  const ip = req ? getClientIP(req) : 'unknown'
  return authRateLimiter.isBlocked(email.toLowerCase(), ip)
}

/**
 * Create rate limit error response
 */
export function createRateLimitError(result: RateLimitResult): {
  success: false
  error: string
  code: string
  rateLimitInfo: {
    remaining: number
    resetTime: string
    totalAttempts: number
    retryAfter: number
  }
} {
  const retryAfter = Math.ceil((result.resetTime.getTime() - Date.now()) / 1000)
  
  return {
    success: false,
    error: 'Too many authentication attempts. Please try again later.',
    code: 'RATE_LIMITED',
    rateLimitInfo: {
      remaining: result.remaining,
      resetTime: result.resetTime.toISOString(),
      totalAttempts: result.totalAttempts,
      retryAfter: Math.max(retryAfter, 0)
    }
  }
}

export default RateLimiter