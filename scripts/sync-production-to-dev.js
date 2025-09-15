// scripts/sync-production-to-dev.js
// สคริปต์ที่รวม backup และ restore เป็นขั้นตอนเดียว

const { backupProductionData } = require('./backup-production-data')
const { restoreToDevDatabase } = require('./restore-to-dev')

async function syncProductionToDevDatabase() {
  try {
    console.log('🚀 Starting production to development database sync...')

    // Step 1: Backup production data
    console.log('\n📝 Step 1: Backing up production data...')
    const backupFilePath = await backupProductionData()

    // Step 2: Restore to development database
    console.log('\n📥 Step 2: Restoring to development database...')
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
  syncProductionToDevDatabase()
}

module.exports = { syncProductionToDevDatabase }