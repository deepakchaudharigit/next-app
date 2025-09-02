/**
 * Authentication Hook
 * Custom React hook providing authentication state, login/logout functions, and role-based permission checking for NPCL Dashboard.
 */

'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { UserRole } from '@prisma/client'
import { hasPermission, Permission, checkUserPermission } from '@lib/rbac.client'
import { useState, useCallback } from 'react'

export function useAuth() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const user = session?.user

  const login = useCallback(async (credentials: { email: string; password: string }) => {
    setIsLoading(true)
    try {
      const result = await signIn('credentials', {
        email: credentials.email,
        password: credentials.password,
        redirect: false,
      })

      if (result?.error) {
        throw new Error(result.error)
      }

      if (result?.ok) {
        router.push('/dashboard')
        return { success: true }
      }

      throw new Error('Login failed')
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed'
      }
    } finally {
      setIsLoading(false)
    }
  }, [router])

  const logout = useCallback(async () => {
    setIsLoading(true)
    try {
      // Use NextAuth's built-in signOut with redirect to login page
      await signOut({ 
        callbackUrl: '/auth/login',
        redirect: true 
      })
      return { success: true, message: 'Logged out successfully' }
    } catch (error) {
      console.error('Logout error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Logout failed'
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const hasRole = useCallback((role: UserRole): boolean => {
    return user?.role === role
  }, [user?.role])

  const hasAnyRole = useCallback((roles: UserRole[]): boolean => {
    return user?.role ? roles.includes(user.role) : false
  }, [user?.role])

  const hasPermissionCheck = useCallback((permission: Permission): boolean => {
    return checkUserPermission(user?.role, permission)
  }, [user?.role])

  const isAdmin = hasRole(UserRole.ADMIN)
  const isOperator = hasRole(UserRole.OPERATOR)
  const isViewer = hasRole(UserRole.VIEWER)
  const isOperatorOrAdmin = hasAnyRole([UserRole.OPERATOR, UserRole.ADMIN])

  return {
    // Session data
    user,
    session,
    status,
    isLoading: status === 'loading' || isLoading,
    isAuthenticated: status === 'authenticated',
    isUnauthenticated: status === 'unauthenticated',

    // Auth actions
    login,
    logout,
    updateSession: update,

    // Role checks
    hasRole,
    hasAnyRole,
    hasPermission: hasPermissionCheck,
    isAdmin,
    isOperator,
    isViewer,
    isOperatorOrAdmin,

    // Utility functions
    requireAuth: () => {
      if (status === 'unauthenticated') {
        router.push('/auth/login')
        return false
      }
      return true
    },

    requireRole: (role: UserRole) => {
      if (!hasRole(role)) {
        router.push('/dashboard?error=insufficient-permissions')
        return false
      }
      return true
    },

    requirePermission: (permission: Permission) => {
      if (!hasPermissionCheck(permission)) {
        router.push('/dashboard?error=insufficient-permissions')
        return false
      }
      return true
    },
  }
}

export function useRequireAuth() {
  const auth = useAuth()
  
  if (auth.status === 'loading') {
    return { ...auth, isLoading: true }
  }

  if (auth.status === 'unauthenticated') {
    auth.requireAuth()
  }

  return auth
}

export function useRequireRole(role: UserRole) {
  const auth = useRequireAuth()
  
  if (auth.isAuthenticated && !auth.hasRole(role)) {
    auth.requireRole(role)
  }

  return auth
}

export function useRequirePermission(permission: Permission) {
  const auth = useRequireAuth()
  
  if (auth.isAuthenticated && !auth.hasPermission(permission)) {
    auth.requirePermission(permission)
  }

  return auth
}