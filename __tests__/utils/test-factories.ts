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

// Test factories utility - no tests should be in this file
// Tests for these factories should be in a separate test file