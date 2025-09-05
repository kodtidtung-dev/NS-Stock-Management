import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'

// GET: ดูสินค้าทั้งหมดสำหรับการจัดการ (เจ้าของร้านเท่านั้น)
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request)
    const user = verifyToken(token || '')
    
    if (!user || user.role !== 'OWNER') {
      return NextResponse.json(
        { success: false, message: 'เฉพาะเจ้าของร้านเท่านั้น' },
        { status: 403 }
      )
    }

    const products = await prisma.product.findMany({
      include: {
        category: { select: { name: true } },
        creator: { select: { name: true } },
        stockLogs: {
          orderBy: { date: 'desc' },
          take: 1
        }
      },
      orderBy: [
        { active: 'desc' }, // Active products first
        { name: 'asc' }
      ]
    })

    const productsWithStock = products.map(product => {
      const latestStock = product.stockLogs[0]
      return {
        id: product.id,
        name: product.name,
        category: product.category?.name || 'ไม่มีหมวดหมู่',
        categoryId: product.categoryId,
        unit: product.unit,
        minimumStock: product.minimumStock,
        description: product.description,
        active: product.active,
        currentStock: latestStock?.quantityRemaining || 0,
        lastStockUpdate: latestStock?.date || null,
        createdBy: product.creator.name,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      }
    })

    return NextResponse.json({
      success: true,
      data: productsWithStock
    })

  } catch (error) {
    console.error('Products manage GET error:', error)
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    )
  }
}

// POST: เพิ่มสินค้าใหม่
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request)
    const user = verifyToken(token || '')
    
    if (!user || user.role !== 'OWNER') {
      return NextResponse.json(
        { success: false, message: 'เฉพาะเจ้าของร้านเท่านั้น' },
        { status: 403 }
      )
    }

    const { name, categoryId, unit, minimumStock, description } = await request.json()
    
    // Validation
    if (!name || !unit || minimumStock == null) {
      return NextResponse.json(
        { success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      )
    }

    if (minimumStock < 0) {
      return NextResponse.json(
        { success: false, message: 'จำนวนขั้นต่ำต้องมากกว่าหรือเท่ากับ 0' },
        { status: 400 }
      )
    }

    // ตรวจสอบว่า category มีอยู่จริงหรือไม่
    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId, active: true }
      })
      
      if (!category) {
        return NextResponse.json(
          { success: false, message: 'ไม่พบหมวดหมู่ที่ระบุ' },
          { status: 400 }
        )
      }
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        categoryId: categoryId || null,
        unit: unit.trim(),
        minimumStock: parseFloat(minimumStock),
        description: description?.trim() || null,
        createdBy: user.userId
      },
      include: {
        category: { select: { name: true } },
        creator: { select: { name: true } }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'เพิ่มสินค้าสำเร็จ',
      data: {
        id: product.id,
        name: product.name,
        category: product.category?.name || 'ไม่มีหมวดหมู่',
        categoryId: product.categoryId,
        unit: product.unit,
        minimumStock: product.minimumStock,
        description: product.description,
        active: product.active,
        createdBy: product.creator.name,
        createdAt: product.createdAt
      }
    })

  } catch (error) {
    console.error('Products manage POST error:', error)
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    )
  }
}

