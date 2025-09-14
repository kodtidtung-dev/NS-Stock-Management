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

    // Use raw query to get stock changes (both usage and restocking)
    const todayUsageQuery = await prisma.$queryRaw`
      SELECT
        p.name,
        p.unit,
        COALESCE(c.name, 'ไม่มีหมวดหมู่') as category,
        COALESCE(yesterday.quantity_remaining, 0) - COALESCE(today.quantity_remaining, 0) as used,
        COALESCE(yesterday.quantity_remaining, 0) as yesterday_stock,
        COALESCE(today.quantity_remaining, 0) as today_stock,
        today.notes as today_notes
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN (
        SELECT product_id, quantity_remaining
        FROM stock_logs
        WHERE DATE(date) = DATE(${yesterday})
        ORDER BY created_at DESC
      ) yesterday ON p.id = yesterday.product_id
      LEFT JOIN (
        SELECT product_id, quantity_remaining, notes
        FROM stock_logs
        WHERE DATE(date) = DATE(${today})
        ORDER BY created_at DESC
      ) today ON p.id = today.product_id
      WHERE p.active = true
        AND (yesterday.quantity_remaining IS NOT NULL OR today.quantity_remaining IS NOT NULL)
        AND ABS(COALESCE(yesterday.quantity_remaining, 0) - COALESCE(today.quantity_remaining, 0)) > 0
      ORDER BY ABS(COALESCE(yesterday.quantity_remaining, 0) - COALESCE(today.quantity_remaining, 0)) DESC
      LIMIT 50
    ` as Array<{
      name: string;
      unit: string;
      category: string;
      used: number;
      yesterday_stock: number;
      today_stock: number;
      today_notes: string;
    }>

    const todayUsage = todayUsageQuery.map(item => {
      // Determine if it's usage (decrease) or restocking (increase)
      const stockChange = item.used;
      const isRestock = stockChange < 0;
      const absChange = Math.abs(stockChange);

      // For display purposes, show actual usage (positive values only)
      // Skip restocking entries or show them separately
      return {
        name: item.name,
        used: absChange % 1 === 0 ? absChange.toString() : absChange.toFixed(1),
        unit: item.unit,
        category: item.category,
        type: isRestock ? 'restock' : 'usage',
        yesterdayStock: item.yesterday_stock,
        todayStock: item.today_stock,
        notes: item.today_notes || ''
      }
    }).filter(item => item.type === 'usage') // Only show actual usage, not restocking

    // Get unique categories for frontend
    const categories = Array.from(new Set(todayUsageQuery.map(item => item.category)))
      .sort((a, b) => {
        if (a === 'ไม่มีหมวดหมู่') return 1
        if (b === 'ไม่มีหมวดหมู่') return -1
        return a.localeCompare(b, 'th')
      })

    const responseData = {
      lastUpdateDate: lastUpdate?.date || new Date().toISOString().split('T')[0],
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
      todayUsage, // Already sorted by the query
      categories // Available categories for filtering
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