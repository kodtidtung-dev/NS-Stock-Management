// src/hooks/useStockLogs.ts
'use client'

import { useEffect, useState, useCallback } from 'react'

interface StockLog {
  id: number
  productId: number
  date: string
  quantityRemaining: number
  notes: string | null
  createdAt: string
  product: {
    name: string
    unit: string
  }
  user: {
    name: string
    username: string
  }
}

interface UseStockLogsReturn {
  stockLogs: StockLog[]
  loading: boolean
  error: string | null
  createStockLog: (data: {
    productId: number
    date: string
    quantityRemaining: number
    notes?: string
  }) => Promise<boolean>
  submitStockData: (date: string, stockData: Array<{productId: number, quantityRemaining: number}>, notes?: string) => Promise<{success: boolean, error?: string}>
  refetch: () => Promise<void>
}

export function useStockLogs(productId?: number): UseStockLogsReturn {
  const [stockLogs, setStockLogs] = useState<StockLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStockLogs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const url = productId 
        ? `/api/stock-logs?productId=${productId}` 
        : '/api/stock-logs'
      
      const response = await fetch(url, {
        headers: {
          'Cache-Control': 'no-cache'
        },
        cache: 'no-store'
      })
      const data = await response.json()

      if (response.ok) {
        setStockLogs(data.stockLogs)
      } else {
        setError(data.error || 'Failed to fetch stock logs')
      }
    } catch (err) {
      setError('Network error occurred')
      console.error('Stock logs fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [productId])

  const createStockLog = async (data: {
    productId: number
    date: string
    quantityRemaining: number
    notes?: string
  }): Promise<boolean> => {
    try {
      const response = await fetch('/api/stock-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        cache: 'no-store',
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (response.ok) {
        // Refresh the list after successful creation
        await fetchStockLogs()
        return true
      } else {
        setError(result.error || 'Failed to create stock log')
        return false
      }
    } catch (err) {
      setError('Network error occurred')
      console.error('Create stock log error:', err)
      return false
    }
  }

  useEffect(() => {
    fetchStockLogs()
  }, [fetchStockLogs])

  const submitStockData = async (
    date: string, 
    stockData: Array<{productId: number, quantityRemaining: number}>, 
    notes?: string
  ): Promise<{success: boolean, error?: string}> => {
    try {
      const response = await fetch('/api/stock-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        cache: 'no-store',
        body: JSON.stringify({
          stockLogs: stockData.map(item => ({
            productId: item.productId,
            quantityRemaining: item.quantityRemaining,
            notes: notes || null
          }))
        }),
      })

      const result = await response.json()

      if (response.ok) {
        await fetchStockLogs()
        // Check if there were partial errors
        if (result.errors && result.errors.length > 0) {
          return {
            success: true,
            error: `บันทึกสำเร็จ ${result.processed}/${result.total} รายการ. เกิดข้อผิดพลาด: ${result.errors.join(', ')}`
          }
        }
        return { success: true }
      } else {
        // Handle detailed error response
        let errorMessage = result.error || 'Failed to submit stock data'
        if (result.details && Array.isArray(result.details)) {
          errorMessage += `: ${result.details.join(', ')}`
        } else if (result.details) {
          errorMessage += `: ${result.details}`
        }
        return { success: false, error: errorMessage }
      }
    } catch (err) {
      console.error('Submit stock data error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Network error occurred'
      return { success: false, error: errorMessage }
    }
  }

  return {
    stockLogs,
    loading,
    error,
    createStockLog,
    submitStockData,
    refetch: fetchStockLogs,
  }
}