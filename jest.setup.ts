import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'

// Setup DOM environment for jsdom
if (typeof window !== 'undefined') {
  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })

  // Mock window.ResizeObserver
  global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }))

  // Mock IntersectionObserver
  global.IntersectionObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }))
}

// Set up test environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-testing-purposes-only'
process.env.NEXTAUTH_URL = 'http://localhost:3000'
// Set NODE_ENV for tests
;(process.env as any).NODE_ENV = 'test'

// Polyfill for Web APIs
Object.assign(global, {
  TextEncoder,
  TextDecoder,
})

// Mock Web APIs for Next.js server components
class MockRequest {
  url: string
  method: string
  headers: Map<string, string>
  body: any

  constructor(input: any, init: any = {}) {
    this.url = input
    this.method = init.method || 'GET'
    this.headers = new Map(Object.entries(init.headers || {}))
    this.body = init.body
  }

  async json() {
    return JSON.parse(this.body || '{}')
  }

  async text() {
    return this.body || ''
  }
}

class MockResponse {
  body: any
  status: number
  statusText: string
  headers: Map<string, string>

  constructor(body: any, init: any = {}) {
    this.body = body
    this.status = init.status || 200
    this.statusText = init.statusText || 'OK'
    this.headers = new Map(Object.entries(init.headers || {}))
  }

  static json(data: any, init: any = {}) {
    return new MockResponse(JSON.stringify(data), {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...init.headers,
      },
    })
  }

  async json() {
    return JSON.parse(this.body)
  }

  async text() {
    return this.body
  }
}

class MockHeaders {
  map: Map<string, string>

  constructor(init: any = {}) {
    this.map = new Map(Object.entries(init))
  }

  get(name: string) {
    return this.map.get(name.toLowerCase())
  }

  set(name: string, value: string) {
    this.map.set(name.toLowerCase(), value)
  }

  has(name: string) {
    return this.map.has(name.toLowerCase())
  }

  delete(name: string) {
    this.map.delete(name.toLowerCase())
  }

  entries() {
    return this.map.entries()
  }
}

// Set global Web API mocks
// Type assertions for global mocks
(global as any).Request = MockRequest
;(global as any).Response = MockResponse
;(global as any).Headers = MockHeaders

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return ''
  },
  redirect: jest.fn(),
}))

// Mock Next.js server
jest.mock('next/server', () => ({
  NextRequest: MockRequest,
  NextResponse: MockResponse,
}))

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
;(global as any).localStorage = localStorageMock

// Mock fetch
global.fetch = jest.fn()

// Mock jose package to avoid ESM issues
jest.mock('jose', () => ({
  SignJWT: jest.fn().mockImplementation(() => ({
    setProtectedHeader: jest.fn().mockReturnThis(),
    setIssuedAt: jest.fn().mockReturnThis(),
    setExpirationTime: jest.fn().mockReturnThis(),
    sign: jest.fn().mockResolvedValue('mock-jwt-token'),
  })),
  jwtVerify: jest.fn().mockResolvedValue({
    payload: {
      sub: 'user-123',
      email: 'test@example.com',
      role: 'VIEWER',
    },
  }),
  createSecretKey: jest.fn(),
  EncryptJWT: jest.fn(),
  jwtDecrypt: jest.fn(),
}))

// Mock NextAuth to avoid ESM issues
jest.mock('next-auth', () => ({
  __esModule: true,
  default: jest.fn(),
  getServerSession: jest.fn(),
}))

// Mock Prisma Client to avoid browser client resolution issues
const mockPrismaClient = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    upsert: jest.fn(),
  },
  account: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  session: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  userSession: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  passwordReset: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    deleteMany: jest.fn(),
  },
  voicebotCall: {
    findMany: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    count: jest.fn(),
    deleteMany: jest.fn(),
  },
  report: {
    findMany: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  systemConfig: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    deleteMany: jest.fn(),
  },
  $transaction: jest.fn(),
  $disconnect: jest.fn(),
  $connect: jest.fn(),
}

