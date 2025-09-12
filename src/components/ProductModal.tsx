'use client'

import React, { useState, useEffect } from 'react'
import { X, Search, Package, AlertTriangle, TrendingDown, CheckCircle, Filter } from 'lucide-react'

interface Product {
  id: number
  name: string
  currentStock: number
  minimumStock: number
  unit: string
  isLowStock: boolean
  active: boolean
  category?: {
    name: string
  }
}

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  filterType: 'all' | 'ok' | 'lowStock' | 'outOfStock'
  title: string
}

interface Category {
  id: number
  name: string
  description?: string
  productCount: number
  createdBy: string
  createdAt: string
}

const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, filterType, title }) => {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  useEffect(() => {
    if (isOpen) {
      fetchProducts()
      fetchCategories()
      setSearchTerm('')
      setSelectedCategory('')
    }
  }, [isOpen, filterType])

  useEffect(() => {
    // Filter products based on search term and category
    const filtered = products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.category?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesCategory = selectedCategory === '' || 
                             product.category?.name === selectedCategory
      
      return matchesSearch && matchesCategory
    })
    setFilteredProducts(filtered)
  }, [products, searchTerm, selectedCategory])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/products')
      if (response.ok) {
        const data = await response.json()
        
        // Filter products based on filterType
        let filtered = data.products || []
        
        switch (filterType) {
          case 'ok':
            filtered = filtered.filter((p: Product) => !p.isLowStock && p.currentStock > 0)
            break
          case 'lowStock':
            filtered = filtered.filter((p: Product) => p.isLowStock && p.currentStock > 0)
            break
          case 'outOfStock':
            filtered = filtered.filter((p: Product) => p.currentStock === 0)
            break
          // 'all' shows all products
        }
        
        setProducts(filtered)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setCategories(data.data || [])
        }
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const getStatusIcon = (product: Product) => {
    // For 'all' filter, just show Package icon
    if (filterType === 'all') {
      return <Package className="w-4 h-4 text-white" />
    }
    
    if (product.currentStock === 0) {
      return <AlertTriangle className="w-4 h-4 text-white" />
    } else if (product.isLowStock) {
      return <TrendingDown className="w-4 h-4 text-white" />
    } else {
      return <CheckCircle className="w-4 h-4 text-white" />
    }
  }

  const getStatusText = (product: Product) => {
    if (product.currentStock === 0) {
      return 'หมดแล้ว'
    } else if (product.isLowStock) {
      return 'ใกล้หมด'
    } else {
      return 'ปกติ'
    }
  }

  const getStatusColor = (product: Product) => {
    // For 'all' filter, use neutral blue color
    if (filterType === 'all') {
      return 'bg-blue-600'
    }
    
    if (product.currentStock === 0) {
      return 'bg-red-600'
    } else if (product.isLowStock) {
      return 'bg-yellow-600'
    } else {
      return 'bg-green-600'
    }
  }

  const getStatusBadgeColor = (product: Product) => {
    if (product.currentStock === 0) {
      return 'bg-red-600 text-white'
    } else if (product.isLowStock) {
      return 'bg-yellow-300 text-black'
    } else {
      return 'bg-green-600 text-white'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-300">
          <div className="flex items-center space-x-3">
            <Package className="w-6 h-6 text-gray-800" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h2>
            <span className="bg-gray-300 text-black text-sm px-3 py-1 rounded-full font-bold">
              {filteredProducts.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Search & Filters */}
        <div className="p-4 sm:p-6 border-b border-gray-300">
          <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-600" />
              <input
                type="text"
                placeholder="ค้นหาสินค้า..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none placeholder-gray-400"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-600 pointer-events-none z-10" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-10 pr-8 py-2 bg-gray-100 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none appearance-none"
              >
                <option value="">ทุกหมวดหมู่</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name} ({category.productCount})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-600">กำลังโหลด...</div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-gray-600">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">ไม่พบสินค้า</h3>
              <p>ไม่มีสินค้าในหมวดหมู่นี้</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Mobile Layout */}
              <div className="block md:hidden space-y-4">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="p-4 bg-gray-100 rounded-lg border border-gray-300 hover:bg-gray-200 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getStatusColor(product)}`}>
                          {getStatusIcon(product)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-black text-base truncate">{String(product.name || '')}</h3>
                          {product.category && (
                            <p className="text-sm text-gray-600">หมวดหมู่: {String(product.category.name)}</p>
                          )}
                        </div>
                      </div>
                      
                      {filterType !== 'all' && (
                        <div className={`px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-2 ${getStatusBadgeColor(product)}`}>
                          {getStatusText(product)}
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="text-center p-2 bg-gray-200 rounded">
                        <p className="text-gray-600 mb-1">คงเหลือ</p>
                        <p className="font-bold text-black">{(product.currentStock || 0).toLocaleString()} {String(product.unit || '')}</p>
                      </div>
                      <div className="text-center p-2 bg-gray-200 rounded">
                        <p className="text-gray-600 mb-1">ขั้นต่ำ</p>
                        <p className="font-bold text-black">{(product.minimumStock || 0).toLocaleString()} {String(product.unit || '')}</p>
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
                    className="flex items-center justify-between p-4 bg-gray-100 rounded-lg border border-gray-300 hover:bg-gray-200 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getStatusColor(product)}`}>
                        {getStatusIcon(product)}
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-black text-lg">{String(product.name || '')}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                          <span>คงเหลือ: {(product.currentStock || 0).toLocaleString()} {String(product.unit || '')}</span>
                          <span>ขั้นต่ำ: {(product.minimumStock || 0).toLocaleString()} {String(product.unit || '')}</span>
                          {product.category && (
                            <span>หมวดหมู่: {String(product.category.name)}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {filterType !== 'all' && (
                        <div className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusBadgeColor(product)}`}>
                          {getStatusText(product)}
                        </div>
                      )}
                      
                      <div className="text-right">
                        <p className="text-lg font-bold text-black">
                          {(product.currentStock || 0).toLocaleString()} {String(product.unit || '')}
                        </p>
                        <p className="text-xs text-gray-600">คงเหลือ</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-gray-300 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              แสดง {filteredProducts.length} รายการ
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg transition-colors font-medium"
            >
              ปิด
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductModal