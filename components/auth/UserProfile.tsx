'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { getRoleDisplayName, getRoleDescription } from '@lib/rbac.client'
import { UserRole } from '@prisma/client'

interface ProfileData {
  id: string
  name: string
  email: string
  role: UserRole
  createdAt: string
  updatedAt: string
  _count: {
    auditLogs: number
    reports: number
  }
}

export function UserProfile() {
  const { user, logout, isLoading: authLoading, updateSession } = useAuth()
  const [showDetails, setShowDetails] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [editName, setEditName] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (user && showDetails) {
      fetchProfile()
    }
  }, [user, showDetails])

  const fetchProfile = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/auth/profile', {
        credentials: 'include',
      })
      
      const result = await response.json()
      
      if (result.success) {
        setProfileData(result.data)
      } else {
        setError(result.message || 'Failed to load profile')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditProfile = () => {
    setEditName(user?.name || '')
    setShowEditModal(true)
  }

  const handleUpdateProfile = async () => {
    if (!editName.trim()) {
      setError('Name is required')
      return
    }

    setIsUpdating(true)
    setError('')

    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: editName.trim(),
        }),
      })

      const result = await response.json()

      if (result.success) {
        setShowEditModal(false)
        // Update the session to reflect the new name
        await updateSession()
        // Refresh profile data
        if (showDetails) {
          await fetchProfile()
        }
      } else {
        setError(result.message || 'Failed to update profile')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <>
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <div className="h-12 w-12 rounded-full bg-indigo-600 flex items-center justify-center">
              <span className="text-white font-medium text-lg">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-medium text-gray-900 truncate">
              {user.name}
            </h3>
            <p className="text-sm text-gray-500 truncate">
              {user.email}
            </p>
            <div className="flex items-center mt-1">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                user.role === 'ADMIN' 
                  ? 'bg-red-100 text-red-800'
                  : user.role === 'OPERATOR'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                {getRoleDisplayName(user.role)}
              </span>
            </div>
          </div>

          <div className="flex-shrink-0">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
            </button>
          </div>
        </div>

        {showDetails && (
          <div className="mt-6 border-t border-gray-200 pt-6">
            {isLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Loading profile...</p>
              </div>
            ) : error ? (
              <div className="text-center py-4">
                <p className="text-red-600 text-sm">{error}</p>
                <button
                  onClick={fetchProfile}
                  className="mt-2 text-sm text-indigo-600 hover:text-indigo-500"
                >
                  Try Again
                </button>
              </div>
            ) : profileData ? (
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Role</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {getRoleDisplayName(profileData.role)}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">User ID</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-mono">
                    {profileData.id}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">Member Since</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(profileData.createdAt).toLocaleDateString()}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(profileData.updatedAt).toLocaleDateString()}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">Audit Logs</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {profileData._count.auditLogs} entries
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">Reports</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {profileData._count.reports} created
                  </dd>
                </div>
                
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Permissions</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {getRoleDescription(profileData.role)}
                  </dd>
                </div>
              </dl>
            ) : null}

            <div className="mt-6 flex space-x-3">
              <button
                onClick={handleEditProfile}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Edit Profile
              </button>
              
              <button
                onClick={logout}
                disabled={authLoading}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                {authLoading ? 'Signing out...' : 'Sign Out'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Profile</h3>
              
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="mb-4">
                <label htmlFor="editName" className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  id="editName"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter your name"
                  disabled={isUpdating}
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleUpdateProfile}
                  disabled={isUpdating}
                  className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {isUpdating ? 'Updating...' : 'Update'}
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setError('')
                  }}
                  disabled={isUpdating}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}