// Mock @prisma/client to force Node.js client usage
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => mockPrismaClient),
  UserRole: {
    ADMIN: 'ADMIN',
    OPERATOR: 'OPERATOR',
    VIEWER: 'VIEWER',
  },
  EquipmentStatus: {
    ONLINE: 'ONLINE',
    OFFLINE: 'OFFLINE',
    MAINTENANCE: 'MAINTENANCE',
    ERROR: 'ERROR',
  },
}))

// Mock lib/prisma to avoid server-side issues
jest.mock('@lib/prisma', () => ({
  prisma: mockPrismaClient,
  serverPrisma: mockPrismaClient,
  usePrisma: jest.fn(() => mockPrismaClient),
  checkPrismaConnection: jest.fn().mockResolvedValue(true),
}))

// Mock lib/prisma with direct path as well
jest.mock('@/lib/prisma', () => ({
  prisma: mockPrismaClient,
  serverPrisma: mockPrismaClient,
  usePrisma: jest.fn(() => mockPrismaClient),
  checkPrismaConnection: jest.fn().mockResolvedValue(true),
}))

// Mock lib/prisma without the @ prefix (for @lib/prisma imports)
jest.mock('@lib/prisma', () => ({
  prisma: mockPrismaClient,
  serverPrisma: mockPrismaClient,
  usePrisma: jest.fn(() => mockPrismaClient),
  checkPrismaConnection: jest.fn().mockResolvedValue(true),
}))

// Mock auth config to avoid environment variable issues
jest.mock('@config/auth', () => ({
  authConfig: {
    bcrypt: {
      saltRounds: 12,
    },
    jwt: {
      secret: 'test-secret',
      expiresIn: '24h',
    },
    session: {
      maxAge: 86400,
      updateAge: 3600,
    },
    password: {
      minLength: 6,
      requireUppercase: false,
      requireLowercase: false,
      requireNumbers: false,
      requireSpecialChars: false,
    },
    rateLimit: {
      windowMs: 60000,
      maxAttempts: 3,
    },
  },
}))

// Note: Auth functions are not globally mocked to allow individual tests to mock them as needed
// Each test file should mock @lib/auth and @/lib/auth as required

// Mock rate limiting functions
const mockRateLimiter = {
  checkStatus: jest.fn().mockReturnValue({ allowed: true, remaining: 5, resetTime: new Date(), totalAttempts: 0, blocked: false }),
  checkLimit: jest.fn().mockReturnValue({ allowed: true, remaining: 4, resetTime: new Date(), totalAttempts: 1, blocked: false }),
  recordFailedAttempt: jest.fn().mockReturnValue({ allowed: false, remaining: 0, resetTime: new Date(), totalAttempts: 5, blocked: true }),
  recordSuccessfulAttempt: jest.fn(),
  isBlocked: jest.fn().mockReturnValue(false),
  reset: jest.fn(),
  resetAll: jest.fn(),
  getStats: jest.fn().mockReturnValue({ totalTrackedIdentifiers: 0, blockedIdentifiers: 0, totalAttempts: 0, oldestAttempt: null }),
  stopCleanup: jest.fn(),
}

jest.mock('@/lib/rate-limiting', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => mockRateLimiter),
  authRateLimiter: mockRateLimiter,
  checkAuthRateLimit: jest.fn().mockResolvedValue({ allowed: true }),
  recordFailedAuth: jest.fn().mockResolvedValue(undefined),
  recordSuccessfulAuth: jest.fn().mockResolvedValue(undefined),
  isAuthBlocked: jest.fn().mockResolvedValue(false),
  createRateLimitError: jest.fn().mockReturnValue({
    success: false,
    error: 'Too many authentication attempts. Please try again later.',
    code: 'RATE_LIMITED',
    rateLimitInfo: {
      remaining: 0,
      resetTime: new Date().toISOString(),
      totalAttempts: 5,
      retryAfter: 900
    }
  }),
}))

