// src/contexts/AuthContext.tsx
'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [logoutLoading, setLogoutLoading] = useState(false)

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include', // Include cookies for authentication
        headers: {
          'Cache-Control': 'no-cache' // Don't cache auth checks
        }
      })
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setUser(null)
    } finally {
      setLoading(false)
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
    if (logoutLoading) return // Prevent multiple logout attempts

    try {
      setLogoutLoading(true)

      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })

      // Only proceed with logout if API call was successful or if it failed due to network/server issues
      // Don't block logout for auth-related failures (user should still be logged out on frontend)
      if (response.ok || response.status >= 500) {
        setUser(null)
        window.location.href = '/login'
      } else {
        // For other errors (like 401, 403), still logout but log the error
        console.warn('Logout API call failed, but proceeding with frontend logout:', response.status)
        setUser(null)
        window.location.href = '/login'
      }
    } catch (error) {
      console.error('Logout error:', error)
      // Even if API fails, logout user from frontend
      setUser(null)
      window.location.href = '/login'
    } finally {
      setLogoutLoading(false)
    }
  }, [logoutLoading])

  const value: AuthContextType = {
    user,
    login,
    logout,
    loading,
    logoutLoading,
    isAuthenticated: !!user,
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