// scripts/add-usage-data.js
// Add proper usage data for testing
const Database = require('better-sqlite3');
const path = require('path');

const devDbPath = path.join(__dirname, '../prisma/dev.db');

console.log('📊 Adding proper usage data for testing...\n');

try {
  const db = new Database(devDbPath);

  // Clear existing stock logs
  db.prepare('DELETE FROM stock_logs').run();
  console.log('🗑️  Cleared existing stock logs');

  // Get today and yesterday
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  console.log(`📅 Yesterday: ${yesterdayStr}`);
  console.log(`📅 Today: ${todayStr}`);

  // Get all products
  const products = db.prepare('SELECT * FROM products').all();

  console.log('\n🎲 Creating realistic usage data...');

  const insertStockLog = db.prepare(`
    INSERT INTO stock_logs (product_id, date, quantity_remaining, created_by, notes, created_at)
    VALUES (?, ?, ?, 1, ?, ?)
  `);

  products.forEach((product, index) => {
    // Generate realistic stock levels based on product type
    let baseStock;
    let usageRate;

    if (product.name.includes('Cup')) {
      baseStock = 120; // High stock for supplies
      usageRate = 0.3; // Use 30%
    } else if (product.name.includes('Cookie') || product.name.includes('Cake')) {
      baseStock = 45; // Medium stock for snacks
      usageRate = 0.25; // Use 25%
    } else {
      baseStock = 25; // Lower stock for drinks/coffee
      usageRate = 0.4; // Use 40%
    }

    // Yesterday stock (higher)
    const yesterdayStock = baseStock + (Math.random() * 20);
    insertStockLog.run(
      product.id,
      yesterdayStr,
      Math.round(yesterdayStock * 100) / 100,
      `Initial stock for ${product.name}`,
      new Date(yesterday.getTime() + index * 60000).toISOString() // Stagger creation times
    );

    // Today stock (after usage)
    const usage = yesterdayStock * usageRate * (0.7 + Math.random() * 0.6); // ±30% variation
    const todayStock = Math.max(0, yesterdayStock - usage);

    insertStockLog.run(
      product.id,
      todayStr,
      Math.round(todayStock * 100) / 100,
      `After usage for ${product.name}`,
      new Date(today.getTime() + index * 60000).toISOString()
    );

    const actualUsage = Math.round((yesterdayStock - todayStock) * 100) / 100;
    console.log(`   ${index + 1}. ${product.name}: ${Math.round(yesterdayStock * 100) / 100} → ${Math.round(todayStock * 100) / 100} (ใช้: ${actualUsage} ${product.unit})`);
  });

  // Verify data
  console.log('\n🔍 Verifying usage data...');

  const usageQuery = db.prepare(`
    SELECT
      p.name,
      p.unit,
      COALESCE(yesterday.quantity_remaining, 0) - COALESCE(today.quantity_remaining, 0) as used
    FROM products p
    LEFT JOIN (
      SELECT product_id, quantity_remaining
      FROM stock_logs
      WHERE date = ?
    ) yesterday ON p.id = yesterday.product_id
    LEFT JOIN (
      SELECT product_id, quantity_remaining
      FROM stock_logs
      WHERE date = ?
    ) today ON p.id = today.product_id
    WHERE p.active = 1
      AND COALESCE(yesterday.quantity_remaining, 0) - COALESCE(today.quantity_remaining, 0) > 0
    ORDER BY used DESC
    LIMIT 10
  `).all(yesterdayStr, todayStr);

  console.log('\n📋 Top 10 daily usage:');
  usageQuery.forEach((item, i) => {
    const used = Math.round(item.used * 100) / 100;
    console.log(`   ${i + 1}. ${item.name}: ${used} ${item.unit}`);
  });

  // Check categories have products
  const categoryCheck = db.prepare(`
    SELECT c.name, COUNT(p.id) as product_count
    FROM categories c
    LEFT JOIN products p ON c.id = p.category_id AND p.active = 1
    GROUP BY c.id, c.name
  `).all();

  console.log('\n🏷️  Categories with products:');
  categoryCheck.forEach(cat => {
    console.log(`   ${cat.name}: ${cat.product_count} products`);
  });

  db.close();

  console.log('\n🎉 Usage data created successfully!');
  console.log('\n💡 Now you can test:');
  console.log('1. Login at: http://localhost:3004');
  console.log('2. Go to: /daily-usage');
  console.log('3. Test category filtering with real data!');

} catch (error) {
  console.error('❌ Error creating usage data:', error);
  process.exit(1);
}