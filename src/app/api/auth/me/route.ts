// src/app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
import { API_MESSAGES, HTTP_STATUS } from '@/lib/constants'

export async function GET(request: NextRequest) {
  try {
    console.log('=== /api/auth/me DEBUG ===')

    // Check for token in various places
    const authHeader = request.headers.get('authorization')
    const cookieToken = request.cookies.get('auth-token')?.value
    console.log('Auth header:', authHeader ? `Bearer ${authHeader.substring(0, 20)}...` : 'NOT_FOUND')
    console.log('Cookie token:', cookieToken ? `${cookieToken.substring(0, 20)}...` : 'NOT_FOUND')

    const token = getTokenFromRequest(request)
    console.log('Extracted token:', token ? `${token.substring(0, 20)}...` : 'NOT_FOUND')

    if (!token) {
      console.log('❌ No token found')
      return NextResponse.json(
        { error: API_MESSAGES.AUTH.UNAUTHORIZED },
        { status: HTTP_STATUS.UNAUTHORIZED }
      )
    }

    console.log('🔍 Verifying token...')
    const payload = verifyToken(token)
    console.log('Token payload:', payload ? `userId: ${payload.userId}, username: ${payload.username}` : 'INVALID')

    if (!payload) {
      console.log('❌ Token verification failed')
      return NextResponse.json(
        { error: API_MESSAGES.AUTH.TOKEN_EXPIRED },
        { status: HTTP_STATUS.UNAUTHORIZED }
      )
    }

    // Get fresh user data
    console.log('🔍 Querying user from database...')
    const user = await prisma.user.findUnique({
      where: { id: payload.userId, active: true },
      select: {
        id: true,
        username: true,
        role: true,
        name: true,
        createdAt: true,
        active: true,
      },
    })

    console.log('Database user result:', user ? `Found user: ${user.username} (active: ${user.active})` : 'USER_NOT_FOUND')

    if (!user) {
      console.log('❌ User not found or inactive')
      return NextResponse.json(
        { error: API_MESSAGES.AUTH.UNAUTHORIZED },
        { status: HTTP_STATUS.UNAUTHORIZED }
      )
    }

    console.log('✅ Auth successful for user:', user.username)
    return NextResponse.json({ user }, { status: HTTP_STATUS.OK })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: API_MESSAGES.GENERAL.INTERNAL_ERROR },
      { status: HTTP_STATUS.INTERNAL_ERROR }
    )
  }
}