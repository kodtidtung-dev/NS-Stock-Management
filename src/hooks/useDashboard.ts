// src/hooks/useDashboard.ts
'use client'

import { useApiCache } from './useApiCache'
import { useEventBus, DASHBOARD_EVENTS } from '@/lib/eventBus'

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
  lastUpdateDate: string
  lastUpdateTime: string
  updatedBy: string
  summary: {
    total: number
    ok: number
    lowStock: number
    outOfStock: number
  }
  lowStockProducts: Array<{
    id: number
    name: string
    currentStock: number
    minStock: number
    unit: string
    status: string
    category: string
  }>
  todayUsage: Array<{
    name: string
    used: string
    unit: string
  }>
}

interface UseDashboardReturn {
  data: DashboardData | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<unknown>
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

  // Listen for data change events and auto-refresh
  useEventBus(DASHBOARD_EVENTS.DATA_CHANGED, (eventData) => {
    console.log('Dashboard data changed:', eventData)

    // Smart refresh - immediate for critical changes, debounced for others
    const isCriticalChange = eventData?.type === 'stock-update'

    if (isCriticalChange) {
      // Immediate refresh for stock updates
      refetch()
    } else {
      // Debounced refresh for other changes
      setTimeout(() => refetch(), 1000)
    }
  }, [refetch])

  // Listen for manual refresh requests
  useEventBus(DASHBOARD_EVENTS.REFRESH, () => {
    refetch()
  }, [refetch])

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