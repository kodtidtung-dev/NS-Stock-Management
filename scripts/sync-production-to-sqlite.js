// scripts/sync-production-to-sqlite.js
// Script เฉพาะสำหรับ sync จาก PostgreSQL (Production) ไป SQLite (Development)

const { backupProductionData } = require('./backup-production-postgresql')
const { restoreToDevDatabase } = require('./restore-to-dev')

async function syncProductionToSQLite() {
  try {
    console.log('🚀 Starting production to SQLite database sync...')

    // Step 1: Backup production data
    console.log('\n📝 Step 1: Backing up production data...')
    const backupFilePath = await backupProductionData()

    // Step 2: Restore to SQLite development database
    console.log('\n📥 Step 2: Restoring to SQLite development database...')
    await restoreToDevDatabase(backupFilePath)

    console.log('\n🎉 Sync completed successfully!')
    console.log('💡 You can now use development environment with production data')
    console.log('⚠️  Remember: Changes in development won\'t affect production')

  } catch (error) {
    console.error('❌ Sync failed:', error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  syncProductionToSQLite()
}

module.exports = { syncProductionToSQLite }