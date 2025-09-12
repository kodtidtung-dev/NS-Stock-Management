// src/app/api/dashboard/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Cache the response for 60 seconds
export const revalidate = 60;

export async function GET() {
  try {
    // Use parallel queries for better performance
    const [products, lastUpdate] = await Promise.all([
      // Get all products with their latest stock logs
      prisma.product.findMany({
        where: { active: true },
        select: {
          id: true,
          name: true,
          minimumStock: true,
          unit: true,
          stockLogs: {
            select: {
              quantityRemaining: true,
              date: true
            },
            orderBy: { date: 'desc' },
            take: 1
          },
          category: {
            select: {
              name: true
            }
          }
        }
      }),
      // Get last update info
      prisma.stockLog.findFirst({
        select: {
          date: true,
          createdAt: true,
          user: {
            select: {
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    ])

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

    // Get today's usage more efficiently
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    // Use raw query for better performance on usage calculation
    const todayUsageQuery = await prisma.$queryRaw`
      SELECT 
        p.name,
        p.unit,
        COALESCE(yesterday.quantity_remaining, 0) - COALESCE(today.quantity_remaining, 0) as used
      FROM products p
      LEFT JOIN (
        SELECT product_id, quantity_remaining
        FROM stock_logs
        WHERE DATE(date) = DATE(${yesterday})
      ) yesterday ON p.id = yesterday.product_id
      LEFT JOIN (
        SELECT product_id, quantity_remaining
        FROM stock_logs
        WHERE DATE(date) = DATE(${today})
      ) today ON p.id = today.product_id
      WHERE p.active = true
        AND (yesterday.quantity_remaining IS NOT NULL OR today.quantity_remaining IS NOT NULL)
        AND COALESCE(yesterday.quantity_remaining, 0) - COALESCE(today.quantity_remaining, 0) > 0
      ORDER BY used DESC
      LIMIT 10
    ` as Array<{ name: string; unit: string; used: number }>

    const todayUsage = todayUsageQuery.map(item => ({
      name: item.name,
      used: item.used.toFixed(2),
      unit: item.unit
    }))

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
      todayUsage // Already sorted by the query
    }

    // Set cache headers for better performance
    return new NextResponse(JSON.stringify(responseData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}