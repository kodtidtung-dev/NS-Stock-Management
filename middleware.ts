import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { logger } from '@/lib/logger'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Get auth token from cookies
  const authToken = request.cookies.get('auth-token')
  const isLoggedIn = !!authToken?.value

  // Define protected and public routes
  const protectedRoutes = ['/dashboard', '/profile', '/admin', '/products', '/staff']
  const authRoutes = ['/login', '/register']
  const publicRoutes = ['/']

  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  )
  const isAuthRoute = authRoutes.some(route =>
    pathname.startsWith(route)
  )
  const isPublicRoute = publicRoutes.includes(pathname)

  // Debug logging (remove in production)
  logger.debug('Middleware Debug:', {
    path: pathname,
    isLoggedIn,
    isProtectedRoute,
    isAuthRoute,
    hasToken: !!authToken
  })

  // Allow public routes
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // API routes - let API handle auth
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Redirect logic for auth routes
  if (isAuthRoute && isLoggedIn) {
    // Verify token before redirecting
    const user = verifyToken(authToken.value)
    if (user) {
      // Don't redirect if cookie is about to expire or invalid
      const redirectUrl = user.role === 'OWNER' ? '/dashboard' : '/staff'
      return NextResponse.redirect(new URL(redirectUrl, request.url))
    } else {
      // Token is invalid, clear cookie and allow access to login page
      const response = NextResponse.next()
      response.cookies.set('auth-token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
        maxAge: 0,
      })
      return response
    }
  }

  // Handle protected routes
  if (isProtectedRoute && !isLoggedIn) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Verify token for protected routes
  if (isProtectedRoute && isLoggedIn) {
    const user = verifyToken(authToken.value)

    if (!user) {
      // Token is invalid, clear cookie and redirect to login
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.set('auth-token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
        maxAge: 0,
      })
      return response
    }

    // Role-based route protection
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/products')) {
      if (user.role !== 'OWNER') {
        return NextResponse.redirect(new URL('/staff', request.url))
      }
    }

    if (pathname.startsWith('/staff')) {
      if (user.role !== 'STAFF') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }
  }

  // Create response
  const response = NextResponse.next()

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin')
  response.headers.set('X-DNS-Prefetch-Control', 'on')

  // Cache control for static assets
  if (pathname.startsWith('/_next/static/')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  }

  // No cache for API routes to ensure CRUD updates are real-time
  if (pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('Surrogate-Control', 'no-store')
  }

  return response
}

export const config = {
  matcher: [
    // Include specific paths for auth checking
    '/dashboard/:path*',
    '/profile/:path*',
    '/admin/:path*',
    '/products/:path*',
    '/staff/:path*',
    '/login',
    '/register',
    '/api/:path*',
    // Exclude static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}