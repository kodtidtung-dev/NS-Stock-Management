// scripts/test-db-connection.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...')
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET ✓' : 'NOT SET ✗')
    console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET ✓' : 'NOT SET ✗')

    // Test connection
    await prisma.$connect()
    console.log('✅ Database connection successful!')

    // Test query
    const userCount = await prisma.user.count()
    console.log(`📊 Found ${userCount} users in database`)

    // Test a specific user
    const users = await prisma.user.findMany({ take: 1 })
    if (users.length > 0) {
      console.log('👤 Sample user:', {
        id: users[0].id,
        username: users[0].username,
        role: users[0].role,
        active: users[0].active
      })
    }

  } catch (error) {
    console.error('❌ Database connection failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()
