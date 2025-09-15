// src/hooks/useRealTimeToast.ts
import React from 'react'
import { toast } from 'sonner'
import { PRODUCT_EVENTS, DASHBOARD_EVENTS } from '@/lib/eventBus'
import { useEventBus } from './useEventBus'

export function useRealTimeToast() {
  // Product events notifications
  useEventBus(PRODUCT_EVENTS.CREATED, (eventData) => {
    const data = eventData as { product?: { name: string } }
    if (data.product) {
      toast.success(`📦 เพิ่มสินค้า "${data.product.name}" สำเร็จ`, {
        duration: 3000,
      })
    }
  }, [])

  useEventBus(PRODUCT_EVENTS.UPDATED, (eventData) => {
    const data = eventData as { product?: { name: string } }
    if (data.product) {
      toast.success(`✏️ อัปเดตข้อมูล "${data.product.name}" สำเร็จ`, {
        duration: 3000,
      })
    }
  }, [])

  useEventBus(PRODUCT_EVENTS.DELETED, () => {
    toast.success(`🗑️ ลบสินค้าสำเร็จ`, {
      duration: 3000,
    })
  }, [])

  useEventBus(PRODUCT_EVENTS.STOCK_UPDATED, (eventData) => {
    const data = eventData as { product?: { name: string; unit: string; minimumStock: number }; newStock?: number }
    if (data.product) {
      const stockStatus = data.newStock && data.newStock <= data.product.minimumStock ? '⚠️' : '✅'
      toast.success(`${stockStatus} อัปเดตสต็อก "${data.product.name}" เป็น ${data.newStock} ${data.product.unit}`, {
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

    const data = eventData as { type?: string }
    const message = messages[data?.type as keyof typeof messages]
    if (message) {
      toast.info(message, {
        duration: 2000,
      })
    }
  }, [])
}

// Auto-initialize toast system
export function RealTimeToastProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  useRealTimeToast()
  return React.createElement(React.Fragment, null, children)
}