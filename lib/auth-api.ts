/**
 * Authentication API Utilities
 * Client-side utilities for handling authentication with proper JSON responses
 */

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  success: boolean
  message: string
  user?: {
    id: string
    name: string
    email: string
    role: string
  }
  errors?: Array<{
    code: string
    message: string
    path: string[]
  }>
}

export interface LogoutResponse {
  success: boolean
  message: string
}

export interface SessionResponse {
  success: boolean
  message: string
  authenticated: boolean
  user?: {
    id: string
    name: string
    email: string
    role: string
  }
}

/**
 * Login with email and password - returns JSON response
 */
export async function loginAPI(credentials: LoginRequest): Promise<LoginResponse> {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Login failed',
        errors: data.errors,
      }
    }

    return data
  } catch (error) {
    console.error('Login API error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Login failed'
    }
  }
}

/**
 * Logout - returns JSON response
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
      return {
        success: false,
        message: data.message || 'Logout failed'
      }
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

/**
 * Check current session status - returns JSON response
 */
export async function getSessionAPI(): Promise<SessionResponse> {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    return data
  } catch (error) {
    console.error('Session API error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Session check failed',
      authenticated: false,
    }
  }
}

/**
 * Combined login function that works with both NextAuth and our API
 */
export async function performLogin(credentials: LoginRequest): Promise<LoginResponse> {
  // First try our custom API
  const apiResult = await loginAPI(credentials)
  
  if (apiResult.success) {
    // If API login succeeds, also sign in with NextAuth for compatibility
    try {
      const { signIn } = await import('next-auth/react')
      const nextAuthResult = await signIn('credentials', {
        email: credentials.email,
        password: credentials.password,
        redirect: false,
      })
      
      if (nextAuthResult?.error) {
        console.warn('NextAuth signin failed after API success:', nextAuthResult.error)
      }
    } catch (error) {
      console.warn('NextAuth signin error:', error)
    }
  }
  
  return apiResult
}

/**
 * Combined logout function that works with both NextAuth and our API
 */
export async function performLogout(): Promise<LogoutResponse> {
  try {
    // First call our API
    const apiResult = await logoutAPI()
    
    // Then call NextAuth signOut for compatibility
    try {
      const { signOut } = await import('next-auth/react')
      await signOut({ redirect: false })
    } catch (error) {
      console.warn('NextAuth signOut error:', error)
    }
    
    return apiResult
  } catch (error) {
    console.error('Combined logout error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Logout failed'
    }
  }
}