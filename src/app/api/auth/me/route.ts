// src/app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
import { API_MESSAGES, HTTP_STATUS } from '@/lib/constants'

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request)
    
    if (!token) {
      return NextResponse.json(
        { error: API_MESSAGES.AUTH.UNAUTHORIZED },
        { status: HTTP_STATUS.UNAUTHORIZED }
      )
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { error: API_MESSAGES.AUTH.TOKEN_EXPIRED },
        { status: HTTP_STATUS.UNAUTHORIZED }
      )
    }

    // Get fresh user data
    const user = await prisma.user.findUnique({
      where: { id: payload.userId, active: true },
      select: {
        id: true,
        username: true,
        role: true,
        name: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: API_MESSAGES.AUTH.UNAUTHORIZED },
        { status: HTTP_STATUS.UNAUTHORIZED }
      )
    }

    return NextResponse.json({ user }, { status: HTTP_STATUS.OK })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: API_MESSAGES.GENERAL.INTERNAL_ERROR },
      { status: HTTP_STATUS.INTERNAL_ERROR }
    )
  }
}