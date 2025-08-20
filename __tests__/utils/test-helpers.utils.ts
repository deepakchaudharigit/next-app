import { NextRequest, NextResponse } from "next/server";
import { Session } from "next-auth";
import { UserRole } from "@prisma/client";
import type { ZodSchema } from "zod";

// ────────────────
// Type definitions for better type safety
// ────────────────
interface MockPrismaUser {
  findUnique: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>
  findMany: jest.MockedFunction<(...args: unknown[]) => Promise<unknown[]>>
  create: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>
  update: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>
  delete: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>
  count: jest.MockedFunction<(...args: unknown[]) => Promise<number>>
}

interface MockPrismaAuditLog {
  create: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>
  findMany: jest.MockedFunction<(...args: unknown[]) => Promise<unknown[]>>
}

interface MockPrisma {
  user: MockPrismaUser
  auditLog: MockPrismaAuditLog
  $transaction: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>
  $disconnect: jest.MockedFunction<() => Promise<void>>
}

interface RequestOptions {
  method?: string
  headers?: Record<string, string>
  body?: unknown
  searchParams?: Record<string, string>
}

interface ValidationCase {
  data: unknown
  expectedErrors: string[]
}

interface MockRouterType {
  push: jest.MockedFunction<(url: string) => void>
  replace: jest.MockedFunction<(url: string) => void>
  prefetch: jest.MockedFunction<(url: string) => void>
  back: jest.MockedFunction<() => void>
  forward: jest.MockedFunction<() => void>
  refresh: jest.MockedFunction<() => void>
}

interface MockSessionType {
  data: Session | null
  status: "loading" | "authenticated" | "unauthenticated"
  update: jest.MockedFunction<() => void>
}

interface ExecutionTimeResult<T> {
  result: T
  executionTime: number
}

// ────────────────
// Mock Prisma client (user + auditLog only)
// ────────────────
export const createMockPrisma = (): MockPrisma => ({
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  $transaction: jest.fn(),
  $disconnect: jest.fn(),
});

// ────────────────
// Session Helpers
// ────────────────
export const mockSession = (user: {
  id: string;
  email: string;
  role: UserRole;
}): Session => ({
  user: {
    ...user,
    name: user.email.split('@')[0] || 'Test User'
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
});

// ────────────────
// Request Helper
// ────────────────
export const createMockRequest = (
  url: string,
  options: RequestOptions = {}
): NextRequest => {
  const { method = "GET", headers = {}, body, searchParams = {} } = options;

  const urlObj = new URL(url, "http://localhost:3000");
  Object.entries(searchParams).forEach(([key, value]) => {
    urlObj.searchParams.set(key, value);
  });

  const request = new NextRequest(urlObj.toString(), {
    method,
    headers: {
      "content-type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  return request;
};

// ────────────────
// Response Helpers
// ────────────────
export const expectJsonResponse = async (
  response: NextResponse,
  expectedStatus: number
): Promise<Record<string, unknown>> => {
  expect(response.status).toBe(expectedStatus);
  const data = await response.json();
  return data as Record<string, unknown>;
};

export const expectSuccessResponse = async (
  response: NextResponse,
  expectedData?: unknown
): Promise<Record<string, unknown>> => {
  const data = await expectJsonResponse(response, 200);
  expect(data.success).toBe(true);
  if (expectedData) {
    expect(data.data).toEqual(expectedData);
  }
  return data;
};

export const expectErrorResponse = async (
  response: NextResponse,
  expectedStatus: number,
  expectedMessage?: string
): Promise<Record<string, unknown>> => {
  const data = await expectJsonResponse(response, expectedStatus);
  expect(data.success).toBe(false);
  if (expectedMessage) {
    expect(data.message).toContain(expectedMessage);
  }
  return data;
};

// ────────────────
// Database Test Setup
// ────────────────
export const setupTestDatabase = (): MockPrisma => {
  const mockPrisma = createMockPrisma();

  mockPrisma.user.create.mockResolvedValue({});
  mockPrisma.user.findUnique.mockResolvedValue(null);

  return mockPrisma;
};

// ────────────────
// Auth Header Helper
// ────────────────
export const withAuthHeaders = (
  headers: Record<string, string>,
  user: { id: string; email: string; role: UserRole }
): Record<string, string> => ({
  ...headers,
  "x-user-id": user.id,
  "x-user-email": user.email,
  "x-user-role": user.role,
});

// ────────────────
// Zod Validation Tester
// ────────────────
export const testFormValidation = (
  schema: ZodSchema,
  validData: unknown,
  invalidCases: ValidationCase[]
): void => {
  describe("Form validation", () => {
    it("should validate correct data", () => {
      const result = schema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    invalidCases.forEach(({ data, expectedErrors }, index) => {
      it(`should reject invalid data case ${index + 1}`, () => {
        const result = schema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          const errorMessages = result.error.issues.map(
            (issue) => issue.message
          );
          expectedErrors.forEach((expectedError) => {
            expect(errorMessages).toContain(expectedError);
          });
        }
      });
    });
  });
};

// ────────────────
// Router Mocks
// ────────────────
export const mockRouter: MockRouterType = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
};

export const mockUseSession = (
  session: Session | null,
  status: "loading" | "authenticated" | "unauthenticated" = "authenticated"
): MockSessionType => ({
  data: session,
  status,
  update: jest.fn(),
});

// ────────────────
// API Utility
// ────────────────
export const testApiRoute = async (
  handler: (req: NextRequest) => Promise<NextResponse>,
  request: NextRequest
): Promise<NextResponse> => {
  const response = await handler(request);
  return response;
};

// ────────────────
// Performance
// ────────────────
export const measureExecutionTime = async <T>(
  fn: () => Promise<T>
): Promise<ExecutionTimeResult<T>> => {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  return {
    result,
    executionTime: end - start,
  };
};

// ────────────────
// Error Simulation
// ────────────────
export const simulateDatabaseError = (
  mockPrisma: MockPrisma,
  operation: string,
  error: Error
): void => {
  const [model, method] = operation.split(".");
  if (model && method && mockPrisma[model as keyof MockPrisma]) {
    const modelMock = mockPrisma[model as keyof MockPrisma] as Record<string, jest.MockInstance<any, never, never>>;
    if (modelMock[method]) {
      modelMock[method].mockRejectedValue(error);
    }
  }
};

export const simulateNetworkError = (): Error & { code: string } => {
  const error = new Error("Network error") as Error & { code: string };
  error.code = "NETWORK_ERROR";
  return error;
};

// ────────────────
// Cleanup
// ────────────────
export const cleanupTestData = (mockPrisma: MockPrisma): void => {
  Object.keys(mockPrisma).forEach((model) => {
    const modelMock = mockPrisma[model as keyof MockPrisma];
    if (typeof modelMock === "object" && modelMock !== null) {
      Object.keys(modelMock as Record<string, unknown>).forEach((method) => {
        const methodMock = (modelMock as Record<string, unknown>)[method];
        if (jest.isMockFunction(methodMock)) {
          methodMock.mockClear();
        }
      });
    }
  });
};

// ────────────────
// Async Wait Helpers
// ────────────────
export const waitFor = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const waitForCondition = async (
  condition: () => boolean,
  timeout = 5000
): Promise<void> => {
  const start = Date.now();
  while (!condition() && Date.now() - start < timeout) {
    await waitFor(10);
  }
  if (!condition()) {
    throw new Error(`Condition not met within ${timeout}ms`);
  }
};