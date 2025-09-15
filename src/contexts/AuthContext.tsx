// src/contexts/AuthContext.tsx
'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: number
  username: string
  name: string
  role: 'STAFF' | 'OWNER'
}

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  loading: boolean
  logoutLoading: boolean
  isAuthenticated: boolean
  isLoggingOut: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [logoutLoading, setLogoutLoading] = useState(false)
  const router = useRouter()
  const logoutInProgress = useRef(false)

  const checkAuth = useCallback(async () => {
    // Don't check auth if logout is in progress
    if (logoutInProgress.current) {
      return
    }

    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        if (!logoutInProgress.current) {
          setUser(null)
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      if (!logoutInProgress.current) {
        setUser(null)
      }
    } finally {
      if (!logoutInProgress.current) {
        setLoading(false)
      }
    }
  }, [])

  // Check if user is already authenticated on mount
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
        return true
      } else {
        console.error('Login failed:', data.error)
        return false
      }
    } catch (error) {
      console.error('Login error:', error)
      return false
    }
  }, [])

  const logout = useCallback(async () => {
    // Prevent multiple logout attempts using ref
    if (logoutInProgress.current || logoutLoading) {
      return
    }

    try {
      // Set both ref and state to prevent race conditions
      logoutInProgress.current = true
      setLogoutLoading(true)

      // Call logout API (but don't wait for it to finish)
      fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      }).catch(error => {
        console.error('Logout API error:', error)
      })

      // Immediately clear frontend state
      setUser(null)

      // Clear all storage and cookies properly
      try {
        localStorage.clear()
        sessionStorage.clear()

        // Fix cookie clearing for production - use proper boolean values
        const isProduction = process.env.NODE_ENV === 'production'

        // Clear auth-token cookie with correct syntax
        document.cookie = `auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; ${isProduction ? 'secure; ' : ''}sameSite=lax`

        // Also try clearing with different path variations
        document.cookie = `auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}; ${isProduction ? 'secure; ' : ''}sameSite=lax`

      } catch (error) {
        console.error('Error clearing storage:', error)
      }

      // Clear cache and redirect using Next.js router
      try {
        if ('caches' in window) {
          caches.keys().then(names => {
            names.forEach(name => caches.delete(name))
          })
        }
      } catch (error) {
        console.error('Error clearing cache:', error)
      }

      // Use Next.js router for better handling
      router.replace('/login')

      // Fallback: force redirect if router fails
      setTimeout(() => {
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }, 500)

    } catch (error) {
      console.error('Logout error:', error)

      // Even if everything fails, force clear and redirect
      setUser(null)
      try {
        localStorage.clear()
        sessionStorage.clear()
        const isProduction = process.env.NODE_ENV === 'production'
        document.cookie = `auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; ${isProduction ? 'secure; ' : ''}sameSite=lax`
      } catch (clearError) {
        console.error('Error clearing storage:', clearError)
      }

      window.location.href = '/login'
    } finally {
      // Reset logout state after a delay
      setTimeout(() => {
        setLogoutLoading(false)
        logoutInProgress.current = false
      }, 1000)
    }
  }, [logoutLoading, router])

  const value: AuthContextType = {
    user,
    login,
    logout,
    loading,
    logoutLoading,
    isAuthenticated: !!user,
    isLoggingOut: logoutLoading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}