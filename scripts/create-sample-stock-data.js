// scripts/create-sample-stock-data.js
// Create sample stock data for testing daily usage
const Database = require('better-sqlite3');
const path = require('path');

const devDbPath = path.join(__dirname, '../prisma/dev.db');
const db = new Database(devDbPath);

console.log('📊 Creating sample stock data for testing...\n');

try {
  // Get all products
  const products = db.prepare('SELECT * FROM products WHERE active = 1').all();
  console.log(`Found ${products.length} products to create stock data for`);

  // Get today and yesterday dates
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  // Helper function to generate realistic stock levels
  const generateStockLevel = (product) => {
    const min = product.minimum_stock;
    const maxStock = min * 3; // มีสต็อกมากสุด 3 เท่าของ minimum
    return Math.random() * (maxStock - min) + min;
  };

  // Helper function to simulate daily usage
  const simulateUsage = (currentStock, product) => {
    // กาแฟใช้มากกว่าขนม
    let usageRate = 0.1; // ใช้ 10% ของสต็อก

    if (product.name.includes('กาแฟ') || product.name.includes('FYH') ||
        product.name.includes('Soyi') || product.name.includes('Ma nat')) {
      usageRate = 0.2; // กาแฟใช้ 20%
    } else if (product.name.includes('คุกกี้') || product.name.includes('ขนม')) {
      usageRate = 0.15; // ขนมใช้ 15%
    }

    const usage = currentStock * usageRate * (0.8 + Math.random() * 0.4); // ±20% variation
    return Math.max(0, currentStock - usage);
  };

  // Create stock logs
  const insertStockLog = db.prepare(`
    INSERT INTO stock_logs (product_id, date, quantity_remaining, created_by, notes, created_at)
    VALUES (?, ?, ?, 1, ?, datetime('now'))
  `);

  console.log('\n📅 Creating stock data for the past 3 days...\n');

  products.forEach((product, index) => {
    console.log(`${index + 1}. ${product.name}`);

    // Day 1 (2 days ago) - Initial stock
    const day1Stock = generateStockLevel(product);
    insertStockLog.run(
      product.id,
      twoDaysAgo.toISOString().split('T')[0],
      Math.round(day1Stock * 100) / 100, // Round to 2 decimal places
      `เริ่มต้นสต็อก`
    );

    // Day 2 (yesterday) - After usage
    const day2Stock = simulateUsage(day1Stock, product);
    insertStockLog.run(
      product.id,
      yesterday.toISOString().split('T')[0],
      Math.round(day2Stock * 100) / 100,
      `หลังการใช้งานวันแรก`
    );

    // Day 3 (today) - After more usage
    const day3Stock = simulateUsage(day2Stock, product);
    insertStockLog.run(
      product.id,
      today.toISOString().split('T')[0],
      Math.round(day3Stock * 100) / 100,
      `หลังการใช้งานวันที่สอง`
    );

    // Show usage calculation
    const usage = Math.round((day2Stock - day3Stock) * 100) / 100;
    console.log(`   📦 Stock: ${Math.round(day2Stock * 100) / 100} → ${Math.round(day3Stock * 100) / 100} (ใช้: ${usage})`);
  });

  // Summary
  const totalLogs = db.prepare('SELECT COUNT(*) as count FROM stock_logs').get();

  console.log(`\n✅ Created ${totalLogs.count} stock log entries`);

  // Show sample daily usage data
  console.log('\n📊 Sample daily usage (today vs yesterday):');

  const sampleUsage = db.prepare(`
    SELECT
      p.name,
      p.unit,
      c.name as category,
      COALESCE(yesterday.quantity_remaining, 0) - COALESCE(today.quantity_remaining, 0) as used
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN (
      SELECT product_id, quantity_remaining
      FROM stock_logs
      WHERE DATE(date) = DATE(?)
    ) yesterday ON p.id = yesterday.product_id
    LEFT JOIN (
      SELECT product_id, quantity_remaining
      FROM stock_logs
      WHERE DATE(date) = DATE(?)
    ) today ON p.id = today.product_id
    WHERE p.active = 1
      AND COALESCE(yesterday.quantity_remaining, 0) - COALESCE(today.quantity_remaining, 0) > 0
    ORDER BY used DESC
    LIMIT 10
  `).all(yesterday.toISOString().split('T')[0], today.toISOString().split('T')[0]);

  sampleUsage.forEach((item, i) => {
    const used = Math.round(item.used * 100) / 100;
    console.log(`   ${i + 1}. ${item.name} (${item.category}): ${used} ${item.unit}`);
  });

} catch (error) {
  console.error('❌ Error creating sample data:', error);
} finally {
  db.close();
}

console.log('\n🎉 Sample stock data created successfully!');
console.log('\n💡 Now you can:');
console.log('1. Run: npm run dev');
console.log('2. Go to /daily-usage');
console.log('3. Test category filtering with real data!');