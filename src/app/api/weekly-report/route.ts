import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const weekOffset = parseInt(searchParams.get('week') || '0')

    // Calculate week dates
    const now = new Date()
    const currentWeekStart = new Date(now)
    currentWeekStart.setDate(now.getDate() - now.getDay() - (weekOffset * 7))
    currentWeekStart.setHours(0, 0, 0, 0)

    const currentWeekEnd = new Date(currentWeekStart)
    currentWeekEnd.setDate(currentWeekStart.getDate() + 6)
    currentWeekEnd.setHours(23, 59, 59, 999)

    // Previous week for comparison
    const prevWeekStart = new Date(currentWeekStart)
    prevWeekStart.setDate(currentWeekStart.getDate() - 7)
    
    const prevWeekEnd = new Date(currentWeekEnd)
    prevWeekEnd.setDate(currentWeekEnd.getDate() - 7)

    // Get all products
    const products = await prisma.product.findMany({
      where: { active: true },
      include: {
        stockLogs: {
          where: {
            date: {
              gte: prevWeekStart.toISOString().split('T')[0],
              lte: currentWeekEnd.toISOString().split('T')[0]
            }
          },
          orderBy: { date: 'asc' }
        }
      }
    })

    // Calculate weekly usage for current week
    const currentWeekUsage = new Map()
    const prevWeekUsage = new Map()
    const dailyUsage: Array<{
      date: string
      totalItems: number
      products: Array<{
        name: string
        used: number
        unit: string
      }>
    }> = []

    // Process each day of current week
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(currentWeekStart)
      currentDate.setDate(currentWeekStart.getDate() + i)
      currentDate.setHours(0, 0, 0, 0)

      const nextDate = new Date(currentDate)
      nextDate.setDate(currentDate.getDate() + 1)

      const dayProducts: Array<{
        name: string
        used: number
        unit: string
      }> = []

      for (const product of products) {
        // Get today's and yesterday's stock for this specific day
        const todayLog = product.stockLogs.find(log => {
          const logDate = new Date(log.date)
          logDate.setHours(0, 0, 0, 0)
          return logDate.getTime() === currentDate.getTime()
        })

        const yesterdayDate = new Date(currentDate)
        yesterdayDate.setDate(currentDate.getDate() - 1)
        
        const yesterdayLog = product.stockLogs.find(log => {
          const logDate = new Date(log.date)
          logDate.setHours(0, 0, 0, 0)
          return logDate.getTime() === yesterdayDate.getTime()
        })

        if (todayLog && yesterdayLog) {
          const used = yesterdayLog.quantityRemaining - todayLog.quantityRemaining
          if (used > 0) {
            dayProducts.push({
              name: product.name,
              used: used,
              unit: product.unit
            })

            // Add to weekly totals
            const currentTotal = currentWeekUsage.get(product.name) || 0
            currentWeekUsage.set(product.name, currentTotal + used)
          }
        }
      }

      if (dayProducts.length > 0) {
        dailyUsage.push({
          date: currentDate.toISOString().split('T')[0],
          totalItems: dayProducts.length,
          products: dayProducts.sort((a, b) => b.used - a.used)
        })
      }
    }

    // Calculate previous week usage for trends
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(prevWeekStart)
      currentDate.setDate(prevWeekStart.getDate() + i)
      currentDate.setHours(0, 0, 0, 0)

      for (const product of products) {
        const todayLog = product.stockLogs.find(log => {
          const logDate = new Date(log.date)
          logDate.setHours(0, 0, 0, 0)
          return logDate.getTime() === currentDate.getTime()
        })

        const yesterdayDate = new Date(currentDate)
        yesterdayDate.setDate(currentDate.getDate() - 1)
        
        const yesterdayLog = product.stockLogs.find(log => {
          const logDate = new Date(log.date)
          logDate.setHours(0, 0, 0, 0)
          return logDate.getTime() === yesterdayDate.getTime()
        })

        if (todayLog && yesterdayLog) {
          const used = yesterdayLog.quantityRemaining - todayLog.quantityRemaining
          if (used > 0) {
            const prevTotal = prevWeekUsage.get(product.name) || 0
            prevWeekUsage.set(product.name, prevTotal + used)
          }
        }
      }
    }

    // Convert usage maps to arrays with product info
    const currentWeekArray = Array.from(currentWeekUsage.entries()).map(([name, totalUsed]) => {
      const product = products.find(p => p.name === name)
      return {
        name,
        totalUsed: totalUsed as number,
        unit: product?.unit || '',
        dailyAverage: (totalUsed as number) / 7
      }
    })

    // Sort and get top/bottom products
    const mostUsedProducts = currentWeekArray
      .sort((a, b) => b.totalUsed - a.totalUsed)
      .slice(0, 5)

    const leastUsedProducts = currentWeekArray
      .sort((a, b) => a.totalUsed - b.totalUsed)
      .slice(0, 5)

    // Calculate trends
    const trends = Array.from(currentWeekUsage.entries()).map(([name, currentUsed]) => {
      const prevUsed = prevWeekUsage.get(name) || 0
      const percentage = prevUsed > 0 ? ((currentUsed as number - prevUsed) / prevUsed) * 100 : 0
      
      let trend: 'up' | 'down' | 'stable' = 'stable'
      if (percentage > 5) trend = 'up'
      else if (percentage < -5) trend = 'down'

      return {
        productName: name,
        trend,
        percentage,
        currentWeek: currentUsed as number,
        previousWeek: prevUsed
      }
    })

    // Calculate total usage
    const totalUsage = Array.from(currentWeekUsage.values()).reduce((sum, usage) => sum + (usage as number), 0)

    const responseData = {
      weekStart: currentWeekStart.toISOString().split('T')[0],
      weekEnd: currentWeekEnd.toISOString().split('T')[0],
      summary: {
        totalUsage,
        totalProducts: currentWeekArray.length,
        mostUsedProducts,
        leastUsedProducts
      },
      dailyUsage: dailyUsage.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      trends: trends.sort((a, b) => Math.abs(b.percentage) - Math.abs(a.percentage))
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Weekly report API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}