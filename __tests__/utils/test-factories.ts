import {
  User,
  UserRole,
} from "@prisma/client";

// ────────────────
// Type definitions for better type safety
// ────────────────
interface MockSession {
  user: {
    id: string
    name: string
    email: string
    role: UserRole
  }
  expires: string
}

interface MockToken {
  id: string
  name: string
  email: string
  role: UserRole
  iat: number
  exp: number
}

interface MockLoginData {
  email: string
  password: string
}

interface MockRegisterData {
  name: string
  email: string
  password: string
  confirmPassword: string
  role: UserRole
}

interface MockApiResponse<T> {
  success: boolean
  message: string
  data?: T
  error?: string
}

// ────────────────
// User Factories
// ────────────────

export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: "user-123",
  name: "Test User",
  email: "test@example.com",
  password: "$2a$12$hashedpassword",
  role: UserRole.VIEWER,
  isDeleted: false,
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  ...overrides,
});

export const createMockAdmin = (overrides: Partial<User> = {}): User =>
  createMockUser({
    id: "admin-123",
    name: "Admin User",
    email: "admin@example.com",
    role: UserRole.ADMIN,
    ...overrides,
  });

export const createMockOperator = (overrides: Partial<User> = {}): User =>
  createMockUser({
    id: "operator-123",
    name: "Operator User",
    email: "operator@example.com",
    role: UserRole.OPERATOR,
    ...overrides,
  });

export const createMockUsers = (count: number): User[] =>
  Array.from({ length: count }, (_, index) =>
    createMockUser({
      id: `user-${index + 1}`,
      name: `User ${index + 1}`,
      email: `user${index + 1}@example.com`,
      role: [UserRole.VIEWER, UserRole.OPERATOR, UserRole.ADMIN][index % 3],
    }),
  );

// ────────────────
// Auth & Session Factories
// ────────────────

export const createMockSession = (user: Partial<User> = {}): MockSession => ({
  user: {
    id: user.id || "user-123",
    name: user.name || "Test User",
    email: user.email || "test@example.com",
    role: user.role || UserRole.VIEWER,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
});

export const createMockToken = (user: Partial<User> = {}): MockToken => ({
  id: user.id || "user-123",
  name: user.name || "Test User",
  email: user.email || "test@example.com",
  role: user.role || UserRole.VIEWER,
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
});

// ────────────────
// Form Factories
// ────────────────

export const createMockLoginData = (): MockLoginData => ({
  email: "test@example.com",
  password: "password123",
});

export const createMockRegisterData = (): MockRegisterData => ({
  name: "Test User",
  email: "test@example.com",
  password: "password123",
  confirmPassword: "password123",
  role: UserRole.VIEWER,
});

// ────────────────
// API Response
// ────────────────

export const createMockApiResponse = <T>(data: T, success = true): MockApiResponse<T> => ({
  success,
  message: success ? "Operation successful" : "Operation failed",
  data: success ? data : undefined,
  error: success ? undefined : "Test error",
});

/**
 * Test Factories and Utilities
 * Provides factory functions for creating test data and cleanup utilities
 */

import { UserRole } from '@prisma/client'
import { prisma } from '@/lib/prisma'

// User factory
export function testUser(overrides: Partial<{
  name: string
  email: string
  password: string
  role: UserRole
}> = {}) {
  const timestamp = Date.now()
  return {
    name: `Test User ${timestamp}`,
    email: `test${timestamp}@example.com`,
    password: 'TestPassword123!',
    role: UserRole.VIEWER,
    ...overrides,
  }
}

// Admin user factory
export function testAdminUser(overrides: Partial<{
  name: string
  email: string
  password: string
}> = {}) {
  return testUser({ role: UserRole.ADMIN, ...overrides })
}

// Operator user factory
export function testOperatorUser(overrides: Partial<{
  name: string
  email: string
  password: string
}> = {}) {
  return testUser({ role: UserRole.OPERATOR, ...overrides })
}

// Voicebot call factory
export function testVoicebotCall(overrides: Partial<{
  cli: string
  language: string
  queryType: string
  ticketsIdentified: number
  durationSeconds: number
  callResolutionStatus: string
}> = {}) {
  const timestamp = Date.now()
  return {
    cli: `+1234567${timestamp.toString().slice(-3)}`,
    receivedAt: new Date(),
    language: 'en',
    queryType: 'billing',
    ticketsIdentified: 1,
    durationSeconds: 120,
    callResolutionStatus: 'RESOLVED',
    ...overrides,
  }
}

// Report factory
export function testReport(userId: string, overrides: Partial<{
  title: string
  content: string
}> = {}) {
  const timestamp = Date.now()
  return {
    title: `Test Report ${timestamp}`,
    content: `Test report content generated at ${new Date().toISOString()}`,
    userId,
    ...overrides,
  }
}

// Cleanup utilities
export async function cleanupTestData() {
  // Delete in order to respect foreign key constraints
  await prisma.auditLog.deleteMany({
    where: {
      user: {
        email: {
          contains: '@example.com'
        }
      }
    }
  })
  
  await prisma.report.deleteMany({
    where: {
      user: {
        email: {
          contains: '@example.com'
        }
      }
    }
  })
  
  await prisma.passwordReset.deleteMany({
    where: {
      user: {
        email: {
          contains: '@example.com'
        }
      }
    }
  })
  
  await prisma.userSession.deleteMany({
    where: {
      user: {
        email: {
          contains: '@example.com'
        }
      }
    }
  })
  
  await prisma.session.deleteMany({
    where: {
      user: {
        email: {
          contains: '@example.com'
        }
      }
    }
  })
  
  await prisma.account.deleteMany({
    where: {
      user: {
        email: {
          contains: '@example.com'
        }
      }
    }
  })
  
  await prisma.user.deleteMany({
    where: {
      email: {
        contains: '@example.com'
      }
    }
  })
  
  await prisma.voicebotCall.deleteMany({
    where: {
      cli: {
        startsWith: '+1234567'
      }
    }
  })
}

// Database seeding for tests
export async function seedTestDatabase() {
  const adminUser = testAdminUser({
    email: 'admin@test.com',
    name: 'Test Admin'
  })
  
  const operatorUser = testOperatorUser({
    email: 'operator@test.com',
    name: 'Test Operator'
  })
  
  const viewerUser = testUser({
    email: 'viewer@test.com',
    name: 'Test Viewer'
  })
  
  const users = await Promise.all([
    prisma.user.create({ data: adminUser }),
    prisma.user.create({ data: operatorUser }),
    prisma.user.create({ data: viewerUser })
  ])
  
  // Create some test voicebot calls
  const calls = await Promise.all([
    prisma.voicebotCall.create({ data: testVoicebotCall() }),
    prisma.voicebotCall.create({ data: testVoicebotCall({ language: 'es', queryType: 'technical' }) }),
    prisma.voicebotCall.create({ data: testVoicebotCall({ callResolutionStatus: 'UNRESOLVED' }) })
  ])
  
  return { users, calls }
}

// Mock data generators
export function generateMockUsers(count: number) {
  return Array.from({ length: count }, (_, i) => testUser({
    email: `user${i}@example.com`,
    name: `User ${i}`
  }))
}

export function generateMockVoicebotCalls(count: number) {
  return Array.from({ length: count }, (_, i) => testVoicebotCall({
    cli: `+123456789${i.toString().padStart(2, '0')}`,
    durationSeconds: Math.floor(Math.random() * 300) + 30
  }))
}