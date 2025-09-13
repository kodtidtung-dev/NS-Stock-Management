'use client'

import React, { useState, useEffect } from 'react'
import { X, ShoppingBag, AlertTriangle, TrendingDown, Plus, Minus, CheckCircle } from 'lucide-react'

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

  const increasePurchaseAmount = (itemId: number) => {
    setShoppingItems(items => 
      items.map(item => 
        item.id === itemId 
          ? { ...item, purchaseAmount: item.purchaseAmount + 1 }
          : item
      )
    )
  }

  const decreasePurchaseAmount = (itemId: number) => {
    setShoppingItems(items => 
      items.map(item => 
        item.id === itemId 
          ? { ...item, purchaseAmount: Math.max(0, item.purchaseAmount - 1) }
          : item
      )
    )
  }

  const updateIndividualStock = async (itemId: number) => {
    const item = shoppingItems.find(i => i.id === itemId)
    if (!item || item.purchaseAmount <= 0) return

    setUpdating(itemId)
    try {
      const response = await fetch('/api/stock-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: itemId,
          quantityUsed: -item.purchaseAmount, // Negative for stock increase
          reason: 'เจ้าของร้านซื้อเข้า'
        }),
      })

      if (response.ok) {
        // Remove the item from shopping list
        setShoppingItems(items => items.filter(i => i.id !== itemId))
        onStockUpdated()
      } else {
        console.error('Failed to update stock')
      }
    } catch (error) {
      console.error('Error updating stock:', error)
    } finally {
      setUpdating(null)
    }
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 pt-4 sm:p-4 z-50">
      <div className="bg-white rounded-xl max-w-[95vw] sm:max-w-3xl w-full max-h-[85vh] sm:max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-6 border-b border-gray-300">
          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
            <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 flex-shrink-0" />
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 truncate">รายการอัพเดทสินค้า</h2>
            <span className="bg-orange-100 text-orange-800 text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full font-bold flex-shrink-0">
              {shoppingItems.length} รายการ
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6">
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
            <div className="space-y-3 sm:space-y-4">
              {/* Shopping Items */}
              {shoppingItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 sm:p-4 bg-gray-100 rounded-lg border border-gray-300 hover:bg-gray-200 transition-colors"
                >
                  <div className="mb-3 sm:mb-4">
                    <div className="flex items-start space-x-3">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getStatusColor(item)}`}>
                        {getStatusIcon(item)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-black text-sm sm:text-base truncate">{String(item.name || '')}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 text-xs sm:text-sm text-gray-600 mt-1">
                          <span>คงเหลือ: {(item.currentStock || 0).toLocaleString()} {String(item.unit || '')}</span>
                          <span>ขั้นต่ำ: {(item.minimumStock || 0).toLocaleString()} {String(item.unit || '')}</span>
                          {item.category && (
                            <span>หมวดหมู่: {String(item.category.name)}</span>
                          )}
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2">
                          <span className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium w-fit ${
                            item.currentStock === 0 
                              ? 'bg-red-600 text-white' 
                              : 'bg-yellow-300 text-black'
                          }`}>
                            {getStatusText(item)}
                          </span>
                          <span className="text-xs text-gray-500">
                            แนะนำอัพเดท: {getSuggestedAmount(item)} {item.unit}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Purchase Amount Input */}
                  <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
                    <div className="space-y-2 sm:space-y-0 sm:flex sm:items-center sm:space-x-3">
                      <label className="block sm:inline text-xs sm:text-sm font-medium text-gray-700">จำนวนที่อัพเดท:</label>
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => decreasePurchaseAmount(item.id)}
                          className="p-1.5 sm:p-1 hover:bg-gray-300 rounded-full transition-colors"
                          disabled={item.purchaseAmount <= 0}
                        >
                          <Minus className="w-4 h-4 text-gray-600" />
                        </button>
                        
                        <input
                          type="number"
                          min="0"
                          value={item.purchaseAmount}
                          onChange={(e) => updatePurchaseAmount(item.id, parseInt(e.target.value) || 0)}
                          className="w-16 sm:w-20 px-2 py-1.5 sm:py-1 border border-gray-300 rounded text-center text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                        
                        <button
                          onClick={() => increasePurchaseAmount(item.id)}
                          className="p-1.5 sm:p-1 hover:bg-gray-300 rounded-full transition-colors"
                        >
                          <Plus className="w-4 h-4 text-gray-600" />
                        </button>
                        
                        <span className="text-xs sm:text-sm text-gray-600">{item.unit}</span>
                      </div>
                      
                      <button
                        onClick={() => updatePurchaseAmount(item.id, getSuggestedAmount(item))}
                        className="w-full sm:w-auto px-3 py-1.5 sm:px-2 sm:py-1 text-xs bg-gray-300 hover:bg-gray-400 rounded transition-colors"
                      >
                        ใส่จำนวนแนะนำ
                      </button>
                    </div>
                    
                    <button
                      onClick={() => updateIndividualStock(item.id)}
                      disabled={item.purchaseAmount <= 0 || updating === item.id}
                      className="w-full sm:w-auto px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      {updating === item.id ? 'กำลังอัพเดท...' : 'อัพเดท'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {shoppingItems.length > 0 && (
          <div className="p-3 sm:p-6 border-t border-gray-300 bg-gray-50">
            <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
              <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                รายการที่มีจำนวนอัพเดท: {shoppingItems.filter(item => item.purchaseAmount > 0).length} รายการ
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition-colors font-medium text-sm"
                >
                  ปิด
                </button>
                <button
                  onClick={updateAllStocks}
                  disabled={shoppingItems.filter(item => item.purchaseAmount > 0).length === 0 || updating === 'all'}
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {updating === 'all' ? 'กำลังอัพเดททั้งหมด...' : 'อัพเดทสต็อกทั้งหมด'}
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