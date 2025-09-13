// src/components/LoadingSpinner.tsx
import React from 'react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: 'white' | 'black' | 'blue' | 'green' | 'orange'
  className?: string
}

export function LoadingSpinner({
  size = 'md',
  color = 'blue',
  className = ''
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  const colorClasses = {
    white: 'border-white border-t-transparent',
    black: 'border-black border-t-transparent',
    blue: 'border-blue-600 border-t-transparent',
    green: 'border-green-600 border-t-transparent',
    orange: 'border-orange-600 border-t-transparent'
  }

  return (
    <div
      className={`
        border-2 rounded-full animate-spin
        ${sizeClasses[size]}
        ${colorClasses[color]}
        ${className}
      `}
    />
  )
}

// Inline loading component for buttons
export function ButtonLoader({ size = 'sm', color = 'white' }: LoadingSpinnerProps) {
  return <LoadingSpinner size={size} color={color} className="mr-2" />
}

// Overlay loading for sections
export function SectionLoader({ message = 'กำลังโหลด...' }: { message?: string }) {
  return (
    <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded-lg">
      <div className="bg-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3">
        <LoadingSpinner size="md" color="blue" />
        <span className="text-gray-700 font-medium">{message}</span>
      </div>
    </div>
  )
}

// Page loading
export function PageLoader() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center text-white space-y-4">
        <LoadingSpinner size="lg" color="white" className="mx-auto" />
        <p className="text-lg">กำลังโหลด...</p>
      </div>
    </div>
  )
}