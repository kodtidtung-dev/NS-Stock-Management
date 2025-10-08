// src/app/api/debug/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    nodeEnv: process.env.NODE_ENV,
    hasJwtSecret: !!process.env.JWT_SECRET,
    jwtSecretPrefix: process.env.JWT_SECRET?.substring(0, 10),
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 20),
  })
}
