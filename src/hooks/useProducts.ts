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
    const data = eventData as { product?: { id: number; name: string; unit: string; minimumStock: number; active?: boolean; category?: string } }
    console.log('Product created:', data.product)

    // Add new product to the list optimistically
    if (data.product && products) {
      // Convert API response format to internal format
      const newProduct = {
        id: data.product.id,
        name: data.product.name,
        unit: data.product.unit,
        minimumStock: data.product.minimumStock,
        currentStock: 0, // New products start with 0 stock
        isLowStock: true, // New products are low stock by default
        lastUpdated: new Date().toISOString(),
        lastUpdatedBy: null,
        active: data.product.active || true,
        category: data.product.category ? { name: data.product.category } : undefined
      }

      const newProducts = [newProduct, ...products]
      mutateCached(newProducts)
    }

    // Background refresh to ensure consistency
    setTimeout(() => refetch(), 500)
  }, [products, mutateCached, refetch])

  useEventBus(PRODUCT_EVENTS.UPDATED, (eventData) => {
    const data = eventData as { product?: { id: number; name: string; unit: string; minimumStock: number; active?: boolean; category?: string } }
    console.log('Product updated:', data.product)

    // Update the product in the list
    if (data.product && products) {
      const updatedProducts = products.map(p => {
        if (p.id === data.product?.id && data.product) {
          const updated = { ...p, ...data.product }
          // Fix category type mismatch
          if (typeof data.product.category === 'string') {
            updated.category = { name: data.product.category }
          }
          return updated
        }
        return p
      })
      mutateCached(updatedProducts)
    }

    // Background refresh
    setTimeout(() => refetch(), 500)
  }, [products, mutateCached, refetch])

  useEventBus(PRODUCT_EVENTS.DELETED, (eventData) => {
    const data = eventData as { productId?: number }
    console.log('Product deleted:', data.productId)

    // Remove product from the list
    if (data.productId && products) {
      const filteredProducts = products.filter(p => p.id !== data.productId)
      mutateCached(filteredProducts)
    }

    // Background refresh
    setTimeout(() => refetch(), 500)
  }, [products, mutateCached, refetch])

  useEventBus(PRODUCT_EVENTS.STOCK_UPDATED, (eventData) => {
    const data = eventData as { productId?: number; newStock?: number }
    console.log('Stock updated:', data)

    // Update stock in the list
    if (data.productId && data.newStock !== undefined && products) {
      const updatedProducts = products.map(p =>
        p.id === data.productId ? {
          ...p,
          currentStock: data.newStock,
          isLowStock: data.newStock <= p.minimumStock,
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