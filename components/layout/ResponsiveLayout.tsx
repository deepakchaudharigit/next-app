/**
 * Responsive Layout Component
 * Provides adaptive layout that works across all device sizes
 */

'use client'

import { useState, useEffect } from 'react'
import { MobileHeader } from '@/components/mobile/MobileHeader'
import { MobileNavigation } from '@/components/mobile/MobileNavigation'

interface ResponsiveLayoutProps {
  children: React.ReactNode
  title?: string
  showMobileHeader?: boolean
  showMobileNav?: boolean
  sidebar?: React.ReactNode
  header?: React.ReactNode
  className?: string
}

export function ResponsiveLayout({
  children,
  title,
  showMobileHeader = true,
  showMobileNav = true,
  sidebar,
  header,
  className = ''
}: ResponsiveLayoutProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      {isMobile && showMobileHeader && (
        <MobileHeader 
          title={title}
          actions={
            sidebar && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )
          }
        />
      )}

      {/* Desktop Header */}
      {!isMobile && header && (
        <div className="bg-white border-b border-gray-200">
          {header}
        </div>
      )}

      <div className="flex h-full">
        {/* Desktop Sidebar */}
        {!isMobile && sidebar && (
          <div className="hidden md:flex md:w-64 md:flex-col">
            <div className="flex flex-col flex-grow bg-white border-r border-gray-200 overflow-y-auto">
              {sidebar}
            </div>
          </div>
        )}

        {/* Mobile Sidebar Overlay */}
        {isMobile && sidebar && sidebarOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setSidebarOpen(false)}
            />
            
            {/* Sidebar */}
            <div className="fixed inset-y-0 left-0 w-64 bg-white z-50 transform transition-transform duration-300 ease-in-out">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {sidebar}
              </div>
            </div>
          </>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          <main 
            className={`flex-1 ${className}`}
            style={{
              paddingBottom: isMobile && showMobileNav ? '80px' : '0'
            }}
          >
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobile && showMobileNav && <MobileNavigation />}
    </div>
  )
}

// Responsive Grid Component
interface ResponsiveGridProps {
  children: React.ReactNode
  cols?: {
    default?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
  gap?: number
  className?: string
}

export function ResponsiveGrid({
  children,
  cols = { default: 1, sm: 2, md: 3, lg: 4 },
  gap = 4,
  className = ''
}: ResponsiveGridProps) {
  const gridClasses = [
    `grid`,
    `gap-${gap}`,
    cols.default && `grid-cols-${cols.default}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={gridClasses}>
      {children}
    </div>
  )
}

// Responsive Container
interface ResponsiveContainerProps {
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  padding?: boolean
  className?: string
}

export function ResponsiveContainer({
  children,
  size = 'lg',
  padding = true,
  className = ''
}: ResponsiveContainerProps) {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-full'
  }

  return (
    <div className={`
      mx-auto w-full
      ${sizeClasses[size]}
      ${padding ? 'px-4 sm:px-6 lg:px-8' : ''}
      ${className}
    `}>
      {children}
    </div>
  )
}

// Responsive Card
interface ResponsiveCardProps {
  children: React.ReactNode
  padding?: 'sm' | 'md' | 'lg'
  shadow?: boolean
  border?: boolean
  className?: string
}

export function ResponsiveCard({
  children,
  padding = 'md',
  shadow = true,
  border = true,
  className = ''
}: ResponsiveCardProps) {
  const paddingClasses = {
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8'
  }

  return (
    <div className={`
      bg-white rounded-lg
      ${paddingClasses[padding]}
      ${shadow ? 'shadow-sm hover:shadow-md transition-shadow duration-200' : ''}
      ${border ? 'border border-gray-200' : ''}
      ${className}
    `}>
      {children}
    </div>
  )
}

// Responsive Stack (Vertical layout with responsive spacing)
interface ResponsiveStackProps {
  children: React.ReactNode
  spacing?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function ResponsiveStack({
  children,
  spacing = 'md',
  className = ''
}: ResponsiveStackProps) {
  const spacingClasses = {
    sm: 'space-y-2 sm:space-y-3',
    md: 'space-y-4 sm:space-y-6',
    lg: 'space-y-6 sm:space-y-8',
    xl: 'space-y-8 sm:space-y-12'
  }

  return (
    <div className={`${spacingClasses[spacing]} ${className}`}>
      {children}
    </div>
  )
}

export default ResponsiveLayout