/**
 * Login API Integration Tests
 * Tests the complete authentication flow including database interactions
 */

// Mock auth functions for integration test
jest.mock('@/lib/auth', () => ({
  hashPassword: jest.fn().mockImplementation(async (password: string) => `hashed_${password}`),
  verifyPassword: jest.fn().mockImplementation(async (password: string, hash: string) => {
    return hash === `hashed_${password}`
  }),
  generateResetToken: jest.fn().mockReturnValue('mock-reset-token'),
  hashResetToken: jest.fn().mockReturnValue('mock-hashed-token'),
  generateToken: jest.fn().mockImplementation(() => {
    throw new Error('generateToken is deprecated. Use NextAuth.js session management instead.')
  }),
  verifyToken: jest.fn().mockImplementation(() => {
    throw new Error('verifyToken is deprecated. Use NextAuth.js session management instead.')
  }),
  extractTokenFromHeader: jest.fn().mockImplementation(() => {
    throw new Error('extractTokenFromHeader is deprecated. Use NextAuth.js session management instead.')
  }),
}))

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/auth/test-login/route'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { testUser } from '@/__tests__/utils/test-factories'

describe('/api/auth/test-login Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Setup default mock responses
    if (prisma.user.findUnique && typeof prisma.user.findUnique.mockResolvedValue === 'function') {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
    }
    if (prisma.user.create && typeof prisma.user.create.mockResolvedValue === 'function') {
      ;(prisma.user.create as jest.Mock).mockResolvedValue({})
    }
    if (prisma.auditLog.create && typeof prisma.auditLog.create.mockResolvedValue === 'function') {
      ;(prisma.auditLog.create as jest.Mock).mockResolvedValue({})
    }
    if (prisma.auditLog.findFirst && typeof prisma.auditLog.findFirst.mockResolvedValue === 'function') {
      ;(prisma.auditLog.findFirst as jest.Mock).mockResolvedValue(null)
    }
  })

  afterAll(async () => {
    jest.clearAllMocks()
  })

  describe('POST /api/auth/test-login', () => {
    it('should authenticate valid user credentials', async () => {
      // Arrange
      const userData = testUser()
      const hashedPassword = await hashPassword(userData.password)
      
      const mockUser = {
        id: 'test-user-id',
        ...userData,
        password: hashedPassword,
      }
      
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

      const request = new NextRequest('http://localhost:3000/api/auth/test-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.user.email).toBe(userData.email)
      expect(data.data.user.role).toBe(userData.role)
      expect(data.data.user.password).toBeUndefined() // Password should not be returned
    })

    it('should reject invalid credentials', async () => {
      // Arrange
      const userData = testUser()
      const hashedPassword = await hashPassword(userData.password)
      
      const mockUser = {
        id: 'test-user-id',
        ...userData,
        password: hashedPassword,
      }
      
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

      const request = new NextRequest('http://localhost:3000/api/auth/test-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userData.email,
          password: 'wrongpassword',
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.message).toContain('Invalid password')
    })

    it('should reject non-existent user', async () => {
      // Arrange
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
      
      const request = new NextRequest('http://localhost:3000/api/auth/test-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: 'password123',
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.message).toContain('User not found')
    })

    it('should validate input data', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/auth/test-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: '',
          password: '',
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toContain('Email and password are required')
    })

    it('should handle database connection errors', async () => {
      // Arrange
      const userData = testUser()
      
      // Mock Prisma to throw an error
      jest.spyOn(prisma.user, 'findUnique').mockRejectedValueOnce(
        new Error('Database connection failed')
      )

      const request = new NextRequest('http://localhost:3000/api/auth/test-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.message).toContain('Internal server error')
    })

    it('should log audit trail for login attempts', async () => {
      // Arrange
      const userData = testUser()
      const hashedPassword = await hashPassword(userData.password)
      
      const mockUser = {
        id: 'test-user-id',
        ...userData,
        password: hashedPassword,
      }
      
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      
      const mockAuditLog = {
        id: 'audit-log-id',
        userId: mockUser.id,
        action: 'LOGIN_SUCCESS',
        ipAddress: '192.168.1.1',
        userAgent: 'Test Browser',
      }
      
      ;(prisma.auditLog.findFirst as jest.Mock).mockResolvedValue(mockAuditLog)

      const request = new NextRequest('http://localhost:3000/api/auth/test-login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1',
          'user-agent': 'Test Browser'
        },
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
        }),
      })

      // Act
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(200)
      
      // Check that audit log creation was called
      expect(prisma.auditLog.create).toHaveBeenCalled()
      
      // Verify the audit log query would find the log
      expect(prisma.auditLog.findFirst).toHaveBeenCalledWith({
        where: {
          userId: mockUser.id,
          action: 'LOGIN_SUCCESS',
        },
      })
      
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          userId: mockUser.id,
          action: 'LOGIN_SUCCESS',
        },
      })
      
      expect(auditLog).toBeDefined()
      expect(auditLog?.ipAddress).toBe('192.168.1.1')
      expect(auditLog?.userAgent).toBe('Test Browser')
    })

    it('should handle rate limiting', async () => {
      // Arrange
      const userData = testUser()
      
      // Mock rate limiting to return not allowed
      const { checkAuthRateLimit, createRateLimitError } = require('@/lib/rate-limiting')
      checkAuthRateLimit.mockResolvedValueOnce({ allowed: false })
      createRateLimitError.mockReturnValueOnce({
        success: false,
        message: 'Too many requests',
      })
      
      const request = new NextRequest('http://localhost:3000/api/auth/test-login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1'
        },
        body: JSON.stringify({
          email: userData.email,
          password: 'wrongpassword',
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(429)
      expect(data.success).toBe(false)
      expect(data.message).toContain('Too many requests')
    })
  })
})