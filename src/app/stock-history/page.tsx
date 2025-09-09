'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Clock, Package, User, RefreshCw, ArrowLeft } from 'lucide-react'
import EditableStockEntry from '@/app/staff/components/EditableStockEntry'

interface StockLog {
  id: number
  productId: number
  quantityRemaining: number
  date: string
  createdAt: string
  notes?: string
  product: {
    name: string
    unit: string
  }
  user: {
    name: string
    username: string
  }
}

export default function StockHistoryPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [stockLogs, setStockLogs] = useState<StockLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStockLogs = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/stock-logs?limit=20', {
        credentials: 'include'
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setStockLogs(data.stockLogs || [])
      } else {
        setError(data.error || 'เกิดข้อผิดพลาดในการโหลดข้อมูล')
      }
    } catch {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchStockLogs()
    }
  }, [user])

  const handleEditSuccess = () => {
    fetchStockLogs() // Refresh data after successful edit
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-black border-b border-white sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-800 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">ประวัติการบันทึกสต็อก</h1>
                <p className="text-sm text-white">แก้ไขได้ภายใน 2 ชั่วโมง</p>
              </div>
            </div>
            <button
              onClick={fetchStockLogs}
              disabled={loading}
              className="p-2 hover:bg-gray-800 rounded-full transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 text-white ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading && stockLogs.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white">กำลังโหลดข้อมูล...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 text-sm">!</span>
              </div>
              <p className="text-red-800">{error}</p>
            </div>
            <button
              onClick={fetchStockLogs}
              className="mt-3 text-red-600 hover:text-red-800 underline text-sm"
            >
              ลองใหม่
            </button>
          </div>
        ) : stockLogs.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-white mb-2">ยังไม่มีข้อมูลการบันทึกสต็อก</h3>
            <p className="text-white">เมื่อมีการบันทึกสต็อกจะแสดงที่นี่</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Info Card */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">เงื่อนไขการแก้ไข</h3>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p>• STAFF: แก้ไขได้เฉพาะข้อมูลตัวเอง ภายใน 2 ชั่วโมงและวันเดียวกัน</p>
                    <p>• OWNER: แก้ไขได้ทุกข้อมูล</p>
                    <p>• การแก้ไขจะบันทึกประวัติและเหตุผล</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stock Logs */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">รายการล่าสุด</h2>
              
              {stockLogs.map((log) => (
                <div key={log.id}>
                  <EditableStockEntry
                    stockLog={log}
                    onEditSuccess={handleEditSuccess}
                  />
                  
                  {/* Additional Info */}
                  <div className="mt-2 px-4 py-2 bg-gray-50 rounded-b-xl border-t border-gray-200 text-sm text-gray-600">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span>บันทึกโดย: {log.user.name}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Package className="w-3 h-3" />
                          <span>วันที่: {new Date(log.date).toLocaleDateString('th-TH')}</span>
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        ID: {log.id}
                      </span>
                    </div>
                    
                    {log.notes && (
                      <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                        <p className="text-xs text-gray-700 whitespace-pre-wrap">{log.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}