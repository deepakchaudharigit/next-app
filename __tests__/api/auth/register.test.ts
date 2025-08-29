/**
 * Tests for /api/auth/register endpoint
 * Fixed: Mock initialization order and TypeScript types
 */

import { UserRole } from '@prisma/client'

// ----------------------------
// Mock Modules with Factory Functions
// ----------------------------

// Mock Prisma with factory functions to avoid hoisting issues
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

// ----------------------------
// Imports (after mocks)
// ----------------------------
import { POST } from '@/app/api/auth/register/route'
import { prisma } from '@lib/prisma'
import { hashPassword } from '@lib/auth'
import { createTestUser } from '../../utils/test-utils'
import { NextRequest, NextResponse } from 'next/server'

// Create mock request function
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

// Response assertion helpers for NextResponse
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

// ----------------------------
// Type-safe mock references
// ----------------------------
const mockPrismaUserFindUnique = prisma.user.findUnique as jest.MockedFunction<typeof prisma.user.findUnique>
const mockPrismaUserCreate = prisma.user.create as jest.MockedFunction<typeof prisma.user.create>
const mockHashPassword = hashPassword as jest.MockedFunction<typeof hashPassword>

// ----------------------------
// Test Suite
// ----------------------------
describe('POST /api/auth/register', () => {
  const baseValidUser = {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'Password@123', // Updated to meet new requirements
    role: 'VIEWER',
  }

  // Suppress console errors for intentional error tests
  const originalConsoleError = console.error

  beforeEach(() => {
    jest.clearAllMocks()
    // Suppress console errors for cleaner test output
    console.error = jest.fn()
    
    mockHashPassword.mockResolvedValue('$2a$12$hashedpassword')
    mockPrismaUserFindUnique.mockResolvedValue(null)
  })

  afterEach(() => {
    // Restore console.error
    console.error = originalConsoleError
  })

  it('registers a new user successfully', async () => {
    // Mock Prisma to return only the selected fields (matching the API route's select clause)
    const selectedUserData = {
      id: 'new-user-id',
      name: 'John Doe',
      email: 'john@example.com',
      role: UserRole.VIEWER,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
    }
    
    const expectedUserResponse = {
      id: 'new-user-id',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'VIEWER',
      createdAt: '2024-01-01T00:00:00.000Z'
    }
    
    mockPrismaUserCreate.mockResolvedValue(selectedUserData as any)

    const req = createMockRequest('/api/auth/register', {
      method: 'POST',
      body: baseValidUser,
    })

    const res = await POST(req)
    const data = await expectSuccessResponse(res)

    expect(mockHashPassword).toHaveBeenCalledWith(baseValidUser.password)
    expect(mockPrismaUserCreate).toHaveBeenCalledWith({
      data: {
        name: baseValidUser.name,
        email: baseValidUser.email.toLowerCase(), // Schema transforms email to lowercase
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
    expect(data.data).toEqual(expectedUserResponse)
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
        password: 'Password@123', // Updated to meet new requirements
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

  it('returns 409 if user already exists', async () => {
    mockPrismaUserFindUnique.mockResolvedValue(createTestUser())

    const req = createMockRequest('/api/auth/register', {
      method: 'POST',
      body: baseValidUser,
    })

    const res = await POST(req)
    await expectErrorResponse(res, 409, 'User with this email already exists')

    expect(mockPrismaUserCreate).not.toHaveBeenCalled()
  })

  it('validates full invalid payload', async () => {
    const req = createMockRequest('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'J',
        email: 'invalid-email',
        password: '123',
      },
    })

    const res = await POST(req)
    const data = await expectErrorResponse(res, 400, 'Invalid input data')

    expect(Array.isArray(data.errors)).toBe(true)
    expect(mockPrismaUserFindUnique).not.toHaveBeenCalled()
    expect(mockPrismaUserCreate).not.toHaveBeenCalled()
  })

  it('validates individual field errors', async () => {
    const base = { ...baseValidUser }

    await expectErrorResponse(
      await POST(createMockRequest('/api/auth/register', {
        method: 'POST',
        body: { ...base, name: 'J' },
      })),
      400,
      'Invalid input data',
    )

    await expectErrorResponse(
      await POST(createMockRequest('/api/auth/register', {
        method: 'POST',
        body: { ...base, email: 'bad' },
      })),
      400,
      'Invalid input data',
    )

    await expectErrorResponse(
      await POST(createMockRequest('/api/auth/register', {
        method: 'POST',
        body: { ...base, password: 'weak' }, // Updated to test new validation
      })),
      400,
      'Invalid input data',
    )
  })

  it('handles missing required fields', async () => {
    const cases = [
      { name: 'John', password: 'Password@123' }, // Updated password
      { email: 'john@example.com', name: 'John' },
      { email: 'john@example.com', password: 'Password@123' }, // Updated password
    ]

    for (const body of cases) {
      const req = createMockRequest('/api/auth/register', {
        method: 'POST',
        body,
      })
      const res = await POST(req)
      await expectErrorResponse(res, 400, 'Invalid input data')
    }
  })

  it('rejects invalid role', async () => {
    const req = createMockRequest('/api/auth/register', {
      method: 'POST',
      body: {
        ...baseValidUser,
        role: 'INVALID_ROLE',
      },
    })

    const res = await POST(req)
    await expectErrorResponse(res, 400, 'Invalid input data')
  })

  it('handles database lookup failure', async () => {
    mockPrismaUserFindUnique.mockRejectedValue(new Error('DB lookup failed'))

    const req = createMockRequest('/api/auth/register', {
      method: 'POST',
      body: baseValidUser,
    })

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(500)
    expect(data.success).toBe(false)
  })

  it('handles password hashing errors', async () => {
    mockHashPassword.mockRejectedValue(new Error('Hashing error'))

    const req = createMockRequest('/api/auth/register', {
      method: 'POST',
      body: baseValidUser,
    })

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(500)
    expect(data.success).toBe(false)
  })

  it('handles Prisma user creation errors', async () => {
    mockPrismaUserCreate.mockRejectedValue(new Error('User creation error'))

    const req = createMockRequest('/api/auth/register', {
      method: 'POST',
      body: baseValidUser,
    })

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(500)
    expect(data.success).toBe(false)
  })

  it('handles malformed JSON input', async () => {
    const req = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: 'invalid-json',
    }) as NextRequest

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(500)
    expect(data.success).toBe(false)
  })

  it('should trim whitespace from inputs', async () => {
    // Test name trimming with a valid email (email validation happens before transform)
    const userWithWhitespace = {
      name: '  John Doe  ',
      email: 'john@example.com', // Use valid email without spaces
      password: 'Password@123', // Updated to meet new requirements
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
      body: userWithWhitespace,
    })

    const res = await POST(req)
    await expectSuccessResponse(res)
    
    // Verify that trimmed name was used (name trimming works, email doesn't have spaces)
    expect(mockPrismaUserCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'John Doe', // Should be trimmed
          email: 'john@example.com', // Should be lowercased
        }),
      })
    )
  })

  it('should handle email case transformation', async () => {
    // Test email case transformation separately
    const userWithUppercaseEmail = {
      name: 'John Doe',
      email: 'JOHN@EXAMPLE.COM',
      password: 'Password@123', // Updated to meet new requirements
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
      body: userWithUppercaseEmail,
    })

    const res = await POST(req)
    await expectSuccessResponse(res)
    
    // Verify that email was transformed to lowercase
    expect(mockPrismaUserCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'john@example.com', // Should be lowercased
        }),
      })
    )
  })

  it('should handle case-insensitive email match', async () => {
    mockPrismaUserFindUnique.mockResolvedValue(createTestUser({
      email: 'john@example.com', // Database stores lowercase
    }))

    const req = createMockRequest('/api/auth/register', {
      method: 'POST',
      body: {
        ...baseValidUser,
        email: 'JOHN@EXAMPLE.COM', // User inputs uppercase
      },
    })

    const res = await POST(req)
    await expectErrorResponse(res, 409, 'User with this email already exists')
    
    // Verify the lookup was done with lowercase email (includes select clause)
    expect(mockPrismaUserFindUnique).toHaveBeenCalledWith({
      where: { email: 'john@example.com' },
      select: { id: true },
    })
  })

  it('should not expose sensitive data in response', async () => {
    // Create a full user for Prisma mock
    const mockUserForPrisma = createTestUser({
      id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com',
      role: UserRole.VIEWER,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
    })
    
    // Mock Prisma to return only selected fields (as per the API route)
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
      body: baseValidUser,
    })

    const res = await POST(req)
    const data = await expectSuccessResponse(res)

    expect(data.data).not.toHaveProperty('password')
    expect(data.data).not.toHaveProperty('resetToken')
    expect(data.data).not.toHaveProperty('resetTokenExpiry')
  })

  describe('Password validation requirements', () => {
    it('should reject passwords that are too short', async () => {
      const req = createMockRequest('/api/auth/register', {
        method: 'POST',
        body: {
          ...baseValidUser,
          password: 'Pass1!', // Only 6 characters - should fail 8-char requirement
        },
      })

      const res = await POST(req)
      await expectErrorResponse(res, 400, 'Invalid input data')
    })

    it('should reject passwords without uppercase letters', async () => {
      const req = createMockRequest('/api/auth/register', {
        method: 'POST',
        body: {
          ...baseValidUser,
          password: 'password123!', // No uppercase
        },
      })

      const res = await POST(req)
      await expectErrorResponse(res, 400, 'Invalid input data')
    })

    it('should reject passwords without lowercase letters', async () => {
      const req = createMockRequest('/api/auth/register', {
        method: 'POST',
        body: {
          ...baseValidUser,
          password: 'PASSWORD123!', // No lowercase
        },
      })

      const res = await POST(req)
      await expectErrorResponse(res, 400, 'Invalid input data')
    })

    it('should reject passwords without numbers', async () => {
      const req = createMockRequest('/api/auth/register', {
        method: 'POST',
        body: {
          ...baseValidUser,
          password: 'Password!', // No numbers
        },
      })

      const res = await POST(req)
      await expectErrorResponse(res, 400, 'Invalid input data')
    })

    it('should reject passwords without special characters', async () => {
      const req = createMockRequest('/api/auth/register', {
        method: 'POST',
        body: {
          ...baseValidUser,
          password: 'Password123', // No special characters
        },
      })

      const res = await POST(req)
      await expectErrorResponse(res, 400, 'Invalid input data')
    })

    it('should accept passwords meeting all requirements', async () => {
      const validPasswords = [
        'Password@123',
        'MySecure1!',
        'Test123#',
        'Admin2024$',
        'User@Pass1',
      ]

      for (const password of validPasswords) {
        const selectedUserData = {
          id: 'test-user-id',
          name: 'Test User',
          email: `test${Math.random()}@example.com`,
          role: UserRole.VIEWER,
          createdAt: new Date(),
        }
        mockPrismaUserCreate.mockResolvedValue(selectedUserData as any)
        mockPrismaUserFindUnique.mockResolvedValue(null)

        const req = createMockRequest('/api/auth/register', {
          method: 'POST',
          body: {
            ...baseValidUser,
            password,
            email: `test${Math.random()}@example.com`, // Unique email for each test
          },
        })

        const res = await POST(req)
        await expectSuccessResponse(res)
      }
    })
  })
})