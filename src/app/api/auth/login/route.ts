// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { comparePassword, createToken } from '../../../../lib/auth'
import { API_MESSAGES, HTTP_STATUS } from '../../../../lib/constants'
import { withRateLimit } from '../../../../lib/apiAuth'
import { logger } from '../../../../lib/logger'

export const POST = withRateLimit(20, 5 * 60 * 1000)(async (request: NextRequest) => {
  try {
    const { username, password } = await request.json()

    logger.debug('🔍 Login attempt:', { username, password: '*'.repeat(password?.length || 0) })

    if (!username || !password) {
      logger.debug('❌ Missing username or password')
      return NextResponse.json(
        { error: API_MESSAGES.GENERAL.INVALID_REQUEST },
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username, active: true },
    })

    logger.debug('👤 User found:', user ? { id: user.id, username: user.username, role: user.role } : 'NOT FOUND')

    if (!user) {
      logger.debug('❌ User not found')
      return NextResponse.json(
        { error: API_MESSAGES.AUTH.INVALID_CREDENTIALS },
        { status: HTTP_STATUS.UNAUTHORIZED }
      )
    }

    const passwordMatch = await comparePassword(password, user.password)
    logger.debug('🔐 Password check:', { match: passwordMatch, hashedPassword: user.password?.substring(0, 10) + '...' })

    if (!passwordMatch) {
      logger.debug('❌ Password mismatch')
      return NextResponse.json(
        { error: API_MESSAGES.AUTH.INVALID_CREDENTIALS },
        { status: HTTP_STATUS.UNAUTHORIZED }
      )
    }

    logger.debug('✅ Login successful for:', user.username)

    // Create JWT token
    const token = createToken({
      userId: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
    })

    // Create response with token in cookie
    const response = NextResponse.json(
      {
        message: API_MESSAGES.AUTH.LOGIN_SUCCESS,
        token, // Include token in response for Bearer auth
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          name: user.name,
        },
      },
      { status: HTTP_STATUS.OK }
    )

    // Set HTTP-only cookie with proper production settings
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (error) {
    logger.error('Login error:', error)
    return NextResponse.json(
      { error: API_MESSAGES.GENERAL.INTERNAL_ERROR },
      { status: HTTP_STATUS.INTERNAL_ERROR }
    )
  }
})