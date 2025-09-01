/**
 * Dashboard Statistics Component
 * Displays key system metrics and statistics with visual indicators for NPCL Dashboard.
 */

import { useState, useEffect } from 'react'

interface DashboardStatsData {
  totalUsers: number
  totalReports: number
  recentAuditLogs: number
  voicebotCallsCount: number
  timeRange: string
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

interface DashboardStatsProps {
  timeRange?: string
}

export function DashboardStats({ timeRange = '24h' }: DashboardStatsProps) {
  const [stats, setStats] = useState<DashboardStatsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchStats()
  }, [timeRange])

  const fetchStats = async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/dashboard/stats?timeRange=${timeRange}`, {
        credentials: 'include',
      })

      const result = await response.json()

      if (result.success) {
        setStats(result.data)
      } else {
        setError(result.message || 'Failed to load dashboard stats')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="card p-6 animate-pulse">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-300 rounded-md"></div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                <div className="h-6 bg-gray-300 rounded mb-1"></div>
                <div className="h-3 bg-gray-300 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="text-center">
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={fetchStats}
            className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!stats) {
    return null
  }

  const getTimeRangeLabel = (range: string) => {
    switch (range) {
      case '1h': return 'Last Hour'
      case '24h': return 'Last 24 Hours'
      case '7d': return 'Last 7 Days'
      case '30d': return 'Last 30 Days'
      default: return 'Last 24 Hours'
    }
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers.toString(),
      subtitle: 'Registered users',
      color: 'bg-blue-500',
      icon: '👥',
    },
    {
      title: 'Reports',
      value: stats.totalReports.toString(),
      subtitle: `Generated in ${getTimeRangeLabel(stats.timeRange).toLowerCase()}`,
      color: 'bg-green-500',
      icon: '📊',
    },
    {
      title: 'Audit Logs',
      value: stats.recentAuditLogs.toString(),
      subtitle: `Activities in ${getTimeRangeLabel(stats.timeRange).toLowerCase()}`,
      color: 'bg-yellow-500',
      icon: '📝',
    },
    {
      title: 'Voicebot Calls',
      value: stats.voicebotCallsCount.toString(),
      subtitle: `Calls in ${getTimeRangeLabel(stats.timeRange).toLowerCase()}`,
      color: 'bg-purple-500',
      icon: '📞',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <div key={index} className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 ${stat.color} rounded-md flex items-center justify-center text-white text-sm`}>
                  {stat.icon}
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {stat.title}
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stat.value}
                  </dd>
                  <dd className="text-sm text-gray-500">
                    {stat.subtitle}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      {stats.recentActivity && stats.recentActivity.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {stats.recentActivity.slice(0, 5).map((activity) => (
              <div key={activity.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.user.name} performed {activity.action} on {activity.resource}
                    </p>
                    <p className="text-sm text-gray-500">
                      {activity.user.email}
                    </p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(activity.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}