// Mock lib/rate-limiting without the @ prefix (for @lib/rate-limiting imports)
jest.mock('@lib/rate-limiting', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => mockRateLimiter),
  authRateLimiter: mockRateLimiter,
  checkAuthRateLimit: jest.fn().mockResolvedValue({ allowed: true }),
  recordFailedAuth: jest.fn().mockResolvedValue(undefined),
  recordSuccessfulAuth: jest.fn().mockResolvedValue(undefined),
  isAuthBlocked: jest.fn().mockResolvedValue(false),
  createRateLimitError: jest.fn().mockReturnValue({
    success: false,
    error: 'Too many authentication attempts. Please try again later.',
    code: 'RATE_LIMITED',
    rateLimitInfo: {
      remaining: 0,
      resetTime: new Date().toISOString(),
      totalAttempts: 5,
      retryAfter: 900
    }
  }),
}))

// Mock lib/nextauth without the @ prefix (for @lib/nextauth imports)
// Note: This is a minimal mock - individual tests should provide more detailed mocks if needed
jest.mock('@lib/nextauth', () => ({
  authOptions: {
    providers: [
      {
        name: 'credentials',
        type: 'credentials',
        authorize: jest.fn().mockResolvedValue(null),
      }
    ],
    session: { strategy: 'jwt' },
    pages: {
      signIn: '/auth/login',
      error: '/auth/error',
    },
    callbacks: {
      jwt: jest.fn().mockImplementation(async ({ token, user, trigger, session }) => {
        if (user) {
          token.id = user.id
          token.role = user.role
        }
        if (trigger === 'update' && session) {
          // Update token with session data
          if (session.user.name) token.name = session.user.name
          if (session.user.email) token.email = session.user.email
        }
        return token
      }),
      session: jest.fn().mockImplementation(async ({ session, token }) => {
        session.user.id = token.id
        session.user.role = token.role
        return session
      }),
      signIn: jest.fn().mockResolvedValue(true),
      redirect: jest.fn().mockImplementation(async ({ url, baseUrl }) => {
        if (url.startsWith('/')) {
          return `${baseUrl}${url}`
        }
        if (url.startsWith(baseUrl)) {
          return url
        }
        return `${baseUrl}/dashboard`
      }),
    },
  },
}))

// Note: Auth functions are not globally mocked to allow individual tests to mock them as needed

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: 'unauthenticated',
    update: jest.fn(),
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Setup test environment
beforeEach(() => {
  jest.clearAllMocks()
  
  // Reset mock implementations
  Object.values(mockPrismaClient).forEach(model => {
    if (typeof model === 'object' && model !== null) {
      Object.values(model).forEach(method => {
        if (typeof method === 'function' && method.mockReset) {
          method.mockReset()
        }
      })
    }
  })
})

// Global cleanup after all tests
afterAll(async () => {
  // Clear all timers and intervals
  jest.clearAllTimers()
  jest.useRealTimers()
  
  // Clear all mocks
  jest.clearAllMocks()
  jest.restoreAllMocks()
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc()
  }
  
  // Small delay to allow cleanup
  await new Promise(resolve => setTimeout(resolve, 100))
})

// Global test utilities
;(global as any).testUtils = {
  createMockUser: (overrides: any = {}) => ({
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    role: 'VIEWER',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
  
  createMockSession: (overrides: any = {}) => ({
    user: {
      id: 'test-user-id',
      name: 'Test User',
      email: 'test@example.com',
      role: 'VIEWER',
      ...(overrides.user || {})
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    ...overrides,
  }),
  
  createMockRequest: (url: string, options: any = {}) => {
    return new MockRequest(url, options)
  },
  
  createMockResponse: (data: any, options: any = {}) => {
    return MockResponse.json(data, options)
  },
}