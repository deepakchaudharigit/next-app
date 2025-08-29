/**
 * Test Utilities with Proper Types
 * Utility functions for testing with proper TypeScript types instead of 'any'
 */

import { UserRole } from '@prisma/client'
import { 
  MockUser, 
  MockSession, 
  MockRequest, 
  MockResponse, 
  TestRequestOptions, 
  TestApiResponse,
  TestDataFactory,
  MockPrisma,
  MockPrismaUser,
  MockPrismaAuditLog
} from '../types/test-types'

// Test user factory
export const createTestUser: TestDataFactory<MockUser> = (overrides = {}) => ({
  id: 'test-user-id',
  name: 'Test User',
  email: 'test@example.com',
  password: '$2a$12$hashedpassword',
  role: UserRole.VIEWER,
  createdAt: new Date(),
  updatedAt: new Date(),
  isDeleted: false,
  ...overrides,
})

// Test session factory
export const createTestSession: TestDataFactory<MockSession> = (overrides = {}) => ({
  user: {
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    role: UserRole.VIEWER,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  ...overrides,
})

// Test request factory
export const createTestRequest = (url: string, options: TestRequestOptions = {}): MockRequest => {
  const { method = 'GET', headers = {}, body } = options
  
  return {
    url,
    method,
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
    json: async () => body || {},
  }
}

// Test response factory
export const createTestResponse = (status: number, data: unknown): MockResponse => ({
  status,
  json: async () => data,
  headers: {},
})

// Mock Prisma factory
export const createMockPrisma = (): MockPrisma => {
  const mockUserFindUnique = jest.fn() as MockPrismaUser['findUnique']
  const mockUserFindMany = jest.fn() as MockPrismaUser['findMany']
  const mockUserCreate = jest.fn() as MockPrismaUser['create']
  const mockUserUpdate = jest.fn() as MockPrismaUser['update']
  const mockUserDelete = jest.fn() as MockPrismaUser['delete']
  
  const mockAuditLogCreate = jest.fn() as MockPrismaAuditLog['create']
  
  // Set up default implementations
  mockUserFindMany.mockResolvedValue([])
  mockUserFindUnique.mockResolvedValue(null)
  mockAuditLogCreate.mockResolvedValue({
    id: 'audit-log-id',
    userId: null,
    action: 'test',
    resource: 'test',
    details: null,
    ipAddress: 'test-ip',
    userAgent: 'test-agent',
    createdAt: new Date(),
  })
  
  return {
    user: {
      findUnique: mockUserFindUnique,
      findMany: mockUserFindMany,
      create: mockUserCreate,
      update: mockUserUpdate,
      delete: mockUserDelete,
    },
    auditLog: {
      create: mockAuditLogCreate,
    },
  }
}

// Test users collection
export const testUsers = {
  admin: createTestUser({
    id: 'admin-id',
    name: 'Admin User',
    email: 'admin@example.com',
    password: '$2a$12$adminhashedpassword',
    role: UserRole.ADMIN,
  }),
  operator: createTestUser({
    id: 'operator-id',
    name: 'Operator User',
    email: 'operator@example.com',
    password: '$2a$12$operatorhashedpassword',
    role: UserRole.OPERATOR,
  }),
  viewer: createTestUser({
    id: 'viewer-id',
    name: 'Viewer User',
    email: 'viewer@example.com',
    password: '$2a$12$viewerhashedpassword',
    role: UserRole.VIEWER,
  }),
}

// Response assertion helpers
export const expectSuccessResponse = async <T>(
  response: MockResponse,
  expectedData?: T
): Promise<TestApiResponse<T>> => {
  expect(response.status).toBe(200)
  const data = await response.json() as TestApiResponse<T>
  expect(data.success).toBe(true)
  if (expectedData) {
    expect(data.data).toEqual(expectedData)
  }
  return data
}

export const expectErrorResponse = async (
  response: MockResponse,
  expectedStatus: number,
  expectedMessage?: string
): Promise<TestApiResponse> => {
  expect(response.status).toBe(expectedStatus)
  const data = await response.json() as TestApiResponse
  expect(data.success).toBe(false)
  if (expectedMessage) {
    expect(data.message || data.error).toContain(expectedMessage)
  }
  return data
}

// Date normalization for test comparisons
export const normalizeDate = (date: Date | string): string => {
  if (date instanceof Date) {
    return date.toISOString()
  }
  if (typeof date === 'string') {
    return new Date(date).toISOString()
  }
  return String(date)
}

// Test data normalization
export const normalizeTestData = <T>(data: T): T => {
  if (Array.isArray(data)) {
    return data.map(normalizeTestData) as T
  }
  
  if (data && typeof data === 'object') {
    const normalized = {} as Record<string, unknown>
    for (const [key, value] of Object.entries(data)) {
      if (key.includes('At') || key.includes('Date')) {
        normalized[key] = normalizeDate(value as Date | string)
      } else {
        normalized[key] = normalizeTestData(value)
      }
    }
    return normalized as T
  }
  
  return data
}

// Mock authentication utilities
export const createMockAuthUtils = () => {
  const mockWithAuth = jest.fn()
  const mockWithAdminAuth = jest.fn()
  const mockHashPassword = jest.fn()
  const mockVerifyPassword = jest.fn()
  
  // Default implementations
  mockHashPassword.mockResolvedValue('$2a$12$hashedpassword')
  mockVerifyPassword.mockResolvedValue(true)
  
  mockWithAuth.mockImplementation((handler) => {
    return async (req: MockRequest) => {
      return handler(req, testUsers.viewer)
    }
  })
  
  mockWithAdminAuth.mockImplementation((handler) => {
    return async (req: MockRequest) => {
      return handler(req, testUsers.admin)
    }
  })
  
  return {
    mockWithAuth,
    mockWithAdminAuth,
    mockHashPassword,
    mockVerifyPassword,
  }
}

// Error simulation utilities
export const createDatabaseError = (message: string, code?: string) => {
  const error = new Error(message) as Error & { code?: string }
  if (code) {
    error.code = code
  }
  return error
}

export const createValidationError = (message: string, path: string[]) => ({
  code: 'invalid_type',
  message,
  path,
})

// Test environment setup
export const setupTestEnvironment = () => {
  // Mock environment variables
  const originalNodeEnv = process.env.NODE_ENV
  Object.defineProperty(process.env, 'NODE_ENV', {
    value: 'test',
    writable: true,
    configurable: true
  })
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
  process.env.NEXTAUTH_SECRET = 'test-secret'
  process.env.NEXTAUTH_URL = 'http://localhost:3000'
  
  const mockPrisma = createMockPrisma()
  const mockAuth = createMockAuthUtils()
  
  return {
    mockPrisma,
    ...mockAuth,
    testUsers,
  }
}

// Clean up test environment
export const cleanupTestEnvironment = () => {
  jest.clearAllMocks()
  jest.resetModules()
}