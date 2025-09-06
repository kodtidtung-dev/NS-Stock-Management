import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'

// GET: ดูข้อมูลหมวดหมู่เฉพาะรายการ
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = getTokenFromRequest(request)
    const user = verifyToken(token || '')
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      )
    }

    const { id } = await params
    const categoryId = parseInt(id)
    
    if (isNaN(categoryId)) {
      return NextResponse.json(
        { success: false, message: 'ID หมวดหมู่ไม่ถูกต้อง' },
        { status: 400 }
      )
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: { products: true }
        },
        creator: {
          select: { name: true }
        }
      }
    })

    if (!category) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบหมวดหมู่ที่ระบุ' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: category.id,
        name: category.name,
        description: category.description,
        active: category.active,
        productCount: category._count.products,
        createdBy: category.creator.name,
        createdAt: category.createdAt
      }
    })

  } catch (error) {
    console.error('Category GET error:', error)
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    )
  }
}

// PUT: แก้ไขหมวดหมู่ (เจ้าของร้านเท่านั้น)
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
    const categoryId = parseInt(id)
    
    if (isNaN(categoryId)) {
      return NextResponse.json(
        { success: false, message: 'ID หมวดหมู่ไม่ถูกต้อง' },
        { status: 400 }
      )
    }

    const { name, description, active } = await request.json()
    
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'กรุณาใส่ชื่อหมวดหมู่' },
        { status: 400 }
      )
    }

    // ตรวจสอบว่าหมวดหมู่มีอยู่จริง
    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId }
    })

    if (!existingCategory) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบหมวดหมู่ที่ระบุ' },
        { status: 404 }
      )
    }

    // ตรวจสอบว่าชื่อซ้ำหรือไม่ (ยกเว้นตัวเอง)
    const duplicateName = await prisma.category.findFirst({
      where: { 
        name: name.trim(),
        id: { not: categoryId }
      }
    })

    if (duplicateName) {
      return NextResponse.json(
        { success: false, message: 'หมวดหมู่นี้มีอยู่แล้ว' },
        { status: 400 }
      )
    }

    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        active: active !== undefined ? active : existingCategory.active
      },
      include: {
        creator: { select: { name: true } },
        _count: { select: { products: true } }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'แก้ไขหมวดหมู่สำเร็จ',
      data: {
        id: updatedCategory.id,
        name: updatedCategory.name,
        description: updatedCategory.description,
        active: updatedCategory.active,
        productCount: updatedCategory._count.products,
        createdBy: updatedCategory.creator.name,
        createdAt: updatedCategory.createdAt
      }
    })

  } catch (error) {
    console.error('Category PUT error:', error)
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    )
  }
}

// DELETE: ลบหมวดหมู่ (เจ้าของร้านเท่านั้น)
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
    const categoryId = parseInt(id)
    
    if (isNaN(categoryId)) {
      return NextResponse.json(
        { success: false, message: 'ID หมวดหมู่ไม่ถูกต้อง' },
        { status: 400 }
      )
    }

    // อ่าน query parameter สำหรับ force delete
    const url = new URL(request.url)
    const force = url.searchParams.get('force') === 'true'

    // ตรวจสอบว่าหมวดหมู่มีอยู่จริง
    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: { select: { products: true } },
        products: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!existingCategory) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบหมวดหมู่ที่ระบุ' },
        { status: 404 }
      )
    }

    // หากไม่ใช่ force delete และมีสินค้าในหมวดหมู่
    if (!force && existingCategory._count.products > 0) {
      return NextResponse.json(
        { success: false, message: `ไม่สามารถลบหมวดหมู่ได้ เนื่องจากมีสินค้า ${existingCategory._count.products} รายการใช้หมวดหมู่นี้อยู่` },
        { status: 400 }
      )
    }

    let deletedProductsCount = 0
    
    // หาก force delete = true จะลบสินค้าทั้งหมดในหมวดหมู่ก่อน
    if (force && existingCategory._count.products > 0) {
      // ลบ StockLog ของสินค้าในหมวดหมู่นี้ก่อน
      for (const product of existingCategory.products) {
        await prisma.stockLog.deleteMany({
          where: { productId: product.id }
        })
      }
      
      // ลบสินค้าทั้งหมดในหมวดหมู่
      const deleteResult = await prisma.product.deleteMany({
        where: { categoryId: categoryId }
      })
      
      deletedProductsCount = deleteResult.count
    }

    // ลบหมวดหมู่
    const deletedCategory = await prisma.category.delete({
      where: { id: categoryId },
      select: {
        id: true,
        name: true
      }
    })

    return NextResponse.json({
      success: true,
      message: force && deletedProductsCount > 0 
        ? `ลบหมวดหมู่สำเร็จ พร้อมลบสินค้า ${deletedProductsCount} รายการ`
        : 'ลบหมวดหมู่สำเร็จ',
      data: {
        ...deletedCategory,
        deletedProductsCount
      }
    })

  } catch (error) {
    console.error('Category DELETE error:', error)
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    )
  }
}

// PATCH: เปลี่ยนสถานะหมวดหมู่ (active/inactive)
export async function PATCH(
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
    const categoryId = parseInt(id)
    
    if (isNaN(categoryId)) {
      return NextResponse.json(
        { success: false, message: 'ID หมวดหมู่ไม่ถูกต้อง' },
        { status: 400 }
      )
    }

    const { active } = await request.json()

    // ตรวจสอบว่าหมวดหมู่มีอยู่จริง
    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId }
    })

    if (!existingCategory) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบหมวดหมู่ที่ระบุ' },
        { status: 404 }
      )
    }

    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: {
        active: active
      },
      select: {
        id: true,
        name: true,
        active: true
      }
    })

    return NextResponse.json({
      success: true,
      message: active ? 'เปิดใช้งานหมวดหมู่สำเร็จ' : 'ปิดใช้งานหมวดหมู่สำเร็จ',
      data: updatedCategory
    })

  } catch (error) {
    console.error('Category PATCH error:', error)
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    )
  }
}