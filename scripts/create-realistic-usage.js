// scripts/create-realistic-usage.js
// Create realistic daily usage scenario
const Database = require('better-sqlite3');
const path = require('path');

const devDbPath = path.join(__dirname, '../prisma/dev.db');

console.log('📊 Creating realistic daily usage scenario...\n');

try {
  const db = new Database(devDbPath);

  // Clear existing stock logs
  db.prepare('DELETE FROM stock_logs').run();

  // Get dates
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  console.log(`📅 Scenario: Coffee shop daily operations`);
  console.log(`📅 Yesterday: ${yesterdayStr}`);
  console.log(`📅 Today: ${todayStr}`);

  const insertStockLog = db.prepare(`
    INSERT INTO stock_logs (product_id, date, quantity_remaining, created_by, notes, created_at)
    VALUES (?, ?, ?, 1, ?, ?)
  `);

  // Realistic coffee shop scenario
  const scenarios = [
    // Coffee - high usage
    { id: 1, name: 'Espresso', yesterday: 30, usage: 15, type: 'popular coffee' },
    { id: 2, name: 'Latte', yesterday: 25, usage: 12, type: 'popular coffee' },
    { id: 3, name: 'Cappuccino', yesterday: 20, usage: 8, type: 'regular coffee' },
    { id: 4, name: 'Americano', yesterday: 18, usage: 10, type: 'regular coffee' },

    // Snacks - medium usage
    { id: 5, name: 'Chocolate Cookie', yesterday: 40, usage: 18, type: 'popular snack' },
    { id: 6, name: 'Coconut Cake', yesterday: 15, usage: 5, type: 'slow seller' },
    { id: 7, name: 'Croissant', yesterday: 25, usage: 8, type: 'breakfast item' },

    // Drinks - varied usage
    { id: 8, name: 'Orange Juice', yesterday: 20, usage: 12, type: 'fresh juice' },
    { id: 9, name: 'Thai Tea', yesterday: 15, usage: 6, type: 'specialty drink' },
    { id: 10, name: 'Mocha', yesterday: 12, usage: 7, type: 'sweet drink' },

    // Supplies - operational usage
    { id: 11, name: 'Paper Cup', yesterday: 150, usage: 85, type: 'high usage supply' },
    { id: 12, name: 'Cup Lid', yesterday: 140, usage: 80, type: 'high usage supply' }
  ];

  console.log('\n📋 Creating realistic usage patterns:\n');

  scenarios.forEach((scenario, index) => {
    // Yesterday stock (opening inventory)
    insertStockLog.run(
      scenario.id,
      yesterdayStr,
      scenario.yesterday,
      `Opening stock: ${scenario.yesterday} ${scenario.name}`,
      new Date(yesterday.getTime() + index * 30000).toISOString()
    );

    // Today stock (after actual usage)
    const todayStock = scenario.yesterday - scenario.usage;
    insertStockLog.run(
      scenario.id,
      todayStr,
      todayStock,
      `After daily sales: used ${scenario.usage}, remaining ${todayStock}`,
      new Date(today.getTime() + index * 30000).toISOString()
    );

    console.log(`${index + 1}. ${scenario.name}:`);
    console.log(`   📦 Stock: ${scenario.yesterday} → ${todayStock}`);
    console.log(`   🎯 Used: ${scenario.usage} (${scenario.type})`);
    console.log('');
  });

  // Add some restocking example for contrast
  console.log('📦 Adding restocking example (กระดาษบิล):');

  // Add a new product for paper bills
  const insertProduct = db.prepare(`
    INSERT INTO products (name, category_id, unit, minimum_stock, description, active, created_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date().toISOString();
  insertProduct.run(
    'Paper Bill',
    4, // Supplies category
    'roll',
    20,
    'Receipt paper rolls',
    1, // active
    1, // created_by
    now,
    now
  );

  // Paper Bill restocking scenario
  insertStockLog.run(
    13, // New product ID
    yesterdayStr,
    5, // Low stock yesterday
    'Low stock: only 5 rolls left',
    new Date(yesterday.getTime() + 1000000).toISOString()
  );

  insertStockLog.run(
    13,
    todayStr,
    105, // Restocked 100 rolls
    'Restocked: Added 100 rolls, now have 105 total',
    new Date(today.getTime() + 1000000).toISOString()
  );

  console.log('📄 Paper Bill: 5 → 105 rolls (Restocked +100)');
  console.log('   ✅ This should NOT show as "usage" in daily report');

  // Verify the data
  console.log('\n🔍 Verifying usage vs restocking:\n');

  const verifyQuery = db.prepare(`
    SELECT
      p.name,
      p.unit,
      yesterday.quantity_remaining as yesterday_stock,
      today.quantity_remaining as today_stock,
      yesterday.quantity_remaining - today.quantity_remaining as change,
      CASE
        WHEN yesterday.quantity_remaining - today.quantity_remaining > 0 THEN 'USAGE'
        WHEN yesterday.quantity_remaining - today.quantity_remaining < 0 THEN 'RESTOCK'
        ELSE 'NO_CHANGE'
      END as type
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
    WHERE yesterday.quantity_remaining IS NOT NULL
      AND today.quantity_remaining IS NOT NULL
    ORDER BY ABS(yesterday.quantity_remaining - today.quantity_remaining) DESC
  `).all(yesterdayStr, todayStr);

  verifyQuery.forEach(item => {
    const change = Math.abs(item.change);
    if (item.type === 'USAGE') {
      console.log(`✅ ${item.name}: Used ${change} ${item.unit}`);
    } else if (item.type === 'RESTOCK') {
      console.log(`📦 ${item.name}: Restocked +${change} ${item.unit} (should be filtered out)`);
    }
  });

  db.close();

  console.log('\n🎉 Realistic usage scenario created!');
  console.log('\n💡 Now the Daily Usage page should show:');
  console.log('✅ Only actual usage (not restocking)');
  console.log('✅ Paper Cup: 85 pieces used');
  console.log('✅ Cup Lid: 80 pieces used');
  console.log('✅ Chocolate Cookie: 18 pieces used');
  console.log('❌ Paper Bill restocking should be hidden');

} catch (error) {
  console.error('❌ Error creating scenario:', error);
  process.exit(1);
}