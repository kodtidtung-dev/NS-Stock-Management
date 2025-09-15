// src/app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { API_MESSAGES, HTTP_STATUS } from '@/lib/constants'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json(
      { message: API_MESSAGES.AUTH.LOGOUT_SUCCESS },
      { status: HTTP_STATUS.OK }
    )

    // Clear the token cookie with multiple variations to ensure it's cleared
    const isProduction = process.env.NODE_ENV === 'production'

    // Clear with original settings
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    })

    // Also clear without httpOnly (in case client-side created some)
    response.cookies.set('auth-token', '', {
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    })

    // Additional cache control headers for production
    if (isProduction) {
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, private')
      response.headers.set('Pragma', 'no-cache')
      response.headers.set('Expires', '0')
    }

    return response
  } catch (error) {
    console.error('Logout API error:', error)

    // Even if error occurs, return success to prevent logout loops
    const response = NextResponse.json(
      { message: API_MESSAGES.AUTH.LOGOUT_SUCCESS },
      { status: HTTP_STATUS.OK }
    )

    // Still try to clear cookies even on error
    const isProduction = process.env.NODE_ENV === 'production'
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    })

    return response
  }
}