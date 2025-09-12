'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  staleWhileRevalidate?: number // Additional time to serve stale data while revalidating
}

interface CacheEntry<T> {
  data: T
  timestamp: number
  loading: boolean
}

const cache = new Map<string, CacheEntry<unknown>>()

export function useApiCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
) {
  const { ttl = 60000, staleWhileRevalidate = 300000 } = options // Default 1 min TTL, 5 min stale
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const fetchingRef = useRef(false)

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (fetchingRef.current) return
    
    const now = Date.now()
    const cached = cache.get(key)

    // Check if we have fresh data
    if (!forceRefresh && cached && (now - cached.timestamp) < ttl) {
      setData(cached.data as T)
      setLoading(false)
      return
    }

    // Check if we can serve stale data while revalidating
    const canServeStale = cached && (now - cached.timestamp) < (ttl + staleWhileRevalidate)
    
    if (canServeStale && !forceRefresh) {
      setData(cached.data as T)
      setLoading(false)
      
      // Revalidate in background
      setTimeout(() => {
        fetchData(true)
      }, 0)
      return
    }

    fetchingRef.current = true
    setLoading(true)
    setError(null)

    try {
      const result = await fetcher()
      
      // Update cache
      cache.set(key, {
        data: result,
        timestamp: now,
        loading: false
      })

      setData(result)
    } catch (err) {
      setError(err as Error)
      
      // If we have stale data, use it
      if (cached) {
        setData(cached.data as T)
      }
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }, [key, fetcher, ttl, staleWhileRevalidate])

  useEffect(() => {
    fetchData()
  }, [key, fetchData])

  const refresh = () => fetchData(true)

  return { data, loading, error, refresh }
}