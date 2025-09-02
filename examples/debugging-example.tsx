/**
 * Debugging Example Component
 * Demonstrates how to use the debugging utilities in your components
 */

'use client'

import { useState, useEffect } from 'react'
import { useDebug, debug } from '@/lib/debug'

interface User {
  id: string
  name: string
  email: string
}

export function DebuggingExample() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Initialize component debugging
  const componentDebug = useDebug('DebuggingExample')

  useEffect(() => {
    componentDebug.component.mount({ initialUsers: users.length })
    
    return () => {
      componentDebug.component.unmount()
    }
  }, [])

  const fetchUsers = async () => {
    // Start a performance timer
    const timer = componentDebug.timer('fetchUsers')
    
    setLoading(true)
    setError(null)
    
    try {
      // Debug API request
      debug.api.request('/api/users', { method: 'GET' })
      
      const response = await fetch('/api/users')
      const data = await response.json()
      
      // Debug API response
      debug.api.response('/api/users', response, data)
      
      if (data.success) {
        setUsers(data.users)
        componentDebug.log('Users fetched successfully', { count: data.users.length })
      } else {
        throw new Error(data.message || 'Failed to fetch users')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      
      // Debug API error
      debug.api.error('/api/users', err as Error)
      componentDebug.log('Error fetching users', { error: errorMessage })
    } finally {
      setLoading(false)
      timer.end('User fetch completed')
    }
  }

  const handleUserClick = (user: User) => {
    // Debug user interaction
    componentDebug.log('User clicked', { userId: user.id, userName: user.name })
    
    // Conditional debugging - only log for admin users
    debug.if(
      user.email.includes('admin'), 
      'ADMIN_ACTION', 
      'Admin user clicked', 
      user
    )
  }

  // Debug render
  componentDebug.component.render({ 
    usersCount: users.length, 
    loading, 
    hasError: !!error 
  })

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Debugging Example</h2>
      
      <div className="mb-4">
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Fetch Users'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
          Error: {error}
        </div>
      )}

      <div className="space-y-2">
        {users.map((user) => (
          <div
            key={user.id}
            onClick={() => handleUserClick(user)}
            className="p-3 border rounded cursor-pointer hover:bg-gray-50"
          >
            <div className="font-medium">{user.name}</div>
            <div className="text-sm text-gray-600">{user.email}</div>
          </div>
        ))}
      </div>

      {/* Debug Info Panel (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-6 p-4 bg-gray-50 rounded">
          <h3 className="font-semibold mb-2">Debug Info</h3>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(debug.info(), null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

// Example of debugging a custom hook
export function useUserData(userId: string) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  
  const hookDebug = useDebug('useUserData')

  useEffect(() => {
    if (!userId) {
      hookDebug.log('No userId provided')
      return
    }

    const fetchUser = async () => {
      const timer = hookDebug.timer('fetchUser')
      setLoading(true)
      
      try {
        hookDebug.log('Fetching user', { userId })
        
        const response = await fetch(`/api/users/${userId}`)
        const data = await response.json()
        
        if (data.success) {
          setUser(data.user)
          hookDebug.log('User fetched', data.user)
        } else {
          throw new Error(data.message)
        }
      } catch (error) {
        hookDebug.log('Error fetching user', { error })
      } finally {
        setLoading(false)
        timer.end()
      }
    }

    fetchUser()
  }, [userId, hookDebug])

  return { user, loading }
}

export default DebuggingExample