/**
 * Optimized Image Component
 * Provides lazy loading, responsive images, and performance optimization
 */

'use client'

import Image from 'next/image'
import { useState, useRef, useEffect } from 'react'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  quality?: number
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  sizes?: string
  fill?: boolean
  style?: React.CSSProperties
  onLoad?: () => void
  onError?: () => void
  lazy?: boolean
  responsive?: boolean
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  quality = 75,
  placeholder = 'empty',
  blurDataURL,
  sizes,
  fill = false,
  style,
  onLoad,
  onError,
  lazy = true,
  responsive = true,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isInView, setIsInView] = useState(!lazy || priority)
  const imgRef = useRef<HTMLDivElement>(null)

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || priority || isInView) return

      const observer = new IntersectionObserver((entries) => {
        const entry = entries[0]
        if (entry && entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '50px', // Start loading 50px before the image enters viewport
        threshold: 0.1
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [lazy, priority, isInView])

  const handleLoad = () => {
    setIsLoading(false)
    onLoad?.()
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
    onError?.()
  }

  // Generate responsive sizes if not provided
  const responsiveSizes = sizes || (responsive ? 
    '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw' : 
    undefined
  )

  // Generate blur placeholder if not provided
  const defaultBlurDataURL = blurDataURL || 
    'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=='

  // Error fallback component
  if (hasError) {
    return (
      <div 
        ref={imgRef}
        className={`flex items-center justify-center bg-gray-100 ${className}`}
        style={{ width, height, ...style }}
      >
        <div className="text-center text-gray-400">
          <svg className="mx-auto h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xs">Image not available</span>
        </div>
      </div>
    )
  }

  // Loading placeholder
  if (!isInView) {
    return (
      <div 
        ref={imgRef}
        className={`bg-gray-200 animate-pulse ${className}`}
        style={{ width, height, ...style }}
      />
    )
  }

  return (
    <div ref={imgRef} className={`relative ${className}`} style={style}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
        </div>
      )}
      
      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        priority={priority}
        quality={quality}
        placeholder={placeholder}
        blurDataURL={placeholder === 'blur' ? defaultBlurDataURL : undefined}
        sizes={responsiveSizes}
        className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    </div>
  )
}

// Preset configurations for common use cases
export const ImagePresets = {
  avatar: {
    width: 40,
    height: 40,
    quality: 80,
    placeholder: 'blur' as const,
    className: 'rounded-full'
  },
  
  thumbnail: {
    width: 150,
    height: 150,
    quality: 70,
    placeholder: 'blur' as const,
    className: 'rounded-lg'
  },
  
  hero: {
    fill: true,
    quality: 90,
    priority: true,
    placeholder: 'blur' as const,
    sizes: '100vw'
  },
  
  card: {
    width: 300,
    height: 200,
    quality: 75,
    placeholder: 'blur' as const,
    className: 'rounded-lg'
  }
}

// Preset components
export function AvatarImage({ src, alt, ...props }: Omit<OptimizedImageProps, 'width' | 'height'>) {
  return <OptimizedImage {...ImagePresets.avatar} src={src} alt={alt} {...props} />
}

export function ThumbnailImage({ src, alt, ...props }: Omit<OptimizedImageProps, 'width' | 'height'>) {
  return <OptimizedImage {...ImagePresets.thumbnail} src={src} alt={alt} {...props} />
}

export function HeroImage({ src, alt, ...props }: Omit<OptimizedImageProps, 'fill' | 'priority'>) {
  return <OptimizedImage {...ImagePresets.hero} src={src} alt={alt} {...props} />
}

export function CardImage({ src, alt, ...props }: Omit<OptimizedImageProps, 'width' | 'height'>) {
  return <OptimizedImage {...ImagePresets.card} src={src} alt={alt} {...props} />
}

export default OptimizedImage