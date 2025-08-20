/**
 * Authentication Utilities
 * Provides password hashing, verification, and token generation functions for user authentication in NPCL Dashboard.
 */

import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { User } from '@prisma/client'
import { authConfig } from '@config/auth'

// Legacy JWT interface removed - NextAuth.js handles all token management

export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, authConfig.bcrypt.saltRounds)
}

export const verifyPassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword)
}

// Legacy JWT functions - deprecated in favor of NextAuth.js session management
// These functions are kept for backward compatibility but throw deprecation errors

/**
 * @deprecated Use NextAuth.js session management instead.
 */
export const generateToken = (user: Pick<User, 'id' | 'email' | 'role'>): never => {
  throw new Error('generateToken is deprecated. Use NextAuth.js session management instead.')
}

/**
 * @deprecated Use NextAuth.js session management instead.
 */
export const verifyToken = (token: string): never => {
  throw new Error('verifyToken is deprecated. Use NextAuth.js session management instead.')
}

/**
 * @deprecated Use NextAuth.js session management instead.
 */
export const extractTokenFromHeader = (authHeader: string): never => {
  throw new Error('extractTokenFromHeader is deprecated. Use NextAuth.js session management instead.')
}

// All authentication now goes through NextAuth.js

// Password reset token generation and hashing utilities
export const generateResetToken = (): string => {
  return crypto.randomBytes(32).toString('hex')
}

export const hashResetToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex')
}

// Re-export NextAuth configuration for convenience
export { authOptions } from '@lib/nextauth'
