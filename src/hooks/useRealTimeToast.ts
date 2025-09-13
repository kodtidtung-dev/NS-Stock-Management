// src/hooks/useRealTimeToast.ts
import React, { useEffect } from 'react'
import { toast } from 'sonner'
import { useEventBus, PRODUCT_EVENTS, DASHBOARD_EVENTS } from '@/lib/eventBus'

export function useRealTimeToast() {
  // Product events notifications
  useEventBus(PRODUCT_EVENTS.CREATED, (eventData) => {
    if (eventData.product) {
      toast.success(`📦 เพิ่มสินค้า "${eventData.product.name}" สำเร็จ`, {
        duration: 3000,
      })
    }
  }, [])

  useEventBus(PRODUCT_EVENTS.UPDATED, (eventData) => {
    if (eventData.product) {
      toast.success(`✏️ อัปเดตข้อมูล "${eventData.product.name}" สำเร็จ`, {
        duration: 3000,
      })
    }
  }, [])

  useEventBus(PRODUCT_EVENTS.DELETED, (eventData) => {
    toast.success(`🗑️ ลบสินค้าสำเร็จ`, {
      duration: 3000,
    })
  }, [])

  useEventBus(PRODUCT_EVENTS.STOCK_UPDATED, (eventData) => {
    if (eventData.product) {
      const stockStatus = eventData.newStock <= eventData.product.minimumStock ? '⚠️' : '✅'
      toast.success(`${stockStatus} อัปเดตสต็อก "${eventData.product.name}" เป็น ${eventData.newStock} ${eventData.product.unit}`, {
        duration: 4000,
      })
    }
  }, [])

  // Dashboard refresh notifications
  useEventBus(DASHBOARD_EVENTS.DATA_CHANGED, (eventData) => {
    const messages = {
      'product-created': '📊 ข้อมูลแดชบอร์ดอัปเดตแล้ว - เพิ่มสินค้าใหม่',
      'product-updated': '📊 ข้อมูลแดชบอร์ดอัปเดตแล้ว - แก้ไขสินค้า',
      'product-deleted': '📊 ข้อมูลแดชบอร์ดอัปเดตแล้ว - ลบสินค้า',
      'stock-update': '📊 ข้อมูลแดชบอร์ดอัปเดตแล้ว - อัปเดตสต็อก',
    }

    const message = messages[eventData?.type as keyof typeof messages]
    if (message) {
      toast.info(message, {
        duration: 2000,
      })
    }
  }, [])
}

// Auto-initialize toast system
export function RealTimeToastProvider({ children }: { children: React.ReactNode }) {
  useRealTimeToast()
  return <>{children}</>
}