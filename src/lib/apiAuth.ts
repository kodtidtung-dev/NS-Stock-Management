// src/lib/apiAuth.ts
import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromRequest, verifyToken, JWTPayload } from '@/lib/auth'
import { API_MESSAGES, HTTP_STATUS } from '@/lib/constants'

export interface AuthenticatedRequest extends NextRequest {
  user: JWTPayload
}

export function withAuth<T extends unknown[]>(
  handler: (request: AuthenticatedRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      // Get token from request
      const token = getTokenFromRequest(request)

      if (!token) {
        return NextResponse.json(
          { error: API_MESSAGES.AUTH.UNAUTHORIZED },
          { status: HTTP_STATUS.UNAUTHORIZED }
        )
      }

      // Verify token
      const payload = verifyToken(token)

      if (!payload) {
        return NextResponse.json(
          { error: API_MESSAGES.AUTH.TOKEN_EXPIRED },
          { status: HTTP_STATUS.UNAUTHORIZED }
        )
      }

      // Add user to request
      const authenticatedRequest = request as AuthenticatedRequest
      authenticatedRequest.user = payload

      // Call the actual handler
      return handler(authenticatedRequest, ...args)
    } catch (error) {
      console.error('Authentication error:', error)
      return NextResponse.json(
        { error: API_MESSAGES.GENERAL.INTERNAL_ERROR },
        { status: HTTP_STATUS.INTERNAL_ERROR }
      )
    }
  }
}

export function withRoleAuth(allowedRoles: Array<'OWNER' | 'STAFF'>) {
  return function <T extends unknown[]>(
    handler: (request: AuthenticatedRequest, ...args: T) => Promise<NextResponse>
  ) {
    return withAuth(async (request: AuthenticatedRequest, ...args: T) => {
      // Check if user role is allowed
      if (!allowedRoles.includes(request.user.role)) {
        return NextResponse.json(
          { error: API_MESSAGES.AUTH.FORBIDDEN },
          { status: HTTP_STATUS.FORBIDDEN }
        )
      }

      return handler(request, ...args)
    })
  }
}

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export function withRateLimit(maxRequests: number, windowMs: number) {
  return function <T extends unknown[]>(
    handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
  ) {
    return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
      // Get client IP (fallback to a default key)
      const clientIp = request.headers.get('x-forwarded-for') ||
                      request.headers.get('x-real-ip') ||
                      'unknown'

      const now = Date.now()
      const key = `${clientIp}:${request.url}`

      // Get current rate limit data
      const current = rateLimitStore.get(key)

      if (!current || current.resetTime < now) {
        // Reset or create new window
        rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
        return handler(request, ...args)
      }

      if (current.count >= maxRequests) {
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          { status: 429 }
        )
      }

      // Increment count
      current.count++
      rateLimitStore.set(key, current)

      return handler(request, ...args)
    }
  }
}

// Cleanup old rate limit entries (run periodically)
export function cleanupRateLimit() {
  const now = Date.now()
  for (const [key, data] of rateLimitStore.entries()) {
    if (data.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}

// Auto cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimit, 5 * 60 * 1000)
}