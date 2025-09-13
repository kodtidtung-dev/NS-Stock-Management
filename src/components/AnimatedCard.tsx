// src/components/AnimatedCard.tsx
import React, { useState, useEffect } from 'react'

interface AnimatedCardProps {
  children: React.ReactNode
  isUpdating?: boolean
  wasJustUpdated?: boolean
  className?: string
}

export function AnimatedCard({
  children,
  isUpdating = false,
  wasJustUpdated = false,
  className = ''
}: AnimatedCardProps) {
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    if (wasJustUpdated) {
      setShowSuccess(true)
      const timer = setTimeout(() => setShowSuccess(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [wasJustUpdated])

  return (
    <div
      className={`
        relative transition-all duration-300 ease-in-out
        ${isUpdating ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}
        ${showSuccess ? 'ring-2 ring-green-400 ring-opacity-75' : ''}
        ${className}
      `}
    >
      {/* Updating overlay */}
      {isUpdating && (
        <div className="absolute -top-1 -right-1 z-10">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-ping" />
          <div className="absolute top-0 w-3 h-3 bg-blue-600 rounded-full" />
        </div>
      )}

      {/* Success indicator */}
      {showSuccess && (
        <div className="absolute -top-1 -right-1 z-10">
          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      )}

      {children}
    </div>
  )
}

// Specialized components
export function ProductCard({
  children,
  productId,
  className = ''
}: {
  children: React.ReactNode
  productId: number
  className?: string
}) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [wasUpdated, setWasUpdated] = useState(false)

  useEffect(() => {
    // Listen for product update events
    const handleUpdate = (event: CustomEvent) => {
      if (event.detail.productId === productId) {
        setIsUpdating(false)
        setWasUpdated(true)
        setTimeout(() => setWasUpdated(false), 2000)
      }
    }

    const handleUpdateStart = (event: CustomEvent) => {
      if (event.detail.productId === productId) {
        setIsUpdating(true)
      }
    }

    window.addEventListener('product:update-start' as any, handleUpdateStart)
    window.addEventListener('product:updated' as any, handleUpdate)

    return () => {
      window.removeEventListener('product:update-start' as any, handleUpdateStart)
      window.removeEventListener('product:updated' as any, handleUpdate)
    }
  }, [productId])

  return (
    <AnimatedCard
      isUpdating={isUpdating}
      wasJustUpdated={wasUpdated}
      className={className}
    >
      {children}
    </AnimatedCard>
  )
}