// src/hooks/useProductMutations.ts
'use client'

import { useOptimisticMutation } from './useOptimisticMutation'
import { useProducts, Product } from './useProducts'
import { toast } from 'sonner'
import { eventBus, PRODUCT_EVENTS, DASHBOARD_EVENTS } from '@/lib/eventBus'

interface UpdateProductStockParams {
  id: number
  currentStock: number
  notes?: string
}

interface CreateProductParams {
  name: string
  unit: string
  minimumStock: number
  currentStock?: number
  categoryId?: number
  description?: string
}

interface UpdateProductParams {
  id: number
  name?: string
  unit?: string
  minimumStock?: number
  categoryId?: number
  description?: string
}

export function useProductMutations() {
  const { products, mutate: mutateProducts } = useProducts()

  // Update product stock with optimistic update
  const updateStockMutation = useOptimisticMutation(
    async ({ id, currentStock, notes }: UpdateProductStockParams) => {
      const response = await fetch(`/api/products/manage/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentStock, notes }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to update stock' }))
        throw new Error(error.error || 'Failed to update stock')
      }

      return response.json()
    },
    {
      onSuccess: (data) => {
        toast.success('อัปเดตสต็อกสำเร็จ')
        // Refresh products list to get updated data
        mutateProducts()

        // Broadcast event to update other components
        const product = data.data || data.product || data
        eventBus.emit(PRODUCT_EVENTS.STOCK_UPDATED, {
          productId: product?.id,
          newStock: product?.currentStock,
          product: product
        })

        // Trigger dashboard refresh
        eventBus.emit(DASHBOARD_EVENTS.DATA_CHANGED, { type: 'stock-update' })
      },
      onError: (error, rollbackData) => {
        toast.error(`เกิดข้อผิดพลาด: ${error.message}`)

        // If we have rollback data, restore the optimistic state
        if (rollbackData) {
          mutateProducts(rollbackData as Product[])
        }
      },
      invalidatePatterns: ['products', 'dashboard'] // Invalidate related caches
    }
  )

  // Create new product
  const createProductMutation = useOptimisticMutation(
    async (params: CreateProductParams) => {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to create product' }))
        throw new Error(error.error || 'Failed to create product')
      }

      return response.json()
    },
    {
      onSuccess: (data) => {
        toast.success('เพิ่มสินค้าสำเร็จ')
        mutateProducts() // Refresh products list

        // Broadcast product created event
        eventBus.emit(PRODUCT_EVENTS.CREATED, {
          product: data.data || data.product || data
        })

        // Trigger dashboard refresh
        eventBus.emit(DASHBOARD_EVENTS.DATA_CHANGED, { type: 'product-created' })
      },
      onError: (error) => {
        toast.error(`เกิดข้อผิดพลาด: ${error.message}`)
      },
      invalidatePatterns: ['products', 'dashboard']
    }
  )

  // Update product details
  const updateProductMutation = useOptimisticMutation(
    async ({ id, ...params }: UpdateProductParams) => {
      const response = await fetch(`/api/products/manage/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to update product' }))
        throw new Error(error.error || 'Failed to update product')
      }

      return response.json()
    },
    {
      onSuccess: (data) => {
        toast.success('อัปเดตข้อมูลสินค้าสำเร็จ')
        mutateProducts() // Refresh products list

        // Broadcast product updated event
        eventBus.emit(PRODUCT_EVENTS.UPDATED, {
          product: data.data || data.product || data
        })

        // Trigger dashboard refresh
        eventBus.emit(DASHBOARD_EVENTS.DATA_CHANGED, { type: 'product-updated' })
      },
      onError: (error) => {
        toast.error(`เกิดข้อผิดพลาด: ${error.message}`)
      },
      invalidatePatterns: ['products', 'dashboard']
    }
  )

  // Delete product
  const deleteProductMutation = useOptimisticMutation(
    async (id: number) => {
      const response = await fetch(`/api/products/manage/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to delete product' }))
        throw new Error(error.error || 'Failed to delete product')
      }

      return response.json()
    },
    {
      onSuccess: (data) => {
        toast.success('ลบสินค้าสำเร็จ')
        mutateProducts() // Refresh products list

        // Broadcast product deleted event
        eventBus.emit(PRODUCT_EVENTS.DELETED, {
          productId: data.data?.id || data.id || data.productId
        })

        // Trigger dashboard refresh
        eventBus.emit(DASHBOARD_EVENTS.DATA_CHANGED, { type: 'product-deleted' })
      },
      onError: (error, rollbackData) => {
        toast.error(`เกิดข้อผิดพลาด: ${error.message}`)

        // Restore products list if we have rollback data
        if (rollbackData) {
          mutateProducts(rollbackData as Product[])
        }
      },
      invalidatePatterns: ['products', 'dashboard']
    }
  )

  // Optimistic stock update helper
  const updateStockOptimistic = async (
    id: number,
    newStock: number,
    notes?: string
  ) => {
    // Create optimistic update
    const optimisticProducts = products.map(product =>
      product.id === id
        ? {
            ...product,
            currentStock: newStock,
            isLowStock: newStock <= product.minimumStock,
            lastUpdated: new Date().toISOString()
          }
        : product
    )

    // Apply optimistic update immediately
    mutateProducts(optimisticProducts)

    // Execute the actual mutation with rollback data
    return updateStockMutation.mutate(
      { id, currentStock: newStock, notes },
      products // Original data for rollback
    )
  }

  // Optimistic delete helper
  const deleteProductOptimistic = async (id: number) => {
    // Create optimistic update - remove product immediately
    const optimisticProducts = products.filter(product => product.id !== id)

    // Apply optimistic update immediately
    mutateProducts(optimisticProducts)

    // Execute the actual mutation with rollback data
    return deleteProductMutation.mutate(
      id,
      products // Original data for rollback
    )
  }

  return {
    updateStock: updateStockOptimistic,
    createProduct: createProductMutation.mutate,
    updateProduct: updateProductMutation.mutate,
    deleteProduct: deleteProductOptimistic,

    // Loading states
    isUpdatingStock: updateStockMutation.isLoading,
    isCreatingProduct: createProductMutation.isLoading,
    isUpdatingProduct: updateProductMutation.isLoading,
    isDeletingProduct: deleteProductMutation.isLoading,

    // Error states
    updateStockError: updateStockMutation.error,
    createProductError: createProductMutation.error,
    updateProductError: updateProductMutation.error,
    deleteProductError: deleteProductMutation.error,

    // Reset functions
    resetUpdateStock: updateStockMutation.reset,
    resetCreateProduct: createProductMutation.reset,
    resetUpdateProduct: updateProductMutation.reset,
    resetDeleteProduct: deleteProductMutation.reset,
  }
}