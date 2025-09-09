'use client'
import { useState } from 'react'

export function useStockEdit() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canEditStock = (createdAt: string): boolean => {
    const created = new Date(createdAt)
    const now = new Date()
    const diffHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60)
    const isToday = created.toDateString() === now.toDateString()
    
    return isToday && diffHours <= 2
  }

  const getTimeLeft = (createdAt: string): number => {
    const created = new Date(createdAt)
    const now = new Date()
    const diffMinutes = (now.getTime() - created.getTime()) / (1000 * 60)
    return Math.max(0, 120 - diffMinutes)
  }

  const editStockEntry = async (
    logId: number,
    newQuantity: number,
    reason: string
  ) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/stock-logs/${logId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          quantityRemaining: newQuantity,
          editReason: reason,
          editedAt: new Date().toISOString()
        })
      })

      const result = await response.json()
      
      if (result.success) {
        return { success: true, data: result.data }
      } else {
        setError(result.message)
        return { success: false, error: result.message }
      }
    } catch {
      const errorMessage = 'เกิดข้อผิดพลาดในการแก้ไขข้อมูล'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    canEditStock,
    getTimeLeft,
    editStockEntry
  }
}