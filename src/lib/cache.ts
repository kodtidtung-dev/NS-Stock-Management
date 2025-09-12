// In-memory caching for API responses
interface CacheEntry<T = unknown> {
  data: T
  timestamp: number
  expiresIn: number
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>()
  private maxSize = 100 // Prevent memory leaks

  set<T>(key: string, data: T, expiresInSeconds: number = 60): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn: expiresInSeconds * 1000
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) return null
    
    // Check if expired
    if (Date.now() - entry.timestamp > entry.expiresIn) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data as T
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear()
      return
    }
    
    // Remove keys matching pattern
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }

  size(): number {
    return this.cache.size
  }
}

export const apiCache = new MemoryCache()

// Cache key generators
export const getCacheKey = {
  dashboard: (userId?: string) => `dashboard:${userId || 'all'}`,
  products: (userId?: string) => `products:${userId || 'all'}`,
  stockLogs: (productId?: number, page?: number) => 
    `stock-logs:${productId || 'all'}:${page || 1}`,
  categories: () => 'categories:active'
}

// Middleware for caching API responses
export function withCache<T extends unknown[]>(
  handler: (...args: T) => Promise<Response>, 
  cacheKeyFn: (...args: T) => string,
  expiresInSeconds: number = 60
) {
  return async (...args: T): Promise<Response> => {
    const cacheKey = cacheKeyFn(...args)
    
    // Try to get from cache first
    const cached = apiCache.get(cacheKey)
    if (cached) {
      return new Response(JSON.stringify(cached), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Cache': 'HIT'
        }
      })
    }
    
    // Execute original handler
    const result = await handler(...args)
    
    // Cache successful responses only
    if (result.status === 200) {
      const data = await result.json()
      apiCache.set(cacheKey, data, expiresInSeconds)
      
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Cache': 'MISS'
        }
      })
    }
    
    return result
  }
}