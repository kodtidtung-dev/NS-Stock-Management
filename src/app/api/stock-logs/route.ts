// src/app/api/stock-logs/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
import { API_MESSAGES, HTTP_STATUS } from '@/lib/constants'

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request)
    const payload = token ? verifyToken(token) : null

    if (!payload) {
      return NextResponse.json(
        { error: API_MESSAGES.AUTH.UNAUTHORIZED },
        { status: HTTP_STATUS.UNAUTHORIZED }
      )
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const limit = parseInt(searchParams.get('limit') || '10')

    const where: { productId?: number } = {}
    if (productId) {
      where.productId = parseInt(productId)
    }

    const stockLogs = await prisma.stockLog.findMany({
      where,
      include: {
        product: {
          select: {
            name: true,
            unit: true,
          },
        },
        user: {
          select: {
            name: true,
            username: true,
          },
        },
      },
      orderBy: { date: 'desc' },
      take: limit,
    })

    const response = NextResponse.json(
      { stockLogs },
      { status: HTTP_STATUS.OK }
    )

    // Add no-cache headers to ensure fresh data
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')

    return response
  } catch (error) {
    console.error('Get stock logs error:', error)
    return NextResponse.json(
      { error: API_MESSAGES.GENERAL.INTERNAL_ERROR },
      { status: HTTP_STATUS.INTERNAL_ERROR }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request)
    const payload = token ? verifyToken(token) : null

    if (!payload) {
      return NextResponse.json(
        { error: API_MESSAGES.AUTH.UNAUTHORIZED },
        { status: HTTP_STATUS.UNAUTHORIZED }
      )
    }

    const body = await request.json()
    
    // Handle bulk stock data submission (from staff page)
    if (body.stockLogs && Array.isArray(body.stockLogs)) {
      const { stockLogs } = body
      const today = new Date().toISOString().split('T')[0]
      const stockDate = today // Keep as string for SQLite schema
      
      if (stockLogs.length === 0) {
        return NextResponse.json(
          { error: 'No stock data provided' },
          { status: HTTP_STATUS.BAD_REQUEST }
        )
      }

      try {
        const createdLogs = []
        const errors = []

        // Validate all items first
        for (const item of stockLogs) {
          const { productId, quantity } = item

          if (!productId || quantity === undefined) {
            errors.push(`Missing productId or quantity in item`)
            continue
          }

          if (quantity < 0) {
            errors.push(`Invalid quantity ${quantity} for product ${productId}`)
            continue
          }
        }

        if (errors.length > 0) {
          return NextResponse.json(
            {
              error: 'Validation failed',
              details: errors,
              validatedItems: stockLogs.length - errors.length,
              totalItems: stockLogs.length
            },
            { status: HTTP_STATUS.BAD_REQUEST }
          )
        }

        // Process each item
        for (const item of stockLogs) {
          const { productId, quantity, notes } = item

          try {
            // Check if product exists
            const product = await prisma.product.findUnique({
              where: { id: parseInt(productId), active: true },
            })

            if (!product) {
              errors.push(`Product with ID ${productId} not found`)
              continue
            }

            // Try to create stock log
            let stockLog
            try {
              stockLog = await prisma.stockLog.create({
                data: {
                  productId: parseInt(productId),
                  date: stockDate,
                  quantityRemaining: parseFloat(quantity),
                  createdBy: payload.userId,
                  notes: notes || null,
                },
              })
            } catch (createError: unknown) {
              // Handle unique constraint violation - update existing log instead
              const prismaError = createError as { code?: string }
              if (prismaError.code === 'P2002') {
                stockLog = await prisma.stockLog.update({
                  where: {
                    productId_date: {
                      productId: parseInt(productId),
                      date: stockDate
                    }
                  },
                  data: {
                    quantityRemaining: parseFloat(quantity),
                    notes: notes || null,
                  }
                })
              } else {
                throw createError
              }
            }

            if (stockLog) {
              createdLogs.push(stockLog)
            }
          } catch (itemError) {
            console.error(`Error processing item ${productId}:`, itemError)
            errors.push(`Failed to process product ${productId}: ${itemError instanceof Error ? itemError.message : 'Unknown error'}`)
          }
        }

        const response = NextResponse.json(
          {
            message: `Successfully processed ${createdLogs.length} stock logs`,
            stockLogs: createdLogs,
            processed: createdLogs.length,
            total: stockLogs.length,
            errors: errors.length > 0 ? errors : undefined
          },
          { status: createdLogs.length > 0 ? HTTP_STATUS.CREATED : HTTP_STATUS.BAD_REQUEST }
        )

        // Add no-cache headers for immediate visibility
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
        response.headers.set('Pragma', 'no-cache')
        response.headers.set('Expires', '0')

        return response
      } catch (error) {
        console.error('Bulk stock log error:', error)
        return NextResponse.json(
          {
            error: 'Failed to process bulk stock data',
            details: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
          },
          { status: HTTP_STATUS.INTERNAL_ERROR }
        )
      }
    }

    // Handle single stock log creation (legacy)
    const { productId, date, quantityRemaining, notes } = body

    if (!productId || !date || quantityRemaining === undefined) {
      return NextResponse.json(
        { error: API_MESSAGES.GENERAL.INVALID_REQUEST },
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    if (quantityRemaining < 0) {
      return NextResponse.json(
        { error: API_MESSAGES.STOCK.INVALID_QUANTITY },
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    const stockDate = new Date(date)
    if (isNaN(stockDate.getTime())) {
      return NextResponse.json(
        { error: API_MESSAGES.STOCK.INVALID_DATE },
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    // Convert to string format for SQLite schema
    const stockDateString = stockDate.toISOString().split('T')[0]

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId), active: true },
    })

    if (!product) {
      return NextResponse.json(
        { error: API_MESSAGES.PRODUCTS.NOT_FOUND },
        { status: HTTP_STATUS.NOT_FOUND }
      )
    }

    try {
      // Create stock log (will fail if duplicate productId + date)
      const stockLog = await prisma.stockLog.create({
        data: {
          productId: parseInt(productId),
          date: stockDateString,
          quantityRemaining: parseFloat(quantityRemaining),
          createdBy: payload.userId,
          notes: notes || null,
        },
        include: {
          product: {
            select: {
              name: true,
              unit: true,
            },
          },
          user: {
            select: {
              name: true,
            },
          },
        },
      })

      const response = NextResponse.json(
        {
          message: API_MESSAGES.STOCK.LOG_CREATED,
          stockLog,
        },
        { status: HTTP_STATUS.CREATED }
      )

      // Add no-cache headers for immediate visibility
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
      response.headers.set('Pragma', 'no-cache')
      response.headers.set('Expires', '0')

      return response
    } catch (error: unknown) {
      // Handle unique constraint violation
      const prismaError = error as { code?: string }
      if (prismaError.code === 'P2002') {
        return NextResponse.json(
          { error: API_MESSAGES.STOCK.DUPLICATE_LOG },
          { status: HTTP_STATUS.CONFLICT }
        )
      }
      throw error
    }
  } catch (error) {
    console.error('Create stock log error:', error)
    return NextResponse.json(
      { error: API_MESSAGES.GENERAL.INTERNAL_ERROR },
      { status: HTTP_STATUS.INTERNAL_ERROR }
    )
  }
}