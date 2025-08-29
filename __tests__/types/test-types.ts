/**
 * Test Type Definitions
 * Proper type definitions for test mocks and fixtures to replace 'as any' usage
 */

import { UserRole } from '@prisma/client'
import { Session } from 'next-auth'

// Mock Prisma User type
export interface MockUser {
  id: string
  name: string
  email: string
  password: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
  isDeleted: boolean
}

// Mock NextAuth Session type
export interface MockSession extends Omit<Session, 'user'> {
  user: {
    id: string
    name: string
    email: string
    role: UserRole
  }
  expires: string
}

// Mock Request type for testing
export interface MockRequest {
  url: string
  method: string
  headers: Record<string, string>
  json: () => Promise<unknown>
}

// Mock Response type for testing
export interface MockResponse {
  status: number
  json: () => Promise<unknown>
  headers: Record<string, string>
}

// Mock Prisma Client methods
export interface MockPrismaUser {
  findUnique: jest.MockedFunction<(args: { where: { id?: string; email?: string }; select?: Record<string, boolean> }) => Promise<MockUser | null>>
  findMany: jest.MockedFunction<(args?: { where?: Record<string, unknown>; select?: Record<string, boolean>; orderBy?: Record<string, string> }) => Promise<MockUser[]>>
  create: jest.MockedFunction<(args: { data: Partial<MockUser>; select?: Record<string, boolean> }) => Promise<MockUser>>
  update: jest.MockedFunction<(args: { where: { id: string }; data: Partial<MockUser>; select?: Record<string, boolean> }) => Promise<MockUser>>
  delete: jest.MockedFunction<(args: { where: { id: string } }) => Promise<MockUser>>
}

export interface MockPrismaAuditLog {
  create: jest.MockedFunction<(args: { data: Record<string, unknown> }) => Promise<{ id: string; userId: string | null; action: string; resource: string; details: string | null; ipAddress: string; userAgent: string; createdAt: Date }>>
}

export interface MockPrisma {
  user: MockPrismaUser
  auditLog: MockPrismaAuditLog
}

// Auth middleware types
export interface AuthResult {
  user: MockUser | null
  response: MockResponse | null
}

export type AuthMiddleware = (req: MockRequest) => Promise<AuthResult>

// Test utility types
export interface TestRequestOptions {
  method?: string
  headers?: Record<string, string>
  body?: unknown
  searchParams?: Record<string, string>
}

export interface TestUser {
  id: string
  name: string
  email: string
  role: UserRole
  password: string
  createdAt: Date
  updatedAt: Date
  isDeleted: boolean
}

// Mock function types
export type MockFunction<T extends (...args: never[]) => unknown> = jest.MockedFunction<T>

// Error types for testing
export interface TestError extends Error {
  code?: string
  statusCode?: number
}

// API Response types for testing
export interface TestApiResponse<T = unknown> {
  success: boolean
  message?: string
  data?: T
  error?: string
  errors?: Array<{ message: string; path: string[] }>
}

// Route handler types
export type RouteHandler = (req: MockRequest, context?: { params?: Record<string, string> }) => Promise<MockResponse>

// Auth wrapper types
export type AuthWrapper<T extends unknown[]> = (
  handler: (req: MockRequest, sessionUser: MockUser, ...args: T) => Promise<MockResponse>
) => RouteHandler

// Database error simulation types
export interface DatabaseErrorOptions {
  code?: string
  message?: string
  meta?: Record<string, unknown>
}

// Test scenario types
export interface TestScenario {
  name: string
  setup: () => void | Promise<void>
  teardown?: () => void | Promise<void>
  expectedResult: unknown
}

// Mock crypto types for password hashing tests
export interface MockCrypto {
  createHash: jest.MockedFunction<(algorithm: string) => {
    update: jest.MockedFunction<(data: string) => { digest: jest.MockedFunction<(encoding: string) => string> }>
  }>
}

// Validation error types
export interface ValidationError {
  code: string
  message: string
  path: string[]
}

// Test data factory types
export type TestDataFactory<T> = (overrides?: Partial<T>) => T

// Mock service types
export interface MockEmailService {
  sendEmail: jest.MockedFunction<(to: string, subject: string, body: string) => Promise<void>>
}

export interface MockAuthService {
  hashPassword: jest.MockedFunction<(password: string) => Promise<string>>
  verifyPassword: jest.MockedFunction<(password: string, hash: string) => Promise<boolean>>
  generateToken: jest.MockedFunction<() => string>
}

// Test environment types
export interface TestEnvironment {
  prisma: MockPrisma
  authService: MockAuthService
  emailService: MockEmailService
  session: MockSession | null
}