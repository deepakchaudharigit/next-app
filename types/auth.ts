/**
 * Authentication and Authorization Types
 * These types are used in middleware and other edge runtime contexts
 * where Prisma client cannot be imported.
 */

export enum UserRole {
  ADMIN = 'ADMIN',
  OPERATOR = 'OPERATOR',
  VIEWER = 'VIEWER'
}

export enum EquipmentStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  MAINTENANCE = 'MAINTENANCE',
  ERROR = 'ERROR'
}

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
}

export interface AuthToken {
  id: string
  email: string
  name: string
  role: UserRole
  iat?: number
  exp?: number
}

export interface SessionUser {
  id: string
  name: string
  email: string
  role: UserRole
}