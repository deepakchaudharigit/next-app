// jest.config.cjs
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  verbose: true,
  errorOnDeprecated: true,
  bail: false, // Don't stop on first failure
  maxWorkers: 1, // Run tests sequentially for clearer output
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
  },
  testMatch: [
    '**/__tests__/**/*.(test|spec).(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)',
  ],
  testPathIgnorePatterns: [
    '/__tests__/utils/test-helpers\\.utils\\.ts$',
    '/__tests__/utils/test-factories\\.ts$',
    '/__tests__/test-runner\\.ts$',
    '/__tests__backup/',
    '/node_modules/',
    '/\\.next/',
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
  testTimeout: 10000,
  transformIgnorePatterns: [
    'node_modules/(?!(jose|@next-auth|next-auth|openid-client|@auth|oauth|preact-render-to-string|preact|.*\\.mjs$))',
  ],
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },
}

module.exports = createJestConfig(config)