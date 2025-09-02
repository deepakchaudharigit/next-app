/**
 * Refactored Registration API Tests
 * Focus: Business logic and user requirements
 * Removed: Framework behavior tests, academic edge cases, duplicate scenarios
 */

import { UserRole } from '@prisma/client'

jest.mock('@lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}))

jest.mock('@lib/auth', () => ({
  hashPassword: jest.fn(),
}))

import { POST } from '@/app/api/auth/register/route'
import { prisma } from '@lib/prisma'
import { hashPassword } from '@lib/auth'
import { createTestUser } from '../../utils/test-utils'
import { NextRequest, NextResponse } from 'next/server'

const createMockRequest = (url: string, options: { method?: string; body?: any; headers?: Record<string, string> } = {}) => {
  const { method = 'GET', body, headers = {} } = options
  return new NextRequest(url, {
    method,
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
}

const expectSuccessResponse = async (response: NextResponse, expectedData?: any) => {
  expect(response.status).toBe(200)
  const data = await response.json()
  expect(data.success).toBe(true)
  if (expectedData) {
    expect(data.data).toEqual(expectedData)
  }
  return data
}

const expectErrorResponse = async (response: NextResponse, expectedStatus: number, expectedMessage?: string) => {
  expect(response.status).toBe(expectedStatus)
  const data = await response.json()
  expect(data.success).toBe(false)
  if (expectedMessage) {
    expect(data.message || data.error).toContain(expectedMessage)
  }
  return data
}

const mockPrismaUserFindUnique = prisma.user.findUnique as jest.MockedFunction<typeof prisma.user.findUnique>
const mockPrismaUserCreate = prisma.user.create as jest.MockedFunction<typeof prisma.user.create>
const mockHashPassword = hashPassword as jest.MockedFunction<typeof hashPassword>

describe('POST /api/auth/register', () => {
  const validUser = {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'Password@123',
    role: 'VIEWER',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockHashPassword.mockResolvedValue('$2a$12$hashedpassword')
    mockPrismaUserFindUnique.mockResolvedValue(null)
  })

  describe('Successful registration', () => {
    it('registers a new user with valid data', async () => {
      const selectedUserData = {
        id: 'new-user-id',
        name: 'John Doe',
        email: 'john@example.com',
        role: UserRole.VIEWER,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
      }
      
      mockPrismaUserCreate.mockResolvedValue(selectedUserData as any)

      const req = createMockRequest('/api/auth/register', {
        method: 'POST',
        body: validUser,
      })

      const res = await POST(req)
      const data = await expectSuccessResponse(res)

      expect(mockHashPassword).toHaveBeenCalledWith(validUser.password)
      expect(mockPrismaUserCreate).toHaveBeenCalledWith({
        data: {
          name: validUser.name,
          email: validUser.email.toLowerCase(),
          password: '$2a$12$hashedpassword',
          role: 'VIEWER',
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      })
      expect(data.message).toBe('User created successfully')
    })

    it('defaults role to VIEWER when not provided', async () => {
      const selectedUserData = {
        id: 'test-user-id',
        name: 'Jane Doe',
        email: 'jane@example.com',
        role: UserRole.VIEWER,
        createdAt: new Date(),
      }
      mockPrismaUserCreate.mockResolvedValue(selectedUserData as any)

      const req = createMockRequest('/api/auth/register', {
        method: 'POST',
        body: {
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'Password@123',
        },
      })

      const res = await POST(req)
      await expectSuccessResponse(res)

      expect(mockPrismaUserCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ role: 'VIEWER' }),
        }),
      )
    })
  })

  describe('Business rule validation', () => {
    it('prevents duplicate email registration', async () => {
      mockPrismaUserFindUnique.mockResolvedValue(createTestUser())

      const req = createMockRequest('/api/auth/register', {
        method: 'POST',
        body: validUser,
      })

      const res = await POST(req)
      await expectErrorResponse(res, 409, 'User with this email already exists')

      expect(mockPrismaUserCreate).not.toHaveBeenCalled()
    })

    it('validates required fields and formats', async () => {
      const invalidCases = [
        { ...validUser, name: '' }, // Missing name
        { ...validUser, email: 'invalid-email' }, // Invalid email
        { ...validUser, password: 'weak' }, // Weak password
        { name: 'John', password: 'Password@123' }, // Missing email
        { email: 'john@example.com', password: 'Password@123' }, // Missing name
        { name: 'John', email: 'john@example.com' }, // Missing password
      ]

      for (const invalidData of invalidCases) {
        const req = createMockRequest('/api/auth/register', {
          method: 'POST',
          body: invalidData,
        })
        const res = await POST(req)
        await expectErrorResponse(res, 400, 'Invalid input data')
      }
    })

    it('enforces password strength requirements', async () => {
      const weakPasswords = [
        'Pass1!', // Too short
        'password123!', // No uppercase
        'PASSWORD123!', // No lowercase
        'Password!', // No numbers
        'Password123', // No special characters
      ]

      for (const password of weakPasswords) {
        const req = createMockRequest('/api/auth/register', {
          method: 'POST',
          body: { ...validUser, password },
        })
        const res = await POST(req)
        await expectErrorResponse(res, 400, 'Invalid input data')
      }
    })

    it('rejects invalid roles', async () => {
      const req = createMockRequest('/api/auth/register', {
        method: 'POST',
        body: {
          ...validUser,
          role: 'INVALID_ROLE',
        },
      })

      const res = await POST(req)
      await expectErrorResponse(res, 400, 'Invalid input data')
    })
  })

  describe('Data processing', () => {
    it('normalizes user input correctly', async () => {
      const userWithMixedCase = {
        name: '  John Doe  ', // Whitespace
        email: 'JOHN@EXAMPLE.COM', // Uppercase
        password: 'Password@123',
        role: 'VIEWER',
      }

      const selectedUserData = {
        id: 'user-1',
        name: 'John Doe',
        email: 'john@example.com',
        role: UserRole.VIEWER,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
      }
      mockPrismaUserCreate.mockResolvedValue(selectedUserData as any)

      const req = createMockRequest('/api/auth/register', {
        method: 'POST',
        body: userWithMixedCase,
      })

      const res = await POST(req)
      await expectSuccessResponse(res)
      
      expect(mockPrismaUserCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'John Doe', // Trimmed
            email: 'john@example.com', // Lowercased
          }),
        })
      )
    })

    it('handles case-insensitive email matching', async () => {
      mockPrismaUserFindUnique.mockResolvedValue(createTestUser({
        email: 'john@example.com',
      }))

      const req = createMockRequest('/api/auth/register', {
        method: 'POST',
        body: {
          ...validUser,
          email: 'JOHN@EXAMPLE.COM',
        },
      })

      const res = await POST(req)
      await expectErrorResponse(res, 409, 'User with this email already exists')
      
      expect(mockPrismaUserFindUnique).toHaveBeenCalledWith({
        where: { email: 'john@example.com' },
        select: { id: true },
      })
    })
  })

  describe('Security and privacy', () => {
    it('does not expose sensitive data in response', async () => {
      const selectedUserData = {
        id: 'user-1',
        name: 'John Doe',
        email: 'john@example.com',
        role: UserRole.VIEWER,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
      }
      
      mockPrismaUserCreate.mockResolvedValue(selectedUserData as any)

      const req = createMockRequest('/api/auth/register', {
        method: 'POST',
        body: validUser,
      })

      const res = await POST(req)
      const data = await expectSuccessResponse(res)

      expect(data.data).not.toHaveProperty('password')
      expect(data.data).not.toHaveProperty('resetToken')
      expect(data.data).not.toHaveProperty('resetTokenExpiry')
    })
  })

  describe('Error handling', () => {
    it('handles server errors gracefully', async () => {
      mockPrismaUserFindUnique.mockRejectedValue(new Error('Database error'))

      const req = createMockRequest('/api/auth/register', {
        method: 'POST',
        body: validUser,
      })

      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(500)
      expect(data.success).toBe(false)
    })
  })
})