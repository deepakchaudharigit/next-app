'use client'

import { useAuth } from '@/hooks/use-auth'
import { LogoutButton } from './LogoutButton'
import { signIn } from 'next-auth/react'

/**
 * Example component demonstrating NextAuth.js integration
 * Shows how to use login, logout, and session management
 */
export function AuthExample() {
  const { user, isAuthenticated, isLoading, login } = useAuth()

  const handleLogin = async () => {
    // Option 1: Use the useAuth hook (recommended for forms)
    const result = await login({
      email: 'admin@npcl.com',
      password: 'admin123'
    })
    
    if (!result.success) {
      console.error('Login failed:', result.error)
    }
  }

  const handleDirectSignIn = async () => {
    // Option 2: Use NextAuth's signIn directly
    const result = await signIn('credentials', {
      email: 'admin@npcl.com',
      password: 'admin123',
      redirect: false
    })
    
    if (result?.error) {
      console.error('Login failed:', result.error)
    }
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">NextAuth.js Integration Example</h2>
      
      {isAuthenticated && user ? (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded">
            <h3 className="font-semibold text-green-800">Authenticated User</h3>
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Role:</strong> {user.role}</p>
            <p><strong>ID:</strong> {user.id}</p>
          </div>
          
          <div className="space-x-2">
            {/* Option 1: Use the LogoutButton component */}
            <LogoutButton>Sign Out</LogoutButton>
            
            {/* Option 2: Use the useAuth hook */}
            <LogoutButton variant="link">Sign Out (Link Style)</LogoutButton>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-yellow-800">Not authenticated</p>
          </div>
          
          <div className="space-x-2">
            <button
              onClick={handleLogin}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Login with useAuth Hook
            </button>
            
            <button
              onClick={handleDirectSignIn}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Login with NextAuth signIn
            </button>
          </div>
        </div>
      )}
      
      <div className="mt-6 p-4 bg-gray-50 rounded">
        <h3 className="font-semibold mb-2">Key Features:</h3>
        <ul className="text-sm space-y-1">
          <li>✅ NextAuth.js built-in session management</li>
          <li>✅ Automatic JWT token handling</li>
          <li>✅ Secure logout with proper cleanup</li>
          <li>✅ Role-based access control</li>
          <li>✅ Audit logging for security</li>
          <li>✅ Frontend-backend session sync</li>
        </ul>
      </div>
    </div>
  )
}

export default AuthExample