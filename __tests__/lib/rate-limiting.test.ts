/**
 * Rate Limiting Unit Tests
 * 
 * Tests the core rate limiting functionality including:
 * - Basic rate limiting logic
 * - Window expiration
 * - Attempt counting
 * - Reset functionality
 * - Statistics tracking
 */

// Unmock the rate limiting module for this test
jest.unmock('@/lib/rate-limiting')
jest.unmock('../../lib/rate-limiting')

import RateLimiter, { 
  authRateLimiter, 
  checkAuthRateLimit, 
  recordFailedAuth, 
  recordSuccessfulAuth,
  isAuthBlocked,
  createRateLimitError
} from '../../lib/rate-limiting'

// Mock the auth config
jest.mock('@config/auth', () => ({
  authConfig: {
    rateLimit: {
      windowMs: 60000, // 1 minute for testing
      maxAttempts: 3   // 3 attempts for testing
    }
  }
}))

// Mock the env config
jest.mock('@config/env.server', () => ({
  serverEnv: {
    RATE_LIMIT_WINDOW_MS: 60000,
    RATE_LIMIT_MAX_ATTEMPTS: 3
  },
  isDevelopment: true,
  isProduction: false
}))

// Mock auth-utils
jest.mock('@lib/auth-utils', () => ({
  getClientIP: jest.fn(() => '127.0.0.1')
}))

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter
  
  beforeEach(() => {
    // Create a new rate limiter for each test with test config
    rateLimiter = new RateLimiter({
      windowMs: 60000, // 1 minute
      maxAttempts: 3   // 3 attempts
    })
  })
  
  afterEach(() => {
    // Clean up
    rateLimiter.stopCleanup()
    rateLimiter.resetAll()
  })
  
  afterAll(() => {
    // Ensure all rate limiters are cleaned up
    authRateLimiter.stopCleanup()
    authRateLimiter.resetAll()
  })

  describe('Basic Rate Limiting', () => {
    test('should allow requests within limit', () => {
      const result1 = rateLimiter.checkLimit('test@example.com', '127.0.0.1')
      expect(result1.allowed).toBe(true)
      expect(result1.remaining).toBe(2)
      expect(result1.totalAttempts).toBe(1)
      
      const result2 = rateLimiter.checkLimit('test@example.com', '127.0.0.1')
      expect(result2.allowed).toBe(true)
      expect(result2.remaining).toBe(1)
      expect(result2.totalAttempts).toBe(2)
      
      const result3 = rateLimiter.checkLimit('test@example.com', '127.0.0.1')
      expect(result3.allowed).toBe(true)
      expect(result3.remaining).toBe(0)
      expect(result3.totalAttempts).toBe(3)
    })
    
    test('should block requests after limit exceeded', () => {
      // Make 3 allowed attempts
      rateLimiter.checkLimit('test@example.com', '127.0.0.1')
      rateLimiter.checkLimit('test@example.com', '127.0.0.1')
      rateLimiter.checkLimit('test@example.com', '127.0.0.1')
      
      // 4th attempt should be blocked
      const result = rateLimiter.checkLimit('test@example.com', '127.0.0.1')
      expect(result.allowed).toBe(false)
      expect(result.blocked).toBe(true)
      expect(result.remaining).toBe(0)
      expect(result.totalAttempts).toBe(4)
    })
    
    test('should track different identifiers separately', () => {
      // Make attempts for first email
      rateLimiter.checkLimit('test1@example.com', '127.0.0.1')
      rateLimiter.checkLimit('test1@example.com', '127.0.0.1')
      rateLimiter.checkLimit('test1@example.com', '127.0.0.1')
      
      // First email should be at limit
      const result1 = rateLimiter.checkLimit('test1@example.com', '127.0.0.1')
      expect(result1.allowed).toBe(false)
      
      // Second email should still be allowed
      const result2 = rateLimiter.checkLimit('test2@example.com', '127.0.0.1')
      expect(result2.allowed).toBe(true)
      expect(result2.totalAttempts).toBe(1)
    })
    
    test('should track different IPs separately', () => {
      const email = 'test@example.com'
      
      // Make attempts from first IP
      rateLimiter.checkLimit(email, '127.0.0.1')
      rateLimiter.checkLimit(email, '127.0.0.1')
      rateLimiter.checkLimit(email, '127.0.0.1')
      
      // First IP should be at limit
      const result1 = rateLimiter.checkLimit(email, '127.0.0.1')
      expect(result1.allowed).toBe(false)
      
      // Second IP should still be allowed
      const result2 = rateLimiter.checkLimit(email, '192.168.1.1')
      expect(result2.allowed).toBe(true)
      expect(result2.totalAttempts).toBe(1)
    })
  })

  describe('checkStatus Method', () => {
    test('should check status without incrementing', () => {
      // Make some attempts first
      rateLimiter.checkLimit('test@example.com', '127.0.0.1')
      rateLimiter.checkLimit('test@example.com', '127.0.0.1')
      
      // Check status should not increment
      const status1 = rateLimiter.checkStatus('test@example.com', '127.0.0.1')
      expect(status1.totalAttempts).toBe(2)
      expect(status1.allowed).toBe(true)
      
      // Check status again should still be 2
      const status2 = rateLimiter.checkStatus('test@example.com', '127.0.0.1')
      expect(status2.totalAttempts).toBe(2)
      expect(status2.allowed).toBe(true)
    })
    
    test('should return correct status for blocked identifier', () => {
      // Make attempts to reach limit
      rateLimiter.checkLimit('test@example.com', '127.0.0.1')
      rateLimiter.checkLimit('test@example.com', '127.0.0.1')
      rateLimiter.checkLimit('test@example.com', '127.0.0.1')
      rateLimiter.checkLimit('test@example.com', '127.0.0.1') // This should block
      
      // Check status should show blocked
      const status = rateLimiter.checkStatus('test@example.com', '127.0.0.1')
      expect(status.totalAttempts).toBe(4)
      expect(status.allowed).toBe(false)
      expect(status.blocked).toBe(true)
    })
  })

  describe('Window Expiration', () => {
    test('should reset after window expires', async () => {
      // Create rate limiter with very short window for testing
      const shortWindowLimiter = new RateLimiter({
        windowMs: 100, // 100ms
        maxAttempts: 2
      })
      
      try {
        // Make attempts to reach limit
        shortWindowLimiter.checkLimit('test@example.com', '127.0.0.1')
        shortWindowLimiter.checkLimit('test@example.com', '127.0.0.1')
        
        // Should be at limit
        const blockedResult = shortWindowLimiter.checkLimit('test@example.com', '127.0.0.1')
        expect(blockedResult.allowed).toBe(false)
        
        // Wait for window to expire
        await new Promise(resolve => setTimeout(resolve, 150))
        
        // Should be allowed again
        const allowedResult = shortWindowLimiter.checkLimit('test@example.com', '127.0.0.1')
        expect(allowedResult.allowed).toBe(true)
        expect(allowedResult.totalAttempts).toBe(1)
      } finally {
        shortWindowLimiter.stopCleanup()
      }
    })
  })

  describe('Reset Functionality', () => {
    test('should reset specific identifier', () => {
      // Make attempts to reach limit
      rateLimiter.checkLimit('test@example.com', '127.0.0.1')
      rateLimiter.checkLimit('test@example.com', '127.0.0.1')
      rateLimiter.checkLimit('test@example.com', '127.0.0.1')
      
      // Should be at limit
      const blockedResult = rateLimiter.checkLimit('test@example.com', '127.0.0.1')
      expect(blockedResult.allowed).toBe(false)
      
      // Reset the identifier
      rateLimiter.reset('test@example.com', '127.0.0.1')
      
      // Should be allowed again
      const allowedResult = rateLimiter.checkLimit('test@example.com', '127.0.0.1')
      expect(allowedResult.allowed).toBe(true)
      expect(allowedResult.totalAttempts).toBe(1)
    })
    
    test('should reset all identifiers', () => {
      // Make attempts for multiple identifiers
      rateLimiter.checkLimit('test1@example.com', '127.0.0.1')
      rateLimiter.checkLimit('test2@example.com', '127.0.0.1')
      
      // Reset all
      rateLimiter.resetAll()
      
      // Both should start fresh
      const result1 = rateLimiter.checkLimit('test1@example.com', '127.0.0.1')
      const result2 = rateLimiter.checkLimit('test2@example.com', '127.0.0.1')
      
      expect(result1.totalAttempts).toBe(1)
      expect(result2.totalAttempts).toBe(1)
    })
  })

  describe('Successful Attempt Handling', () => {
    test('should reset counter on successful attempt', () => {
      // Make failed attempts
      rateLimiter.recordFailedAttempt('test@example.com', '127.0.0.1')
      rateLimiter.recordFailedAttempt('test@example.com', '127.0.0.1')
      
      // Record successful attempt
      rateLimiter.recordSuccessfulAttempt('test@example.com', '127.0.0.1')
      
      // Should start fresh
      const result = rateLimiter.checkLimit('test@example.com', '127.0.0.1')
      expect(result.totalAttempts).toBe(1)
      expect(result.allowed).toBe(true)
    })
  })

  describe('Statistics', () => {
    test('should provide accurate statistics', () => {
      // Make attempts for multiple identifiers
      rateLimiter.checkLimit('test1@example.com', '127.0.0.1')
      rateLimiter.checkLimit('test1@example.com', '127.0.0.1')
      rateLimiter.checkLimit('test1@example.com', '127.0.0.1')
      rateLimiter.checkLimit('test1@example.com', '127.0.0.1') // This should block
      
      rateLimiter.checkLimit('test2@example.com', '192.168.1.1')
      
      const stats = rateLimiter.getStats()
      
      expect(stats.totalTrackedIdentifiers).toBe(2)
      expect(stats.blockedIdentifiers).toBe(1)
      expect(stats.totalAttempts).toBe(5)
      expect(stats.oldestAttempt).toBeInstanceOf(Date)
    })
  })

  describe('isBlocked Method', () => {
    test('should correctly identify blocked identifiers', () => {
      // Make attempts to reach limit
      rateLimiter.checkLimit('test@example.com', '127.0.0.1')
      rateLimiter.checkLimit('test@example.com', '127.0.0.1')
      rateLimiter.checkLimit('test@example.com', '127.0.0.1')
      rateLimiter.checkLimit('test@example.com', '127.0.0.1') // This should block
      
      expect(rateLimiter.isBlocked('test@example.com', '127.0.0.1')).toBe(true)
      expect(rateLimiter.isBlocked('other@example.com', '127.0.0.1')).toBe(false)
    })
  })
})

