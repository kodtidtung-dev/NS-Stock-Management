// src/app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
import { API_MESSAGES, HTTP_STATUS, ROLES } from '@/lib/constants'

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

    // Get products with optimized query - use compound index for better performance
    const products = await prisma.product.findMany({
      where: {
        active: true, // Filter for active products first (uses compound index)
      },
      include: {
        category: {
          select: { name: true }
        },
      },
      orderBy: [
        { name: 'asc' }
      ]
    })

    // Get latest stock for each product in a separate query
    const productIds = products.map(p => p.id)
    const stockLogs = await prisma.stockLog.findMany({
      where: {
        productId: { in: productIds }
      },
      orderBy: { date: 'desc' },
      distinct: ['productId'],
    })

    // Create a map for faster lookup
    const stockMap = new Map(stockLogs.map(stock => [stock.productId, stock]))

    // Transform data to include current stock and alert status
    const productsWithStock = products.map(product => {
      const latestStock = stockMap.get(product.id)
      const currentStock = latestStock?.quantityRemaining || 0
      const isLowStock = currentStock <= product.minimumStock

      return {
        id: product.id,
        name: product.name,
        category: product.category,
        categoryId: product.categoryId,
        unit: product.unit,
        minimumStock: product.minimumStock,
        currentStock,
        isLowStock,
        active: product.active,
        lastUpdated: latestStock?.date || null,
        lastUpdatedBy: latestStock?.createdBy || null,
      }
    })

    const response = NextResponse.json(
      { products: productsWithStock },
      { status: HTTP_STATUS.OK }
    )

    // Add cache headers for better performance (allow client-side caching for 2 minutes)
    response.headers.set('Cache-Control', 'public, max-age=120, s-maxage=60')
    response.headers.set('ETag', `"products-${Date.now()}"`)
    response.headers.set('Last-Modified', new Date().toUTCString())

    return response
  } catch (error) {
    console.error('Get products error:', error)
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

    if (!payload || payload.role !== ROLES.OWNER) {
      return NextResponse.json(
        { error: API_MESSAGES.AUTH.UNAUTHORIZED },
        { status: HTTP_STATUS.FORBIDDEN }
      )
    }

    const { name, unit, minimumStock, categoryId, description } = await request.json()

    if (!name || !unit || minimumStock === undefined) {
      return NextResponse.json(
        { error: API_MESSAGES.GENERAL.INVALID_REQUEST },
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    // Check for duplicate product name
    const existingProduct = await prisma.product.findFirst({
      where: { name, active: true },
    })

    if (existingProduct) {
      return NextResponse.json(
        { error: API_MESSAGES.PRODUCTS.DUPLICATE_NAME },
        { status: HTTP_STATUS.CONFLICT }
      )
    }

    // Validate category if provided
    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: parseInt(categoryId), active: true }
      })
      
      if (!category) {
        return NextResponse.json(
          { error: 'ไม่พบหมวดหมู่ที่ระบุ' },
          { status: HTTP_STATUS.BAD_REQUEST }
        )
      }
    }

    // Create new product
    const product = await prisma.product.create({
      data: {
        name,
        unit,
        minimumStock: parseFloat(minimumStock),
        categoryId: categoryId ? parseInt(categoryId) : null,
        description: description?.trim() || null,
        createdBy: payload.userId,
      },
    })

    const response = NextResponse.json(
      {
        message: API_MESSAGES.PRODUCTS.CREATED_SUCCESS,
        product,
      },
      { status: HTTP_STATUS.CREATED }
    )

    // Add no-cache headers for immediate visibility
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')

    return response
  } catch (error) {
    console.error('Create product error:', error)
    return NextResponse.json(
      { error: API_MESSAGES.GENERAL.INTERNAL_ERROR },
      { status: HTTP_STATUS.INTERNAL_ERROR }
    )
  }
}