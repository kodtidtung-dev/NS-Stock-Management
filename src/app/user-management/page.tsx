'use client'

import React, { useState, useEffect } from 'react'
import { 
  User, 
  UserPlus, 
  Edit, 
  Trash2, 
  Shield, 
  ShieldCheck,
  Eye,
  EyeOff,
  Save,
  X,
  ArrowLeft,
  LogOut,
  RefreshCw,
  Search
} from 'lucide-react'
import Image from 'next/image'

interface UserData {
  id: number
  username: string
  name: string
  role: 'OWNER' | 'STAFF'
  active: boolean
  createdAt: string
}

interface UserFormData {
  username: string
  name: string
  role: 'OWNER' | 'STAFF'
  password?: string
  active: boolean
}

const UserManagementPage = () => {
  const [currentUser] = useState({
    name: 'เจ้าของร้าน',
    role: 'OWNER'
  })

  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<'add' | 'edit' | 'delete'>('add')
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    name: '',
    role: 'STAFF',
    password: '',
    active: true
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchUsers()
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

  const openModal = (type: 'add' | 'edit' | 'delete', user?: UserData) => {
    setModalType(type)
    setSelectedUser(user || null)
    
    if (type === 'add') {
      setFormData({
        username: '',
        name: '',
        role: 'STAFF',
        password: '',
        active: true
      })
    } else if (type === 'edit' && user) {
      setFormData({
        username: user.username,
        name: user.name,
        role: user.role,
        password: '',
        active: user.active
      })
    }
    
    setFormErrors({})
    setShowPassword(false)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedUser(null)
    setFormData({
      username: '',
      name: '',
      role: 'STAFF',
      password: '',
      active: true
    })
    setFormErrors({})
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    if (!formData.username.trim()) {
      errors.username = 'กรุณากรอก Username'
    } else if (formData.username.length < 3) {
      errors.username = 'Username ต้องมีอย่างน้อย 3 ตัวอักษร'
    }
    
    if (!formData.name.trim()) {
      errors.name = 'กรุณากรอกชื่อ-นามสกุล'
    }
    
    if (modalType === 'add' && (!formData.password || formData.password.length < 6)) {
      errors.password = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'
    }
    
    if (modalType === 'edit' && formData.password && formData.password.length < 6) {
      errors.password = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    try {
      const url = modalType === 'add' ? '/api/users' : `/api/users/${selectedUser?.id}`
      const method = modalType === 'add' ? 'POST' : 'PUT'
      
      const body: {
        username: string
        name: string
        role: string
        active: boolean
        password?: string
      } = {
        username: formData.username,
        name: formData.name,
        role: formData.role,
        active: formData.active
      }
      
      if (modalType === 'add' || (modalType === 'edit' && formData.password)) {
        body.password = formData.password
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        await fetchUsers()
        closeModal()
      } else {
        const errorData = await response.json()
        setFormErrors({ submit: errorData.error || 'เกิดข้อผิดพลาด' })
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      setFormErrors({ submit: 'เกิดข้อผิดพลาดในการบันทึก' })
    }
  }

  const handleDelete = async () => {
    if (!selectedUser) return

    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchUsers()
        closeModal()
      } else {
        const errorData = await response.json()
        setFormErrors({ submit: errorData.error || 'เกิดข้อผิดพลาดในการลบ' })
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      setFormErrors({ submit: 'เกิดข้อผิดพลาดในการลบ' })
    }
  }

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getRoleText = (role: string) => {
    return role === 'OWNER' ? 'เจ้าของร้าน' : 'พนักงาน'
  }

  const getRoleIcon = (role: string) => {
    return role === 'OWNER' ? <ShieldCheck className="w-4 h-4" /> : <Shield className="w-4 h-4" />
  }

  const getRoleBadgeColor = (role: string) => {
    return role === 'OWNER' 
      ? 'bg-purple-600 text-white' 
      : 'bg-blue-600 text-white'
  }

  const getStatusBadgeColor = (active: boolean) => {
    return active 
      ? 'bg-green-600 text-white' 
      : 'bg-gray-600 text-white'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">กำลังโหลดข้อมูลผู้ใช้...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
          {/* Mobile Header */}
          <div className="flex items-center justify-between md:hidden">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="p-2 hover:bg-gray-700 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-300" />
              </button>
              
              <Image 
                src="/ns.logowhite.png" 
                alt="NS Logo" 
                width={40} 
                height={40} 
                className="object-contain"
              />
              
              <div>
                <h1 className="text-lg font-bold text-white">จัดการพนักงาน</h1>
              </div>
            </div>
            
            <button 
              onClick={handleLogout}
              className="p-2 hover:bg-gray-700 rounded-full transition-colors"
            >
              <LogOut className="w-5 h-5 text-gray-300" />
            </button>
          </div>
          
          {/* Desktop Header */}
          <div className="hidden md:flex items-center justify-between">
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
                <h1 className="text-2xl font-bold text-white">จัดการพนักงาน</h1>
                <p className="text-gray-300">จัดการข้อมูลผู้ใช้และสิทธิ์การเข้าถึง</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="text-sm font-medium">รีเฟรช</span>
              </button>
              
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <User className="w-4 h-4" />
                <span>{currentUser.name}</span>
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
        {/* Controls */}
        <div className="space-y-4">
          {/* Mobile Controls */}
          <div className="block md:hidden space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นหาผู้ใช้..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                ทั้งหมด {filteredUsers.length} คน
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
                
                <button
                  onClick={() => openModal('add')}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  <span className="hidden sm:inline">เพิ่มผู้ใช้</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Desktop Controls */}
          <div className="hidden md:flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="ค้นหาผู้ใช้..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                />
              </div>
              <div className="text-sm text-gray-400">
                ทั้งหมด {filteredUsers.length} คน
              </div>
            </div>
            
            <button
              onClick={() => openModal('add')}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>เพิ่มผู้ใช้</span>
            </button>
          </div>
        </div>

        {/* Users List */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          {/* Mobile Cards View */}
          <div className="block md:hidden">
            {filteredUsers.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-400">
                ไม่พบข้อมูลผู้ใช้
              </div>
            ) : (
              <div className="divide-y divide-gray-600">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="p-4 hover:bg-gray-700 transition-colors">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-6 h-6 text-gray-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-base font-medium text-white truncate">{user.name}</div>
                        <div className="text-sm text-gray-400">@{user.username}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openModal('edit', user)}
                          className="p-2 text-blue-400 hover:text-blue-300 transition-colors bg-gray-700 rounded-lg"
                          title="แก้ไข"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {user.id !== 1 && (
                          <button
                            onClick={() => openModal('delete', user)}
                            className="p-2 text-red-400 hover:text-red-300 transition-colors bg-gray-700 rounded-lg"
                            title="ลบ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-4">
                        <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                          {getRoleIcon(user.role)}
                          <span>{getRoleText(user.role)}</span>
                        </div>
                        
                        <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(user.active)}`}>
                          {user.active ? 'ใช้งาน' : 'ปิดใช้งาน'}
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-400">
                        {new Date(user.createdAt).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    ผู้ใช้
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    บทบาท
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    สถานะ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    วันที่สร้าง
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-600">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                      ไม่พบข้อมูลผู้ใช้
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-gray-300" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">{user.name}</div>
                            <div className="text-sm text-gray-400">@{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                          {getRoleIcon(user.role)}
                          <span>{getRoleText(user.role)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(user.active)}`}>
                          {user.active ? 'ใช้งาน' : 'ปิดใช้งาน'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {new Date(user.createdAt).toLocaleDateString('th-TH')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => openModal('edit', user)}
                            className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                            title="แก้ไข"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {user.id !== 1 && ( // Don't allow deleting the main owner
                            <button
                              onClick={() => openModal('delete', user)}
                              className="p-1 text-red-400 hover:text-red-300 transition-colors"
                              title="ลบ"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-4 sm:p-6 w-full max-w-md border border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">
                {modalType === 'add' && 'เพิ่มผู้ใช้ใหม่'}
                {modalType === 'edit' && 'แก้ไขข้อมูลผู้ใช้'}
                {modalType === 'delete' && 'ยืนยันการลบ'}
              </h3>
              <button
                onClick={closeModal}
                className="p-1 text-gray-400 hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalType === 'delete' ? (
              <div>
                <p className="text-gray-300 mb-6">
                  คุณต้องการลบผู้ใช้ &quot;{selectedUser?.name}&quot; หรือไม่?
                </p>
                {formErrors.submit && (
                  <div className="text-red-400 text-sm mb-4">{formErrors.submit}</div>
                )}
                <div className="flex space-x-4">
                  <button
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    ลบ
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={modalType === 'edit'}
                  />
                  {formErrors.username && (
                    <div className="text-red-400 text-sm mt-1">{formErrors.username}</div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    ชื่อ-นามสกุล
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {formErrors.name && (
                    <div className="text-red-400 text-sm mt-1">{formErrors.name}</div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    รหัสผ่าน {modalType === 'edit' && '(ไม่ระบุหากไม่ต้องการเปลี่ยน)'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 pr-10 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {formErrors.password && (
                    <div className="text-red-400 text-sm mt-1">{formErrors.password}</div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    บทบาท
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'OWNER' | 'STAFF' })}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="STAFF">พนักงาน</option>
                    <option value="OWNER">เจ้าของร้าน</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="active"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="active" className="text-sm text-gray-300">
                    เปิดใช้งาน
                  </label>
                </div>

                {formErrors.submit && (
                  <div className="text-red-400 text-sm">{formErrors.submit}</div>
                )}

                <div className="flex space-x-4 pt-4">
                  <button
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>บันทึก</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default UserManagementPage