// PUT: แก้ไขสินค้า
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = getTokenFromRequest(request)
    const user = verifyToken(token || '')
    
    if (!user || user.role !== 'OWNER') {
      return NextResponse.json(
        { success: false, message: 'เฉพาะเจ้าของร้านเท่านั้น' },
        { status: 403 }
      )
    }

    const { id } = await params
    const productId = parseInt(id)
    if (isNaN(productId)) {
      return NextResponse.json(
        { success: false, message: 'ID สินค้าไม่ถูกต้อง' },
        { status: 400 }
      )
    }

    const { name, categoryId, unit, minimumStock, description, active } = await request.json()
    
    // Validation
    if (!name || !unit || minimumStock == null) {
      return NextResponse.json(
        { success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      )
    }

    if (minimumStock < 0) {
      return NextResponse.json(
        { success: false, message: 'จำนวนขั้นต่ำต้องมากกว่าหรือเท่ากับ 0' },
        { status: 400 }
      )
    }

    // ตรวจสอบว่าสินค้ามีอยู่จริง
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบสินค้าที่ระบุ' },
        { status: 404 }
      )
    }

    // ตรวจสอบว่า category มีอยู่จริงหรือไม่
    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId, active: true }
      })
      
      if (!category) {
        return NextResponse.json(
          { success: false, message: 'ไม่พบหมวดหมู่ที่ระบุ' },
          { status: 400 }
        )
      }
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        name: name.trim(),
        categoryId: categoryId || null,
        unit: unit.trim(),
        minimumStock: parseFloat(minimumStock),
        description: description?.trim() || null,
        active: active !== undefined ? active : existingProduct.active,
        updatedAt: new Date()
      },
      include: {
        category: { select: { name: true } },
        creator: { select: { name: true } }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'แก้ไขสินค้าสำเร็จ',
      data: {
        id: updatedProduct.id,
        name: updatedProduct.name,
        category: updatedProduct.category?.name || 'ไม่มีหมวดหมู่',
        categoryId: updatedProduct.categoryId,
        unit: updatedProduct.unit,
        minimumStock: updatedProduct.minimumStock,
        description: updatedProduct.description,
        active: updatedProduct.active,
        createdBy: updatedProduct.creator.name,
        createdAt: updatedProduct.createdAt,
        updatedAt: updatedProduct.updatedAt
      }
    })

  } catch (error) {
    console.error('Products manage PUT error:', error)
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    )
  }
}

// DELETE: ลบสินค้า (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = getTokenFromRequest(request)
    const user = verifyToken(token || '')
    
    if (!user || user.role !== 'OWNER') {
      return NextResponse.json(
        { success: false, message: 'เฉพาะเจ้าของร้านเท่านั้น' },
        { status: 403 }
      )
    }

    const { id } = await params
    const productId = parseInt(id)
    if (isNaN(productId)) {
      return NextResponse.json(
        { success: false, message: 'ID สินค้าไม่ถูกต้อง' },
        { status: 400 }
      )
    }

    // ตรวจสอบว่าสินค้ามีอยู่จริง
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบสินค้าที่ระบุ' },
        { status: 404 }
      )
    }

    // Hard delete - ลบจริงออกจาก database
    const deletedProduct = await prisma.product.delete({
      where: { id: productId },
      select: {
        id: true,
        name: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'ลบสินค้าสำเร็จ',
      data: deletedProduct
    })

  } catch (error) {
    console.error('Products manage DELETE error:', error)
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    )
  }
}

// PATCH: เปลี่ยนสถานะสินค้า (active/inactive)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = getTokenFromRequest(request)
    const user = verifyToken(token || '')
    
    if (!user || user.role !== 'OWNER') {
      return NextResponse.json(
        { success: false, message: 'เฉพาะเจ้าของร้านเท่านั้น' },
        { status: 403 }
      )
    }

    const { id } = await params
    const productId = parseInt(id)
    if (isNaN(productId)) {
      return NextResponse.json(
        { success: false, message: 'ID สินค้าไม่ถูกต้อง' },
        { status: 400 }
      )
    }

    const { active } = await request.json()

    // ตรวจสอบว่าสินค้ามีอยู่จริง
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบสินค้าที่ระบุ' },
        { status: 404 }
      )
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        active: active,
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        active: true
      }
    })

    return NextResponse.json({
      success: true,
      message: active ? 'เปิดใช้งานสินค้าสำเร็จ' : 'ปิดใช้งานสินค้าสำเร็จ',
      data: updatedProduct
    })

  } catch (error) {
    console.error('Products manage PATCH error:', error)
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    )
  }
}