// Custom hook for API data fetching with caching
import { useState, useEffect, useCallback, useRef } from 'react'

interface ApiCacheOptions {
  cacheTime?: number // milliseconds
  staleTime?: number // milliseconds
  refetchOnWindowFocus?: boolean
  retryAttempts?: number
}

interface CacheEntry<T> {
  data: T
  timestamp: number
  isStale: boolean
}

const cache = new Map<string, CacheEntry<unknown>>()

export function useApiCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: ApiCacheOptions = {}
) {
  const {
    cacheTime = 5 * 60 * 1000, // 5 minutes
    staleTime = 60 * 1000, // 1 minute
    refetchOnWindowFocus = true,
    retryAttempts = 3
  } = options

  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isValidating, setIsValidating] = useState(false)
  const retryCount = useRef(0)
  const abortController = useRef<AbortController | null>(null)

  const fetchData = useCallback(async (force = false) => {
    // Check cache first
    const cached = cache.get(key)
    const now = Date.now()
    
    if (!force && cached && (now - cached.timestamp) < cacheTime) {
      setData(cached.data as T)
      setIsLoading(false)
      
      // Check if data is stale but still usable
      if ((now - cached.timestamp) < staleTime) {
        return cached.data
      }
      
      // Data is stale, fetch in background
      setIsValidating(true)
    } else {
      setIsLoading(true)
    }

    try {
      // Cancel previous request
      if (abortController.current) {
        abortController.current.abort()
      }
      abortController.current = new AbortController()

      const result = await fetcher()
      
      // Update cache
      cache.set(key, {
        data: result,
        timestamp: now,
        isStale: false
      })
      
      setData(result)
      setError(null)
      retryCount.current = 0
      
      return result
    } catch (err) {
      const error = err as Error
      
      // Don't set error if request was aborted
      if (error.name !== 'AbortError') {
        // Retry logic
        if (retryCount.current < retryAttempts) {
          retryCount.current++
          setTimeout(() => fetchData(force), 1000 * retryCount.current)
          return
        }
        
        setError(error)
        
        // Return stale data if available
        if (cached) {
          setData(cached.data as T)
        }
      }
    } finally {
      setIsLoading(false)
      setIsValidating(false)
    }
  }, [key, fetcher, cacheTime, staleTime, retryAttempts])

  // Initial fetch
  useEffect(() => {
    fetchData()
    
    // Cleanup on unmount
    return () => {
      if (abortController.current) {
        abortController.current.abort()
      }
    }
  }, [fetchData])

  // Refetch on window focus
  useEffect(() => {
    if (!refetchOnWindowFocus) return

    const handleFocus = () => {
      const cached = cache.get(key)
      if (cached && (Date.now() - cached.timestamp) > staleTime) {
        fetchData(true)
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [key, staleTime, refetchOnWindowFocus, fetchData])

  const mutate = useCallback((newData?: T) => {
    if (newData) {
      cache.set(key, {
        data: newData,
        timestamp: Date.now(),
        isStale: false
      })
      setData(newData)
    } else {
      fetchData(true)
    }
  }, [key, fetchData])

  const invalidate = useCallback(() => {
    cache.delete(key)
    fetchData(true)
  }, [key, fetchData])

  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
    invalidate,
    refetch: () => fetchData(true)
  }
}

// Utility to clear all cache
export const clearAllCache = () => {
  cache.clear()
}

// Utility to clear specific cache pattern
export const clearCachePattern = (pattern: string) => {
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key)
    }
  }
}