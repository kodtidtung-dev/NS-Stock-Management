// scripts/backup-production-data.js
// สคริปต์สำหรับ backup ข้อมูลจาก production database

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

// Production database connection
const productionPrisma = new PrismaClient({
  datasourceUrl: process.env.PRODUCTION_DATABASE_URL
})

async function backupProductionData() {
  try {
    console.log('🔄 Starting production data backup...')

    // Fetch all data from production
    const [users, categories, products, stockLogs] = await Promise.all([
      productionPrisma.user.findMany(),
      productionPrisma.category.findMany(),
      productionPrisma.product.findMany(),
      productionPrisma.stockLog.findMany()
    ])

    const backupData = {
      timestamp: new Date().toISOString(),
      users,
      categories,
      products,
      stockLogs
    }

    // Create backup directory if it doesn't exist
    const backupDir = path.join(__dirname, '..', 'backups')
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }

    // Save backup file with timestamp
    const backupFileName = `production-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    const backupFilePath = path.join(backupDir, backupFileName)

    fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2))

    console.log('✅ Backup completed successfully!')
    console.log(`📁 Backup saved to: ${backupFilePath}`)
    console.log(`📊 Data summary:`)
    console.log(`   - Users: ${users.length}`)
    console.log(`   - Categories: ${categories.length}`)
    console.log(`   - Products: ${products.length}`)
    console.log(`   - Stock Logs: ${stockLogs.length}`)

    return backupFilePath

  } catch (error) {
    console.error('❌ Backup failed:', error)
    throw error
  } finally {
    await productionPrisma.$disconnect()
  }
}

if (require.main === module) {
  backupProductionData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

module.exports = { backupProductionData }