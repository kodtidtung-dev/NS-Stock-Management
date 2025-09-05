'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { 
  Plus, 
  Edit, 
  Eye, 
  EyeOff, 
  Package, 
  Tag, 
  Search,
  X,
  Trash2
} from 'lucide-react'

// Type definitions
interface Product {
  id: number
  name: string
  category?: {
    name: string
  }
  categoryId?: number
  unit: string
  minimumStock: number
  currentStock?: number
  description?: string
  active: boolean
  createdBy?: string
  createdAt?: string
  updatedAt?: string
  lastUpdated?: string
  lastUpdatedBy?: string
}

interface Category {
  id: number
  name: string
  description?: string
}

interface NewProduct {
  name: string
  categoryId: string
  unit: string
  minimumStock: string
  description: string
}

interface NewCategory {
  name: string
  description: string
}

const ProductManagement = () => {
  const { loading: authLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showInactive, setShowInactive] = useState(false)

  const [newProduct, setNewProduct] = useState<NewProduct>({
    name: '',
    categoryId: '',
    unit: '',
    minimumStock: '',
    description: ''
  })

  const [newCategory, setNewCategory] = useState<NewCategory>({
    name: '',
    description: ''
  })

  // Check authentication and redirect if needed
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
      return
    }
    if (isAuthenticated) {
      fetchProducts()
      fetchCategories()
    }
  }, [authLoading, isAuthenticated, router])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products', {
        credentials: 'include' // Include cookies for authentication
      })
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        console.log('📁 Categories API response:', data)
        setCategories(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      setCategories([])
    }
  }

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || product.categoryId?.toString() === selectedCategory
    const matchesActive = showInactive || product.active
    
    return matchesSearch && matchesCategory && matchesActive
  })

  const getStockStatus = (currentStock: number, minStock: number): 'ok' | 'low' | 'out' => {
    if (currentStock === 0) return 'out'
    if (currentStock <= minStock) return 'low'
    return 'ok'
  }

  const getStatusColor = (status: 'ok' | 'low' | 'out'): string => {
    switch (status) {
      case 'ok': return 'text-white bg-gray-600'
      case 'low': return 'text-black bg-gray-300'
      case 'out': return 'text-white bg-black'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusText = (status: 'ok' | 'low' | 'out'): string => {
    switch (status) {
      case 'ok': return 'ปกติ'
      case 'low': return 'ใกล้หมด'
      case 'out': return 'หมด'
      default: return 'ไม่ทราบ'
    }
  }

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.unit || !newProduct.minimumStock) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน')
      return
    }

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({
          name: newProduct.name,
          categoryId: parseInt(newProduct.categoryId) || null,
          unit: newProduct.unit,
          minimumStock: parseFloat(newProduct.minimumStock),
          description: newProduct.description,
        }),
      })

      if (response.ok) {
        await fetchProducts()
        setNewProduct({ name: '', categoryId: '', unit: '', minimumStock: '', description: '' })
        setShowAddProduct(false)
      } else {
        toast.error('เกิดข้อผิดพลาดในการเพิ่มสินค้า')
      }
    } catch (error) {
      console.error('Error adding product:', error)
      toast.error('เกิดข้อผิดพลาดในการเพิ่มสินค้า')
    }
  }

  const handleAddCategory = async () => {
    if (!newCategory.name) {
      toast.error('กรุณาใส่ชื่อหมวดหมู่')
      return
    }

    try {
      console.log('🏷️ Adding category:', newCategory)
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCategory.name,
          description: newCategory.description,
        }),
      })

      const data = await response.json()
      console.log('🏷️ Add category response:', data)

      if (response.ok) {
        await fetchCategories()
        setNewCategory({ name: '', description: '' })
        setShowAddCategory(false)
        toast.success('เพิ่มหมวดหมู่สำเร็จ!')
      } else {
        toast.error(data.message || 'เกิดข้อผิดพลาดในการเพิ่มหมวดหมู่')
      }
    } catch (error) {
      console.error('Error adding category:', error)
      toast.error('เกิดข้อผิดพลาดในการเพิ่มหมวดหมู่')
    }
  }

  const toggleProductStatus = async (id: number) => {
    try {
      const product = products.find(p => p.id === id)
      if (!product) return
      
      const response = await fetch(`/api/products/manage/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          active: !product.active,
        }),
      })

      const data = await response.json()
      if (response.ok && data.success) {
        await fetchProducts()
        toast.success(data.message)
      } else {
        toast.error(data.message || 'เกิดข้อผิดพลาดในการแก้ไขสถานะสินค้า')
      }
    } catch (error) {
      console.error('Error toggling product status:', error)
      toast.error('เกิดข้อผิดพลาดในการแก้ไขสถานะสินค้า')
    }
  }

  const deleteProduct = async (id: number) => {
    try {
      const product = products.find(p => p.id === id)
      if (!product || !confirm(`คุณต้องการลบสินค้า "${product.name}" หรือไม่?`)) {
        return
      }

      const response = await fetch(`/api/products/manage/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      const data = await response.json()
      if (response.ok && data.success) {
        await fetchProducts()
        toast.success(data.message)
      } else {
        toast.error(data.message || 'เกิดข้อผิดพลาดในการลบสินค้า')
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error('เกิดข้อผิดพลาดในการลบสินค้า')
    }
  }

  const handleEditProduct = async () => {
    if (!editingProduct || !editingProduct.name || !editingProduct.unit || editingProduct.minimumStock === undefined) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน')
      return
    }

    try {
      const response = await fetch(`/api/products/manage/${editingProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: editingProduct.name,
          categoryId: editingProduct.categoryId ? parseInt(editingProduct.categoryId.toString()) : null,
          unit: editingProduct.unit,
          minimumStock: editingProduct.minimumStock,
          description: editingProduct.description,
        }),
      })

      const data = await response.json()
      if (response.ok && data.success) {
        await fetchProducts()
        setEditingProduct(null)
        toast.success(data.message)
      } else {
        toast.error(data.message || 'เกิดข้อผิดพลาดในการแก้ไขสินค้า')
      }
    } catch (error) {
      console.error('Error editing product:', error)
      toast.error('เกิดข้อผิดพลาดในการแก้ไขสินค้า')
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">กำลังโหลด...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">กำลังเปลี่ยนเส้นทางไปหน้าเข้าสู่ระบบ...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700 shadow-sm mb-6">
          {/* Mobile Header */}
          <div className="block md:hidden mb-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-black" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">จัดการสินค้า</h1>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setShowAddCategory(true)}
                className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors text-sm"
              >
                <Tag className="w-4 h-4" />
                <span className="hidden sm:inline">เพิ่มหมวดหมู่</span>
                <span className="sm:hidden">หมวดหมู่</span>
              </button>
              
              <button
                onClick={() => setShowAddProduct(true)}
                className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-white hover:bg-gray-100 text-black rounded-lg transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">เพิ่มสินค้าใหม่</span>
                <span className="sm:hidden">สินค้า</span>
              </button>
            </div>
          </div>
          
          {/* Desktop Header */}
          <div className="hidden md:flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-black" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">จัดการสินค้า</h1>
                <p className="text-gray-300">เพิ่ม แก้ไข และจัดการสินค้าในร้าน</p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowAddCategory(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors"
              >
                <Tag className="w-4 h-4" />
                <span>เพิ่มหมวดหมู่</span>
              </button>
              
              <button
                onClick={() => setShowAddProduct(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มสินค้าใหม่</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-3 md:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นหาสินค้า..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-white outline-none placeholder-gray-400"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-white outline-none"
            >
              <option value="all">ทุกหมวดหมู่</option>
              {categories.map((cat: Category) => (
                <option key={cat.id} value={cat.id.toString()}>
                  {cat.name}
                </option>
              ))}
            </select>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="w-4 h-4 text-white border-gray-600 rounded focus:ring-white bg-gray-700"
              />
              <span className="text-sm text-gray-300">แสดงสินค้าที่ปิดใช้งาน</span>
            </label>
          </div>
        </div>

        {/* Products List */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-700 bg-gray-900">
            <h2 className="text-lg font-semibold text-white">รายการสินค้า ({filteredProducts.length})</h2>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-500" />
              <p>ไม่พบสินค้าที่ค้นหา</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {filteredProducts.map((product: Product) => {
                const status = getStockStatus(product.currentStock || 0, product.minimumStock)
                return (
                  <div key={product.id} className={`p-4 sm:p-6 ${!product.active ? 'bg-gray-900 opacity-75' : ''}`}>
                    {/* Mobile Layout */}
                    <div className="block md:hidden space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="text-base font-semibold text-white truncate">{product.name}</h3>
                            {!product.active && (
                              <span className="px-2 py-1 bg-gray-600 text-gray-300 text-xs rounded-full whitespace-nowrap">
                                ปิดใช้งาน
                              </span>
                            )}
                          </div>
                          
                          <div className="text-sm text-gray-400 mb-2">
                            {product.category?.name || 'ไม่มีหมวดหมู่'}
                          </div>
                          
                          {product.description && (
                            <p className="text-xs text-gray-500 mb-2 line-clamp-2">{product.description}</p>
                          )}
                        </div>
                        
                        <div className="flex flex-col items-end space-y-1 ml-3">
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => setEditingProduct(product)}
                              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                              title="แก้ไขสินค้า"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => deleteProduct(product.id)}
                              className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition-colors"
                              title="ลบสินค้า"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => toggleProductStatus(product.id)}
                              className={`p-1.5 rounded transition-colors ${
                                product.active 
                                  ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                                  : 'text-gray-600 hover:text-gray-400 hover:bg-gray-700'
                              }`}
                              title={product.active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                            >
                              {product.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3 text-xs">
                        <div className="text-center p-2 bg-gray-700 rounded">
                          <p className="text-gray-400 mb-1">หน่วย</p>
                          <p className="font-medium text-white">{product.unit}</p>
                        </div>
                        <div className="text-center p-2 bg-gray-700 rounded">
                          <p className="text-gray-400 mb-1">ขั้นต่ำ</p>
                          <p className="font-medium text-white">{product.minimumStock}</p>
                        </div>
                        <div className="text-center p-2 bg-gray-700 rounded">
                          <p className="text-gray-400 mb-1">คงเหลือ</p>
                          <div className="flex flex-col items-center space-y-1">
                            <span className="font-medium text-white">{product.currentStock || 0}</span>
                            <span className={`px-1.5 py-0.5 text-xs rounded ${getStatusColor(status)}`}>
                              {getStatusText(status)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Desktop Layout */}
                    <div className="hidden md:flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-white">{product.name}</h3>
                          {!product.active && (
                            <span className="px-2 py-1 bg-gray-600 text-gray-300 text-xs rounded-full">
                              ปิดใช้งาน
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-400">หมวดหมู่</p>
                            <p className="font-medium text-white">{product.category?.name || 'ไม่มีหมวดหมู่'}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">หน่วย</p>
                            <p className="font-medium text-white">{product.unit}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">ขั้นต่ำ</p>
                            <p className="font-medium text-white">{product.minimumStock} {product.unit}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">คงเหลือ</p>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-white">{product.currentStock || 0} {product.unit}</span>
                              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(status)}`}>
                                {getStatusText(status)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {product.description && (
                          <div className="mt-2">
                            <p className="text-gray-400 text-sm">{product.description}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => setEditingProduct(product)}
                          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                          title="แก้ไขสินค้า"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
                          title="ลบสินค้า"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => toggleProductStatus(product.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            product.active 
                              ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                              : 'text-gray-600 hover:text-gray-400 hover:bg-gray-700'
                          }`}
                          title={product.active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                        >
                          {product.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Add Product Modal */}
        {showAddProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-xl p-4 sm:p-6 w-full max-w-md border border-gray-700 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">เพิ่มสินค้าใหม่</h3>
                <button
                  onClick={() => setShowAddProduct(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">ชื่อสินค้า</label>
                  <input
                    type="text"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-white outline-none"
                    placeholder="ชื่อสินค้า"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">หมวดหมู่</label>
                  <select
                    value={newProduct.categoryId}
                    onChange={(e) => setNewProduct({...newProduct, categoryId: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-white outline-none"
                  >
                    <option value="">เลือกหมวดหมู่</option>
                    {categories.map((cat: Category) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">หน่วย</label>
                  <input
                    type="text"
                    value={newProduct.unit}
                    onChange={(e) => setNewProduct({...newProduct, unit: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-white outline-none"
                    placeholder="เช่น กิโลกรัม, ลิตร, ชิ้น"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">จำนวนขั้นต่ำ</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newProduct.minimumStock}
                    onChange={(e) => setNewProduct({...newProduct, minimumStock: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-white outline-none"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">รายละเอียด</label>
                  <textarea
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-white outline-none"
                    placeholder="รายละเอียดสินค้า (ไม่บังคับ)"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowAddProduct(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleAddProduct}
                  className="flex-1 px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-lg transition-colors"
                >
                  เพิ่มสินค้า
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Product Modal */}
        {editingProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-xl p-4 sm:p-6 w-full max-w-md border border-gray-700 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">แก้ไขสินค้า</h3>
                <button
                  onClick={() => setEditingProduct(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">ชื่อสินค้า</label>
                  <input
                    type="text"
                    value={editingProduct?.name || ''}
                    onChange={(e) => editingProduct && setEditingProduct({...editingProduct, name: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-white outline-none"
                    placeholder="ชื่อสินค้า"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">หมวดหมู่</label>
                  <select
                    value={editingProduct?.categoryId?.toString() || ''}
                    onChange={(e) => editingProduct && setEditingProduct({...editingProduct, categoryId: e.target.value ? parseInt(e.target.value) : undefined})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-white outline-none"
                  >
                    <option value="">เลือกหมวดหมู่</option>
                    {categories.map((cat: Category) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">หน่วย</label>
                  <input
                    type="text"
                    value={editingProduct?.unit || ''}
                    onChange={(e) => editingProduct && setEditingProduct({...editingProduct, unit: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-white outline-none"
                    placeholder="เช่น กิโลกรัม, ลิตร, ชิ้น"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">จำนวนขั้นต่ำ</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingProduct?.minimumStock || ''}
                    onChange={(e) => editingProduct && setEditingProduct({...editingProduct, minimumStock: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-white outline-none"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">รายละเอียด</label>
                  <textarea
                    value={editingProduct?.description || ''}
                    onChange={(e) => editingProduct && setEditingProduct({...editingProduct, description: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-white outline-none"
                    placeholder="รายละเอียดสินค้า (ไม่บังคับ)"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleEditProduct}
                  className="flex-1 px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-lg transition-colors"
                >
                  บันทึกการแก้ไข
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Category Modal */}
        {showAddCategory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-xl p-4 sm:p-6 w-full max-w-md border border-gray-700 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">เพิ่มหมวดหมู่ใหม่</h3>
                <button
                  onClick={() => setShowAddCategory(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">ชื่อหมวดหมู่</label>
                  <input
                    type="text"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-white outline-none"
                    placeholder="ชื่อหมวดหมู่"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">รายละเอียด</label>
                  <textarea
                    value={newCategory.description}
                    onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-white outline-none"
                    placeholder="รายละเอียดหมวดหมู่ (ไม่บังคับ)"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowAddCategory(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleAddCategory}
                  className="flex-1 px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-lg transition-colors"
                >
                  เพิ่มหมวดหมู่
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductManagement