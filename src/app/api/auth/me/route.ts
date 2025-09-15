// src/app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
import { API_MESSAGES, HTTP_STATUS } from '@/lib/constants'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    logger.debug('=== /api/auth/me DEBUG ===')

    // Check for token in various places
    const authHeader = request.headers.get('authorization')
    const cookieToken = request.cookies.get('auth-token')?.value
    logger.debug('Auth header:', authHeader ? `Bearer ${authHeader.substring(0, 20)}...` : 'NOT_FOUND')
    logger.debug('Cookie token:', cookieToken ? `${cookieToken.substring(0, 20)}...` : 'NOT_FOUND')

    const token = getTokenFromRequest(request)
    logger.debug('Extracted token:', token ? `${token.substring(0, 20)}...` : 'NOT_FOUND')

    if (!token) {
      logger.debug('❌ No token found')
      return NextResponse.json(
        { error: API_MESSAGES.AUTH.UNAUTHORIZED },
        { status: HTTP_STATUS.UNAUTHORIZED }
      )
    }

    logger.debug('🔍 Verifying token...')
    const payload = verifyToken(token)
    logger.debug('Token payload:', payload ? `userId: ${payload.userId}, username: ${payload.username}` : 'INVALID')

    if (!payload) {
      logger.debug('❌ Token verification failed')
      return NextResponse.json(
        { error: API_MESSAGES.AUTH.TOKEN_EXPIRED },
        { status: HTTP_STATUS.UNAUTHORIZED }
      )
    }

    // Get fresh user data
    logger.debug('🔍 Querying user from database...')
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

    logger.debug('Database user result:', user ? `Found user: ${user.username} (active: ${user.active})` : 'USER_NOT_FOUND')

    if (!user) {
      logger.debug('❌ User not found or inactive')
      return NextResponse.json(
        { error: API_MESSAGES.AUTH.UNAUTHORIZED },
        { status: HTTP_STATUS.UNAUTHORIZED }
      )
    }

    logger.debug('✅ Auth successful for user:', user.username)
    return NextResponse.json({ user }, { status: HTTP_STATUS.OK })
  } catch (error) {
    logger.error('Get user error:', error)
    return NextResponse.json(
      { error: API_MESSAGES.GENERAL.INTERNAL_ERROR },
      { status: HTTP_STATUS.INTERNAL_ERROR }
    )
  }
}