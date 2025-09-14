// scripts/create-fresh-data.js
// Create fresh data with proper encoding
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const devDbPath = path.join(__dirname, '../prisma/dev.db');

console.log('🆕 Creating fresh data with proper encoding...\n');

try {
  const db = new Database(devDbPath);

  // Create users first
  console.log('👥 Creating users...');
  const insertUser = db.prepare(`
    INSERT INTO users (username, password, role, name, active, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `);

  const ownerPassword = bcrypt.hashSync('owner123', 10);
  const staffPassword = bcrypt.hashSync('staff123', 10);

  insertUser.run('owner', ownerPassword, 'OWNER', 'เจ้าของร้าน', 1);
  insertUser.run('staff', staffPassword, 'STAFF', 'พนักงาน', 1);
  console.log('✅ Created 2 users');

  // Create categories
  console.log('\n🏷️ Creating categories...');
  const insertCategory = db.prepare(`
    INSERT INTO categories (name, description, active, created_by, created_at)
    VALUES (?, ?, ?, 1, datetime('now'))
  `);

  const categories = [
    { name: 'กาแฟ', description: 'เมล็ดกาแฟและเครื่องดื่มกาแฟ' },
    { name: 'ขนม', description: 'ขนมและของหวาน' },
    { name: 'เครื่องดื่ม', description: 'เครื่องดื่มทุกประเภท' },
    { name: 'ของใช้ทั่วไป', description: 'อุปกรณ์และของใช้ในร้าน' }
  ];

  categories.forEach(cat => {
    insertCategory.run(cat.name, cat.description, 1);
  });
  console.log(`✅ Created ${categories.length} categories`);

  // Create products
  console.log('\n📦 Creating products...');
  const insertProduct = db.prepare(`
    INSERT INTO products (name, category_id, unit, minimum_stock, description, active, created_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
  `);

  const products = [
    // กาแฟ
    { name: 'เอสเปรสโซ่', categoryId: 1, unit: 'ถ้วย', minStock: 10, desc: 'กาแฟเอสเปรสโซ่เข้มข้น' },
    { name: 'ลาเต้', categoryId: 1, unit: 'ถ้วย', minStock: 15, desc: 'กาแฟลาเต้นมนวล' },
    { name: 'คาปูชิโน่', categoryId: 1, unit: 'ถ้วย', minStock: 12, desc: 'กาแฟคาปูชิโน่โฟมหนา' },
    { name: 'อเมริกาโน่', categoryId: 1, unit: 'ถ้วย', minStock: 20, desc: 'กาแฟอเมริกาโน่รสชาติเข้มข้น' },

    // ขนม
    { name: 'คุกกี้ช็อคโกแลต', categoryId: 2, unit: 'ชิ้น', minStock: 30, desc: 'คุกกี้ช็อคโกแลตกรอบอร่อย' },
    { name: 'เค้กมะพร้าว', categoryId: 2, unit: 'ชิ้น', minStock: 20, desc: 'เค้กมะพร้าวหอมหวาน' },
    { name: 'ครัวซอง', categoryId: 2, unit: 'ชิ้น', minStock: 25, desc: 'ครัวซองเนยเฟรนช์' },

    // เครื่องดื่ม
    { name: 'น้ำส้มคั้น', categoryId: 3, unit: 'แก้ว', minStock: 15, desc: 'น้ำส้มคั้นสดใหม่' },
    { name: 'ชาไทย', categoryId: 3, unit: 'แก้ว', minStock: 18, desc: 'ชาไทยหวานมัน' },
    { name: 'มอคค่า', categoryId: 3, unit: 'แก้ว', minStock: 12, desc: 'มอคค่าร้อนหรือเย็น' },

    // ของใช้ทั่วไป
    { name: 'แก้วกระดาษ', categoryId: 4, unit: 'ใบ', minStock: 100, desc: 'แก้วกระดาษใส่เครื่องดื่ม' },
    { name: 'ฝากิโล', categoryId: 4, unit: 'ใบ', minStock: 100, desc: 'ฝาปิดแก้วกระดาษ' }
  ];

  products.forEach(product => {
    insertProduct.run(
      product.name,
      product.categoryId,
      product.unit,
      product.minStock,
      product.desc,
      1
    );
  });
  console.log(`✅ Created ${products.length} products`);

  // Create sample stock data
  console.log('\n📊 Creating sample stock data...');
  const insertStockLog = db.prepare(`
    INSERT INTO stock_logs (product_id, date, quantity_remaining, created_by, notes, created_at)
    VALUES (?, ?, ?, 1, ?, datetime('now'))
  `);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const productIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  productIds.forEach(productId => {
    // Yesterday stock
    const yesterdayStock = Math.random() * 50 + 20; // 20-70
    insertStockLog.run(
      productId,
      yesterday.toISOString().split('T')[0],
      Math.round(yesterdayStock * 100) / 100,
      'สต็อกเมื่อวาน'
    );

    // Today stock (less than yesterday)
    const usage = yesterdayStock * (0.1 + Math.random() * 0.3); // ใช้ 10-40%
    const todayStock = Math.max(0, yesterdayStock - usage);
    insertStockLog.run(
      productId,
      today.toISOString().split('T')[0],
      Math.round(todayStock * 100) / 100,
      'สต็อกวันนี้'
    );
  });

  console.log(`✅ Created ${productIds.length * 2} stock log entries`);

  // Show summary
  console.log('\n📋 Database Summary:');
  console.log('- Users: 2 (owner, staff)');
  console.log('- Categories: 4 (กาแฟ, ขนม, เครื่องดื่ม, ของใช้ทั่วไป)');
  console.log('- Products: 12 (clean Thai names)');
  console.log('- Stock Logs: 24 (2 days of data)');

  db.close();

  console.log('\n🎉 Fresh data created successfully!');
  console.log('\n💡 Login credentials:');
  console.log('- Username: owner / Password: owner123');
  console.log('- Username: staff / Password: staff123');

} catch (error) {
  console.error('❌ Error creating fresh data:', error);
  process.exit(1);
}