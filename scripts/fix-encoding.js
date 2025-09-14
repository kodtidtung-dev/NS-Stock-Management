// scripts/fix-encoding.js
// Fix character encoding issues in the database
const Database = require('better-sqlite3');
const path = require('path');

const devDbPath = path.join(__dirname, '../prisma/dev.db');

console.log('🔧 Fixing character encoding issues...\n');

try {
  const db = new Database(devDbPath);

  // Disable foreign key constraints
  db.pragma('foreign_keys = OFF');

  console.log('📊 Checking data integrity...');

  // Check for problematic characters in products
  const products = db.prepare('SELECT * FROM products').all();
  console.log(`Found ${products.length} products to check`);

  let fixedCount = 0;

  // Clean product names and descriptions
  const updateProduct = db.prepare(`
    UPDATE products
    SET name = ?, description = ?
    WHERE id = ?
  `);

  products.forEach(product => {
    let needsUpdate = false;
    let cleanName = product.name;
    let cleanDescription = product.description || '';

    // Remove any non-printable characters and fix encoding
    try {
      // Clean name
      const originalName = cleanName;
      cleanName = cleanName
        .replace(/[^\x20-\x7E\u0E00-\u0E7F]/g, '') // Keep ASCII and Thai characters only
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();

      if (cleanName !== originalName) {
        needsUpdate = true;
        console.log(`   🔤 Fixed name: "${originalName}" → "${cleanName}"`);
      }

      // Clean description
      if (cleanDescription) {
        const originalDesc = cleanDescription;
        cleanDescription = cleanDescription
          .replace(/[^\x20-\x7E\u0E00-\u0E7F]/g, '')
          .replace(/\s+/g, ' ')
          .trim();

        if (cleanDescription !== originalDesc) {
          needsUpdate = true;
          console.log(`   📝 Fixed description for ${product.name}`);
        }
      }

      if (needsUpdate) {
        updateProduct.run(cleanName, cleanDescription, product.id);
        fixedCount++;
      }

    } catch (error) {
      console.log(`   ❌ Error processing product ${product.id}: ${error.message}`);
    }
  });

  // Check categories
  const categories = db.prepare('SELECT * FROM categories').all();
  console.log(`\nFound ${categories.length} categories to check`);

  const updateCategory = db.prepare(`
    UPDATE categories
    SET name = ?, description = ?
    WHERE id = ?
  `);

  categories.forEach(category => {
    let needsUpdate = false;
    let cleanName = category.name;
    let cleanDescription = category.description || '';

    try {
      // Clean name
      const originalName = cleanName;
      cleanName = cleanName
        .replace(/[^\x20-\x7E\u0E00-\u0E7F]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (cleanName !== originalName) {
        needsUpdate = true;
        console.log(`   🏷️  Fixed category: "${originalName}" → "${cleanName}"`);
      }

      // Clean description
      if (cleanDescription) {
        const originalDesc = cleanDescription;
        cleanDescription = cleanDescription
          .replace(/[^\x20-\x7E\u0E00-\u0E7F]/g, '')
          .replace(/\s+/g, ' ')
          .trim();

        if (cleanDescription !== originalDesc) {
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        updateCategory.run(cleanName, cleanDescription, category.id);
        fixedCount++;
      }

    } catch (error) {
      console.log(`   ❌ Error processing category ${category.id}: ${error.message}`);
    }
  });

  // Check stock logs notes
  const stockLogs = db.prepare('SELECT * FROM stock_logs WHERE notes IS NOT NULL').all();
  console.log(`\nFound ${stockLogs.length} stock logs with notes to check`);

  const updateStockLog = db.prepare(`
    UPDATE stock_logs
    SET notes = ?
    WHERE id = ?
  `);

  stockLogs.forEach(log => {
    try {
      const originalNotes = log.notes || '';
      const cleanNotes = originalNotes
        .replace(/[^\x20-\x7E\u0E00-\u0E7F]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (cleanNotes !== originalNotes) {
        updateStockLog.run(cleanNotes, log.id);
        fixedCount++;
        console.log(`   📝 Fixed stock log notes for ID ${log.id}`);
      }

    } catch (error) {
      console.log(`   ❌ Error processing stock log ${log.id}: ${error.message}`);
    }
  });

  // Re-enable foreign key constraints
  db.pragma('foreign_keys = ON');

  // Verify database integrity
  console.log('\n🔍 Verifying database integrity...');
  const integrityCheck = db.prepare('PRAGMA integrity_check').get();

  if (integrityCheck.integrity_check === 'ok') {
    console.log('✅ Database integrity check passed');
  } else {
    console.log('⚠️  Database integrity issues found:', integrityCheck);
  }

  db.close();

  console.log(`\n🎉 Encoding fix completed!`);
  console.log(`📊 Fixed ${fixedCount} records`);

} catch (error) {
  console.error('❌ Error fixing encoding:', error);
  process.exit(1);
}

console.log('\n💡 Try running your app again!');