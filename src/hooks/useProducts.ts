// src/hooks/useProducts.ts
'use client'

import { useApiCache } from './useApiCache'

export interface Product {
  id: number
  name: string
  unit: string
  minimumStock: number
  currentStock: number
  isLowStock: boolean
  lastUpdated: string | null
  lastUpdatedBy: number | null
  active: boolean
  category?: {
    name: string
  }
}

interface ProductsResponse {
  products: Product[]
}

interface UseProductsReturn {
  products: Product[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
  isValidating: boolean
  mutate: (newData?: Product[]) => void
}

const fetchProducts = async (): Promise<Product[]> => {
  const response = await fetch('/api/products', {
    headers: {
      'Cache-Control': 'no-cache'
    }
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to fetch products' }))
    throw new Error(errorData.error || `HTTP ${response.status}`)
  }

  const data: ProductsResponse = await response.json()
  return data.products
}

export function useProducts(): UseProductsReturn {
  const {
    data: products,
    error,
    isLoading: loading,
    isValidating,
    refetch,
    mutate: mutateCached
  } = useApiCache<Product[]>(
    'products',
    fetchProducts,
    {
      cacheTime: 10 * 60 * 1000, // 10 minutes
      staleTime: 30 * 1000, // 30 seconds
      refetchOnWindowFocus: true,
      retryAttempts: 2
    }
  )

  const mutate = (newData?: Product[]) => {
    if (newData) {
      mutateCached(newData)
    } else {
      refetch()
    }
  }

  return {
    products: products || [],
    loading,
    error,
    refetch,
    isValidating,
    mutate,
  }
}