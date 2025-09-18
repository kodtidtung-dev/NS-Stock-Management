import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { Role } from '@prisma/client'

// Helper function to check user dependencies
async function checkUserDependencies(userId: number) {
  const [stockLogsCount, productsCount, categoriesCount] = await Promise.all([
    prisma.stockLog.count({
      where: { createdBy: userId }
    }),
    prisma.product.count({
      where: { createdBy: userId }
    }),
    prisma.category.count({
      where: { createdBy: userId }
    })
  ])

  return {
    stockLogs: stockLogsCount,
    products: productsCount,
    categories: categoriesCount,
    hasAnyData: stockLogsCount > 0 || productsCount > 0 || categoriesCount > 0
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = parseInt(id)

    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'ID ผู้ใช้ไม่ถูกต้อง' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        active: true,
        createdAt: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'ไม่พบผู้ใช้' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = parseInt(id)

    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'ID ผู้ใช้ไม่ถูกต้อง' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { name, role, password, active } = body

    // Validation
    if (!name) {
      return NextResponse.json(
        { error: 'กรุณากรอกชื่อ-นามสกุล' },
        { status: 400 }
      )
    }

    if (password && password.length < 6) {
      return NextResponse.json(
        { error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'ไม่พบผู้ใช้' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: {
      name: string
      role: Role
      active: boolean
      password?: string
    } = {
      name,
      role: (role as Role) || existingUser.role,
      active: active !== undefined ? active : existingUser.active
    }

    // Hash new password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10)
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        active: true,
        createdAt: true
      }
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัปเดตผู้ใช้' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = parseInt(id)

    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'ID ผู้ใช้ไม่ถูกต้อง' },
        { status: 400 }
      )
    }

    // Don't allow deleting the main owner (user ID 1)
    if (userId === 1) {
      return NextResponse.json(
        { error: 'ไม่สามารถลบเจ้าของร้านหลักได้' },
        { status: 403 }
      )
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'ไม่พบผู้ใช้' },
        { status: 404 }
      )
    }

    // Check if user has any related data (to prevent data integrity issues)
    const dependencies = await checkUserDependencies(userId)

    if (dependencies.hasAnyData) {
      // Instead of deleting, deactivate the user to preserve data integrity
      await prisma.user.update({
        where: { id: userId },
        data: { active: false }
      })

      // Provide detailed information about why user cannot be deleted
      const relatedDataInfo = []
      if (dependencies.stockLogs > 0) relatedDataInfo.push(`ประวัติสต็อก ${dependencies.stockLogs} รายการ`)
      if (dependencies.products > 0) relatedDataInfo.push(`สินค้า ${dependencies.products} รายการ`)
      if (dependencies.categories > 0) relatedDataInfo.push(`หมวดหมู่ ${dependencies.categories} รายการ`)

      return NextResponse.json({
        success: true,
        message: `ผู้ใช้มีข้อมูลที่เกี่ยวข้อง (${relatedDataInfo.join(', ')}) จึงทำการปิดใช้งานแทนการลบ`,
        data: {
          userId,
          action: 'deactivated',
          relatedData: dependencies
        }
      })
    } else {
      // Safe to delete if no related data
      await prisma.user.delete({
        where: { id: userId }
      })

      return NextResponse.json({
        success: true,
        message: 'ลบผู้ใช้เรียบร้อยแล้ว',
        data: {
          userId,
          action: 'deleted'
        }
      })
    }
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบผู้ใช้' },
      { status: 500 }
    )
  }
}