'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { 
  ArrowLeft, 
  BarChart3,
  Package,
  Search,
  RefreshCw,
  LogOut,
  User,
  Calendar,
  TrendingUp,
  Activity
} from 'lucide-react'
import Image from 'next/image'

interface TodayUsageItem {
  name: string
  used: string
  unit: string
}

interface DashboardData {
  todayUsage: TodayUsageItem[]
  lastUpdateDate: string
  lastUpdateTime: string
}

const DailyUsagePage = () => {
  const { user, logout } = useAuth()
  const router = useRouter()
  
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

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

  // Filter usage items
  const filteredUsageItems = (dashboardData?.todayUsage || []).filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Calculate total usage count
  const totalUsage = filteredUsageItems.reduce((sum, item) => {
    return sum + (parseFloat(item.used) || 0)
  }, 0)

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
                  <h1 className="text-lg font-bold text-white">การใช้งานวันนี้</h1>
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
                <h1 className="text-2xl font-bold text-white">การใช้งานวันนี้</h1>
                <p className="text-gray-300">รายการสินค้าที่ใช้ไปในวันนี้</p>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Package className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-400">รายการที่ใช้</p>
                <p className="text-lg font-bold text-white">
                  {filteredUsageItems.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-400">การใช้งานรวม</p>
                <p className="text-lg font-bold text-white">
                  {totalUsage.toFixed(1)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-400">วันที่</p>
                <p className="text-lg font-bold text-white">
                  {dashboardData?.lastUpdateDate ? 
                    new Date(dashboardData.lastUpdateDate).toLocaleDateString('th-TH', { 
                      day: '2-digit', 
                      month: '2-digit' 
                    }) : 
                    'วันนี้'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 shadow-sm">
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
          <div className="mt-2 text-sm text-gray-400">
            พบ {filteredUsageItems.length} รายการ
          </div>
        </div>

        {/* Usage Items List */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <Activity className="w-5 h-5 text-indigo-500" />
              <h2 className="text-lg font-bold text-white">รายการการใช้งานทั้งหมด</h2>
            </div>
          </div>

          <div className="p-6">
            {filteredUsageItems.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                <h3 className="text-lg font-semibold mb-2">ไม่มีการใช้งานวันนี้</h3>
                <p>ยังไม่มีการบันทึกการใช้งานสินค้าในวันนี้</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredUsageItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-700 rounded-lg border border-gray-600 hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-white" />
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-white text-lg">{item.name}</h3>
                        <p className="text-sm text-gray-400">การใช้งานวันนี้</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-white">
                            {item.used}
                          </p>
                          <p className="text-sm text-gray-400">{item.unit}</p>
                        </div>
                        <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                          <TrendingUp className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Last Update Info */}
        {dashboardData?.lastUpdateTime && (
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 shadow-sm">
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>
                อัปเดตล่าสุด: {new Date(dashboardData.lastUpdateDate || new Date()).toLocaleDateString('th-TH')} 
                เวลา {dashboardData.lastUpdateTime} น.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DailyUsagePage