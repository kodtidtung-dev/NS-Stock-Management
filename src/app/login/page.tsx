'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { User, Lock, LogIn, AlertCircle, CheckCircle, Sparkles } from 'lucide-react'
import Image from 'next/image'

const CoffeeLoginMinimalist = () => {
  const { user, login, loading: authLoading } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [focusField, setFocusField] = useState('')

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push(user.role === 'OWNER' ? '/dashboard' : '/staff')
    }
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const success = await login(formData.username, formData.password)
      if (!success) {
        setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง')
      }
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    if (error) setError('')
  }

  const quickLogin = (username: string, password: string) => {
    setFormData({ username, password })
    setError('')
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white text-sm font-medium ">กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Minimal Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-white rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="relative inline-block mb-6">
            <div className="w-24 h-24 bg-black rounded-3xl flex items-center justify-center shadow-2xl shadow-black/50 relative border-2 border-black">
              <Image 
                src="/ns.logowhite.png" 
                alt="NS Logo" 
                width={200} 
                height={200} 
                className="drop-shadow-lg"
              />
              
              {/* Sparkle Effect */}
              <div className="absolute -top-2 -right-2">
                <Sparkles className="w-6 h-6 text-black animate-pulse" />
              </div>
            </div>
            
            {/* Glow Effect */}
            <div className="absolute inset-0 w-24 h-24 bg-white rounded-3xl blur-xl opacity-20 animate-pulse"></div>
          </div>
          
          <h1 className="text-5xl font-extrabold text-white mb-3 tracking-tight">
            NS-<span className="text-white">Stock</span>
          </h1>
          <p className="text-white text-lg font-medium">ระบบจัดการสต็อกภายในร้าน</p>
          <div className="w-24 h-1 bg-white rounded-full mx-auto mt-4"></div>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-2xl border-2 border-black p-8 relative overflow-hidden">
          
          {/* Card Header Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-black"></div>
          
          <div className="space-y-6">
            
            {/* Username Field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-black flex items-center space-x-2">
                <User className="w-4 h-4 text-black" />
                <span>ชื่อผู้ใช้</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  onFocus={() => setFocusField('username')}
                  onBlur={() => setFocusField('')}
                  className={`w-full px-4 py-4 bg-gray-100 border-2 rounded-2xl transition-all duration-300 outline-none font-medium text-black placeholder-gray-500 ${
                    focusField === 'username' 
                      ? 'border-black bg-gray-50 shadow-lg shadow-black/10' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  placeholder="owner หรือ staff1"
                  required
                  disabled={loading}
                />
                
                {/* Focus Indicator */}
                {focusField === 'username' && (
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <div className="w-2 h-2 bg-black rounded-full animate-pulse"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-black flex items-center space-x-2">
                <Lock className="w-4 h-4 text-black" />
                <span>รหัสผ่าน</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  onFocus={() => setFocusField('password')}
                  onBlur={() => setFocusField('')}
                  className={`w-full px-4 py-4 bg-gray-100 border-2 rounded-2xl transition-all duration-300 outline-none font-medium text-black placeholder-gray-500 ${
                    focusField === 'password' 
                      ? 'border-black bg-gray-50 shadow-lg shadow-black/10' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  placeholder="รหัสผ่าน"
                  required
                  disabled={loading}
                />
                
                {/* Focus Indicator */}
                {focusField === 'password' && (
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <div className="w-2 h-2 bg-black rounded-full animate-pulse"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-2xl animate-pulse">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <p className="text-red-800 font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading || !formData.username || !formData.password}
              className="w-full relative overflow-hidden bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white font-extrabold py-4 px-6 rounded-2xl transition-all duration-300 shadow-xl border-2 border-black hover:border-gray-800 disabled:opacity-50 disabled:cursor-not-allowed group tracking-tight"
            >
              <div className="flex items-center justify-center space-x-3 relative z-10">
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>กำลังเข้าสู่ระบบ...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    <span>เข้าสู่ระบบ</span>
                  </>
                )}
              </div>
              
              {/* Button Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            </button>

            {/* Quick Login Buttons */}
            <div className="space-y-3">
              <div className="flex items-center space-x-4">
                <div className="flex-1 h-px bg-black"></div>
                <span className="text-black text-sm font-medium">เข้าสู่ระบบด่วน</span>
                <div className="flex-1 h-px bg-black"></div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => quickLogin('owner', '123456')}
                  disabled={loading}
                  className="bg-gray-100 hover:bg-gray-50 border border-gray-300 text-black py-3 px-4 rounded-xl transition-all duration-200 text-sm font-medium hover:border-black disabled:opacity-50"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>เจ้าของร้าน</span>
                  </div>
                </button>
                
                <button
                  type="button"
                  onClick={() => quickLogin('staff1', '123456')}
                  disabled={loading}
                  className="bg-gray-100 hover:bg-gray-50 border border-gray-300 text-black py-3 px-4 rounded-xl transition-all duration-200 text-sm font-medium hover:border-black disabled:opacity-50"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>พนักงาน</span>
                  </div>
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-white text-sm font-medium">
            © 2025 NS-Stock Management System
          </p>
        </div>
      </div>
    </div>
  )
}

export default CoffeeLoginMinimalist