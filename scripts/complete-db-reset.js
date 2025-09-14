// scripts/complete-db-reset.js
// Complete database reset with ASCII-only data
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const devDbPath = path.join(__dirname, '../prisma/dev.db');

console.log('🔄 Complete database reset with ASCII-only data...\n');

// Delete existing database file if exists
if (fs.existsSync(devDbPath)) {
  try {
    fs.unlinkSync(devDbPath);
    console.log('🗑️  Deleted old database file');
  } catch (error) {
    console.log('⚠️  Could not delete old database file, will overwrite');
  }
}

try {
  // Create new database
  const db = new Database(devDbPath);
  console.log('🆕 Created new database file');

  // Create tables manually to ensure clean schema
  console.log('📋 Creating database schema...');

  db.exec(`
    -- Users table
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('STAFF', 'OWNER')),
      name TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Categories table
    CREATE TABLE categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_by INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    -- Products table
    CREATE TABLE products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      category_id INTEGER,
      unit TEXT NOT NULL,
      minimum_stock REAL NOT NULL,
      description TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_by INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (category_id) REFERENCES categories(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    -- Stock logs table
    CREATE TABLE stock_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      quantity_remaining REAL NOT NULL,
      created_by INTEGER NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (created_by) REFERENCES users(id),
      UNIQUE (product_id, date)
    );

    -- Create indexes
    CREATE INDEX idx_categories_active ON categories(active);
    CREATE INDEX idx_categories_created_at ON categories(created_at);
    CREATE INDEX idx_products_active ON products(active);
    CREATE INDEX idx_products_category_id ON products(category_id);
    CREATE INDEX idx_products_created_at ON products(created_at);
    CREATE INDEX idx_products_active_category ON products(active, category_id);
    CREATE INDEX idx_stock_logs_date ON stock_logs(date);
    CREATE INDEX idx_stock_logs_product_id ON stock_logs(product_id);
    CREATE INDEX idx_stock_logs_created_at ON stock_logs(created_at);
    CREATE INDEX idx_stock_logs_date_product ON stock_logs(date, product_id);
  `);

  console.log('✅ Database schema created');

  // Insert data with ASCII-only characters
  console.log('\n👥 Creating users...');

  const ownerPassword = bcrypt.hashSync('owner123', 10);
  const staffPassword = bcrypt.hashSync('staff123', 10);

  db.prepare(`
    INSERT INTO users (username, password, role, name, active, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `).run('owner', ownerPassword, 'OWNER', 'Owner', 1);

  db.prepare(`
    INSERT INTO users (username, password, role, name, active, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `).run('staff', staffPassword, 'STAFF', 'Staff', 1);

  console.log('✅ Created 2 users (ASCII names only)');

  // Create categories with ASCII names
  console.log('\n🏷️ Creating categories...');

  const categories = [
    { name: 'Coffee', description: 'Coffee and hot drinks' },
    { name: 'Snacks', description: 'Snacks and sweets' },
    { name: 'Drinks', description: 'All beverages' },
    { name: 'Supplies', description: 'Store supplies and equipment' }
  ];

  categories.forEach(cat => {
    db.prepare(`
      INSERT INTO categories (name, description, active, created_by, created_at)
      VALUES (?, ?, ?, 1, datetime('now'))
    `).run(cat.name, cat.description, 1);
  });

  console.log(`✅ Created ${categories.length} categories (ASCII names only)`);

  // Create products with ASCII names
  console.log('\n📦 Creating products...');

  const products = [
    // Coffee
    { name: 'Espresso', categoryId: 1, unit: 'cup', minStock: 10, desc: 'Strong espresso coffee' },
    { name: 'Latte', categoryId: 1, unit: 'cup', minStock: 15, desc: 'Creamy milk coffee' },
    { name: 'Cappuccino', categoryId: 1, unit: 'cup', minStock: 12, desc: 'Coffee with foam' },
    { name: 'Americano', categoryId: 1, unit: 'cup', minStock: 20, desc: 'Black coffee' },

    // Snacks
    { name: 'Chocolate Cookie', categoryId: 2, unit: 'piece', minStock: 30, desc: 'Crispy chocolate cookie' },
    { name: 'Coconut Cake', categoryId: 2, unit: 'piece', minStock: 20, desc: 'Sweet coconut cake' },
    { name: 'Croissant', categoryId: 2, unit: 'piece', minStock: 25, desc: 'French butter croissant' },

    // Drinks
    { name: 'Orange Juice', categoryId: 3, unit: 'glass', minStock: 15, desc: 'Fresh orange juice' },
    { name: 'Thai Tea', categoryId: 3, unit: 'glass', minStock: 18, desc: 'Sweet Thai tea' },
    { name: 'Mocha', categoryId: 3, unit: 'glass', minStock: 12, desc: 'Hot or cold mocha' },

    // Supplies
    { name: 'Paper Cup', categoryId: 4, unit: 'piece', minStock: 100, desc: 'Disposable paper cup' },
    { name: 'Cup Lid', categoryId: 4, unit: 'piece', minStock: 100, desc: 'Paper cup lid' }
  ];

  products.forEach(product => {
    db.prepare(`
      INSERT INTO products (name, category_id, unit, minimum_stock, description, active, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
    `).run(
      product.name,
      product.categoryId,
      product.unit,
      product.minStock,
      product.desc,
      1
    );
  });

  console.log(`✅ Created ${products.length} products (ASCII names only)`);

  // Create sample stock data
  console.log('\n📊 Creating sample stock data...');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const productIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  productIds.forEach(productId => {
    // Yesterday stock
    const yesterdayStock = Math.random() * 50 + 20; // 20-70
    db.prepare(`
      INSERT INTO stock_logs (product_id, date, quantity_remaining, created_by, notes, created_at)
      VALUES (?, ?, ?, 1, ?, datetime('now'))
    `).run(
      productId,
      yesterday.toISOString().split('T')[0],
      Math.round(yesterdayStock * 100) / 100,
      'Yesterday stock'
    );

    // Today stock (less than yesterday)
    const usage = yesterdayStock * (0.1 + Math.random() * 0.3); // Use 10-40%
    const todayStock = Math.max(0, yesterdayStock - usage);
    db.prepare(`
      INSERT INTO stock_logs (product_id, date, quantity_remaining, created_by, notes, created_at)
      VALUES (?, ?, ?, 1, ?, datetime('now'))
    `).run(
      productId,
      today.toISOString().split('T')[0],
      Math.round(todayStock * 100) / 100,
      'Today stock'
    );
  });

  console.log(`✅ Created ${productIds.length * 2} stock log entries`);

  // Verify data integrity
  console.log('\n🔍 Verifying data integrity...');

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get();
  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get();
  const stockLogCount = db.prepare('SELECT COUNT(*) as count FROM stock_logs').get();

  console.log('📋 Final Database Summary:');
  console.log(`- Users: ${userCount.count}`);
  console.log(`- Categories: ${categoryCount.count}`);
  console.log(`- Products: ${productCount.count}`);
  console.log(`- Stock Logs: ${stockLogCount.count}`);

  // Test a simple query to ensure no encoding issues
  const sampleProduct = db.prepare('SELECT * FROM products LIMIT 1').get();
  console.log(`📝 Sample product: ${sampleProduct.name}`);

  db.close();

  console.log('\n🎉 Complete database reset successful!');
  console.log('🔒 All data uses ASCII characters only - no encoding issues!');
  console.log('\n💡 Login credentials:');
  console.log('- Username: owner / Password: owner123');
  console.log('- Username: staff / Password: staff123');

} catch (error) {
  console.error('❌ Error during complete reset:', error);
  process.exit(1);
}