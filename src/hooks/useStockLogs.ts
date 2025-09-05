// src/hooks/useStockLogs.ts
'use client'

import { useEffect, useState } from 'react'

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

  const fetchStockLogs = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const url = productId 
        ? `/api/stock-logs?productId=${productId}` 
        : '/api/stock-logs'
      
      const response = await fetch(url)
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
  }

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
        },
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
  }, [productId])

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
        },
        body: JSON.stringify({
          stockLogs: stockData.map(item => ({
            productId: item.productId,
            quantity: item.quantityRemaining,
            type: 'UPDATE',
            notes: notes || undefined
          }))
        }),
      })

      const result = await response.json()

      if (response.ok) {
        await fetchStockLogs()
        return { success: true }
      } else {
        return { success: false, error: result.error || 'Failed to submit stock data' }
      }
    } catch (err) {
      console.error('Submit stock data error:', err)
      return { success: false, error: 'Network error occurred' }
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