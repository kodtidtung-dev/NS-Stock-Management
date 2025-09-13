'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useProducts, Product } from '@/hooks/useProducts'
import { useProductMutations } from '@/hooks/useProductMutations'
import { parseFraction, validateNumberInput, formatWithUnit } from '@/lib/fractions'
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
// Using Product from useProducts hook

// Extended Product type for editing (allows string minimumStock for fractions)
interface EditableProduct extends Omit<Product, 'minimumStock'> {
  minimumStock: number | string
}

interface Category {
  id: number
  name: string
  description?: string
  productCount?: number
  createdBy?: string
  createdAt?: string
  active?: boolean
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
  
  // Use hooks for products data
  const { products, loading: productsLoading, refetch } = useProducts()
  const {
    createProduct,
    deleteProduct: deleteProductMutation,
    isCreatingProduct,
    isDeletingProduct
  } = useProductMutations()

  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [showCategoryManagement, setShowCategoryManagement] = useState(false)
  const [editingProduct, setEditingProduct] = useState<EditableProduct | null>(null)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
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

  const [minimumStockError, setMinimumStockError] = useState<string | null>(null)
  const [editMinimumStockError, setEditMinimumStockError] = useState<string | null>(null)

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
      fetchCategories()
    }
  }, [authLoading, isAuthenticated, router])

  // Update loading state based on products loading
  useEffect(() => {
    setLoading(productsLoading)
  }, [productsLoading])

  // Remove manual fetchProducts - now handled by useProducts hook

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

  // Memoized functions for performance
  const getStockStatusMemoized = useCallback((currentStock: number, minStock: number | string): 'ok' | 'low' | 'out' => {
    if (currentStock === 0) return 'out'
    const minStockValue = typeof minStock === 'string' ? parseFraction(minStock).value : minStock
    if (currentStock <= minStockValue) return 'low'
    return 'ok'
  }, [])

  const formatMinimumStock = useCallback((minStock: number | string, unit: string): string => {
    const value = typeof minStock === 'string' ? parseFraction(minStock).value : minStock
    return formatWithUnit(value, unit)
  }, [])

  // Memoized filtered products
  const filteredProducts = useMemo(() =>
    products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.category?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || product.categoryId?.toString() === selectedCategory
      const matchesActive = showInactive || product.active

      return matchesSearch && matchesCategory && matchesActive
    }), [products, searchTerm, selectedCategory, showInactive])


  const getStatusColor = (status: 'ok' | 'low' | 'out'): string => {
    switch (status) {
      case 'ok': return 'text-black bg-green-300'
      case 'low': return 'text-black bg-yellow-300'
      case 'out': return 'text-black bg-red-400'
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

    // Parse and validate minimum stock
    const minimumStockResult = parseFraction(newProduct.minimumStock)
    if (!minimumStockResult.isValid) {
      toast.error(minimumStockResult.error || 'จำนวนขั้นต่ำไม่ถูกต้อง')
      return
    }

    try {
      await createProduct({
        name: newProduct.name,
        categoryId: parseInt(newProduct.categoryId) || undefined,
        unit: newProduct.unit,
        minimumStock: minimumStockResult.value,
        description: newProduct.description,
      })

      // Reset form and close modal
      setNewProduct({ name: '', categoryId: '', unit: '', minimumStock: '', description: '' })
      setMinimumStockError(null)
      setShowAddProduct(false)
    } catch (error) {
      console.error('Error adding product:', error)
      // Error handling is done in the mutation hook
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

  const handleEditCategory = async () => {
    if (!editingCategory || !editingCategory.name) {
      toast.error('กรุณาใส่ชื่อหมวดหมู่')
      return
    }

    try {
      const response = await fetch(`/api/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingCategory.name,
          description: editingCategory.description,
          active: editingCategory.active,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        await fetchCategories()
        setEditingCategory(null)
        toast.success('แก้ไขหมวดหมู่สำเร็จ!')
      } else {
        toast.error(data.message || 'เกิดข้อผิดพลาดในการแก้ไขหมวดหมู่')
      }
    } catch (error) {
      console.error('Error editing category:', error)
      toast.error('เกิดข้อผิดพลาดในการแก้ไขหมวดหมู่')
    }
  }

  const deleteCategory = async (id: number, force: boolean = false) => {
    try {
      const category = categories.find(c => c.id === id)
      if (!category) return

      let confirmMessage
      if (force) {
        confirmMessage = `⚠️ คุณต้องการลบหมวดหมู่ "${category.name}" พร้อมกับสินค้าทั้งหมด ${category.productCount || 0} รายการหรือไม่?\n\n🚨 การกระทำนี้ไม่สามารถย้อนกลับได้!`
      } else {
        confirmMessage = `คุณต้องการลบหมวดหมู่ "${category.name}" หรือไม่?`
      }

      if (!confirm(confirmMessage)) {
        return
      }

      const url = force ? `/api/categories/${id}?force=true` : `/api/categories/${id}`
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      if (response.ok && data.success) {
        await fetchCategories()
        refetch() // รีเฟรชสินค้าด้วยเพราะอาจมีสินค้าถูกลบ
        toast.success(data.message)
      } else {
        toast.error(data.message || 'เกิดข้อผิดพลาดในการลบหมวดหมู่')
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error('เกิดข้อผิดพลาดในการลบหมวดหมู่')
    }
  }

  const toggleCategoryStatus = async (id: number) => {
    try {
      const category = categories.find(c => c.id === id)
      if (!category) return
      
      const response = await fetch(`/api/categories/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          active: !category.active,
        }),
      })

      const data = await response.json()
      if (response.ok && data.success) {
        await fetchCategories()
        toast.success(data.message)
      } else {
        toast.error(data.message || 'เกิดข้อผิดพลาดในการแก้ไขสถานะหมวดหมู่')
      }
    } catch (error) {
      console.error('Error toggling category status:', error)
      toast.error('เกิดข้อผิดพลาดในการแก้ไขสถานะหมวดหมู่')
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
        refetch()
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

      // Use the optimistic delete mutation
      await deleteProductMutation(id)
    } catch (error) {
      console.error('Error deleting product:', error)
      // Error handling is done in the mutation hook
    }
  }

  const handleEditProduct = async () => {
    if (!editingProduct || !editingProduct.name || !editingProduct.unit || editingProduct.minimumStock === undefined) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน')
      return
    }

    // Parse minimum stock if it's a string (fraction input)
    let minimumStockValue = editingProduct.minimumStock
    if (typeof minimumStockValue === 'string') {
      const minimumStockResult = parseFraction(minimumStockValue)
      if (!minimumStockResult.isValid) {
        toast.error(minimumStockResult.error || 'จำนวนขั้นต่ำไม่ถูกต้อง')
        return
      }
      minimumStockValue = minimumStockResult.value
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
          minimumStock: minimumStockValue,
          description: editingProduct.description,
        }),
      })

      const data = await response.json()
      if (response.ok && data.success) {
        refetch()
        setEditingProduct(null)
        setEditMinimumStockError(null)
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-black">กำลังโหลด...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-black">กำลังเปลี่ยนเส้นทางไปหน้าเข้าสู่ระบบ...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-300 shadow-sm mb-6">
          {/* Mobile Header */}
          <div className="block md:hidden mb-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-300">
                <Package className="w-5 h-5 text-black" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">จัดการสินค้า</h1>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setShowAddCategory(true)}
                className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-black rounded-lg transition-colors text-sm border border-gray-300"
              >
                <Tag className="w-4 h-4" />
                <span className="hidden sm:inline">เพิ่มหมวดหมู่</span>
                <span className="sm:hidden">หมวดหมู่</span>
              </button>

              <button
                onClick={() => setShowCategoryManagement(true)}
                className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-black rounded-lg transition-colors text-sm border border-gray-300"
              >
                <Edit className="w-4 h-4" />
                <span className="hidden sm:inline">จัดการหมวดหมู่</span>
                <span className="sm:hidden">จัดการ</span>
              </button>
              
              <button
                onClick={() => setShowAddProduct(true)}
                className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-white hover:bg-gray-100 text-black rounded-lg transition-colors text-sm border-2 border-gray-300"
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
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-300">
                <Package className="w-5 h-5 text-black" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">จัดการสินค้า</h1>
                <p className="text-gray-700">เพิ่ม แก้ไข และจัดการสินค้าในร้าน</p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowAddCategory(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-black rounded-lg transition-colors border border-gray-300"
              >
                <Tag className="w-4 h-4" />
                <span>เพิ่มหมวดหมู่</span>
              </button>

              <button
                onClick={() => setShowCategoryManagement(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-black rounded-lg transition-colors border border-gray-300"
              >
                <Edit className="w-4 h-4" />
                <span>จัดการหมวดหมู่</span>
              </button>
              
              <button
                onClick={() => setShowAddProduct(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-lg transition-colors border-2 border-gray-300"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มสินค้าใหม่</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-3 md:gap-4">
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

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 bg-gray-100 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
            >
              <option value="all">ทั้งหมด</option>
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
                className="w-4 h-4 text-black border-gray-300 rounded focus:ring-white bg-gray-100"
              />
              <span className="text-sm text-gray-800">แสดงสินค้าที่ปิดใช้งาน</span>
            </label>
          </div>
        </div>

        {/* Products List */}
        <div className="bg-white rounded-xl border border-gray-300 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-300 bg-black">
            <h2 className="text-lg font-semibold text-white">รายการสินค้า ({filteredProducts.length})</h2>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-gray-600">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-500" />
              <p>ไม่พบสินค้าที่ค้นหา</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredProducts.map((product: Product) => {
                const status = getStockStatusMemoized(product.currentStock || 0, product.minimumStock)
                return (
                  <div key={product.id} className={`p-4 sm:p-6 ${!product.active ? 'bg-gray-100 opacity-75' : ''}`}>
                    {/* Mobile Layout */}
                    <div className="block md:hidden space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="text-base font-semibold text-black truncate">{product.name}</h3>
                            {!product.active && (
                              <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full whitespace-nowrap">
                                ปิดใช้งาน
                              </span>
                            )}
                          </div>
                          
                          <div className="text-sm text-gray-600 mb-2">
                            {product.category?.name || 'ไม่มีหมวดหมู่'}
                          </div>
                          
                          {product.description && (
                            <p className="text-xs text-gray-500 mb-2 line-clamp-2">{product.description}</p>
                          )}
                        </div>
                        
                        <div className="flex flex-col items-end space-y-1 ml-3">
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => setEditingProduct(product as EditableProduct)}
                              className="p-1.5 text-gray-600 hover:text-black hover:bg-gray-100 rounded transition-colors"
                              title="แก้ไขสินค้า"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => deleteProduct(product.id)}
                              disabled={isDeletingProduct}
                              className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="ลบสินค้า"
                            >
                              {isDeletingProduct ? (
                                <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                            
                            <button
                              onClick={() => toggleProductStatus(product.id)}
                              className={`p-1.5 rounded transition-colors ${
                                product.active 
                                  ? 'text-gray-600 hover:text-black hover:bg-gray-100' 
                                  : 'text-gray-600 hover:text-gray-600 hover:bg-gray-100'
                              }`}
                              title={product.active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                            >
                              {product.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3 text-xs">
                        <div className="text-center p-2 bg-gray-100 rounded">
                          <p className="text-gray-600 mb-1">หน่วย</p>
                          <p className="font-medium text-black">{product.unit}</p>
                        </div>
                        <div className="text-center p-2 bg-gray-100 rounded">
                          <p className="text-gray-600 mb-1">ขั้นต่ำ</p>
                          <p className="font-medium text-black">{formatMinimumStock(product.minimumStock, product.unit)}</p>
                        </div>
                        <div className="text-center p-2 bg-gray-100 rounded">
                          <p className="text-gray-600 mb-1">คงเหลือ</p>
                          <div className="flex flex-col items-center space-y-1">
                            <span className="font-medium text-black">{formatWithUnit(product.currentStock || 0, product.unit)}</span>
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
                          <h3 className="text-lg font-semibold text-black">{product.name}</h3>
                          {!product.active && (
                            <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full">
                              ปิดใช้งาน
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">หมวดหมู่</p>
                            <p className="font-medium text-black">{product.category?.name || 'ไม่มีหมวดหมู่'}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">หน่วย</p>
                            <p className="font-medium text-black">{product.unit}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">ขั้นต่ำ</p>
                            <p className="font-medium text-black">{formatMinimumStock(product.minimumStock, product.unit)}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">คงเหลือ</p>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-black">{formatWithUnit(product.currentStock || 0, product.unit)}</span>
                              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(status)}`}>
                                {getStatusText(status)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {product.description && (
                          <div className="mt-2">
                            <p className="text-gray-600 text-sm">{product.description}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => setEditingProduct(product as EditableProduct)}
                          className="p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
                          title="แก้ไขสินค้า"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => deleteProduct(product.id)}
                          disabled={isDeletingProduct}
                          className="p-2 text-gray-600 hover:text-red-400 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="ลบสินค้า"
                        >
                          {isDeletingProduct ? (
                            <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                        
                        <button
                          onClick={() => toggleProductStatus(product.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            product.active 
                              ? 'text-gray-600 hover:text-black hover:bg-gray-100' 
                              : 'text-gray-600 hover:text-gray-600 hover:bg-gray-100'
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
            <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-md border border-gray-300 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-black">เพิ่มสินค้าใหม่</h3>
                <button
                  onClick={() => setShowAddProduct(false)}
                  className="text-gray-600 hover:text-black"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อสินค้า</label>
                  <input
                    type="text"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
                    placeholder="ชื่อสินค้า"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">หมวดหมู่</label>
                  <select
                    value={newProduct.categoryId}
                    onChange={(e) => setNewProduct({...newProduct, categoryId: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
                  >
                    <option value="">เลือกหมวดหมู่</option>
                    {categories.map((cat: Category) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">หน่วย</label>
                  <input
                    type="text"
                    value={newProduct.unit}
                    onChange={(e) => setNewProduct({...newProduct, unit: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
                    placeholder="เช่น กิโลกรัม, ลิตร, ชิ้น"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">จำนวนขั้นต่ำ</label>
                  <input
                    type="text"
                    value={newProduct.minimumStock}
                    onChange={(e) => {
                      const value = e.target.value
                      setNewProduct({...newProduct, minimumStock: value})

                      // Validate input
                      if (value.trim() === '') {
                        setMinimumStockError(null)
                        return
                      }

                      const validation = validateNumberInput(value)
                      setMinimumStockError(validation.isValid ? null : validation.error || null)
                    }}
                    className={`w-full px-3 py-2 bg-gray-100 border text-black rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none ${
                      minimumStockError ? 'border-red-400' : 'border-gray-300'
                    }`}
                    placeholder="เช่น 1/4, 0.25, 1 1/2"
                  />
                  {minimumStockError && (
                    <p className="mt-1 text-xs text-red-600">{minimumStockError}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    รองรับเศษส่วน: 1/4, 3/4, 1 1/2 หรือทศนิยม: 0.25, 1.5
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">รายละเอียด</label>
                  <textarea
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
                    placeholder="รายละเอียดสินค้า (ไม่บังคับ)"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowAddProduct(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-black rounded-lg transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleAddProduct}
                  disabled={isCreatingProduct}
                  className="flex-1 px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-lg transition-colors border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingProduct ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>กำลังเพิ่ม...</span>
                    </div>
                  ) : (
                    'เพิ่มสินค้า'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Product Modal */}
        {editingProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-md border border-gray-300 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-black">แก้ไขสินค้า</h3>
                <button
                  onClick={() => {
                    setEditingProduct(null)
                    setEditMinimumStockError(null)
                  }}
                  className="text-gray-600 hover:text-black"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อสินค้า</label>
                  <input
                    type="text"
                    value={editingProduct?.name || ''}
                    onChange={(e) => editingProduct && setEditingProduct({...editingProduct, name: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
                    placeholder="ชื่อสินค้า"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">หมวดหมู่</label>
                  <select
                    value={editingProduct?.categoryId?.toString() || ''}
                    onChange={(e) => editingProduct && setEditingProduct({...editingProduct, categoryId: e.target.value ? parseInt(e.target.value) : undefined})}
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
                  >
                    <option value="">เลือกหมวดหมู่</option>
                    {categories.map((cat: Category) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">หน่วย</label>
                  <input
                    type="text"
                    value={editingProduct?.unit || ''}
                    onChange={(e) => editingProduct && setEditingProduct({...editingProduct, unit: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
                    placeholder="เช่น กิโลกรัม, ลิตร, ชิ้น"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">จำนวนขั้นต่ำ</label>
                  <input
                    type="text"
                    value={editingProduct?.minimumStock?.toString() || ''}
                    onChange={(e) => {
                      if (editingProduct) {
                        const value = e.target.value
                        setEditingProduct({...editingProduct, minimumStock: value})

                        // Validate input
                        if (value.trim() === '') {
                          setEditMinimumStockError(null)
                          return
                        }

                        const validation = validateNumberInput(value)
                        setEditMinimumStockError(validation.isValid ? null : validation.error || null)
                      }
                    }}
                    className={`w-full px-3 py-2 bg-gray-100 border text-black rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none ${
                      editMinimumStockError ? 'border-red-400' : 'border-gray-300'
                    }`}
                    placeholder="เช่น 1/4, 0.25, 1 1/2"
                  />
                  {editMinimumStockError && (
                    <p className="mt-1 text-xs text-red-600">{editMinimumStockError}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    รองรับเศษส่วน: 1/4, 3/4, 1 1/2 หรือทศนิยม: 0.25, 1.5
                  </p>

                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">รายละเอียด</label>
                  <textarea
                    value={editingProduct?.description || ''}
                    onChange={(e) => editingProduct && setEditingProduct({...editingProduct, description: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
                    placeholder="รายละเอียดสินค้า (ไม่บังคับ)"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    setEditingProduct(null)
                    setEditMinimumStockError(null)
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-black rounded-lg transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleEditProduct}
                  className="flex-1 px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-lg transition-colors border border-gray-300"
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
            <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-md border border-gray-300 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-black">เพิ่มหมวดหมู่ใหม่</h3>
                <button
                  onClick={() => setShowAddCategory(false)}
                  className="text-gray-600 hover:text-black"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อหมวดหมู่</label>
                  <input
                    type="text"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
                    placeholder="ชื่อหมวดหมู่"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">รายละเอียด</label>
                  <textarea
                    value={newCategory.description}
                    onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
                    placeholder="รายละเอียดหมวดหมู่ (ไม่บังคับ)"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowAddCategory(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-black rounded-lg transition-colors"
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

        {/* Category Management Modal */}
        {showCategoryManagement && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-2xl border border-gray-300 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-black">จัดการหมวดหมู่</h3>
                <button
                  onClick={() => setShowCategoryManagement(false)}
                  className="text-gray-600 hover:text-black"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                {categories.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    ไม่มีหมวดหมู่
                  </div>
                ) : (
                  categories.map((category) => (
                    <div key={category.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-black">{category.name}</h4>
                            {category.active === false && (
                              <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                                ปิดใช้งาน
                              </span>
                            )}
                          </div>
                          {category.description && (
                            <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            {category.productCount !== undefined && (
                              <span>สินค้า: {category.productCount} รายการ</span>
                            )}
                            {category.createdBy && (
                              <span>สร้างโดย: {category.createdBy}</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setEditingCategory(category)}
                            className="p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
                            title="แก้ไข"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => toggleCategoryStatus(category.id)}
                            className={`p-2 rounded-lg transition-colors ${
                              category.active !== false 
                                ? 'text-gray-600 hover:text-black hover:bg-gray-100' 
                                : 'text-gray-600 hover:text-gray-600 hover:bg-gray-100'
                            }`}
                            title={category.active !== false ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                          >
                            {category.active !== false ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          
                          {(category.productCount || 0) === 0 ? (
                            <button
                              onClick={() => deleteCategory(category.id, false)}
                              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                              title="ลบหมวดหมู่"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <div className="flex space-x-1">
                              <button
                                onClick={() => deleteCategory(category.id, false)}
                                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                                title="ลบหมวดหมู่ (ได้เฉพาะเมื่อไม่มีสินค้า)"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteCategory(category.id, true)}
                                className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                                title="ลบทั้งหมด (หมวดหมู่ + สินค้าทั้งหมด)"
                              >
                                ลบทั้งหมด
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowCategoryManagement(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-black rounded-lg transition-colors"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Category Modal */}
        {editingCategory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-md border border-gray-300 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-black">แก้ไขหมวดหมู่</h3>
                <button
                  onClick={() => setEditingCategory(null)}
                  className="text-gray-600 hover:text-black"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อหมวดหมู่</label>
                  <input
                    type="text"
                    value={editingCategory?.name || ''}
                    onChange={(e) => editingCategory && setEditingCategory({...editingCategory, name: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
                    placeholder="ชื่อหมวดหมู่"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">รายละเอียด</label>
                  <textarea
                    value={editingCategory?.description || ''}
                    onChange={(e) => editingCategory && setEditingCategory({...editingCategory, description: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
                    placeholder="รายละเอียดหมวดหมู่ (ไม่บังคับ)"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editingCategory?.active !== false}
                      onChange={(e) => editingCategory && setEditingCategory({...editingCategory, active: e.target.checked})}
                      className="rounded border-gray-300 text-black focus:ring-black"
                    />
                    <span className="text-sm font-medium text-gray-700">เปิดใช้งาน</span>
                  </label>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setEditingCategory(null)}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-black rounded-lg transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleEditCategory}
                  className="flex-1 px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-lg transition-colors"
                >
                  บันทึกการแก้ไข
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