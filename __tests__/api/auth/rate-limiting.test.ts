/**
 * Rate Limiting Integration Tests
 * 
 * Tests rate limiting integration with API endpoints including:
 * - Test login endpoint rate limiting
 * - Rate limit statistics endpoint
 * - Rate limit reset functionality
 */

// Unmock rate limiting for this test
jest.unmock('@/lib/rate-limiting')
jest.unmock('../../../lib/rate-limiting')

import { NextRequest } from 'next/server'
import { POST as testLoginPost } from '../../../app/api/auth/test-login/route'
import { GET as rateLimitGet, DELETE as rateLimitDelete, POST as rateLimitReset } from '../../../app/api/auth/rate-limit/route'
import { authRateLimiter } from '../../../lib/rate-limiting'

// Mock dependencies
jest.mock('@lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn()
    },
    auditLog: {
      create: jest.fn()
    }
  }
}))

jest.mock('@lib/auth', () => ({
  verifyPassword: jest.fn()
}))

jest.mock('@middleware/authMiddleware', () => ({
  requireAdmin: jest.fn()
}))

jest.mock('@lib/auth-utils', () => ({
  getClientIP: jest.fn(() => '127.0.0.1'),
  logAuditEvent: jest.fn()
}))

// Mock config
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
    RATE_LIMIT_MAX_ATTEMPTS: 3,
    NEXTAUTH_SECRET: 'test-secret'
  },
  isDevelopment: true,
  isProduction: false
}))

