/**
 * Client-Side Role-Based Access Control Utilities
 * Safe to use in client components and browser code
 * Does not import server-side dependencies
 */

import { UserRole } from '@prisma/client'

// Permission definitions (same as server-side)
export const permissions = {
  // User management
  'users.view': [UserRole.ADMIN],
  'users.create': [UserRole.ADMIN],
  'users.update': [UserRole.ADMIN],
  'users.delete': [UserRole.ADMIN],

  // Power units
  'power-units.view': [UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER],
  'power-units.create': [UserRole.ADMIN, UserRole.OPERATOR],
  'power-units.update': [UserRole.ADMIN, UserRole.OPERATOR],
  'power-units.delete': [UserRole.ADMIN],

  // Maintenance
  'maintenance.view': [UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER],
  'maintenance.create': [UserRole.ADMIN, UserRole.OPERATOR],
  'maintenance.update': [UserRole.ADMIN, UserRole.OPERATOR],
  'maintenance.delete': [UserRole.ADMIN, UserRole.OPERATOR],

  // Reports
  'reports.view': [UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER],
  'reports.create': [UserRole.ADMIN, UserRole.OPERATOR],
  'reports.delete': [UserRole.ADMIN],

  // System configuration
  'system.config': [UserRole.ADMIN],
  'system.audit': [UserRole.ADMIN],

  // Dashboard
  'dashboard.view': [UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER],
  'dashboard.admin': [UserRole.ADMIN],
} as const

export type Permission = keyof typeof permissions

/**
 * Check if a user role has a specific permission
 */
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  // Handle invalid permissions gracefully
  if (!permissions[permission]) {
    return false
  }
  return [...permissions[permission]].includes(userRole)
}

/**
 * Check if a user role has any of the specified permissions
 */
export function hasAnyPermission(userRole: UserRole, permissionList: Permission[]): boolean {
  return permissionList.some(permission => hasPermission(userRole, permission))
}

/**
 * Check if a user role has all of the specified permissions
 */
export function hasAllPermissions(userRole: UserRole, permissionList: Permission[]): boolean {
  return permissionList.every(permission => hasPermission(userRole, permission))
}

/**
 * Client-side hook for checking permissions (to be used with useSession)
 */
export function checkUserPermission(userRole: UserRole | undefined, permission: Permission): boolean {
  if (!userRole) return false
  return hasPermission(userRole, permission)
}

/**
 * Role hierarchy helper
 */
export const roleHierarchy = {
  [UserRole.VIEWER]: 1,
  [UserRole.OPERATOR]: 2,
  [UserRole.ADMIN]: 3,
}

/**
 * Check if a role has higher or equal level than another role
 */
export function hasRoleLevel(userRole: UserRole, requiredRole: UserRole): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

/**
 * Get user role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  switch (role) {
    case UserRole.ADMIN:
      return 'Administrator'
    case UserRole.OPERATOR:
      return 'Operator'
    case UserRole.VIEWER:
      return 'Viewer'
    default:
      return 'Unknown'
  }
}

/**
 * Get user role description
 */
export function getRoleDescription(role: UserRole): string {
  switch (role) {
    case UserRole.ADMIN:
      return 'Full system access including user management and system configuration'
    case UserRole.OPERATOR:
      return 'Can manage power units, maintenance, and generate reports'
    case UserRole.VIEWER:
      return 'Read-only access to dashboard and reports'
    default:
      return 'No description available'
  }
}

/**
 * Get available roles for user creation (based on current user role)
 */
export function getAvailableRoles(currentUserRole: UserRole): UserRole[] {
  switch (currentUserRole) {
    case UserRole.ADMIN:
      return [UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER]
    case UserRole.OPERATOR:
      return [UserRole.VIEWER] // Operators can only create viewers
    default:
      return [] // Viewers cannot create users
  }
}