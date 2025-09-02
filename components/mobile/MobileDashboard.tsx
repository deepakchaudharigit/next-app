/**
 * Mobile-Optimized Dashboard Component
 * Provides touch-friendly dashboard interface for mobile devices
 */

'use client'

import { useState, useEffect } from 'react'
import { ResponsiveLayout, ResponsiveGrid, ResponsiveCard } from '@/components/layout/ResponsiveLayout'
import { TouchButton, PullToRefresh, FloatingActionButton } from '@/components/mobile/TouchOptimized'
import { DashboardStatsLazy } from '@/components/lazy/LazyComponents'
import { OptimizedImage } from '@/components/ui/OptimizedImage'

interface DashboardData {
  totalUsers: number
  totalReports: number
  recentAuditLogs: number
  voicebotCallsCount: number
  recentActivity: Array<{
    id: string
    action: string
    resource: string
    timestamp: string
    user: {
      name: string
      email: string
    }
  }>
}

export function MobileDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [timeRange, setTimeRange] = useState('24h')

  useEffect(() => {
    loadDashboardData()
  }, [timeRange])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/dashboard/stats?timeRange=${timeRange}`)
      const data = await response.json()
      
      if (data.success) {
        setDashboardData(data.data)
        setLastRefresh(new Date())
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    await loadDashboardData()
  }

  const handleQuickAction = () => {
    // Navigate to reports or show quick action menu
    window.location.href = '/reports'
  }

  const timeRangeOptions = [
    { value: '1h', label: '1 Hour' },
    { value: '24h', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' }
  ]

  return (
    <ResponsiveLayout 
      title="Dashboard"
      showMobileHeader={true}
      showMobileNav={true}
    >
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="space-y-4 pb-4">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
            <div className="px-4 py-6 sm:px-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">Welcome Back!</h1>
                  <p className="text-indigo-100 mt-1">
                    Last updated: {lastRefresh.toLocaleTimeString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Time Range Selector */}
          <div className="px-4">
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {timeRangeOptions.map((option) => (
                <TouchButton
                  key={option.value}
                  onClick={() => setTimeRange(option.value)}
                  variant={timeRange === option.value ? 'primary' : 'secondary'}
                  size="sm"
                  className="whitespace-nowrap flex-shrink-0"
                >
                  {option.label}
                </TouchButton>
              ))}
            </div>
          </div>

          {/* Stats Grid */}
          {isLoading ? (
            <div className="px-4">
              <ResponsiveGrid cols={{ default: 2, sm: 2, md: 4 }}>
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </ResponsiveGrid>
            </div>
          ) : dashboardData ? (
            <div className="px-4">
              <ResponsiveGrid cols={{ default: 2, sm: 2, md: 4 }}>
                <StatCard
                  title="Total Users"
                  value={dashboardData.totalUsers}
                  icon="👥"
                  color="blue"
                />
                <StatCard
                  title="Reports"
                  value={dashboardData.totalReports}
                  icon="📊"
                  color="green"
                />
                <StatCard
                  title="Audit Logs"
                  value={dashboardData.recentAuditLogs}
                  icon="🔍"
                  color="yellow"
                />
                <StatCard
                  title="Voice Calls"
                  value={dashboardData.voicebotCallsCount}
                  icon="📞"
                  color="purple"
                />
              </ResponsiveGrid>
            </div>
          ) : null}

          {/* Quick Actions */}
          <div className="px-4">
            <ResponsiveCard>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <TouchButton
                  onClick={() => window.location.href = '/reports'}
                  variant="secondary"
                  className="flex flex-col items-center py-4"
                >
                  <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  View Reports
                </TouchButton>
                
                <TouchButton
                  onClick={() => window.location.href = '/auth/profile'}
                  variant="secondary"
                  className="flex flex-col items-center py-4"
                >
                  <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Profile
                </TouchButton>
              </div>
            </ResponsiveCard>
          </div>

          {/* Recent Activity */}
          {dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 && (
            <div className="px-4">
              <ResponsiveCard>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                  <TouchButton
                    onClick={() => window.location.href = '/activity'}
                    variant="secondary"
                    size="sm"
                  >
                    View All
                  </TouchButton>
                </div>
                
                <div className="space-y-3">
                  {dashboardData.recentActivity.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-indigo-600 font-medium text-sm">
                          {activity.user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {activity.action}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {activity.user.name} • {new Date(activity.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ResponsiveCard>
            </div>
          )}

          {/* Performance Metrics */}
          <div className="px-4">
            <DashboardStatsLazy timeRange={timeRange} />
          </div>
        </div>
      </PullToRefresh>

      {/* Floating Action Button */}
      <FloatingActionButton
        onClick={handleQuickAction}
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        }
        label="Quick Action"
      />
    </ResponsiveLayout>
  )
}

// Stat Card Component
interface StatCardProps {
  title: string
  value: number
  icon: string
  color: 'blue' | 'green' | 'yellow' | 'purple'
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600'
  }

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 truncate">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {value.toLocaleString()}
          </p>
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <span className="text-lg">{icon}</span>
        </div>
      </div>
    </div>
  )
}

export default MobileDashboard