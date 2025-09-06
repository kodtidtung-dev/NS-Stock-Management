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

  // Redirect if not staff or owner
  useEffect(() => {
    if (user && user.role !== 'STAFF' && user.role !== 'OWNER') {
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
      case 'ok': return <CheckCircle2 className="w-5 h-5 text-green-600" />
      case 'low': return <AlertCircle className="w-5 h-5 text-yellow-600" />
      case 'out': return <AlertCircle className="w-5 h-5 text-red-600" />
      default: return <Package className="w-5 h-5 text-black" />
    }
  }

  const getInputBorderColor = (status: string) => {
    switch (status) {
      case 'ok': return 'border-green-300 focus:border-green-500 focus:ring-green-500'
      case 'low': return 'border-yellow-300 focus:border-yellow-500 focus:ring-yellow-500'
      case 'out': return 'border-red-300 focus:border-red-500 focus:ring-red-500'
      default: return 'border-gray-300 focus:border-black focus:ring-black'
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
    return <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
    </div>
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-white border-b-2 border-black sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center border border-black">
                <Coffee className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-black tracking-tight">อัปเดตสต็อก</h1>
                <p className="text-sm text-black font-medium">{getCurrentDate()}</p>
              </div>
            </div>
            <button 
              onClick={logout}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors border border-gray-300"
            >
              <LogOut className="w-5 h-5 text-black" />
            </button>
          </div>

          {/* Category Filter */}
          <div className="mt-4 mb-4">
            <div className="flex items-center space-x-3">
              <Filter className="w-4 h-4 text-black" />
              <span className="text-sm text-black font-medium">กรองตามหมวดหมู่:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 bg-gray-100 text-black text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
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
              <span className="text-sm text-black font-medium">
                ความคืบหน้า {selectedCategory !== 'ทั้งหมด' && `(${selectedCategory})`}
              </span>
              <span className="text-sm font-extrabold text-black">
                {selectedCategory === 'ทั้งหมด' ? `${completedCount}/${totalCount}` : `${filteredCompletedCount}/${filteredTotalCount}`}
              </span>
            </div>
            <div className="w-full bg-gray-300 rounded-full h-2">
              <div 
                className="bg-black h-2 rounded-full transition-all duration-300"
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
            <Package className="w-16 h-16 mx-auto mb-4 text-white" />
            <h3 className="text-lg font-extrabold text-white mb-2 tracking-tight">
              ไม่พบสินค้าในหมวดหมู่ &quot;{selectedCategory}&quot;
            </h3>
            <p className="text-white">
              ลองเลือกหมวดหมู่อื่น หรือเลือก &quot;ทั้งหมด&quot; เพื่อดูสินค้าทั้งหมด
            </p>
          </div>
        ) : (
          sortedCategoryNames.map((categoryName) => (
          <div key={categoryName} className="space-y-3">
            {/* Category Header */}
            <div className="flex items-center space-x-3 mb-4">
              <div className="h-1 bg-white flex-1 rounded"></div>
              <h2 className="text-lg font-extrabold text-black px-4 py-2 bg-white rounded-full border-2 border-black tracking-tight">
                {categoryName}
              </h2>
              <div className="h-1 bg-white flex-1 rounded"></div>
            </div>

            {/* Products in this category */}
            <div className="space-y-3">
              {groupedProducts[categoryName].map((product) => {
                const currentValue = stockData[product.id] || ''
                const status = getStockStatus(currentValue, product.minimumStock)
                return (
                  <div key={product.id} className="bg-white rounded-xl p-4 border-2 border-black shadow-sm">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getStockIcon(status)}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-extrabold text-black mb-1 tracking-tight">{product.name}</h3>
                        <p className="text-sm text-black mb-3 font-medium">
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
                            className={`w-full px-4 py-3 border-2 rounded-xl text-lg font-extrabold text-center transition-all duration-200 outline-none bg-gray-100 text-black placeholder-gray-500 ${getInputBorderColor(status)}`}
                            placeholder={`คงเหลือ (${product.unit})`}
                          />
                          
                          {/* Status indicator */}
                          {currentValue !== '' && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              {status === 'low' && (
                                <div className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-extrabold border border-yellow-300">
                                  ใกล้หมด
                                </div>
                              )}
                              {status === 'out' && (
                                <div className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-extrabold border border-red-300">
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
        <div className="bg-white rounded-xl p-4 border-2 border-black shadow-sm">
          <label className="block text-sm font-extrabold text-black mb-2 tracking-tight">
            หมายเหตุเพิ่มเติม (ไม่บังคับ)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-black transition-all duration-200 outline-none resize-none bg-gray-100 text-black placeholder-gray-500 font-medium"
            rows={3}
            placeholder="เช่น มีของเสียหาย, พบของเพิ่มในตู้เย็น..."
          />
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="sticky bottom-0 bg-white border-t-2 border-black p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2 text-sm text-black font-medium">
            <Clock className="w-4 h-4" />
            <span>อัปเดตล่าสุด: {getCurrentTime()}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-black font-medium">
            <User className="w-4 h-4" />
            <span>{user.name}</span>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={submitting || completedCount === 0}
          className="w-full bg-black text-white py-4 px-6 rounded-xl font-extrabold text-lg hover:bg-gray-800 focus:ring-4 focus:ring-gray-300 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-black tracking-tight"
        >
          {submitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
        <div className="fixed top-4 left-4 right-4 bg-white text-black p-4 rounded-xl shadow-lg z-50 flex items-center space-x-3 border-2 border-black">
          <CheckCircle2 className="w-6 h-6 text-green-600" />
          <div>
            <p className="font-extrabold">บันทึกสำเร็จ!</p>
            <p className="text-sm font-medium">ข้อมูลสต็อกได้รับการอัปเดตแล้ว</p>
          </div>
        </div>
      )}
    </div>
  )
}

