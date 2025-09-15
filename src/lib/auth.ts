// src/lib/auth.ts
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { NextRequest } from 'next/server'
import { logger } from './logger'

export interface JWTPayload {
  userId: number
  username: string
  role: 'STAFF' | 'OWNER'
  name: string
}

export function createToken(payload: JWTPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '7d' })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    logger.debug('🔐 Verifying JWT token...')
    logger.debug('JWT_SECRET exists:', !!process.env.JWT_SECRET)
    const result = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
    logger.debug('✅ Token verified successfully')
    return result
  } catch (error) {
    logger.debug('❌ Token verification failed:', error instanceof Error ? error.message : 'Unknown error')
    return null
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  
  // Check cookie as fallback
  return request.cookies.get('auth-token')?.value || null
}