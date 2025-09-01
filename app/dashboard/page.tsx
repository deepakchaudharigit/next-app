'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { UserProfile } from '@/components/auth/UserProfile'
import { DashboardStats } from '@/components/dashboard/DashboardStats'
import { RoleGuard, AdminOnly, OperatorOrAdmin } from '@/components/auth/RoleGuard'
import { UserRoleEnum } from '@/lib/constants/roles'
import type { Permission } from '@lib/rbac.client'

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const [timeRange, setTimeRange] = useState('24h')

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">Please sign in to access the dashboard.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              NPCL Power Management Dashboard
            </h1>
            <p className="text-gray-600">
              Welcome back, {user?.name}! Here's your system overview.
            </p>
          </div>
        </div>

        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* User Profile */}
            <div className="lg:col-span-1">
              <UserProfile />
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Time Range Selector */}
              <div className="bg-white shadow rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Dashboard Overview</h3>
                  <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="1h">Last Hour</option>
                    <option value="24h">Last 24 Hours</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                  </select>
                </div>
              </div>

              {/* Dashboard Stats */}
              <DashboardStats timeRange={timeRange} />

              {/* Role-based content */}
              <AdminOnly>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-red-800 mb-2">
                    Administrator Panel
                  </h3>
                  <p className="text-red-700 text-sm">
                    You have full administrative access to the system.
                  </p>
                  <div className="mt-3">
                    <button className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700">
                      Manage Users
                    </button>
                  </div>
                </div>
              </AdminOnly>

              <OperatorOrAdmin>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-yellow-800 mb-2">
                    Operator Controls
                  </h3>
                  <p className="text-yellow-700 text-sm">
                    You can manage power units and maintenance schedules.
                  </p>
                  <div className="mt-3 space-x-2">
                    <button className="bg-yellow-600 text-white px-4 py-2 rounded-md text-sm hover:bg-yellow-700">
                      Manage Power Units
                    </button>
                    <button className="bg-yellow-600 text-white px-4 py-2 rounded-md text-sm hover:bg-yellow-700">
                      Schedule Maintenance
                    </button>
                  </div>
                </div>
              </OperatorOrAdmin>

              {/* Permission-based content */}
              <RoleGuard requiredPermission={"reports.view" as Permission}>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-blue-800 mb-2">
                    Reports & Analytics
                  </h3>
                  <p className="text-blue-700 text-sm">
                    View system reports and performance analytics.
                  </p>
                  <div className="mt-3">
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700">
                      View Reports
                    </button>
                  </div>
                </div>
              </RoleGuard>

              {/* Role-specific features */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Available Features
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">View Dashboard</span>
                    <span className="text-green-600 text-sm">✓ Available</span>
                  </div>
                  
                  <RoleGuard 
                    allowedRoles={[UserRoleEnum.OPERATOR, UserRoleEnum.ADMIN]}
                    fallback={
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Manage Power Units</span>
                        <span className="text-red-600 text-sm">✗ Restricted</span>
                      </div>
                    }
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Manage Power Units</span>
                      <span className="text-green-600 text-sm">✓ Available</span>
                    </div>
                  </RoleGuard>

                  <AdminOnly
                    fallback={
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">User Management</span>
                        <span className="text-red-600 text-sm">✗ Admin Only</span>
                      </div>
                    }
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">User Management</span>
                      <span className="text-green-600 text-sm">✓ Available</span>
                    </div>
                  </AdminOnly>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}