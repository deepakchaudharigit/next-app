'use client'

import { signOut } from 'next-auth/react'
import { useState } from 'react'

interface LogoutButtonProps {
  children?: React.ReactNode
  className?: string
  variant?: 'button' | 'link'
  callbackUrl?: string
}

export function LogoutButton({ 
  children = 'Sign Out', 
  className = '',
  variant = 'button',
  callbackUrl = '/auth/login'
}: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      await signOut({ 
        callbackUrl,
        redirect: true 
      })
    } catch (error) {
      console.error('Logout error:', error)
      setIsLoading(false)
    }
  }

  const baseClasses = variant === 'button' 
    ? 'inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50'
    : 'text-sm text-red-600 hover:text-red-500 focus:outline-none focus:underline'

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className={`${baseClasses} ${className}`}
    >
      {isLoading ? 'Signing out...' : children}
    </button>
  )
}

export default LogoutButton