// src/app/api/debug/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  const databaseUrl = process.env.DATABASE_URL_OVERRIDE || process.env.DATABASE_URL

  return NextResponse.json({
    nodeEnv: process.env.NODE_ENV,
    hasJwtSecret: !!process.env.JWT_SECRET,
    jwtSecretPrefix: process.env.JWT_SECRET?.substring(0, 10),
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasDatabaseUrlOverride: !!process.env.DATABASE_URL_OVERRIDE,
    usingOverride: !!process.env.DATABASE_URL_OVERRIDE,
    activeDatabaseUrlPrefix: databaseUrl?.substring(0, 30),
    hasConnectionLimit: databaseUrl?.includes('connection_limit'),
    hasPoolTimeout: databaseUrl?.includes('pool_timeout'),
  })
}
