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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-gray-300/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-white/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Coffee Bean Decorations */}
      <div className="absolute top-10 left-10 w-3 h-3 bg-gray-400 rounded-full opacity-40 animate-bounce" style={{animationDelay: '0s', animationDuration: '4s'}}></div>
      <div className="absolute top-32 right-16 w-2 h-2 bg-white rounded-full opacity-60 animate-bounce" style={{animationDelay: '1s', animationDuration: '3s'}}></div>
      <div className="absolute bottom-24 left-16 w-4 h-4 bg-gray-500 rounded-full opacity-30 animate-bounce" style={{animationDelay: '2s', animationDuration: '5s'}}></div>

      <div className="w-full max-w-md relative z-10">
        
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="relative inline-block mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-800 to-black rounded-3xl flex items-center justify-center shadow-2xl shadow-black/50 relative border border-gray-700">
              <Image 
                src="/ns.logowhite.png" 
                alt="NS Logo" 
                width={100} 
                height={100} 
                className="drop-shadow-lg"
              />
              
              {/* Sparkle Effect */}
              <div className="absolute -top-2 -right-2">
                <Sparkles className="w-6 h-6 text-gray-300 animate-pulse" />
              </div>
            </div>
            
            {/* Glow Effect */}
            <div className="absolute inset-0 w-24 h-24 bg-gradient-to-br from-gray-600 to-gray-800 rounded-3xl blur-xl opacity-20 animate-pulse"></div>
          </div>
          
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
            NS-<span className="text-gray-300">Stock</span>
          </h1>
          <p className="text-gray-400 text-lg font-medium">ระบบจัดการสต็อกภายในร้าน</p>
          <div className="w-24 h-1 bg-gradient-to-r from-gray-600 to-gray-400 rounded-full mx-auto mt-4"></div>
        </div>

        {/* Login Card */}
        <div className="bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-700/50 p-8 relative overflow-hidden">
          
          {/* Card Header Glow */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gray-600 via-white to-gray-600"></div>
          
          <div className="space-y-6">
            
            {/* Username Field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-300 flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-400" />
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
                  className={`w-full px-4 py-4 bg-gray-800/50 border-2 rounded-2xl transition-all duration-300 outline-none font-medium text-white placeholder-gray-400 ${
                    focusField === 'username' 
                      ? 'border-white bg-gray-800/80 shadow-lg shadow-white/10' 
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                  placeholder="owner หรือ staff1"
                  required
                  disabled={loading}
                />
                
                {/* Focus Indicator */}
                {focusField === 'username' && (
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-300 flex items-center space-x-2">
                <Lock className="w-4 h-4 text-gray-400" />
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
                  className={`w-full px-4 py-4 bg-gray-800/50 border-2 rounded-2xl transition-all duration-300 outline-none font-medium text-white placeholder-gray-400 ${
                    focusField === 'password' 
                      ? 'border-white bg-gray-800/80 shadow-lg shadow-white/10' 
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                  placeholder="รหัสผ่าน"
                  required
                  disabled={loading}
                />
                
                {/* Focus Indicator */}
                {focusField === 'password' && (
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-900/50 border-l-4 border-red-500 p-4 rounded-r-2xl animate-pulse">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <p className="text-red-300 font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading || !formData.username || !formData.password}
              className="w-full relative overflow-hidden bg-gradient-to-r from-gray-800 to-black hover:from-gray-700 hover:to-gray-900 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 shadow-xl border border-gray-600 hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed group"
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
                <div className="flex-1 h-px bg-gray-700"></div>
                <span className="text-gray-500 text-sm font-medium">เข้าสู่ระบบด่วน</span>
                <div className="flex-1 h-px bg-gray-700"></div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => quickLogin('owner', '123456')}
                  disabled={loading}
                  className="bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600 text-gray-300 py-3 px-4 rounded-xl transition-all duration-200 text-sm font-medium hover:border-gray-500 disabled:opacity-50"
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
                  className="bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600 text-gray-300 py-3 px-4 rounded-xl transition-all duration-200 text-sm font-medium hover:border-gray-500 disabled:opacity-50"
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
          <p className="text-gray-500 text-sm">
            © 2024 NS-Stock Management System
          </p>
        </div>
      </div>
    </div>
  )
}

export default CoffeeLoginMinimalist