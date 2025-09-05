// src/hooks/useDashboard.ts
'use client'

import { useEffect, useState } from 'react'

interface DashboardSummary {
  totalProducts: number
  lowStockProducts: number
  outOfStockProducts: number
  totalValue: number
}

interface LowStockAlert {
  id: number
  name: string
  currentStock: number
  minimumStock: number
  unit: string
  lastUpdated: string | null
}

interface RecentActivity {
  id: number
  productName: string
  quantity: number
  date: string
  createdBy: string
  createdAt: string
  notes: string | null
}

interface StockTrend {
  date: string
  entriesCount: number
}

interface DashboardData {
  summary: DashboardSummary
  lowStockAlerts: LowStockAlert[]
  recentActivities: RecentActivity[]
  stockTrends: StockTrend[]
}

interface UseDashboardReturn {
  data: DashboardData | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useDashboard(): UseDashboardReturn {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/dashboard')
      const result = await response.json()

      if (response.ok) {
        setData(result)
      } else {
        setError(result.error || 'Failed to fetch dashboard data')
      }
    } catch (err) {
      setError('Network error occurred')
      console.error('Dashboard fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  return {
    data,
    loading,
    error,
    refetch: fetchDashboardData,
  }
}