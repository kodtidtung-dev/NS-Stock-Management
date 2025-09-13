// src/hooks/useBackgroundSync.ts
'use client'

import { useEffect, useRef, useCallback } from 'react'
import { clearCachePattern } from './useApiCache'

interface BackgroundSyncOptions {
  interval?: number // milliseconds
  enabled?: boolean
  patterns?: string[] // Cache patterns to invalidate
  onSync?: () => void
  onError?: (error: Error) => void
}

export function useBackgroundSync(
  syncFn: () => Promise<void> | void,
  options: BackgroundSyncOptions = {}
) {
  const {
    interval = 30000, // 30 seconds default
    enabled = true,
    patterns = [],
    onSync,
    onError
  } = options

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isVisibleRef = useRef(true)
  const lastSyncRef = useRef<number>(Date.now())

  const executeSync = useCallback(async () => {
    try {
      await syncFn()
      lastSyncRef.current = Date.now()
      onSync?.()

      // Invalidate cache patterns after successful sync
      patterns.forEach(pattern => {
        clearCachePattern(pattern)
      })
    } catch (error) {
      console.error('Background sync failed:', error)
      onError?.(error as Error)
    }
  }, [syncFn, onSync, onError, patterns])

  // Start/stop sync based on enabled state
  const startSync = useCallback(() => {
    if (!enabled) return

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    // Execute immediately if it's been a while
    const timeSinceLastSync = Date.now() - lastSyncRef.current
    if (timeSinceLastSync >= interval) {
      executeSync()
    }

    // Set up recurring sync
    intervalRef.current = setInterval(() => {
      // Only sync if tab is visible
      if (isVisibleRef.current) {
        executeSync()
      }
    }, interval)
  }, [enabled, interval, executeSync])

  const stopSync = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // Handle visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden

      if (isVisibleRef.current) {
        // Tab became visible, check if we need to sync
        const timeSinceLastSync = Date.now() - lastSyncRef.current
        if (timeSinceLastSync >= interval * 0.8) { // Sync if 80% of interval has passed
          executeSync()
        }
        startSync()
      } else {
        // Tab became hidden, stop syncing to save resources
        stopSync()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [interval, executeSync, startSync, stopSync])

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      if (enabled && isVisibleRef.current) {
        // Just came back online, sync immediately
        executeSync()
        startSync()
      }
    }

    const handleOffline = () => {
      stopSync()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [enabled, executeSync, startSync, stopSync])

  // Initial start and cleanup
  useEffect(() => {
    if (enabled) {
      startSync()
    }

    return () => {
      stopSync()
    }
  }, [enabled, startSync, stopSync])

  return {
    syncNow: executeSync,
    lastSync: lastSyncRef.current,
    isEnabled: enabled
  }
}

// Specialized hooks for common use cases
export function useDashboardSync(enabled = true) {
  return useBackgroundSync(
    async () => {
      // This will trigger a background refresh of dashboard data
      await fetch('/api/dashboard', {
        headers: { 'Cache-Control': 'no-cache' }
      }).catch(console.error)
    },
    {
      interval: 15000, // 15 seconds for dashboard
      enabled,
      patterns: ['dashboard']
    }
  )
}

export function useProductsSync(enabled = true) {
  return useBackgroundSync(
    async () => {
      // This will trigger a background refresh of products data
      await fetch('/api/products', {
        headers: { 'Cache-Control': 'no-cache' }
      }).catch(console.error)
    },
    {
      interval: 30000, // 30 seconds for products
      enabled,
      patterns: ['products']
    }
  )
}

export function useStockLogsSync(enabled = true) {
  return useBackgroundSync(
    async () => {
      // This will trigger a background refresh of stock logs
      await fetch('/api/stock-logs', {
        headers: { 'Cache-Control': 'no-cache' }
      }).catch(console.error)
    },
    {
      interval: 20000, // 20 seconds for stock logs
      enabled,
      patterns: ['stock-logs']
    }
  )
}