describe('Auth Rate Limiting Functions', () => {
  beforeEach(() => {
    authRateLimiter.resetAll()
  })

  test('checkAuthRateLimit should work correctly', async () => {
    const result = await checkAuthRateLimit('test@example.com')
    expect(result.allowed).toBe(true)
    expect(result.totalAttempts).toBe(0) // checkAuthRateLimit uses checkStatus, doesn't increment
  })

  test('recordFailedAuth should increment attempts', async () => {
    await recordFailedAuth('test@example.com')
    await recordFailedAuth('test@example.com')
    
    const result = await checkAuthRateLimit('test@example.com')
    expect(result.totalAttempts).toBe(2) // 2 failed, checkAuthRateLimit doesn't increment
  })

  test('recordSuccessfulAuth should reset attempts', async () => {
    await recordFailedAuth('test@example.com')
    await recordFailedAuth('test@example.com')
    await recordSuccessfulAuth('test@example.com')
    
    const result = await checkAuthRateLimit('test@example.com')
    expect(result.totalAttempts).toBe(0) // Fresh start, checkAuthRateLimit doesn't increment
  })

  test('isAuthBlocked should work correctly', async () => {
    // Make enough failed attempts to get blocked
    for (let i = 0; i < 6; i++) {
      await recordFailedAuth('test@example.com')
    }
    
    const isBlocked = await isAuthBlocked('test@example.com')
    expect(isBlocked).toBe(true)
  })
})

describe('createRateLimitError', () => {
  test('should create proper error response', () => {
    const rateLimitResult = {
      allowed: false,
      remaining: 0,
      resetTime: new Date('2024-01-01T12:00:00Z'),
      totalAttempts: 5,
      blocked: true
    }
    
    const error = createRateLimitError(rateLimitResult)
    
    expect(error.success).toBe(false)
    expect(error.error).toBe('Too many authentication attempts. Please try again later.')
    expect(error.code).toBe('RATE_LIMITED')
    expect(error.rateLimitInfo.remaining).toBe(0)
    expect(error.rateLimitInfo.totalAttempts).toBe(5)
    expect(error.rateLimitInfo.resetTime).toBe('2024-01-01T12:00:00.000Z')
    expect(typeof error.rateLimitInfo.retryAfter).toBe('number')
  })
})