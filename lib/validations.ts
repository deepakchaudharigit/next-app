/**
 * Validation Schemas
 * Zod schemas for input validation, form handling, and data sanitization across NPCL Dashboard authentication and user management.
 */

import { z } from 'zod'
import { UserRole } from '@prisma/client'

// User authentication and management validation schemas

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const registerSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .transform(val => val.trim()),
  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters')
    .transform(val => val.trim().toLowerCase())
    .refine(val => val.includes('@'), 'Email must contain @ symbol')
    .refine(val => !val.includes('..'), 'Email cannot contain consecutive dots'),
  password: z.string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
  role: z.nativeEnum(UserRole)
    .optional()
    .default(UserRole.VIEWER)
    .refine(
      role => Object.values(UserRole).includes(role || UserRole.VIEWER),
      'Invalid role specified',
    ),
})

export const updateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  role: z.enum(['ADMIN', 'OPERATOR', 'VIEWER']).optional(),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})


export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(6, 'New password is required'),
  confirmNewPassword: z.string().min(6, 'Please confirm your new password'),
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: 'Passwords do not match',
  path: ['confirmNewPassword'],
})



export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmNewPassword: z.string().min(8, 'Please confirm your new password'),
})


// API Query parameter validation schemas

export const voicebotCallsQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 10),
  language: z.string().optional(),
  cli: z.string().optional(),
  callResolutionStatus: z.string().optional(),
  durationMin: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
  durationMax: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
  dateFrom: z.string().optional().refine(val => !val || !isNaN(Date.parse(val)), 'Invalid date format'),
  dateTo: z.string().optional().refine(val => !val || !isNaN(Date.parse(val)), 'Invalid date format'),
})

export const userIdParamsSchema = z.object({
  id: z.string().min(1, 'User ID is required'),
})

export const reportIdParamsSchema = z.object({
  id: z.string().min(1, 'Report ID is required'),
})

// Dashboard stats query schema
export const dashboardStatsQuerySchema = z.object({
  timeRange: z.enum(['1h', '24h', '7d', '30d']).optional().default('24h'),
  includeOffline: z.string().optional().transform(val => val === 'true'),
})

// TypeScript type inference from Zod schemas

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type VoicebotCallsQueryInput = z.infer<typeof voicebotCallsQuerySchema>
export type UserIdParamsInput = z.infer<typeof userIdParamsSchema>
export type ReportIdParamsInput = z.infer<typeof reportIdParamsSchema>
export type DashboardStatsQueryInput = z.infer<typeof dashboardStatsQuerySchema>

