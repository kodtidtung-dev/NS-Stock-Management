// Database connection pooling and optimization
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  // Connection pooling configuration
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  // Enable query optimization
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  
  // Performance optimizations
  omit: {
    // Omit large fields by default to reduce payload size
  }
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Create database indexes for better query performance
export const createOptimizedIndexes = async () => {
  try {
    // Index for stock_logs queries (most frequent)
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_stock_logs_product_date 
      ON stock_logs(product_id, date DESC);
    `
    
    // Index for product queries with category
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_products_active_name 
      ON products(active, name);
    `
    
    // Index for user authentication
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_users_email 
      ON users(email) WHERE active = true;
    `
    
    console.log('Database indexes created successfully')
  } catch (error) {
    console.error('Error creating database indexes:', error)
  }
}