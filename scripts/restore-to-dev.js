// scripts/restore-to-dev.js
// สคริปต์สำหรับ restore ข้อมูลจาก backup ไปยัง development database

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

async function restoreToDevDatabase(backupFilePath) {
  // Development database connection (แยกจาก production)
  const devPrisma = new PrismaClient()

  try {
    console.log('🔄 Starting data restoration to development database...')

    // Read backup file
    if (!fs.existsSync(backupFilePath)) {
      throw new Error(`Backup file not found: ${backupFilePath}`)
    }

    const backupData = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'))
    console.log(`📖 Reading backup from: ${backupFilePath}`)
    console.log(`📅 Backup timestamp: ${backupData.timestamp}`)

    // Clear existing development data
    console.log('🗑️  Clearing existing development data...')
    await devPrisma.stockLog.deleteMany()
    await devPrisma.product.deleteMany()
    await devPrisma.category.deleteMany()
    await devPrisma.user.deleteMany()

    // Restore users
    console.log('👥 Restoring users...')
    for (const user of backupData.users) {
      await devPrisma.user.create({
        data: {
          id: user.id,
          username: user.username,
          password: user.password,
          name: user.name,
          role: user.role,
          active: user.active,
          createdAt: new Date(user.createdAt)
        }
      })
    }

    // Restore categories
    console.log('📂 Restoring categories...')
    for (const category of backupData.categories) {
      await devPrisma.category.create({
        data: {
          id: category.id,
          name: category.name,
          description: category.description,
          active: category.active,
          createdBy: category.createdBy,
          createdAt: new Date(category.createdAt)
        }
      })
    }

    // Restore products
    console.log('📦 Restoring products...')
    for (const product of backupData.products) {
      await devPrisma.product.create({
        data: {
          id: product.id,
          name: product.name,
          categoryId: product.categoryId,
          unit: product.unit,
          minimumStock: product.minimumStock,
          description: product.description,
          active: product.active,
          createdBy: product.createdBy,
          createdAt: new Date(product.createdAt)
        }
      })
    }

    // Restore stock logs
    console.log('📊 Restoring stock logs...')
    for (const stockLog of backupData.stockLogs) {
      // Convert DateTime to String for SQLite
      const dateString = typeof stockLog.date === 'string'
        ? stockLog.date
        : new Date(stockLog.date).toISOString().split('T')[0]

      await devPrisma.stockLog.create({
        data: {
          id: stockLog.id,
          productId: stockLog.productId,
          date: dateString,
          quantityRemaining: stockLog.quantityRemaining,
          notes: stockLog.notes,
          createdBy: stockLog.createdBy,
          createdAt: new Date(stockLog.createdAt)
        }
      })
    }

    console.log('✅ Data restoration completed successfully!')
    console.log(`📊 Restored data summary:`)
    console.log(`   - Users: ${backupData.users.length}`)
    console.log(`   - Categories: ${backupData.categories.length}`)
    console.log(`   - Products: ${backupData.products.length}`)
    console.log(`   - Stock Logs: ${backupData.stockLogs.length}`)

  } catch (error) {
    console.error('❌ Restoration failed:', error)
    throw error
  } finally {
    await devPrisma.$disconnect()
  }
}

// ถ้าเรียกจาก command line
if (require.main === module) {
  const backupFilePath = process.argv[2]
  if (!backupFilePath) {
    console.error('❌ Please provide backup file path')
    console.log('Usage: node scripts/restore-to-dev.js <backup-file-path>')
    process.exit(1)
  }

  restoreToDevDatabase(backupFilePath)
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

module.exports = { restoreToDevDatabase }