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
  },
  // Critical: Configure connection for serverless
  __internal: {
    engine: {
      // Retry on connection errors
      connection_retries: 3,
    }
  }
})

// Always disconnect after query in serverless (prevent stale connections)
if (process.env.NODE_ENV === 'production') {
  // Store original query method
  const originalQuery = prisma.$queryRaw.bind(prisma)

  // No auto-disconnect in serverless - let Vercel handle it
}

// Prevent hot reload from creating new instances
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma