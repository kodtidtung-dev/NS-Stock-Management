'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { 
  Calendar, 
  TrendingDown, 
  TrendingUp,
  Package, 
  BarChart3, 
  Clock,
  User,
  LogOut,
  RefreshCw,
  ArrowLeft,
  Download
} from 'lucide-react'
import Image from 'next/image'

interface WeeklyData {
  weekStart: string
  weekEnd: string
  summary: {
    totalUsage: number
    totalProducts: number
    mostUsedProducts: Array<{
      name: string
      totalUsed: number
      unit: string
      dailyAverage: number
    }>
    leastUsedProducts: Array<{
      name: string
      totalUsed: number
      unit: string
      dailyAverage: number
    }>
  }
  dailyUsage: Array<{
    date: string
    totalItems: number
    products: Array<{
      name: string
      used: number
      unit: string
    }>
  }>
  trends: Array<{
    productName: string
    trend: 'up' | 'down' | 'stable'
    percentage: number
    currentWeek: number
    previousWeek: number
  }>
}

const WeeklyReportPage = () => {
  const [user] = useState({
    name: 'เจ้าของร้าน',
    role: 'OWNER'
  })

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [weeklyData, setWeeklyData] = useState<WeeklyData | null>(null)
  const [selectedWeek, setSelectedWeek] = useState(0) // 0 = current week, 1 = last week, etc.

  const fetchWeeklyData = useCallback(async () => {
    try {
      const response = await fetch(`/api/weekly-report?week=${selectedWeek}`)
      if (response.ok) {
        const data = await response.json()
        setWeeklyData(data)
      } else {
        // Fallback data if API fails
        setWeeklyData({
          weekStart: '2025-09-01',
          weekEnd: '2025-09-07',
          summary: {
            totalUsage: 0,
            totalProducts: 0,
            mostUsedProducts: [],
            leastUsedProducts: []
          },
          dailyUsage: [],
          trends: []
        })
      }
    } catch (error) {
      console.error('Error fetching weekly data:', error)
      setWeeklyData({
        weekStart: '2025-09-01',
        weekEnd: '2025-09-07',
        summary: {
          totalUsage: 0,
          totalProducts: 0,
          mostUsedProducts: [],
          leastUsedProducts: []
        },
        dailyUsage: [],
        trends: []
      })
    } finally {
      setLoading(false)
    }
  }, [selectedWeek])

  useEffect(() => {
    fetchWeeklyData()
  }, [fetchWeeklyData])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchWeeklyData()
    await new Promise(resolve => setTimeout(resolve, 500))
    setRefreshing(false)
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      window.location.href = '/login'
    } catch (error) {
      console.error('Logout error:', error)
      window.location.href = '/login'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-400" />
      case 'down': return <TrendingDown className="w-4 h-4 text-red-400" />
      default: return <div className="w-4 h-4 bg-gray-400 rounded-full" />
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-400'
      case 'down': return 'text-red-400'
      default: return 'text-gray-600'
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const getWeekOptions = () => {
    const options = []
    for (let i = 0; i < 4; i++) {
      const date = new Date()
      date.setDate(date.getDate() - (i * 7))
      const weekStart = new Date(date.setDate(date.getDate() - date.getDay()))
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      
      options.push({
        value: i,
        label: i === 0 ? 'สัปดาห์นี้' : i === 1 ? 'สัปดาห์ที่แล้ว' : `${i + 1} สัปดาห์ที่แล้ว`,
        dateRange: `${formatDate(weekStart.toISOString())} - ${formatDate(weekEnd.toISOString())}`
      })
    }
    return options
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-black">กำลังโหลดรายงาน...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-black border-b border-white">
        <div className="max-w-7xl mx-auto px-4 py-4 lg:py-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Left section - Logo and Title */}
            <div className="flex items-center space-x-3 lg:space-x-4">
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              
              <Image 
                src="/ns.logowhite.png" 
                alt="NS Logo" 
                width={60} 
                height={60} 
                className="object-contain lg:w-[80px] lg:h-[80px]"
              />
              
              <div>
                <h1 className="text-lg lg:text-2xl font-bold text-white">รายงานประจำสัปดาห์</h1>
                <p className="text-sm lg:text-base text-white hidden sm:block">วิเคราะห์การใช้งานและแนวโน้ม</p>
              </div>
            </div>
            
            {/* Right section - Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 lg:gap-4">
              {/* Week selector */}
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(Number(e.target.value))}
                className="px-3 py-2 bg-gray-100 text-black rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                {getWeekOptions().map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              
              {/* Button group */}
              <div className="flex gap-2">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center justify-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-black rounded-lg transition-colors disabled:opacity-50 flex-1 sm:flex-none"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  <span className="text-sm font-medium hidden sm:inline">รีเฟรช</span>
                </button>
                
                <button className="flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-black rounded-lg transition-colors flex-1 sm:flex-none">
                  <Download className="w-4 h-4" />
                  <span className="text-sm font-medium hidden sm:inline">ดาวน์โหลด</span>
                </button>
              </div>
              
              {/* User info - hidden on mobile */}
              <div className="hidden lg:flex items-center space-x-2 text-sm text-white">
                <User className="w-4 h-4" />
                <span>{user.name}</span>
              </div>
              
              <button 
                onClick={handleLogout}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors self-end sm:self-auto"
                title="ออกจากระบบ"
              >
                <LogOut className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4 lg:py-6 space-y-4 lg:space-y-6">
        {/* Week Period */}
        <div className="bg-white rounded-xl p-4 lg:p-6 border border-gray-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3 lg:space-x-4">
              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base lg:text-lg font-bold text-black">ช่วงเวลา</h2>
                <p className="text-sm lg:text-base text-gray-700">
                  {weeklyData ? `${formatDate(weeklyData.weekStart)} - ${formatDate(weeklyData.weekEnd)}` : 'ไม่มีข้อมูล'}
                </p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-sm text-gray-600">สรุปรายงาน</p>
              <p className="font-bold text-black">7 วัน</p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
          <div className="bg-white rounded-xl p-4 lg:p-6 border border-gray-300">
            <div className="flex items-center space-x-2 lg:space-x-3">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs lg:text-sm text-black truncate">รายการสินค้า</p>
                <p className="text-lg lg:text-2xl font-bold text-black">{weeklyData?.summary.totalProducts || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 lg:p-6 border border-gray-300">
            <div className="flex items-center space-x-2 lg:space-x-3">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs lg:text-sm text-gray-600 truncate">ใช้มากที่สุด</p>
                <p className="text-lg lg:text-2xl font-bold text-black">
                  {weeklyData?.summary.mostUsedProducts.length || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 lg:p-6 border border-gray-300">
            <div className="flex items-center space-x-2 lg:space-x-3">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-yellow-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingDown className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs lg:text-sm text-gray-600 truncate">ใช้น้อยที่สุด</p>
                <p className="text-lg lg:text-2xl font-bold text-black">
                  {weeklyData?.summary.leastUsedProducts.length || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 lg:p-6 border border-gray-300">
            <div className="flex items-center space-x-2 lg:space-x-3">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs lg:text-sm text-gray-600 truncate">การใช้งานรวม</p>
                <p className="text-lg lg:text-2xl font-bold text-black">{weeklyData?.summary.totalUsage.toFixed(0) || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Top Used Products */}
          <div className="bg-white rounded-xl border border-gray-300">
            <div className="p-4 lg:p-6 border-b border-gray-300">
              <h2 className="text-base lg:text-lg font-bold text-black flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 lg:w-5 lg:h-5 text-green-400" />
                <span>สินค้าที่ใช้มากที่สุด</span>
              </h2>
            </div>
            <div className="p-4 lg:p-6 space-y-3 lg:space-y-4">
              {!weeklyData?.summary.mostUsedProducts || weeklyData.summary.mostUsedProducts.length === 0 ? (
                <div className="text-center py-6 lg:py-8 text-gray-600">
                  <Package className="w-10 h-10 lg:w-12 lg:h-12 mx-auto mb-3 lg:mb-4 text-gray-500" />
                  <p className="text-sm lg:text-base">ไม่มีข้อมูลการใช้งาน</p>
                </div>
              ) : (
                weeklyData.summary.mostUsedProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 lg:p-4 bg-gray-100 rounded-lg">
                    <div className="flex items-center space-x-2 lg:space-x-3 min-w-0 flex-1">
                      <div className="w-6 h-6 lg:w-8 lg:h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs lg:text-sm font-bold text-black">{index + 1}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-black text-sm lg:text-base truncate">{product.name}</p>
                        <p className="text-xs lg:text-sm text-gray-600">เฉลี่ย {product.dailyAverage.toFixed(1)} {product.unit}/วัน</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="font-bold text-green-400 text-sm lg:text-base">{product.totalUsed.toFixed(1)} {product.unit}</p>
                      <p className="text-xs text-gray-600">ใช้ทั้งสัปดาห์</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Trends Analysis */}
          <div className="bg-white rounded-xl border border-gray-300">
            <div className="p-4 lg:p-6 border-b border-gray-300">
              <h2 className="text-base lg:text-lg font-bold text-black flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 lg:w-5 lg:h-5 text-blue-400" />
                <span>แนวโน้มการใช้งาน</span>
              </h2>
            </div>
            <div className="p-4 lg:p-6 space-y-3 lg:space-y-4">
              {!weeklyData?.trends || weeklyData.trends.length === 0 ? (
                <div className="text-center py-6 lg:py-8 text-gray-600">
                  <BarChart3 className="w-10 h-10 lg:w-12 lg:h-12 mx-auto mb-3 lg:mb-4 text-gray-500" />
                  <p className="text-sm lg:text-base">ไม่มีข้อมูลแนวโน้ม</p>
                </div>
              ) : (
                weeklyData.trends.slice(0, 5).map((trend, index) => (
                  <div key={index} className="flex items-center justify-between p-3 lg:p-4 bg-gray-100 rounded-lg">
                    <div className="flex items-center space-x-2 lg:space-x-3 min-w-0 flex-1">
                      {getTrendIcon(trend.trend)}
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-black text-sm lg:text-base truncate">{trend.productName}</p>
                        <p className="text-xs lg:text-sm text-gray-600">
                          {trend.currentWeek.toFixed(1)} vs {trend.previousWeek.toFixed(1)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className={`font-bold text-sm lg:text-base ${getTrendColor(trend.trend)}`}>
                        {trend.percentage > 0 ? '+' : ''}{trend.percentage.toFixed(1)}%
                      </p>
                      <p className="text-xs text-gray-600">เปรียบเทียบ</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Daily Usage Chart */}
        <div className="bg-white rounded-xl border border-gray-300">
          <div className="p-4 lg:p-6 border-b border-gray-300">
            <h2 className="text-base lg:text-lg font-bold text-black flex items-center space-x-2">
              <Clock className="w-4 h-4 lg:w-5 lg:h-5 text-purple-400" />
              <span>การใช้งานรายวัน</span>
            </h2>
          </div>
          <div className="p-4 lg:p-6">
            {!weeklyData?.dailyUsage || weeklyData.dailyUsage.length === 0 ? (
              <div className="text-center py-6 lg:py-8 text-gray-600">
                <Clock className="w-10 h-10 lg:w-12 lg:h-12 mx-auto mb-3 lg:mb-4 text-gray-500" />
                <p className="text-sm lg:text-base">ไม่มีข้อมูลรายวัน</p>
              </div>
            ) : (
              <div className="space-y-3 lg:space-y-4">
                {weeklyData.dailyUsage.map((day, index) => (
                  <div key={index} className="p-3 lg:p-4 bg-gray-100 rounded-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <h3 className="font-semibold text-black text-sm lg:text-base">{formatDate(day.date)}</h3>
                      <span className="text-xs lg:text-sm text-gray-600">{day.totalItems} รายการ</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-3">
                      {day.products.slice(0, 6).map((product, pidx) => (
                        <div key={pidx} className="flex items-center justify-between p-2 bg-gray-200 rounded text-xs lg:text-sm">
                          <span className="text-gray-700 truncate flex-1 mr-2">{product.name}</span>
                          <span className="font-medium text-black flex-shrink-0">
                            {product.used.toFixed(1)} {product.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                    {day.products.length > 6 && (
                      <div className="mt-2 text-center">
                        <span className="text-xs text-gray-600">และอีก {day.products.length - 6} รายการ</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default WeeklyReportPage