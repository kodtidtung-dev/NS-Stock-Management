// src/hooks/useDashboard.ts
'use client'

import { useApiCache } from './useApiCache'

export interface DashboardSummary {
  totalProducts: number
  lowStockProducts: number
  outOfStockProducts: number
  totalValue: number
}

export interface LowStockAlert {
  id: number
  name: string
  currentStock: number
  minimumStock: number
  unit: string
  lastUpdated: string | null
}

export interface RecentActivity {
  id: number
  productName: string
  quantity: number
  date: string
  createdBy: string
  createdAt: string
  notes: string | null
}

export interface StockTrend {
  date: string
  entriesCount: number
}

export interface DashboardData {
  summary: DashboardSummary
  lowStockAlerts: LowStockAlert[]
  recentActivities: RecentActivity[]
  stockTrends: StockTrend[]
}

interface UseDashboardReturn {
  data: DashboardData | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
  isValidating: boolean
  mutate: (newData?: DashboardData) => void
}

const fetchDashboardData = async (): Promise<DashboardData> => {
  const response = await fetch('/api/dashboard', {
    headers: {
      'Cache-Control': 'no-cache'
    }
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to fetch dashboard data' }))
    throw new Error(errorData.error || `HTTP ${response.status}`)
  }

  return response.json()
}

export function useDashboard(): UseDashboardReturn {
  const {
    data,
    error,
    isLoading: loading,
    isValidating,
    refetch,
    mutate: mutateCached
  } = useApiCache<DashboardData>(
    'dashboard',
    fetchDashboardData,
    {
      cacheTime: 5 * 60 * 1000, // 5 minutes
      staleTime: 15 * 1000, // 15 seconds (dashboard data should be fresh)
      refetchOnWindowFocus: true,
      retryAttempts: 2
    }
  )

  const mutate = (newData?: DashboardData) => {
    if (newData) {
      mutateCached(newData)
    } else {
      refetch()
    }
  }

  return {
    data,
    loading,
    error,
    refetch,
    isValidating,
    mutate,
  }
}