describe('Rate Limiting Integration Tests', () => {
  beforeEach(() => {
    // Reset rate limiter before each test
    authRateLimiter.resetAll()
    
    // Reset all mocks
    jest.clearAllMocks()
  })
  
  afterEach(() => {
    // Clean up rate limiter after each test to prevent hanging
    authRateLimiter.stopCleanup()
    authRateLimiter.resetAll()
  })
  
  afterAll(() => {
    // Final cleanup to prevent hanging
    authRateLimiter.stopCleanup()
    authRateLimiter.resetAll()
  })

  describe('Test Login Endpoint Rate Limiting', () => {
    const { prisma } = require('@lib/prisma')
    const { verifyPassword } = require('@lib/auth')

    test('should allow requests within rate limit', async () => {
      // Mock user not found to trigger failed auth
      prisma.user.findUnique.mockResolvedValue(null)
      
      const request = new NextRequest('http://localhost:3000/api/auth/test-login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrongpassword'
        }),
        headers: {
          'content-type': 'application/json'
        }
      })

      // First attempt should be allowed
      const response1 = await testLoginPost(request)
      expect(response1.status).toBe(404) // User not found, but not rate limited
      
      const body1 = await response1.json()
      expect(body1.success).toBe(false)
      expect(body1.message).toBe('User not found')
    })

    test('should block requests after rate limit exceeded', async () => {
      // Mock user not found to trigger failed auth
      prisma.user.findUnique.mockResolvedValue(null)
      
      const createRequest = () => new NextRequest('http://localhost:3000/api/auth/test-login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrongpassword'
        }),
        headers: {
          'content-type': 'application/json'
        }
      })

      // Make 3 failed attempts (should be allowed)
      await testLoginPost(createRequest())
      await testLoginPost(createRequest())
      await testLoginPost(createRequest())
      
      // 4th attempt should be rate limited
      const response4 = await testLoginPost(createRequest())
      expect(response4.status).toBe(429)
      
      const body4 = await response4.json()
      expect(body4.success).toBe(false)
      expect(body4.code).toBe('RATE_LIMITED')
      expect(body4.rateLimitInfo).toBeDefined()
      expect(body4.rateLimitInfo.totalAttempts).toBe(3) // Should be exactly 3 failed attempts
    })

    test('should reset rate limit on successful authentication', async () => {
      // Reset rate limiter to start fresh
      authRateLimiter.resetAll()
      
      // Mock user found and valid password for successful attempt
      const mockUser = {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedpassword',
        role: 'VIEWER',
        isDeleted: false
      }
      
      // Make 2 failed attempts first with user not found
      prisma.user.findUnique.mockResolvedValueOnce(null)
      await testLoginPost(new NextRequest('http://localhost:3000/api/auth/test-login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrongpassword'
        }),
        headers: { 'content-type': 'application/json' }
      }))
      
      prisma.user.findUnique.mockResolvedValueOnce(null)
      await testLoginPost(new NextRequest('http://localhost:3000/api/auth/test-login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrongpassword'
        }),
        headers: { 'content-type': 'application/json' }
      }))
      
      // Now make successful attempt - mock user found and valid password
      prisma.user.findUnique.mockResolvedValueOnce(mockUser)
      verifyPassword.mockResolvedValueOnce(true)
      
      const successRequest = new NextRequest('http://localhost:3000/api/auth/test-login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'correctpassword'
        }),
        headers: { 'content-type': 'application/json' }
      })
      
      const successResponse = await testLoginPost(successRequest)
      expect(successResponse.status).toBe(200)
      
      const successBody = await successResponse.json()
      expect(successBody.success).toBe(true)
      
      // Rate limit should be reset - next failed attempt should start fresh
      prisma.user.findUnique.mockResolvedValueOnce(null)
      const nextRequest = new NextRequest('http://localhost:3000/api/auth/test-login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrongpassword'
        }),
        headers: { 'content-type': 'application/json' }
      })
      
      const nextResponse = await testLoginPost(nextRequest)
      expect(nextResponse.status).toBe(404) // Should be allowed, not rate limited
    })
  })

  describe('Rate Limit Statistics Endpoint', () => {
    const { requireAdmin } = require('@middleware/authMiddleware')

    beforeEach(() => {
      // Mock admin authentication
      requireAdmin.mockResolvedValue({
        user: { id: 'admin-1', email: 'admin@npcl.com', role: 'ADMIN' },
        response: null
      })
    })

    test('should return rate limiting statistics', async () => {
      // Make some attempts to generate statistics
      authRateLimiter.checkLimit('test1@example.com', '127.0.0.1')
      authRateLimiter.checkLimit('test2@example.com', '192.168.1.1')
      
      const request = new NextRequest('http://localhost:3000/api/auth/rate-limit', {
        method: 'GET'
      })

      const response = await rateLimitGet(request)
      expect(response.status).toBe(200)
      
      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.data.statistics).toBeDefined()
      expect(body.data.configuration).toBeDefined()
      expect(body.data.statistics.totalTrackedIdentifiers).toBe(2)
    })

    test('should require admin authentication', async () => {
      // Mock authentication failure
      requireAdmin.mockResolvedValueOnce({
        user: null,
        response: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
      })

      const request = new NextRequest('http://localhost:3000/api/auth/rate-limit', {
        method: 'GET'
      })

      const response = await rateLimitGet(request)
      expect(response.status).toBe(401)
    })
  })

  describe('Rate Limit Reset Functionality', () => {
    const { requireAdmin } = require('@middleware/authMiddleware')

    beforeEach(() => {
      // Mock admin authentication
      requireAdmin.mockResolvedValue({
        user: { id: 'admin-1', email: 'admin@npcl.com', role: 'ADMIN' },
        response: null
      })
    })

    test('should reset all rate limits', async () => {
      // Make some attempts
      authRateLimiter.checkLimit('test1@example.com', '127.0.0.1')
      authRateLimiter.checkLimit('test2@example.com', '192.168.1.1')
      
      expect(authRateLimiter.getStats().totalTrackedIdentifiers).toBe(2)
      
      const request = new NextRequest('http://localhost:3000/api/auth/rate-limit', {
        method: 'DELETE'
      })

      const response = await rateLimitDelete(request)
      expect(response.status).toBe(200)
      
      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.message).toBe('All rate limits have been reset')
      
      // Verify reset
      expect(authRateLimiter.getStats().totalTrackedIdentifiers).toBe(0)
    })

    test('should reset specific rate limit', async () => {
      // Make attempts for multiple identifiers
      authRateLimiter.checkLimit('test1@example.com', '127.0.0.1')
      authRateLimiter.checkLimit('test2@example.com', '192.168.1.1')
      
      const request = new NextRequest('http://localhost:3000/api/auth/rate-limit', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test1@example.com',
          ip: '127.0.0.1'
        }),
        headers: {
          'content-type': 'application/json'
        }
      })

      const response = await rateLimitReset(request)
      expect(response.status).toBe(200)
      
      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.message).toBe('Rate limit reset for test1@example.com')
      
      // Verify specific reset
      expect(authRateLimiter.getStats().totalTrackedIdentifiers).toBe(1)
    })

    test('should validate email parameter for specific reset', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/rate-limit', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'content-type': 'application/json'
        }
      })

      const response = await rateLimitReset(request)
      expect(response.status).toBe(400)
      
      const body = await response.json()
      expect(body.success).toBe(false)
      expect(body.error).toBe('Email is required')
    })
  })
})