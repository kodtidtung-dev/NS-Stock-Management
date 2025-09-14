'use client'

import React, { useState, useEffect, useMemo } from 'react'
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
  Activity,
  Lightbulb
} from 'lucide-react'
import Image from 'next/image'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface TodayUsageItem {
  name: string
  used: string
  unit: string
  category: string
}

interface DashboardData {
  todayUsage: TodayUsageItem[]
  categories: string[]
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
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [viewMode, setViewMode] = useState<'list' | 'chart'>('list')

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

  // Filter usage items by category and search
  const filteredUsageItems = useMemo(() => {
    return (dashboardData?.todayUsage || []).filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [dashboardData?.todayUsage, searchTerm, selectedCategory])

  // Calculate total usage count
  const totalUsage = filteredUsageItems.reduce((sum, item) => {
    return sum + (parseFloat(item.used) || 0)
  }, 0)

  // Get category emoji
  const getCategoryEmoji = (category: string) => {
    if (category.includes('ขนม') || category.includes('snack')) return '🍪'
    if (category.includes('กาแฟ') || category.includes('coffee')) return '☕'
    if (category.includes('เครื่องดื่ม') || category.includes('drink')) return '🥤'
    if (category.includes('ของใช้') || category.includes('supplies')) return '🧴'
    if (category.includes('นม') || category.includes('milk')) return '🥛'
    if (category.includes('ผลไม้') || category.includes('fruit')) return '🍓'
    return '📦'
  }

  // Get smart insight for selected category
  const getCategoryInsight = () => {
    if (!filteredUsageItems.length) return null

    const topItem = filteredUsageItems[0]
    const totalInCategory = filteredUsageItems.length
    const categoryTotal = filteredUsageItems.reduce((sum, item) => sum + parseFloat(item.used), 0)

    switch (selectedCategory) {
      case 'all':
        return `💡 วันนี้มีการใช้งานทั้งหมด ${totalInCategory} รายการ รวม ${categoryTotal % 1 === 0 ? categoryTotal : categoryTotal.toFixed(1)} หน่วย`
      default:
        if (selectedCategory !== 'all') {
          return `${getCategoryEmoji(selectedCategory)} ${selectedCategory}ที่ใช้มากที่สุด: ${topItem.name} (${topItem.used} ${topItem.unit})`
        }
        return null
    }
  }

  // Prepare chart data
  const chartData = filteredUsageItems.slice(0, 10).map(item => ({
    name: item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name,
    fullName: item.name,
    used: parseFloat(item.used),
    unit: item.unit
  }))

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
        {/* Category Filter */}
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 shadow-sm">
          {/* Mobile Category Filter */}
          <div className="md:hidden mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">เลือกหมวดหมู่</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="all">📊 ดูทั้งหมด</option>
              {dashboardData?.categories?.map((category) => (
                <option key={category} value={category}>
                  {getCategoryEmoji(category)} {category}
                </option>
              ))}
            </select>
          </div>

          {/* Desktop Category Tabs */}
          <div className="hidden md:block mb-4">
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                📊 ทั้งหมด
              </button>
              {dashboardData?.categories?.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {getCategoryEmoji(category)} {category}
                </button>
              ))}
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-300">
                {selectedCategory === 'all' ? 'การใช้งานทั้งหมด' : `การใช้งาน${selectedCategory}`}
              </span>
            </div>
            <div className="flex bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  viewMode === 'list' ? 'bg-gray-600 text-white' : 'text-gray-400'
                }`}
              >
                รายการ
              </button>
              <button
                onClick={() => setViewMode('chart')}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  viewMode === 'chart' ? 'bg-gray-600 text-white' : 'text-gray-400'
                }`}
              >
                กราฟ
              </button>
            </div>
          </div>
        </div>

        {/* Smart Insight */}
        {getCategoryInsight() && (
          <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-xl p-4 border border-blue-700/50 shadow-sm">
            <div className="flex items-start space-x-3">
              <Lightbulb className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
              <p className="text-blue-100 text-sm">{getCategoryInsight()}</p>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Package className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-400">
                  {selectedCategory === 'all' ? 'รายการที่ใช้' : `รายการ${selectedCategory}`}
                </p>
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
                  {totalUsage % 1 === 0 ? totalUsage.toString() : totalUsage.toFixed(1)}
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

        {/* Chart/List Content */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Activity className="w-5 h-5 text-indigo-500" />
                <h2 className="text-lg font-bold text-white">
                  {selectedCategory === 'all'
                    ? 'รายการการใช้งานทั้งหมด'
                    : `รายการ${selectedCategory}ที่ใช้งาน`
                  }
                </h2>
              </div>
              <div className="text-sm text-gray-400">
                {viewMode === 'chart' ? 'Top 10' : `${filteredUsageItems.length} รายการ`}
              </div>
            </div>
          </div>

          <div className="p-6">
            {filteredUsageItems.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                <h3 className="text-lg font-semibold mb-2">
                  {selectedCategory === 'all'
                    ? 'ไม่มีการใช้งานวันนี้'
                    : `ไม่มีการใช้งาน${selectedCategory}วันนี้`
                  }
                </h3>
                <p>
                  {selectedCategory === 'all'
                    ? 'ยังไม่มีการบันทึกการใช้งานสินค้าในวันนี้'
                    : `ลองเลือกหมวดหมู่อื่น หรือดู "ทั้งหมด"`
                  }
                </p>
              </div>
            ) : (
              <>
                {/* Chart View */}
                {viewMode === 'chart' && chartData.length > 0 && (
                  <div className="h-96 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis
                          dataKey="name"
                          stroke="#9CA3AF"
                          fontSize={12}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis
                          stroke="#9CA3AF"
                          fontSize={12}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1F2937',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#F9FAFB'
                          }}
                          formatter={(value, name, props) => [
                            `${value} ${props.payload.unit}`,
                            'การใช้งาน'
                          ]}
                          labelFormatter={(label, payload) => {
                            const item = payload?.[0]?.payload
                            return item?.fullName || label
                          }}
                        />
                        <Bar
                          dataKey="used"
                          fill="#3B82F6"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* List View */}
                {viewMode === 'list' && (
                  <div className="space-y-4">
                    {filteredUsageItems.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-gray-700 rounded-lg border border-gray-600 hover:bg-gray-600 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-lg">
                              {getCategoryEmoji(item.category)}
                            </span>
                          </div>

                          <div>
                            <h3 className="font-semibold text-white text-lg">{item.name}</h3>
                            <div className="flex items-center space-x-2 text-sm text-gray-400">
                              <span>{item.category}</span>
                              <span>•</span>
                              <span>การใช้งานวันนี้</span>
                            </div>
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
              </>
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