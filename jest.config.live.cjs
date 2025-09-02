/**
 * Jest Configuration for Live Server Testing
 * This config is used when testing against a running server
 */

const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const config = {
  // Test environment for live server testing
  testEnvironment: 'node',
  
  // Test patterns for live server testing
  testMatch: [
    '**/__tests__/live/**/*.test.{js,ts}',
    '**/__tests__/api/**/*.live.test.{js,ts}',
    '**/__tests__/integration/**/*.live.test.{js,ts}',
  ],
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.ts',
  ],
  
  // Test timeout for live server tests (longer than unit tests)
  testTimeout: 30000,
  
  // Module name mapping
  moduleNameMapper: {
    '^@prisma/client$': '<rootDir>/node_modules/@prisma/client/index.js',
    '^@prisma/client/(.*)$': '<rootDir>/node_modules/@prisma/client/$1',
    '^@/(.*)$': '<rootDir>/$1',
    '^@lib/(.*)$': '<rootDir>/lib/$1',
    '^@models/(.*)$': '<rootDir>/models/$1',
    '^@config/(.*)$': '<rootDir>/config/$1',
    '^@middleware/(.*)$': '<rootDir>/middleware/$1',
    '^@types/(.*)$': '<rootDir>/types/$1',
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@test-utils/live$': '<rootDir>/__tests__/utils/live-server-utils.ts',
  },
  
  // Coverage settings for live tests
  collectCoverageFrom: [
    'app/api/**/*.{js,ts}',
    'lib/**/*.{js,ts}',
    '!**/*.d.ts',
    '!**/*.test.{js,ts}',
    '!**/__tests__/**',
  ],
  
  // Test path ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/\.next/',
    '/__tests__/utils/',
    '/__tests__backup/',
  ],
  
  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(jose|@next-auth|next-auth|openid-client|@auth|oauth|preact-render-to-string|preact|.*\\.mjs$))',
  ],
  
  // Test environment options
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },
  
  // Coverage provider
  coverageProvider: 'v8',
};

module.exports = createJestConfig(config);