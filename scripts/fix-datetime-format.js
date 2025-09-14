// scripts/fix-datetime-format.js
// Fix DateTime format to be compatible with Prisma
const Database = require('better-sqlite3');
const path = require('path');

const devDbPath = path.join(__dirname, '../prisma/dev.db');

console.log('📅 Fixing DateTime format for Prisma compatibility...\n');

try {
  const db = new Database(devDbPath);

  // Convert created_at format from 'YYYY-MM-DD HH:MM:SS' to ISO 8601
  console.log('🔄 Converting users created_at format...');

  const users = db.prepare('SELECT * FROM users').all();
  const updateUser = db.prepare('UPDATE users SET created_at = ? WHERE id = ?');

  users.forEach(user => {
    if (user.created_at && !user.created_at.includes('T')) {
      // Convert "2025-09-14 11:22:37" to "2025-09-14T11:22:37.000Z"
      const isoDate = new Date(user.created_at).toISOString();
      updateUser.run(isoDate, user.id);
      console.log(`   ✅ Fixed user ${user.username}: ${user.created_at} → ${isoDate}`);
    }
  });

  // Fix categories
  console.log('\n🏷️ Converting categories created_at format...');

  const categories = db.prepare('SELECT * FROM categories').all();
  const updateCategory = db.prepare('UPDATE categories SET created_at = ? WHERE id = ?');

  categories.forEach(category => {
    if (category.created_at && !category.created_at.includes('T')) {
      const isoDate = new Date(category.created_at).toISOString();
      updateCategory.run(isoDate, category.id);
      console.log(`   ✅ Fixed category ${category.name}: ${category.created_at} → ${isoDate}`);
    }
  });

  // Fix products
  console.log('\n📦 Converting products timestamps format...');

  const products = db.prepare('SELECT * FROM products').all();
  const updateProduct = db.prepare('UPDATE products SET created_at = ?, updated_at = ? WHERE id = ?');

  products.forEach(product => {
    let needsUpdate = false;
    let createdAt = product.created_at;
    let updatedAt = product.updated_at;

    if (createdAt && !createdAt.includes('T')) {
      createdAt = new Date(createdAt).toISOString();
      needsUpdate = true;
    }

    if (updatedAt && !updatedAt.includes('T')) {
      updatedAt = new Date(updatedAt).toISOString();
      needsUpdate = true;
    }

    if (needsUpdate) {
      updateProduct.run(createdAt, updatedAt, product.id);
      console.log(`   ✅ Fixed product ${product.name}`);
    }
  });

  // Fix stock logs
  console.log('\n📊 Converting stock logs timestamps format...');

  const stockLogs = db.prepare('SELECT * FROM stock_logs').all();
  const updateStockLog = db.prepare('UPDATE stock_logs SET date = ?, created_at = ? WHERE id = ?');

  stockLogs.forEach(log => {
    let needsUpdate = false;
    let date = log.date;
    let createdAt = log.created_at;

    // Fix date format (should be just date, not datetime)
    if (date && date.includes(' ')) {
      date = date.split(' ')[0]; // Keep only YYYY-MM-DD
      needsUpdate = true;
    }

    // Fix created_at format
    if (createdAt && !createdAt.includes('T')) {
      createdAt = new Date(createdAt).toISOString();
      needsUpdate = true;
    }

    if (needsUpdate) {
      updateStockLog.run(date, createdAt, log.id);
      console.log(`   ✅ Fixed stock log ${log.id}`);
    }
  });

  // Verify the fix
  console.log('\n🔍 Verifying DateTime formats...');

  const sampleUser = db.prepare('SELECT created_at FROM users LIMIT 1').get();
  const sampleProduct = db.prepare('SELECT created_at, updated_at FROM products LIMIT 1').get();
  const sampleStockLog = db.prepare('SELECT date, created_at FROM stock_logs LIMIT 1').get();

  console.log('Sample formats:');
  console.log(`  👤 User created_at: ${sampleUser.created_at}`);
  console.log(`  📦 Product created_at: ${sampleProduct.created_at}`);
  console.log(`  📦 Product updated_at: ${sampleProduct.updated_at}`);
  console.log(`  📊 StockLog date: ${sampleStockLog.date}`);
  console.log(`  📊 StockLog created_at: ${sampleStockLog.created_at}`);

  db.close();

  console.log('\n🎉 DateTime format fix completed!');
  console.log('💡 All timestamps are now ISO 8601 compatible with Prisma');

} catch (error) {
  console.error('❌ Error fixing DateTime format:', error);
  process.exit(1);
}