/**
 * Rate Limiting Middleware Integration
 * Implements rate limiting across all API routes with different strategies
 */

import { NextRequest, NextResponse } from 'next/server'
import { rateLimiter, authRateLimiter, apiRateLimiter, reportRateLimiter } from '@/lib/scalability/rate-limiter'
import { alertManager } from '@/lib/monitoring/alerts'

interface RateLimitOptions {
  windowMs: number
  maxRequests: number
  message?: string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  keyGenerator?: (req: NextRequest) => string
  onLimitReached?: (identifier: string, req: NextRequest) => void
}

export class RateLimitMiddleware {
  private static instance: RateLimitMiddleware
  private suspiciousIPs = new Set<string>()
  private blockedIPs = new Set<string>()

  static getInstance(): RateLimitMiddleware {
    if (!RateLimitMiddleware.instance) {
      RateLimitMiddleware.instance = new RateLimitMiddleware()
    }
    return RateLimitMiddleware.instance
  }

  // Get client identifier (IP + User ID if available)
  private getClientIdentifier(req: NextRequest): string {
    const ip = this.getClientIP(req)
    const userId = req.headers.get('x-user-id')
    
    // Use user ID if authenticated, otherwise use IP
    return userId ? `user:${userId}` : `ip:${ip}`
  }

  private getClientIP(req: NextRequest): string {
    return (
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      req.headers.get('cf-connecting-ip') ||
      req.ip ||
      'unknown'
    )
  }

  // Check if IP is blocked
  isBlocked(req: NextRequest): boolean {
    const ip = this.getClientIP(req)
    return this.blockedIPs.has(ip)
  }

