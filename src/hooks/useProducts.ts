// src/hooks/useProducts.ts
'use client'

import { useApiCache } from './useApiCache'
import { useEventBus, PRODUCT_EVENTS } from '@/lib/eventBus'

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
  categoryId?: number
  description?: string
  createdBy?: string
  createdAt?: string
  updatedAt?: string
}

interface ProductsResponse {
  products: Product[]
}

interface UseProductsReturn {
  products: Product[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<unknown>
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

  // Listen for product events and update UI accordingly
  useEventBus(PRODUCT_EVENTS.CREATED, (eventData) => {
    console.log('Product created:', eventData.product)

    // Add new product to the list optimistically
    if (eventData.product && products) {
      // Convert API response format to internal format
      const newProduct = {
        id: eventData.product.id,
        name: eventData.product.name,
        unit: eventData.product.unit,
        minimumStock: eventData.product.minimumStock,
        currentStock: 0, // New products start with 0 stock
        isLowStock: true, // New products are low stock by default
        lastUpdated: new Date().toISOString(),
        lastUpdatedBy: null,
        active: eventData.product.active || true,
        category: eventData.product.category ? { name: eventData.product.category } : undefined
      }

      const newProducts = [newProduct, ...products]
      mutateCached(newProducts)
    }

    // Background refresh to ensure consistency
    setTimeout(() => refetch(), 500)
  }, [products, mutateCached, refetch])

  useEventBus(PRODUCT_EVENTS.UPDATED, (eventData) => {
    console.log('Product updated:', eventData.product)

    // Update the product in the list
    if (eventData.product && products) {
      const updatedProducts = products.map(p =>
        p.id === eventData.product.id ? { ...p, ...eventData.product } : p
      )
      mutateCached(updatedProducts)
    }

    // Background refresh
    setTimeout(() => refetch(), 500)
  }, [products, mutateCached, refetch])

  useEventBus(PRODUCT_EVENTS.DELETED, (eventData) => {
    console.log('Product deleted:', eventData.productId)

    // Remove product from the list
    if (eventData.productId && products) {
      const filteredProducts = products.filter(p => p.id !== eventData.productId)
      mutateCached(filteredProducts)
    }

    // Background refresh
    setTimeout(() => refetch(), 500)
  }, [products, mutateCached, refetch])

  useEventBus(PRODUCT_EVENTS.STOCK_UPDATED, (eventData) => {
    console.log('Stock updated:', eventData)

    // Update stock in the list
    if (eventData.productId && eventData.newStock !== undefined && products) {
      const updatedProducts = products.map(p =>
        p.id === eventData.productId ? {
          ...p,
          currentStock: eventData.newStock,
          isLowStock: eventData.newStock <= p.minimumStock,
          lastUpdated: new Date().toISOString()
        } : p
      )
      mutateCached(updatedProducts)
    }
  }, [products, mutateCached])

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