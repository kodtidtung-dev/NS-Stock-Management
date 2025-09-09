import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const token = getTokenFromRequest(request)
    const user = verifyToken(token || '')
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      )
    }

    const logId = parseInt(params.id)
    if (isNaN(logId)) {
      return NextResponse.json(
        { success: false, message: 'ID ไม่ถูกต้อง' },
        { status: 400 }
      )
    }

    const { quantityRemaining, editReason } = await request.json()

    const existingLog = await prisma.stockLog.findUnique({
      where: { id: logId }
    })

    if (!existingLog) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบข้อมูลที่ต้องการแก้ไข' },
        { status: 404 }
      )
    }

    if (user.role === 'STAFF') {
      if (existingLog.createdBy !== user.userId) {
        return NextResponse.json(
          { success: false, message: 'คุณสามารถแก้ไขได้เฉพาะข้อมูลที่ตัวเองบันทึก' },
          { status: 403 }
        )
      }

      const now = new Date()
      const created = new Date(existingLog.createdAt)
      const diffHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60)
      
      if (diffHours > 2) {
        return NextResponse.json(
          { success: false, message: 'สามารถแก้ไขได้เฉพาะภายใน 2 ชั่วโมงหลังบันทึก' },
          { status: 403 }
        )
      }

      if (created.toDateString() !== now.toDateString()) {
        return NextResponse.json(
          { success: false, message: 'สามารถแก้ไขได้เฉพาะข้อมูลวันเดียวกัน' },
          { status: 403 }
        )
      }
    }

    if (quantityRemaining < 0) {
      return NextResponse.json(
        { success: false, message: 'จำนวนต้องมากกว่าหรือเท่ากับ 0' },
        { status: 400 }
      )
    }

    const updatedLog = await prisma.stockLog.update({
      where: { id: logId },
      data: {
        quantityRemaining: parseFloat(quantityRemaining),
        notes: existingLog.notes 
          ? `${existingLog.notes}\n\n[แก้ไขโดย ${user.name} เมื่อ ${new Date().toLocaleString('th-TH')}]\nเหตุผล: ${editReason}`
          : `[แก้ไขโดย ${user.name} เมื่อ ${new Date().toLocaleString('th-TH')}]\nเหตุผล: ${editReason}`
      },
      include: {
        product: { select: { name: true, unit: true } },
        user: { select: { name: true } }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'แก้ไขข้อมูลสำเร็จ',
      data: updatedLog
    })

  } catch (error) {
    console.error('Edit stock log error:', error)
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในระบบ' },
      { status: 500 }
    )
  }
}