  // Block IP address
  blockIP(ip: string, reason: string = 'Rate limit exceeded') {
    this.blockedIPs.add(ip)
    console.warn(`🚫 Blocked IP ${ip}: ${reason}`)
    
    // Alert on IP blocking
    alertManager['alerts'].push({
      id: `ip_block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      severity: 'medium',
      title: 'IP Address Blocked',
      message: `IP ${ip} has been blocked: ${reason}`,
      timestamp: new Date(),
      source: 'rate_limiter',
      tags: { ip, reason },
      resolved: false
    })

    // Auto-unblock after 1 hour
    setTimeout(() => {
      this.blockedIPs.delete(ip)
      console.log(`🔓 Unblocked IP ${ip}`)
    }, 60 * 60 * 1000)
  }

  // Mark IP as suspicious
  markSuspicious(ip: string) {
    this.suspiciousIPs.add(ip)
    
    // Remove from suspicious list after 30 minutes
    setTimeout(() => {
      this.suspiciousIPs.delete(ip)
    }, 30 * 60 * 1000)
  }

  // Authentication rate limiting
  async checkAuthRateLimit(req: NextRequest): Promise<NextResponse | null> {
    if (this.isBlocked(req)) {
      return this.createBlockedResponse(req)
    }

    const identifier = this.getClientIdentifier(req)
    const result = await authRateLimiter.check(identifier)

    if (!result.allowed) {
      const ip = this.getClientIP(req)
      this.markSuspicious(ip)
      
      // Block IP after multiple auth failures
      const suspiciousCount = await this.getSuspiciousCount(ip)
      if (suspiciousCount > 3) {
        this.blockIP(ip, 'Multiple authentication failures')
      }

      return this.createRateLimitResponse(result, authRateLimiter.config.message)
    }

    return null
  }

  // API rate limiting
  async checkApiRateLimit(req: NextRequest): Promise<NextResponse | null> {
    if (this.isBlocked(req)) {
      return this.createBlockedResponse(req)
    }

    const identifier = this.getClientIdentifier(req)
    const result = await apiRateLimiter.check(identifier)

    if (!result.allowed) {
      return this.createRateLimitResponse(result, apiRateLimiter.config.message)
    }

    return null
  }

  // Report generation rate limiting
  async checkReportRateLimit(req: NextRequest): Promise<NextResponse | null> {
    if (this.isBlocked(req)) {
      return this.createBlockedResponse(req)
    }

    const identifier = this.getClientIdentifier(req)
    const result = await reportRateLimiter.check(identifier)

    if (!result.allowed) {
      return this.createRateLimitResponse(result, reportRateLimiter.config.message)
    }

    return null
  }

  // Custom rate limiting
  async checkCustomRateLimit(
    req: NextRequest, 
    options: RateLimitOptions
  ): Promise<NextResponse | null> {
    if (this.isBlocked(req)) {
      return this.createBlockedResponse(req)
    }

    const identifier = options.keyGenerator 
      ? options.keyGenerator(req)
      : this.getClientIdentifier(req)

    const result = await rateLimiter.checkWithLists(identifier, {
      windowMs: options.windowMs,
      maxRequests: options.maxRequests,
      message: options.message,
      onLimitReached: (id) => {
        if (options.onLimitReached) {
          options.onLimitReached(id, req)
        }
      }
    })

    if (!result.allowed) {
      return this.createRateLimitResponse(result, options.message || 'Rate limit exceeded')
    }

    return null
  }

  // Adaptive rate limiting based on system load
  async checkAdaptiveRateLimit(
    req: NextRequest,
    baseOptions: RateLimitOptions,
    systemLoad: number = 0.5
  ): Promise<NextResponse | null> {
    // Reduce limits when system is under high load
    const adaptedOptions = {
      ...baseOptions,
      maxRequests: Math.floor(baseOptions.maxRequests * (1 - systemLoad * 0.5))
    }

    return this.checkCustomRateLimit(req, adaptedOptions)
  }

  private async getSuspiciousCount(ip: string): Promise<number> {
    // This would typically be stored in Redis or database
    // For now, return a simple count
    return this.suspiciousIPs.has(ip) ? 1 : 0
  }

  private createRateLimitResponse(result: any, message: string): NextResponse {
    const retryAfter = Math.ceil((result.resetTime.getTime() - Date.now()) / 1000)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message,
          retryAfter
        }
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': result.totalRequests.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.resetTime.toISOString(),
          'Retry-After': retryAfter.toString()
        }
      }
    )
  }

  private createBlockedResponse(req: NextRequest): NextResponse {
    const ip = this.getClientIP(req)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'IP_BLOCKED',
          message: 'Your IP address has been temporarily blocked due to suspicious activity'
        }
      },
      {
        status: 403,
        headers: {
          'X-Blocked-IP': ip
        }
      }
    )
  }

  // Get rate limiting statistics
  getStats() {
    return {
      blockedIPs: Array.from(this.blockedIPs),
      suspiciousIPs: Array.from(this.suspiciousIPs),
      rateLimiterStats: rateLimiter.getStats()
    }
  }

  // Whitelist management
  addToWhitelist(identifier: string) {
    rateLimiter.addToWhitelist(identifier)
    console.log(`✅ Added ${identifier} to whitelist`)
  }

  removeFromWhitelist(identifier: string) {
    rateLimiter.removeFromWhitelist(identifier)
    console.log(`❌ Removed ${identifier} from whitelist`)
  }

  // Emergency rate limiting (during attacks)
  enableEmergencyMode() {
    console.warn('🚨 Emergency rate limiting enabled')
    
    // Drastically reduce rate limits
    authRateLimiter.config.maxRequests = 2
    authRateLimiter.config.windowMs = 5 * 60 * 1000 // 5 minutes
    
    apiRateLimiter.config.maxRequests = 20
    apiRateLimiter.config.windowMs = 60 * 1000 // 1 minute
  }

  disableEmergencyMode() {
    console.log('✅ Emergency rate limiting disabled')
    
    // Restore normal rate limits
    authRateLimiter.config.maxRequests = 5
    authRateLimiter.config.windowMs = 15 * 60 * 1000 // 15 minutes
    
    apiRateLimiter.config.maxRequests = 100
    apiRateLimiter.config.windowMs = 60 * 1000 // 1 minute
  }
}

// Global rate limit middleware instance
export const rateLimitMiddleware = RateLimitMiddleware.getInstance()

// Utility functions for different rate limiting scenarios
export async function withAuthRateLimit(req: NextRequest): Promise<NextResponse | null> {
  return rateLimitMiddleware.checkAuthRateLimit(req)
}

export async function withApiRateLimit(req: NextRequest): Promise<NextResponse | null> {
  return rateLimitMiddleware.checkApiRateLimit(req)
}

export async function withReportRateLimit(req: NextRequest): Promise<NextResponse | null> {
  return rateLimitMiddleware.checkReportRateLimit(req)
}

export async function withCustomRateLimit(
  req: NextRequest,
  options: RateLimitOptions
): Promise<NextResponse | null> {
  return rateLimitMiddleware.checkCustomRateLimit(req, options)
}