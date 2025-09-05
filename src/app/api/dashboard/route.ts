// src/app/api/dashboard/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get all products with their latest stock logs
    const products = await prisma.product.findMany({
      where: { active: true },
      include: {
        stockLogs: {
          orderBy: { date: 'desc' },
          take: 1
        },
        category: true
      }
    })

    // Calculate summary statistics
    const total = products.length
    let ok = 0
    let lowStock = 0
    let outOfStock = 0
    const lowStockProducts: Array<{
      id: number
      name: string
      currentStock: number
      minStock: number
      unit: string
      status: string
      category: string
    }> = []

    products.forEach(product => {
      const latestStock = product.stockLogs[0]
      const currentStock = latestStock?.quantityRemaining || 0
      
      let status = 'OK'
      if (currentStock === 0) {
        status = 'OUT_OF_STOCK'
        outOfStock++
      } else if (currentStock <= product.minimumStock) {
        status = 'LOW_STOCK'
        lowStock++
      } else {
        ok++
      }

      if (status !== 'OK') {
        lowStockProducts.push({
          id: product.id,
          name: product.name,
          currentStock,
          minStock: product.minimumStock,
          unit: product.unit,
          status,
          category: product.category?.name || 'ไม่มีหมวดหมู่'
        })
      }
    })

    // Get today's usage (difference between yesterday and today)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const todayUsage: Array<{
      name: string
      used: string
      unit: string
    }> = []
    
    // Get all stock logs for yesterday and today for all products
    const allStockLogs = await prisma.stockLog.findMany({
      where: {
        date: {
          gte: yesterday
        }
      },
      include: {
        product: true
      },
      orderBy: [
        { productId: 'asc' },
        { date: 'desc' }
      ]
    })

    // Group by product and calculate usage
    const productUsage = new Map()
    
    for (const log of allStockLogs) {
      const productId = log.productId
      const logDate = new Date(log.date)
      logDate.setHours(0, 0, 0, 0)
      
      if (!productUsage.has(productId)) {
        productUsage.set(productId, {
          name: log.product.name,
          unit: log.product.unit,
          yesterday: null,
          today: null
        })
      }
      
      const productData = productUsage.get(productId)
      
      if (logDate.getTime() === yesterday.getTime()) {
        productData.yesterday = log.quantityRemaining
      } else if (logDate.getTime() === today.getTime()) {
        productData.today = log.quantityRemaining
      }
    }

    // Calculate usage for products that have both yesterday and today data
    for (const [, data] of productUsage) {
      if (data.yesterday !== null && data.today !== null) {
        const used = data.yesterday - data.today
        if (used > 0) {
          todayUsage.push({
            name: data.name,
            used: used.toFixed(2),
            unit: data.unit
          })
        }
      }
    }

    // Get last update info
    const lastUpdate = await prisma.stockLog.findFirst({
      orderBy: { createdAt: 'desc' },
      include: { user: true }
    })

    const responseData = {
      lastUpdateDate: lastUpdate?.date.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
      lastUpdateTime: lastUpdate?.createdAt.toLocaleTimeString('th-TH', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }) || new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      updatedBy: lastUpdate?.user?.name || 'ระบบ',
      summary: {
        total,
        ok,
        lowStock,
        outOfStock
      },
      lowStockProducts: lowStockProducts.sort((a, b) => {
        if (a.status === 'OUT_OF_STOCK' && b.status !== 'OUT_OF_STOCK') return -1
        if (a.status !== 'OUT_OF_STOCK' && b.status === 'OUT_OF_STOCK') return 1
        return 0
      }),
      todayUsage: todayUsage.sort((a, b) => parseFloat(b.used) - parseFloat(a.used))
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}