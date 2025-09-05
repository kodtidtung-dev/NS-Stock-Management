import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes ที่ไม่ต้อง login
  const publicRoutes = ['/', '/login']
  
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // API routes - ให้ API จัดการ auth เอง
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // ดึง token จาก cookie
  const token = request.cookies.get('auth-token')?.value

  // ถ้าไม่มี token ให้ redirect ไป login
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // ตรวจสอบ token
  const user = verifyToken(token)
  
  if (!user) {
    // Token ไม่ถูกต้อง ลบ cookie และ redirect
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('auth-token')
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

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}