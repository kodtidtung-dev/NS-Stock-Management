'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { 
  ArrowLeft, 
  AlertTriangle, 
  Bell,
  Package,
  Search,
  RefreshCw,
  TrendingDown,
  LogOut,
  User,
  Filter
} from 'lucide-react'
import Image from 'next/image'

interface LowStockProduct {
  id: number
  name: string
  currentStock: number
  minStock: number
  unit: string
  status: string
  category?: string
}

interface DashboardData {
  lowStockProducts: LowStockProduct[]
  summary: {
    total: number
    ok: number
    lowStock: number
    outOfStock: number
  }
}

const StockAlertsPage = () => {
  const { user, logout } = useAuth()
  const router = useRouter()
  
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    if (user && user.role !== 'OWNER') {
      router.push('/dashboard')
    }
    fetchDashboardData()
  }, [user, router])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard')
      if (response.ok) {
        const data = await response.json()
        setDashboardData(data)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchDashboardData()
    await new Promise(resolve => setTimeout(resolve, 500))
    setRefreshing(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OUT_OF_STOCK':
        return 'bg-white'
      case 'LOW_STOCK':
        return 'bg-gray-300'
      default:
        return 'bg-gray-600'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'OUT_OF_STOCK':
        return 'หมดแล้ว'
      case 'LOW_STOCK':
        return 'ใกล้หมด'
      default:
        return 'ปกติ'
    }
  }

  const getBadgeColor = (status: string) => {
    switch (status) {
      case 'OUT_OF_STOCK':
        return 'bg-gray-800 text-white border-gray-700'
      case 'LOW_STOCK':
        return 'bg-gray-600 text-white border-gray-500'
      default:
        return 'bg-gray-400 text-black border-gray-300'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OUT_OF_STOCK':
        return <AlertTriangle className="w-4 h-4 text-white" />
      case 'LOW_STOCK':
        return <TrendingDown className="w-4 h-4 text-gray-300" />
      default:
        return <Package className="w-4 h-4 text-gray-400" />
    }
  }

  // Filter products
  const filteredProducts = (dashboardData?.lowStockProducts || []).filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || product.status === filterStatus
    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">กำลังโหลด...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
          {/* Mobile Header */}
          <div className="block md:hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="p-2 hover:bg-gray-700 rounded-full transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-300" />
                </button>
                
                <Image 
                  src="/ns.logowhite.png" 
                  alt="NS Logo" 
                  width={40} 
                  height={40} 
                  className="object-contain"
                />
                
                <div>
                  <h1 className="text-lg font-bold text-white">แจ้งเตือนสต็อก</h1>
                </div>
              </div>
              
              <button 
                onClick={logout}
                className="p-2 hover:bg-gray-700 rounded-full transition-colors"
              >
                <LogOut className="w-5 h-5 text-gray-300" />
              </button>
            </div>
          </div>
          
          {/* Desktop Header */}
          <div className="hidden md:flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 hover:bg-gray-700 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-300" />
              </button>
              
              <Image 
                src="/ns.logowhite.png" 
                alt="NS Logo" 
                width={80} 
                height={80} 
                className="object-contain"
              />
              
              <div>
                <h1 className="text-2xl font-bold text-white">แจ้งเตือนสต็อก</h1>
                <p className="text-gray-300">รายการสินค้าที่ต้องเติมสต็อก</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="text-sm font-medium">รีเฟรช</span>
              </button>
              
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <User className="w-4 h-4" />
                <span>{user?.name}</span>
              </div>
              
              <button 
                onClick={logout}
                className="p-2 hover:bg-gray-700 rounded-full transition-colors"
              >
                <LogOut className="w-5 h-5 text-gray-300" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-gray-800 rounded-xl p-3 sm:p-4 border border-gray-700 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mx-auto sm:mx-0">
                <Package className="w-4 h-4 text-white" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-xs text-gray-400">สินค้าทั้งหมด</p>
                <p className="text-lg sm:text-xl font-bold text-white">
                  {(dashboardData?.summary.total || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-3 sm:p-4 border border-gray-700 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center mx-auto sm:mx-0">
                <Package className="w-4 h-4 text-white" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-xs text-gray-400">สต็อกปกติ</p>
                <p className="text-lg sm:text-xl font-bold text-white">
                  {(dashboardData?.summary.ok || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-3 sm:p-4 border border-gray-700 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <div className="w-8 h-8 bg-yellow-600 rounded-lg flex items-center justify-center mx-auto sm:mx-0">
                <TrendingDown className="w-4 h-4 text-white" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-xs text-gray-400">ใกล้หมด</p>
                <p className="text-lg sm:text-xl font-bold text-white">
                  {(dashboardData?.summary.lowStock || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-3 sm:p-4 border border-gray-700 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center mx-auto sm:mx-0">
                <AlertTriangle className="w-4 h-4 text-white" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-xs text-gray-400">หมดแล้ว</p>
                <p className="text-lg sm:text-xl font-bold text-white">
                  {(dashboardData?.summary.outOfStock || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 shadow-sm">
          <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-3 md:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นหาสินค้า..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none placeholder-gray-400"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="all">ทุกสถานะ</option>
                <option value="LOW_STOCK">ใกล้หมด</option>
                <option value="OUT_OF_STOCK">หมดแล้ว</option>
              </select>
            </div>

            <div className="text-sm text-gray-400 flex items-center justify-center md:justify-start">
              พบ {filteredProducts.length.toLocaleString()} รายการ
            </div>
          </div>
        </div>

        {/* Products List */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-sm">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <Bell className="w-5 h-5 text-orange-500" />
              <h2 className="text-base sm:text-lg font-bold text-white">รายการสินค้าที่ต้องแจ้งเตือน</h2>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-8 sm:py-12 text-gray-400">
                <Bell className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-500" />
                <h3 className="text-base sm:text-lg font-semibold mb-2">ไม่มีสินค้าที่ต้องแจ้งเตือน</h3>
                <p className="text-sm sm:text-base">ทุกสินค้ามีสต็อกเพียงพอแล้ว</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Mobile Layout */}
                <div className="block md:hidden space-y-4">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="p-4 bg-gray-700 rounded-lg border border-gray-600 hover:bg-gray-600 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            product.status === 'OUT_OF_STOCK' ? 'bg-red-600' : 'bg-yellow-600'
                          }`}>
                            {getStatusIcon(product.status)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white text-base truncate">{product.name}</h3>
                            {product.category && (
                              <p className="text-sm text-gray-400">หมวดหมู่: {product.category}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className={`px-3 py-1 rounded-full text-xs font-medium border flex-shrink-0 ml-2 ${getBadgeColor(product.status)}`}>
                          {getStatusText(product.status)}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="text-center p-2 bg-gray-600 rounded">
                          <p className="text-gray-300 mb-1">คงเหลือ</p>
                          <p className="font-bold text-white">{product.currentStock.toLocaleString()} {product.unit}</p>
                        </div>
                        <div className="text-center p-2 bg-gray-600 rounded">
                          <p className="text-gray-300 mb-1">ขั้นต่ำ</p>
                          <p className="font-bold text-white">{product.minStock.toLocaleString()} {product.unit}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Desktop Layout */}
                <div className="hidden md:block space-y-4">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-4 bg-gray-700 rounded-lg border border-gray-600 hover:bg-gray-600 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          product.status === 'OUT_OF_STOCK' ? 'bg-red-600' : 'bg-yellow-600'
                        }`}>
                          {getStatusIcon(product.status)}
                        </div>
                        
                        <div>
                          <h3 className="font-semibold text-white text-lg">{product.name}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-400 mt-1">
                            <span>คงเหลือ: {product.currentStock.toLocaleString()} {product.unit}</span>
                            <span>ขั้นต่ำ: {product.minStock.toLocaleString()} {product.unit}</span>
                            {product.category && (
                              <span>หมวดหมู่: {product.category}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className={`px-4 py-2 rounded-full text-sm font-medium border ${getBadgeColor(product.status)}`}>
                          {getStatusText(product.status)}
                        </div>
                        
                        <div className="text-right">
                          <p className="text-lg font-bold text-white">
                            {product.currentStock.toLocaleString()} {product.unit}
                          </p>
                          <p className="text-xs text-gray-400">คงเหลือ</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default StockAlertsPage