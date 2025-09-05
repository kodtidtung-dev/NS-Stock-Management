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
      default: return 'text-gray-400'
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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">กำลังโหลดรายงาน...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.location.href = '/dashboard'}
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
                <h1 className="text-2xl font-bold text-white">รายงานประจำสัปดาห์</h1>
                <p className="text-gray-300">วิเคราะห์การใช้งานและแนวโน้ม</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(Number(e.target.value))}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {getWeekOptions().map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="text-sm font-medium">รีเฟรช</span>
              </button>
              
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                <Download className="w-4 h-4" />
                <span className="text-sm font-medium">ดาวน์โหลด</span>
              </button>
              
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <User className="w-4 h-4" />
                <span>{user.name}</span>
              </div>
              
              <button 
                onClick={handleLogout}
                className="p-2 hover:bg-gray-700 rounded-full transition-colors"
              >
                <LogOut className="w-5 h-5 text-gray-300" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Week Period */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">ช่วงเวลา</h2>
                <p className="text-gray-300">
                  {weeklyData ? `${formatDate(weeklyData.weekStart)} - ${formatDate(weeklyData.weekEnd)}` : 'ไม่มีข้อมูล'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">สรุปรายงาน</p>
              <p className="font-bold text-white">7 วัน</p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-400">รายการสินค้า</p>
                <p className="text-2xl font-bold text-white">{weeklyData?.summary.totalProducts || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-400">ใช้มากที่สุด</p>
                <p className="text-2xl font-bold text-white">
                  {weeklyData?.summary.mostUsedProducts.length || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-400">ใช้น้อยที่สุด</p>
                <p className="text-2xl font-bold text-white">
                  {weeklyData?.summary.leastUsedProducts.length || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-400">การใช้งานรวม</p>
                <p className="text-2xl font-bold text-white">{weeklyData?.summary.totalUsage.toFixed(0) || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Used Products */}
          <div className="bg-gray-800 rounded-xl border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <span>สินค้าที่ใช้มากที่สุด</span>
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {!weeklyData?.summary.mostUsedProducts || weeklyData.summary.mostUsedProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Package className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                  <p>ไม่มีข้อมูลการใช้งาน</p>
                </div>
              ) : (
                weeklyData.summary.mostUsedProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-white">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-white">{product.name}</p>
                        <p className="text-sm text-gray-400">เฉลี่ย {product.dailyAverage.toFixed(1)} {product.unit}/วัน</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-400">{product.totalUsed.toFixed(1)} {product.unit}</p>
                      <p className="text-xs text-gray-400">ใช้ทั้งสัปดาห์</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Trends Analysis */}
          <div className="bg-gray-800 rounded-xl border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                <span>แนวโน้มการใช้งาน</span>
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {!weeklyData?.trends || weeklyData.trends.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                  <p>ไม่มีข้อมูลแนวโน้ม</p>
                </div>
              ) : (
                weeklyData.trends.slice(0, 5).map((trend, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getTrendIcon(trend.trend)}
                      <div>
                        <p className="font-semibold text-white">{trend.productName}</p>
                        <p className="text-sm text-gray-400">
                          {trend.currentWeek.toFixed(1)} vs {trend.previousWeek.toFixed(1)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${getTrendColor(trend.trend)}`}>
                        {trend.percentage > 0 ? '+' : ''}{trend.percentage.toFixed(1)}%
                      </p>
                      <p className="text-xs text-gray-400">เปรียบเทียบ</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Daily Usage Chart */}
        <div className="bg-gray-800 rounded-xl border border-gray-700">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Clock className="w-5 h-5 text-purple-400" />
              <span>การใช้งานรายวัน</span>
            </h2>
          </div>
          <div className="p-6">
            {!weeklyData?.dailyUsage || weeklyData.dailyUsage.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Clock className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                <p>ไม่มีข้อมูลรายวัน</p>
              </div>
            ) : (
              <div className="space-y-4">
                {weeklyData.dailyUsage.map((day, index) => (
                  <div key={index} className="p-4 bg-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-white">{formatDate(day.date)}</h3>
                      <span className="text-sm text-gray-400">{day.totalItems} รายการ</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {day.products.slice(0, 6).map((product, pidx) => (
                        <div key={pidx} className="flex items-center justify-between p-2 bg-gray-600 rounded">
                          <span className="text-sm text-gray-300">{product.name}</span>
                          <span className="text-sm font-medium text-white">
                            {product.used.toFixed(1)} {product.unit}
                          </span>
                        </div>
                      ))}
                    </div>
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