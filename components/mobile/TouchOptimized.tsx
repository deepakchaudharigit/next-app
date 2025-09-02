/**
 * Touch-Optimized Components
 * Provides touch-friendly UI components for mobile devices
 */

'use client'

import { useState, useRef, useEffect } from 'react'

// Touch-optimized button with haptic feedback
interface TouchButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  className?: string
}

export function TouchButton({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md',
  disabled = false,
  className = ''
}: TouchButtonProps) {
  const [isPressed, setIsPressed] = useState(false)

  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 select-none'
  
  const variantClasses = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 active:bg-indigo-800',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500 active:bg-gray-400',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 active:bg-red-800'
  }
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm min-h-[40px]',
    md: 'px-4 py-3 text-base min-h-[48px]',
    lg: 'px-6 py-4 text-lg min-h-[56px]'
  }
  
  const disabledClasses = 'opacity-50 cursor-not-allowed'

  const handleTouchStart = () => {
    if (!disabled) {
      setIsPressed(true)
      // Haptic feedback for supported devices
      if ('vibrate' in navigator) {
        navigator.vibrate(10)
      }
    }
  }

  const handleTouchEnd = () => {
    setIsPressed(false)
  }

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick()
    }
  }

  return (
    <button
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabled ? disabledClasses : ''}
        ${isPressed ? 'scale-95' : 'scale-100'}
        ${className}
      `}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
      onClick={handleClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

// Swipeable card component
interface SwipeableCardProps {
  children: React.ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  className?: string
}

export function SwipeableCard({ 
  children, 
  onSwipeLeft, 
  onSwipeRight, 
  className = '' 
}: SwipeableCardProps) {
  const [startX, setStartX] = useState(0)
  const [currentX, setCurrentX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      setStartX(e.touches[0].clientX)
      setCurrentX(e.touches[0].clientX)
    }
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !e.touches[0]) return
    setCurrentX(e.touches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!isDragging) return
    
    const diffX = currentX - startX
    const threshold = 100 // Minimum swipe distance
    
    if (Math.abs(diffX) > threshold) {
      if (diffX > 0 && onSwipeRight) {
        onSwipeRight()
      } else if (diffX < 0 && onSwipeLeft) {
        onSwipeLeft()
      }
    }
    
    setIsDragging(false)
    setStartX(0)
    setCurrentX(0)
  }

  const translateX = isDragging ? currentX - startX : 0

  return (
    <div
      ref={cardRef}
      className={`touch-pan-y ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: `translateX(${translateX}px)`,
        transition: isDragging ? 'none' : 'transform 0.3s ease-out'
      }}
    >
      {children}
    </div>
  )
}

// Pull-to-refresh component
interface PullToRefreshProps {
  children: React.ReactNode
  onRefresh: () => Promise<void>
  threshold?: number
}

export function PullToRefresh({ 
  children, 
  onRefresh, 
  threshold = 80 
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [startY, setStartY] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

    const handleTouchStart = (e: React.TouchEvent) => {
      if (e.touches[0]) {
        setStartY(e.touches[0].clientY)
      }
    }

    const handleTouchMove = (e: React.TouchEvent) => {
      if (!e.touches[0] || window.scrollY > 0 || isRefreshing) return
      
      const currentY = e.touches[0].clientY
      const distance = Math.max(0, currentY - startY)
    
      if (distance > 0) {
        e.preventDefault()
        setPullDistance(Math.min(distance, threshold * 1.5))
      }
  }

  const handleTouchEnd = async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true)
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
      }
    }
    setPullDistance(0)
    setStartY(0)
  }

  const refreshProgress = Math.min(pullDistance / threshold, 1)

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div 
        className="absolute top-0 left-0 right-0 flex items-center justify-center bg-gray-50 transition-all duration-200"
        style={{
          height: `${pullDistance}px`,
          transform: `translateY(-${Math.max(0, threshold - pullDistance)}px)`
        }}
      >
        {isRefreshing ? (
          <div className="flex items-center space-x-2 text-indigo-600">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
            <span className="text-sm font-medium">Refreshing...</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-gray-600">
            <svg 
              className={`h-5 w-5 transition-transform duration-200 ${
                refreshProgress >= 1 ? 'rotate-180' : ''
              }`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M19 14l-7 7m0 0l-7-7m7 7V3" 
              />
            </svg>
            <span className="text-sm font-medium">
              {refreshProgress >= 1 ? 'Release to refresh' : 'Pull to refresh'}
            </span>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div 
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: pullDistance === 0 ? 'transform 0.3s ease-out' : 'none'
        }}
      >
        {children}
      </div>
    </div>
  )
}

// Touch-optimized input with better mobile UX
interface TouchInputProps {
  label: string
  type?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  error?: string
  required?: boolean
  autoComplete?: string
}

export function TouchInput({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  required = false,
  autoComplete
}: TouchInputProps) {
  const [isFocused, setIsFocused] = useState(false)

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`
            block w-full px-4 py-3 text-base border rounded-lg
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
            transition-colors duration-200
            ${error 
              ? 'border-red-300 text-red-900 placeholder-red-300' 
              : isFocused 
                ? 'border-indigo-300' 
                : 'border-gray-300'
            }
            ${type === 'number' ? 'inputmode-numeric' : ''}
          `}
          style={{
            fontSize: '16px', // Prevents zoom on iOS
            minHeight: '48px' // Touch-friendly height
          }}
        />
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}

// Floating Action Button
interface FloatingActionButtonProps {
  onClick: () => void
  icon: React.ReactNode
  label?: string
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center'
}

export function FloatingActionButton({
  onClick,
  icon,
  label,
  position = 'bottom-right'
}: FloatingActionButtonProps) {
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'bottom-center': 'bottom-6 left-1/2 transform -translate-x-1/2'
  }

  return (
    <button
      onClick={onClick}
      className={`
        fixed ${positionClasses[position]} z-50
        w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg
        flex items-center justify-center
        hover:bg-indigo-700 active:bg-indigo-800
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
        md:hidden
      `}
      style={{
        marginBottom: 'env(safe-area-inset-bottom)'
      }}
      aria-label={label}
    >
      {icon}
    </button>
  )
}