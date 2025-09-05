import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'

// GET: ดูหมวดหมู่ทั้งหมด
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request)
    const user = verifyToken(token || '')
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      )
    }

    const categories = await prisma.category.findMany({
      where: { active: true },
      include: {
        _count: {
          select: { products: true }
        },
        creator: {
          select: { name: true }
        }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        description: cat.description,
        productCount: cat._count.products,
        createdBy: cat.creator.name,
        createdAt: cat.createdAt
      }))
    })

  } catch (error) {
    console.error('Categories GET error:', error)
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    )
  }
}

// POST: เพิ่มหมวดหมู่ใหม่ (เจ้าของร้านเท่านั้น)
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

    const { name, description } = await request.json()
    
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'กรุณาใส่ชื่อหมวดหมู่' },
        { status: 400 }
      )
    }

    // ตรวจสอบว่าชื่อซ้ำหรือไม่
    const existing = await prisma.category.findUnique({
      where: { name: name.trim() }
    })

    if (existing) {
      return NextResponse.json(
        { success: false, message: 'หมวดหมู่นี้มีอยู่แล้ว' },
        { status: 400 }
      )
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        createdBy: user.userId
      },
      include: {
        creator: { select: { name: true } }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'เพิ่มหมวดหมู่สำเร็จ',
      data: {
        id: category.id,
        name: category.name,
        description: category.description,
        createdBy: category.creator.name,
        createdAt: category.createdAt
      }
    })

  } catch (error) {
    console.error('Categories POST error:', error)
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    )
  }
}
