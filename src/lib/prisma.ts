// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Use override URL if available (for production with connection pooling)
const databaseUrl = process.env.DATABASE_URL_OVERRIDE || process.env.DATABASE_URL

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  // Optimize for Vercel/Serverless
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: databaseUrl
    }
  }
})

// Prevent hot reload from creating new instances
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma