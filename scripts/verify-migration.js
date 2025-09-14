// scripts/verify-migration.js
// Verify the migrated data
const Database = require('better-sqlite3');
const path = require('path');

const devDbPath = path.join(__dirname, '../prisma/dev.db');
const db = new Database(devDbPath, { readonly: true });

console.log('🔍 Verifying migrated data...\n');

try {
  // Check users
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  const users = db.prepare('SELECT username, role, name FROM users').all();

  console.log(`👥 Users: ${userCount.count}`);
  users.forEach(user => {
    console.log(`   - ${user.username} (${user.role}): ${user.name}`);
  });

  // Check categories
  const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get();
  const categories = db.prepare('SELECT name, active FROM categories').all();

  console.log(`\n🏷️  Categories: ${categoryCount.count}`);
  categories.forEach(cat => {
    console.log(`   - ${cat.name} ${cat.active ? '✅' : '❌'}`);
  });

  // Check products
  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get();
  const products = db.prepare(`
    SELECT p.name, p.unit, p.minimum_stock, c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    ORDER BY p.name
  `).all();

  console.log(`\n📦 Products: ${productCount.count}`);
  products.forEach(product => {
    console.log(`   - ${product.name} (${product.unit}) - Min: ${product.minimum_stock} - Category: ${product.category_name || 'ไม่มีหมวดหมู่'}`);
  });

  // Check stock logs
  const stockLogCount = db.prepare('SELECT COUNT(*) as count FROM stock_logs').get();

  console.log(`\n📊 Stock Logs: ${stockLogCount.count}`);

  if (stockLogCount.count > 0) {
    const recentLogs = db.prepare(`
      SELECT p.name, s.date, s.quantity_remaining
      FROM stock_logs s
      JOIN products p ON s.product_id = p.id
      ORDER BY s.date DESC
      LIMIT 5
    `).all();

    console.log('   Recent logs:');
    recentLogs.forEach(log => {
      console.log(`   - ${log.name}: ${log.quantity_remaining} on ${log.date}`);
    });
  } else {
    console.log('   ⚠️  No stock logs found - you may need to add some test data');
  }

} catch (error) {
  console.error('❌ Error verifying data:', error);
} finally {
  db.close();
}

console.log('\n✅ Verification complete!');
console.log('\n💡 Next steps:');
console.log('1. Run: npm run dev');
console.log('2. Login with existing users');
console.log('3. Test the daily-usage page with real data!');