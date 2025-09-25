'use client'

import { useState, useRef, useEffect } from 'react'
import { Loader2 } from 'lucide-react'

interface LazyImageProps {
  src: string
  alt: string
  className?: string
  placeholder?: string
  onLoad?: () => void
  onError?: () => void
  width?: number
  height?: number
  priority?: boolean
}

export function LazyImage({
  src,
  alt,
  className = '',
  placeholder,
  onLoad,
  onError,
  width,
  height,
  priority = false
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(priority)
  const [hasError, setHasError] = useState(false)
  const [imageSrc, setImageSrc] = useState<string | null>(priority ? src : null)
  const [loadTimeout, setLoadTimeout] = useState(false)
  const imgRef = useRef<HTMLDivElement>(null)

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || isInView) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            setImageSrc(src)
            observer.unobserve(entry.target)
          }
        })
      },
      {
        rootMargin: '50px 0px', // Start loading 50px before the image comes into view
        threshold: 0.1
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current)
      }
    }
  }, [src, priority, isInView])

  // Timeout effect to prevent infinite loading
  useEffect(() => {
    if (!imageSrc || isLoaded || hasError) return

    const timeout = setTimeout(() => {
      console.warn('⚠️ Image load timeout for:', src)
      setLoadTimeout(true)
      setHasError(true)
    }, 10000) // 10 second timeout

    return () => clearTimeout(timeout)
  }, [imageSrc, isLoaded, hasError, src])

  // Handle image load
  const handleLoad = () => {
    setIsLoaded(true)
    setHasError(false)
    onLoad?.()
  }

  // Handle image error
  const handleError = () => {
    setHasError(true)
    setIsLoaded(false)
    onError?.()
  }

  // Generate placeholder
  const generatePlaceholder = () => {
    if (placeholder) return placeholder
    
    // Create a simple SVG placeholder
    const svg = `
      <svg width="${width || 200}" height="${height || 200}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial, sans-serif" font-size="12" fill="#9ca3af">
          Loading...
        </text>
      </svg>
    `
    return `data:image/svg+xml;base64,${btoa(svg)}`
  }

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
    >
      {/* Loading state */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center text-gray-500">
            <div className="text-sm">{loadTimeout ? 'Load timeout' : 'Failed to load'}</div>
            <div className="text-xs">{loadTimeout ? 'Image took too long' : 'Image Error'}</div>
          </div>
        </div>
      )}

      {/* Actual image */}
      {imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } w-full h-full object-cover`}
          style={{
            display: isLoaded ? 'block' : 'none'
          }}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
        />
      )}

      {/* Placeholder */}
      {!imageSrc && (
        <img
          src={generatePlaceholder()}
          alt="Loading placeholder"
          className="w-full h-full object-cover"
        />
      )}
    </div>
  )
}

// Hook for managing image cache and memory
export function useImageCache() {
  const [cache, setCache] = useState<Map<string, string>>(new Map())
  const [memoryUsage, setMemoryUsage] = useState(0)

  const addToCache = (url: string, dataUrl: string) => {
    setCache(prev => {
      const newCache = new Map(prev)
      newCache.set(url, dataUrl)
      
      // Limit cache size to prevent memory issues
      if (newCache.size > 50) {
        const firstKey = newCache.keys().next().value
        newCache.delete(firstKey)
      }
      
      return newCache
    })
  }

  const getFromCache = (url: string) => {
    return cache.get(url)
  }

  const clearCache = () => {
    setCache(new Map())
    setMemoryUsage(0)
  }

  const getCacheSize = () => {
    return cache.size
  }

  // Monitor memory usage
  useEffect(() => {
    const updateMemoryUsage = () => {
      if (typeof window !== 'undefined' && 'performance' in window) {
        const memory = (performance as any).memory
        if (memory) {
          setMemoryUsage(memory.usedJSHeapSize / 1024 / 1024) // MB
        }
      }
    }

    updateMemoryUsage()
    const interval = setInterval(updateMemoryUsage, 5000)
    return () => clearInterval(interval)
  }, [])

  return {
    addToCache,
    getFromCache,
    clearCache,
    getCacheSize,
    memoryUsage
  }
}
