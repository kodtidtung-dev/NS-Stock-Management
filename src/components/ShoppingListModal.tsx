'use client'

import React, { useState, useEffect } from 'react'
import { X, ShoppingBag, AlertTriangle, TrendingDown, CheckCircle } from 'lucide-react'

interface ShoppingItem {
  id: number
  name: string
  currentStock: number
  minimumStock: number
  unit: string
  isLowStock: boolean
  category?: {
    name: string
  }
  purchaseAmount: number
}

interface ShoppingListModalProps {
  isOpen: boolean
  onClose: () => void
  onStockUpdated: () => void
}

const ShoppingListModal: React.FC<ShoppingListModalProps> = ({ isOpen, onClose, onStockUpdated }) => {
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([])
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState<number | 'all' | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchShoppingItems()
    }
  }, [isOpen])

  const fetchShoppingItems = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/products')
      if (response.ok) {
        const data = await response.json()
        // Filter for low stock and out of stock items
        const needToBuy = data.products?.filter((product: { isLowStock: boolean; currentStock: number }) => 
          product.isLowStock || product.currentStock === 0
        ).map((product: { id: number; name: string; currentStock: number; minimumStock: number; unit: string; isLowStock: boolean; category?: { name: string } }) => ({
          id: product.id,
          name: product.name,
          currentStock: product.currentStock,
          minimumStock: product.minimumStock,
          unit: product.unit,
          isLowStock: product.isLowStock,
          category: product.category,
          purchaseAmount: 0
        })) || []
        
        setShoppingItems(needToBuy)
      }
    } catch (error) {
      console.error('Error fetching shopping items:', error)
    } finally {
      setLoading(false)
    }
  }

  const updatePurchaseAmount = (itemId: number, amount: number) => {
    setShoppingItems(items =>
      items.map(item =>
        item.id === itemId
          ? { ...item, purchaseAmount: Math.max(0, amount) }
          : item
      )
    )
  }

  const addToPurchaseAmount = (itemId: number, amount: number) => {
    setShoppingItems(items =>
      items.map(item =>
        item.id === itemId
          ? { ...item, purchaseAmount: item.purchaseAmount + amount }
          : item
      )
    )
  }

  const updateAllStocks = async () => {
    const itemsToUpdate = shoppingItems.filter(item => item.purchaseAmount > 0)
    if (itemsToUpdate.length === 0) return

    setUpdating('all')
    try {
      // Update all items in parallel
      const updatePromises = itemsToUpdate.map(item =>
        fetch('/api/stock-logs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productId: item.id,
            quantityUsed: -item.purchaseAmount, // Negative for stock increase
            reason: 'เจ้าของร้านซื้อเข้า'
          }),
        })
      )

      const results = await Promise.all(updatePromises)
      const allSuccessful = results.every(response => response.ok)

      if (allSuccessful) {
        // Remove all updated items from shopping list
        const updatedIds = itemsToUpdate.map(item => item.id)
        setShoppingItems(items => items.filter(item => !updatedIds.includes(item.id)))
        onStockUpdated()
      } else {
        console.error('Some stock updates failed')
      }
    } catch (error) {
      console.error('Error updating stocks:', error)
    } finally {
      setUpdating(null)
    }
  }

  const getStatusIcon = (item: ShoppingItem) => {
    if (item.currentStock === 0) {
      return <AlertTriangle className="w-4 h-4 text-white" />
    } else {
      return <TrendingDown className="w-4 h-4 text-white" />
    }
  }

  const getStatusColor = (item: ShoppingItem) => {
    if (item.currentStock === 0) {
      return 'bg-red-600'
    } else {
      return 'bg-yellow-600'
    }
  }

  const getStatusText = (item: ShoppingItem) => {
    if (item.currentStock === 0) {
      return 'หมดแล้ว'
    } else {
      return 'ใกล้หมด'
    }
  }

  const getSuggestedAmount = (item: ShoppingItem) => {
    // Suggest amount to reach minimum stock + some buffer
    const needed = Math.max(0, item.minimumStock - item.currentStock)
    const buffer = Math.ceil(item.minimumStock * 0.2) // 20% buffer
    return needed + buffer
  }

  // Check if item is measured in "ถัง" (bucket/container)
  const isBucketUnit = (unit: string) => {
    return unit.toLowerCase().includes('ถัง')
  }

  // Get fraction buttons for bucket items
  const getBucketFractions = () => [
    { label: '1/4', value: 0.25 },
    { label: '1/2', value: 0.5 },
    { label: '3/4', value: 0.75 },
    { label: '1', value: 1 },
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-[98vw] sm:max-w-3xl w-full max-h-[90vh] sm:max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border-2 sm:border-4 border-green-200">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-6 border-b-2 border-green-200 bg-gradient-to-r from-green-50 to-green-100">
          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
            <div className="w-9 h-9 sm:w-12 sm:h-12 bg-green-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
              <ShoppingBag className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight truncate">อัพเดทสินค้า</h2>
              <p className="text-xs sm:text-sm text-gray-600 font-medium">
                {shoppingItems.length} รายการ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 hover:bg-white/50 rounded-xl sm:rounded-2xl transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8 sm:py-12">
              <div className="text-gray-600 text-sm sm:text-base">กำลังโหลดรายการ...</div>
            </div>
          ) : shoppingItems.length === 0 ? (
            <div className="text-center py-8 sm:py-12 text-gray-600">
              <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-green-600" />
              <h3 className="text-base sm:text-lg font-semibold mb-2 text-green-600">ไม่มีรายการที่ต้องอัพเดท</h3>
              <p className="text-sm sm:text-base">สินค้าทั้งหมดมีสต็อกเพียงพอแล้ว</p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {/* Shopping Items */}
              {shoppingItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl sm:rounded-2xl border-2 border-gray-200 p-3 sm:p-4 hover:border-green-300 transition-all shadow-md hover:shadow-lg"
                >
                  {/* Item Header */}
                  <div className="flex items-start justify-between mb-2 sm:mb-3">
                    <div className="flex items-start space-x-2 sm:space-x-3 flex-1 min-w-0">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md ${getStatusColor(item)}`}>
                        {getStatusIcon(item)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-sm sm:text-base md:text-lg mb-1 line-clamp-1">{String(item.name || '')}</h3>
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs">
                          <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg sm:rounded-xl font-bold ${
                            item.currentStock === 0
                              ? 'bg-red-600 text-white'
                              : 'bg-yellow-400 text-black'
                          }`}>
                            {getStatusText(item)}
                          </span>
                          <span className="text-gray-600">
                            เหลือ: <span className="font-semibold text-gray-900">{(item.currentStock || 0).toLocaleString()}</span> {String(item.unit || '')}
                          </span>
                          <span className="text-gray-400 hidden sm:inline">•</span>
                          <span className="text-gray-600 hidden sm:inline">
                            ขั้นต่ำ: <span className="font-semibold">{(item.minimumStock || 0).toLocaleString()}</span> {String(item.unit || '')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Amount Buttons */}
                  <div className="space-y-2 sm:space-y-3">
                    {isBucketUnit(item.unit) ? (
                      // Bucket/Container units - show fractions
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                          เลือกส่วนของถัง:
                        </label>
                        <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                          {getBucketFractions().map((fraction) => (
                            <button
                              key={fraction.label}
                              onClick={() => addToPurchaseAmount(item.id, fraction.value)}
                              className="px-2 py-2 sm:px-3 sm:py-3 bg-blue-100 hover:bg-blue-200 active:bg-blue-300 text-blue-900 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base border-2 border-blue-300 transition-all hover:scale-105 active:scale-95 shadow-sm"
                            >
                              +{fraction.label}
                            </button>
                          ))}
                        </div>
                        <div className="text-xs text-gray-600 bg-blue-50 rounded-lg sm:rounded-xl p-1.5 sm:p-2 border border-blue-200">
                          💡 กดปุ่มเพื่อเพิ่มส่วนของถัง
                        </div>
                      </div>
                    ) : (
                      // Regular units - show numbers
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">เลือกจำนวนด่วน:</label>
                        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                          <button
                            onClick={() => updatePurchaseAmount(item.id, getSuggestedAmount(item))}
                            className="px-2 py-2 sm:px-3 sm:py-2.5 bg-green-100 hover:bg-green-200 active:bg-green-300 text-green-800 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm border-2 border-green-300 transition-all hover:scale-105 active:scale-95 shadow-sm"
                          >
                            แนะนำ<br/><span className="text-[10px] sm:text-xs">({getSuggestedAmount(item)})</span>
                          </button>
                          {[5, 10, 20, 50].map((amount) => (
                            <button
                              key={amount}
                              onClick={() => addToPurchaseAmount(item.id, amount)}
                              className="px-2 py-2 sm:px-3 sm:py-2.5 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-900 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm border-2 border-gray-300 transition-all hover:scale-105 active:scale-95 shadow-sm"
                            >
                              +{amount}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Manual Input */}
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-1.5 sm:space-y-0 sm:space-x-3">
                      <label className="text-xs sm:text-sm font-semibold text-gray-700">
                        {isBucketUnit(item.unit) ? 'ระบุจำนวนถัง:' : 'ระบุเอง:'}
                      </label>
                      <div className="flex-1 flex items-center space-x-2">
                        <input
                          type="number"
                          min="0"
                          step={isBucketUnit(item.unit) ? "0.25" : "1"}
                          value={item.purchaseAmount}
                          onChange={(e) => updatePurchaseAmount(item.id, parseFloat(e.target.value) || 0)}
                          className="flex-1 px-3 py-2 sm:px-4 sm:py-3 border-2 border-gray-300 rounded-xl sm:rounded-2xl text-center text-base sm:text-lg font-bold focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50"
                          placeholder="0"
                        />
                        <span className="text-xs sm:text-sm font-semibold text-gray-600 whitespace-nowrap">{item.unit}</span>
                        {item.purchaseAmount > 0 && (
                          <button
                            onClick={() => updatePurchaseAmount(item.id, 0)}
                            className="px-2.5 py-2 sm:px-3 sm:py-3 bg-red-100 hover:bg-red-200 active:bg-red-300 text-red-700 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-semibold transition-colors shadow-sm"
                          >
                            ล้าง
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Preview */}
                    {item.purchaseAmount > 0 && (
                      <div className="bg-green-50 border-2 border-green-200 rounded-xl sm:rounded-2xl p-2 sm:p-3 shadow-sm">
                        <div className="flex items-center justify-between text-xs sm:text-sm">
                          <span className="text-green-800 font-semibold">จะอัพเดท:</span>
                          <span className="text-green-900 font-bold text-sm sm:text-lg">
                            +{isBucketUnit(item.unit) && item.purchaseAmount % 1 !== 0
                              ? item.purchaseAmount.toFixed(2).replace(/\.?0+$/, '')
                              : item.purchaseAmount} {item.unit}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] sm:text-xs text-green-700 mt-0.5 sm:mt-1">
                          <span>สต็อกใหม่:</span>
                          <span className="font-semibold">
                            {isBucketUnit(item.unit) && (item.currentStock + item.purchaseAmount) % 1 !== 0
                              ? (item.currentStock + item.purchaseAmount).toFixed(2).replace(/\.?0+$/, '')
                              : (item.currentStock + item.purchaseAmount).toLocaleString()} {item.unit}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {shoppingItems.length > 0 && (
          <div className="p-3 sm:p-6 border-t-2 border-green-200 bg-gradient-to-r from-gray-50 to-green-50">
            <div className="space-y-2 sm:space-y-3">
              {/* Summary */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">พร้อมอัพเดท</p>
                  <p className="text-xl sm:text-2xl font-extrabold text-gray-900">
                    {shoppingItems.filter(item => item.purchaseAmount > 0).length} / {shoppingItems.length}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs sm:text-sm text-gray-600">จำนวนรวม</p>
                  <p className="text-lg sm:text-xl font-bold text-green-600">
                    {shoppingItems.reduce((sum, item) => sum + item.purchaseAmount, 0).toFixed(2).replace(/\.?0+$/, '')} รายการ
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2.5 sm:px-6 sm:py-3 bg-white hover:bg-gray-100 active:bg-gray-200 text-gray-800 rounded-xl sm:rounded-2xl transition-colors font-semibold text-sm sm:text-base border-2 border-gray-300 shadow-sm"
                >
                  ปิด
                </button>
                <button
                  onClick={updateAllStocks}
                  disabled={shoppingItems.filter(item => item.purchaseAmount > 0).length === 0 || updating === 'all'}
                  className="flex-1 px-4 py-2.5 sm:px-6 sm:py-3 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white rounded-xl sm:rounded-2xl transition-all font-bold text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-100 disabled:transform-none"
                >
                  {updating === 'all' ? (
                    <span className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>กำลังอัพเดท...</span>
                    </span>
                  ) : (
                    <span className="block sm:inline">
                      อัพเดททั้งหมด <span className="hidden sm:inline">({shoppingItems.filter(item => item.purchaseAmount > 0).length})</span>
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ShoppingListModal