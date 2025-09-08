/**
 * Auth Test Setup
 * Provides clean mocks for auth-related tests without global interference
 */

// Mock bcrypt for auth tests
export const mockBcrypt = {
  hash: jest.fn(),
  compare: jest.fn(),
}

// Mock crypto for auth tests
export const mockCrypto = {
  randomBytes: jest.fn(),
  createHash: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn(),
  })),
}

// Setup function for auth tests
export function setupAuthMocks() {
  // Clear any existing mocks
  jest.clearAllMocks()
  
  // Set up environment variables
  process.env.NEXTAUTH_SECRET = 'test-secret-key-for-testing-purposes-only'
  process.env.BCRYPT_SALT_ROUNDS = '12'
  
  return {
    mockBcrypt,
    mockCrypto,
  }
}

// Clean up function
export function cleanupAuthMocks() {
  jest.clearAllMocks()
}