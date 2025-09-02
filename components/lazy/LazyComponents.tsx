/**
 * Lazy Loading Components
 * Implements React.lazy for code splitting and performance optimization
 */

import { lazy, Suspense, ComponentType } from 'react'
// import { ErrorBoundary } from 'react-error-boundary'
// Using React's built-in error boundary instead
import { Component, ReactNode, ErrorInfo } from 'react'

// Simple Error Boundary component
class ErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Lazy component error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

// Loading component
export function LoadingSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="flex items-center space-x-3">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
        <span className="text-gray-600">{message}</span>
      </div>
    </div>
  )
}

// Error fallback component
function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <div className="text-red-600 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Something went wrong</h3>
        <p className="text-gray-600 mb-4">{error.message}</p>
        <button
          onClick={resetErrorBoundary}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          Try again
        </button>
      </div>
    </div>
  )
}

// Higher-order component for lazy loading with error boundary
export function withLazyLoading<P extends object>(
  Component: ComponentType<P>,
  loadingMessage?: string
) {
  return function LazyWrapper(props: P) {
    return (
      <ErrorBoundary fallback={<ErrorFallback error={new Error('Component failed to load')} resetErrorBoundary={() => window.location.reload()} />}>
        <Suspense fallback={<LoadingSpinner message={loadingMessage} />}>
          <Component {...props} />
        </Suspense>
      </ErrorBoundary>
    )
  }
}

// Lazy loaded dashboard components
export const LazyDashboardStats = lazy(() => 
  import('../dashboard/DashboardStats').then(module => ({
    default: module.DashboardStats
  }))
)

export const LazyUserProfile = lazy(() => 
  import('../auth/UserProfile').then(module => ({
    default: module.UserProfile
  }))
)

export const LazyDashboardLayout = lazy(() => 
  import('../dashboard/DashboardLayout').then(module => ({
    default: module.DashboardLayout
  }))
)

export const LazyLoginForm = lazy(() => 
  import('../auth/LoginForm').then(module => ({
    default: module.LoginForm
  }))
)

export const LazyRegisterForm = lazy(() => 
  import('../auth/RegisterForm').then(module => ({
    default: module.RegisterForm
  }))
)

// Lazy loaded page components
// Report Detail Page - using a placeholder since dynamic routes can't be lazy loaded this way
export const LazyReportDetailPage = lazy(() =>
  Promise.resolve({
    default: () => (
      <div className="p-4">
        <h1>Report Detail</h1>
        <p>Report detail component placeholder</p>
      </div>
    )
  })
)

// Wrapped components with loading states
export const DashboardStatsLazy = withLazyLoading(LazyDashboardStats, 'Loading dashboard statistics...')
export const UserProfileLazy = withLazyLoading(LazyUserProfile, 'Loading user profile...')
export const DashboardLayoutLazy = withLazyLoading(LazyDashboardLayout, 'Loading dashboard...')
export const LoginFormLazy = withLazyLoading(LazyLoginForm, 'Loading login form...')
export const RegisterFormLazy = withLazyLoading(LazyRegisterForm, 'Loading registration form...')

// Preload functions for critical components
export const preloadComponents = {
  dashboardStats: () => import('../dashboard/DashboardStats'),
  userProfile: () => import('../auth/UserProfile'),
  loginForm: () => import('../auth/LoginForm'),
  registerForm: () => import('../auth/RegisterForm'),
}

// Preload critical components on user interaction
export function preloadCriticalComponents() {
  // Preload dashboard stats when user hovers over dashboard link
  const dashboardLinks = document.querySelectorAll('[href*="/dashboard"]')
  dashboardLinks.forEach(link => {
    link.addEventListener('mouseenter', () => {
      preloadComponents.dashboardStats()
    }, { once: true })
  })

  // Preload auth forms when user hovers over auth links
  const authLinks = document.querySelectorAll('[href*="/auth"]')
  authLinks.forEach(link => {
    link.addEventListener('mouseenter', () => {
      preloadComponents.loginForm()
      preloadComponents.registerForm()
    }, { once: true })
  })

  // Preload user profile when user hovers over profile link
  const profileLinks = document.querySelectorAll('[href*="/profile"]')
  profileLinks.forEach(link => {
    link.addEventListener('mouseenter', () => {
      preloadComponents.userProfile()
    }, { once: true })
  })
}

// Initialize preloading on component mount
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', preloadCriticalComponents)
  } else {
    preloadCriticalComponents()
  }
}

export default {
  DashboardStatsLazy,
  UserProfileLazy,
  DashboardLayoutLazy,
  LoginFormLazy,
  RegisterFormLazy,
  withLazyLoading,
  preloadComponents,
  preloadCriticalComponents
}