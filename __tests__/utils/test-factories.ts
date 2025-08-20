import {
  User,
  UserRole,
} from "@prisma/client";
import { testFormValidation } from "../utils/test-helpers.utils";

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

// ────────────────
// Jest Test Coverage
// ────────────────

describe("Test Factories", () => {
  test("should create mock user with default values", () => {
    const user = createMockUser();
    expect(user).toHaveProperty("id");
    expect(user).toHaveProperty("email");
    expect(user).toHaveProperty("role");
    expect(user.role).toBe(UserRole.VIEWER);
  });

  test("should create mock admin user", () => {
    const admin = createMockAdmin();
    expect(admin.role).toBe(UserRole.ADMIN);
    expect(admin.email).toBe("admin@example.com");
  });

  test("should create multiple mock users", () => {
    const users = createMockUsers(3);
    expect(users).toHaveLength(3);
    expect(users[0]?.id).toBe("user-1");
    expect(users[1]?.id).toBe("user-2");
    expect(users[2]?.id).toBe("user-3");
  });

  test("should create mock session with proper structure", () => {
    const session = createMockSession();
    expect(session).toHaveProperty("user");
    expect(session).toHaveProperty("expires");
    expect(session.user).toHaveProperty("id");
    expect(session.user).toHaveProperty("role");
  });

  test("should create mock token with proper structure", () => {
    const token = createMockToken();
    expect(token).toHaveProperty("id");
    expect(token).toHaveProperty("iat");
    expect(token).toHaveProperty("exp");
    expect(typeof token.iat).toBe("number");
    expect(typeof token.exp).toBe("number");
  });

  test("should create mock API response", () => {
    const response = createMockApiResponse({ id: "test" });
    expect(response.success).toBe(true);
    expect(response.data).toEqual({ id: "test" });
    expect(response.message).toBe("Operation successful");
  });

  test("should create mock API error response", () => {
    const response = createMockApiResponse(null, false);
    expect(response.success).toBe(false);
    expect(response.error).toBe("Test error");
    expect(response.message).toBe("Operation failed");
  });
});