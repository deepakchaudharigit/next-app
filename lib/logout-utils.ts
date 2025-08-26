/**
 * Logout Utilities
 * Client-side utilities for handling logout with proper JSON responses
 */

import { signOut } from 'next-auth/react'

export interface LogoutResponse {
  success: boolean
  message: string
}

/**
 * Performs a complete logout with proper JSON response
 * This function calls our custom logout API and then NextAuth signOut
 */
export async function performLogout(): Promise<LogoutResponse> {
  try {
    // First, call our custom logout API to clear server-side data
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Logout failed')
    }

    // Then call NextAuth signOut to clear client-side session
    // Use redirect: false to prevent automatic redirect
    await signOut({ redirect: false })

    return {
      success: true,
      message: data.message || 'Logged out successfully'
    }
  } catch (error) {
    console.error('Logout error:', error)
    
    // Even if our API fails, try to clear the client session
    try {
      await signOut({ redirect: false })
    } catch (signOutError) {
      console.error('SignOut error:', signOutError)
    }

    return {
      success: false,
      message: error instanceof Error ? error.message : 'Logout failed'
    }
  }
}

/**
 * Simple logout that only returns JSON response from our API
 * Use this when you want to handle the response manually
 */
export async function logoutAPI(): Promise<LogoutResponse> {
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Logout failed')
    }

    return data
  } catch (error) {
    console.error('Logout API error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Logout failed'
    }
  }
}