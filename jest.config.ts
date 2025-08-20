// jest.config.ts
import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const config: Config = {
  coverageProvider: 'v8',
  // Use Node.js environment for all tests to avoid Prisma browser client issues
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    // Force Prisma to use Node.js client instead of browser client
    '^@prisma/client$': '<rootDir>/node_modules/@prisma/client/index.js',
    '^@prisma/client/(.*)$': '<rootDir>/node_modules/@prisma/client/$1',
    // Application path mappings
    '^@/(.*)$': '<rootDir>/$1',
    '^@lib/(.*)$': '<rootDir>/lib/$1',
    '^@models/(.*)$': '<rootDir>/models/$1',
    '^@config/(.*)$': '<rootDir>/config/$1',
    '^@middleware/(.*)$': '<rootDir>/middleware/$1',
    '^@types/(.*)$': '<rootDir>/types/$1',
    '^@/components/(.*)$': '<rootDir>/components/$1',
  },
  testMatch: [
    '**/__tests__/**/*.(test|spec).(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/__tests__/utils/test-helpers.utils.ts',
    '<rootDir>/__tests__/utils/test-factories.ts',
    '<rootDir>/__tests__/test-runner.ts',
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
  ],
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    'models/**/*.{ts,tsx}',
    'middleware/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  testTimeout: 10000,
  // Add transformIgnorePatterns to handle ES modules and force Node.js resolution
  transformIgnorePatterns: [
    'node_modules/(?!(jose|@next-auth|next-auth|openid-client|@auth|oauth|preact-render-to-string|preact|.*\\.mjs$))',
  ],
  // Force Node.js environment for Prisma-related tests
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },
  // Additional module resolution for Prisma
  resolver: undefined, // Use default resolver but with our moduleNameMapper
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config)