import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function clearData() {
  try {
    console.log('🗑️  Starting database cleanup...')
    
    // Delete in reverse order due to foreign key constraints
    console.log('Deleting StockLogs...')
    await prisma.stockLog.deleteMany({})
    
    console.log('Deleting Products...')
    await prisma.product.deleteMany({})
    
    console.log('Deleting Categories...')
    await prisma.category.deleteMany({})
    
    console.log('✅ Database cleanup completed successfully!')
    console.log('👤 Users data preserved')
    
    // Show remaining data
    const userCount = await prisma.user.count()
    console.log(`\n📊 Remaining data:`)
    console.log(`- Users: ${userCount}`)
    console.log(`- Categories: 0`)
    console.log(`- Products: 0`)
    console.log(`- StockLogs: 0`)
    
  } catch (error) {
    console.error('❌ Error clearing database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

clearData()