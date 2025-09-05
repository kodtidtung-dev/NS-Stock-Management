'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useProducts } from '@/hooks/useProducts'
import { useStockLogs } from '@/hooks/useStockLogs'
import { Coffee, Package, Save, LogOut, User, CheckCircle2, AlertCircle, Clock, Filter } from 'lucide-react'

export default function StaffPage() {
  const { user, logout } = useAuth()
  const { products, refetch: refetchProducts } = useProducts()
  const { submitStockData, loading: submitting } = useStockLogs()
  const router = useRouter()

  const [stockData, setStockData] = useState<Record<number, string>>({})
  const [notes, setNotes] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('ทั้งหมด')

  // Redirect if not staff
  useEffect(() => {
    if (user && user.role !== 'STAFF') {
      router.push('/dashboard')
    }
  }, [user, router])

  const handleInputChange = (productId: number, value: string) => {
    setStockData(prev => ({
      ...prev,
      [productId]: value
    }))
  }

  const getCurrentDate = () => {
    const today = new Date()
    return today.toLocaleDateString('th-TH', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('th-TH', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const getStockStatus = (currentValue: string, minStock: number) => {
    const value = parseFloat(currentValue)
    if (isNaN(value) || currentValue === '') return 'empty'
    if (value === 0) return 'out'
    if (value <= minStock) return 'low'
    return 'ok'
  }

  const getStockIcon = (status: string) => {
    switch (status) {
      case 'ok': return <CheckCircle2 className="w-5 h-5 text-gray-300" />
      case 'low': return <AlertCircle className="w-5 h-5 text-gray-400" />
      case 'out': return <AlertCircle className="w-5 h-5 text-white" />
      default: return <Package className="w-5 h-5 text-gray-500" />
    }
  }

  const getInputBorderColor = (status: string) => {
    switch (status) {
      case 'ok': return 'border-gray-500 focus:border-gray-300 focus:ring-gray-300'
      case 'low': return 'border-gray-400 focus:border-gray-300 focus:ring-gray-300'
      case 'out': return 'border-white focus:border-gray-300 focus:ring-gray-300'
      default: return 'border-gray-600 focus:border-white focus:ring-white'
    }
  }

  const handleSave = async () => {
    // Validate that at least some fields are filled
    const filledItems = Object.entries(stockData).filter(([, value]) => value !== '')
    if (filledItems.length === 0) {
      alert('กรุณากรอกข้อมูลอย่างน้อย 1 รายการ')
      return
    }

    // Prepare data for API
    const today = new Date().toISOString().split('T')[0]
    const stockDataArray = filledItems.map(([productId, value]) => ({
      productId: parseInt(productId),
      quantityRemaining: parseFloat(value)
    }))

    const result = await submitStockData(today, stockDataArray, notes)
    
    if (result.success) {
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
      // Refresh products to get updated stock levels
      refetchProducts()
      // Reset form
      setStockData({})
      setNotes('')
    } else {
      alert('เกิดข้อผิดพลาด: ' + (result.error || 'กรุณาลองใหม่'))
    }
  }

  const completedCount = Object.values(stockData).filter(value => value !== '').length
  const totalCount = products.filter(p => p.active).length

  // Get all categories for filter dropdown
  const allCategories = ['ทั้งหมด', ...Array.from(new Set(
    products.filter(p => p.active).map(p => p.category?.name || 'ไม่มีหมวดหมู่')
  )).sort((a, b) => {
    if (a === 'ไม่มีหมวดหมู่') return 1
    if (b === 'ไม่มีหมวดหมู่') return -1
    return a.localeCompare(b, 'th')
  })]

  // Filter products based on selected category
  const filteredProducts = products.filter(p => {
    if (!p.active) return false
    if (selectedCategory === 'ทั้งหมด') return true
    const productCategory = p.category?.name || 'ไม่มีหมวดหมู่'
    return productCategory === selectedCategory
  })

  // Group filtered products by category
  const groupedProducts = filteredProducts.reduce((acc, product) => {
    const categoryName = product.category?.name || 'ไม่มีหมวดหมู่'
    if (!acc[categoryName]) {
      acc[categoryName] = []
    }
    acc[categoryName].push(product)
    return acc
  }, {} as Record<string, typeof products>)

  // Sort categories alphabetically, but put "ไม่มีหมวดหมู่" at the end
  const sortedCategoryNames = Object.keys(groupedProducts).sort((a, b) => {
    if (a === 'ไม่มีหมวดหมู่') return 1
    if (b === 'ไม่มีหมวดหมู่') return -1
    return a.localeCompare(b, 'th')
  })

  // Update completed count based on filtered products
  const filteredCompletedCount = Object.entries(stockData).filter(([productId, value]) => {
    const product = products.find(p => p.id === parseInt(productId))
    return product && filteredProducts.includes(product) && value !== ''
  }).length
  
  const filteredTotalCount = filteredProducts.length

  if (!user) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
    </div>
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <Coffee className="w-5 h-5 text-black" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">อัปเดตสต็อก</h1>
                <p className="text-sm text-gray-300">{getCurrentDate()}</p>
              </div>
            </div>
            <button 
              onClick={logout}
              className="p-2 hover:bg-gray-700 rounded-full transition-colors"
            >
              <LogOut className="w-5 h-5 text-gray-300" />
            </button>
          </div>

          {/* Category Filter */}
          <div className="mt-4 mb-4">
            <div className="flex items-center space-x-3">
              <Filter className="w-4 h-4 text-gray-300" />
              <span className="text-sm text-gray-300">กรองตามหมวดหมู่:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 bg-gray-700 text-white text-sm rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {allCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-300">
                ความคืบหน้า {selectedCategory !== 'ทั้งหมด' && `(${selectedCategory})`}
              </span>
              <span className="text-sm font-semibold text-white">
                {selectedCategory === 'ทั้งหมด' ? `${completedCount}/${totalCount}` : `${filteredCompletedCount}/${filteredTotalCount}`}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-white h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: selectedCategory === 'ทั้งหมด' 
                    ? `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`
                    : `${filteredTotalCount > 0 ? (filteredCompletedCount / filteredTotalCount) * 100 : 0}%`
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Stock Items - Grouped by Category */}
      <div className="p-4 space-y-6">
        {sortedCategoryNames.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-400 mb-2">
              ไม่พบสินค้าในหมวดหมู่ &quot;{selectedCategory}&quot;
            </h3>
            <p className="text-gray-500">
              ลองเลือกหมวดหมู่อื่น หรือเลือก &quot;ทั้งหมด&quot; เพื่อดูสินค้าทั้งหมด
            </p>
          </div>
        ) : (
          sortedCategoryNames.map((categoryName) => (
          <div key={categoryName} className="space-y-3">
            {/* Category Header */}
            <div className="flex items-center space-x-3 mb-4">
              <div className="h-1 bg-gray-600 flex-1 rounded"></div>
              <h2 className="text-lg font-bold text-white px-3 py-1 bg-gray-700 rounded-full border border-gray-600">
                {categoryName}
              </h2>
              <div className="h-1 bg-gray-600 flex-1 rounded"></div>
            </div>

            {/* Products in this category */}
            <div className="space-y-3">
              {groupedProducts[categoryName].map((product) => {
                const currentValue = stockData[product.id] || ''
                const status = getStockStatus(currentValue, product.minimumStock)
                return (
                  <div key={product.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700 shadow-sm">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getStockIcon(status)}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-white mb-1">{product.name}</h3>
                        <p className="text-sm text-gray-400 mb-3">
                          หน่วย: {product.unit} • ขั้นต่ำ: {product.minimumStock} {product.unit}
                          {product.currentStock > 0 && (
                            <span className="ml-2">• เหลือเดิม: {product.currentStock} {product.unit}</span>
                          )}
                        </p>
                        
                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={currentValue}
                            onChange={(e) => handleInputChange(product.id, e.target.value)}
                            className={`w-full px-4 py-3 border-2 rounded-xl text-lg font-semibold text-center transition-all duration-200 outline-none bg-gray-700 text-white placeholder-gray-400 ${getInputBorderColor(status)}`}
                            placeholder={`คงเหลือ (${product.unit})`}
                          />
                          
                          {/* Status indicator */}
                          {currentValue !== '' && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              {status === 'low' && (
                                <div className="bg-gray-600 text-gray-200 text-xs px-2 py-1 rounded-full font-semibold">
                                  ใกล้หมด
                                </div>
                              )}
                              {status === 'out' && (
                                <div className="bg-gray-700 text-white text-xs px-2 py-1 rounded-full font-semibold">
                                  หมดแล้ว
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          ))
        )}
      </div>

      {/* Notes Section */}
      <div className="p-4">
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 shadow-sm">
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            หมายเหตุเพิ่มเติม (ไม่บังคับ)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-4 py-3 border border-gray-600 rounded-xl focus:ring-2 focus:ring-white focus:border-white transition-all duration-200 outline-none resize-none bg-gray-700 text-white placeholder-gray-400"
            rows={3}
            placeholder="เช่น มีของเสียหาย, พบของเพิ่มในตู้เย็น..."
          />
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="sticky bottom-0 bg-gray-800 border-t border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2 text-sm text-gray-300">
            <Clock className="w-4 h-4" />
            <span>อัปเดตล่าสุด: {getCurrentTime()}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-300">
            <User className="w-4 h-4" />
            <span>{user.name}</span>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={submitting || completedCount === 0}
          className="w-full bg-white text-black py-4 px-6 rounded-xl font-semibold text-lg hover:bg-gray-100 focus:ring-4 focus:ring-gray-300 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              <span>กำลังบันทึก...</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>บันทึกข้อมูล ({completedCount}/{totalCount})</span>
            </>
          )}
        </button>
      </div>

      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-4 left-4 right-4 bg-gray-700 text-white p-4 rounded-xl shadow-lg z-50 flex items-center space-x-3 border border-gray-600">
          <CheckCircle2 className="w-6 h-6" />
          <div>
            <p className="font-semibold">บันทึกสำเร็จ!</p>
            <p className="text-sm opacity-90">ข้อมูลสต็อกได้รับการอัปเดตแล้ว</p>
          </div>
        </div>
      )}
    </div>
  )
}

