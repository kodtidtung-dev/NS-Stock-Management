// src/app/api/auth/logout/route.ts
import { NextResponse } from 'next/server'
import { API_MESSAGES, HTTP_STATUS } from '@/lib/constants'

export async function POST() {
  const response = NextResponse.json(
    { message: API_MESSAGES.AUTH.LOGOUT_SUCCESS },
    { status: HTTP_STATUS.OK }
  )

  // Clear the token cookie with matching settings
  response.cookies.set('auth-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0, // Expire immediately
  })

  return response
}