// src/hooks/useLogout.ts
'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useCallback } from 'react'

export const useLogout = () => {
  const { logout, logoutLoading } = useAuth()

  const handleLogout = useCallback(async (e?: React.MouseEvent) => {
    // Prevent default behavior and event bubbling
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    // Prevent multiple calls
    if (logoutLoading) {
      return
    }

    try {
      await logout()
    } catch (error) {
      console.error('Logout handler error:', error)
    }
  }, [logout, logoutLoading])

  return {
    handleLogout,
    isLoggingOut: logoutLoading
  }
}