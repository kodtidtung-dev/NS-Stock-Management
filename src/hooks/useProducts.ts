// src/hooks/useProducts.ts
'use client'

import { useEffect, useState } from 'react'

interface Product {
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

interface UseProductsReturn {
  products: Product[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useProducts(): UseProductsReturn {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/products')
      const data = await response.json()

      if (response.ok) {
        setProducts(data.products)
      } else {
        setError(data.error || 'Failed to fetch products')
      }
    } catch (err) {
      setError('Network error occurred')
      console.error('Products fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  return {
    products,
    loading,
    error,
    refetch: fetchProducts,
  }
}