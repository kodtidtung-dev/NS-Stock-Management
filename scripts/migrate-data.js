// scripts/migrate-data.js
// Script to safely migrate data from nsstock.db to dev.db
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting data migration from nsstock.db to dev.db...');

// Database paths
const nsstockDbPath = path.join(__dirname, '../prisma/nsstock.db');
const devDbPath = path.join(__dirname, '../prisma/dev.db');

// Check if source database exists
if (!fs.existsSync(nsstockDbPath)) {
  console.error('❌ nsstock.db not found at:', nsstockDbPath);
  process.exit(1);
}

// Backup dev.db if it exists
if (fs.existsSync(devDbPath)) {
  const backupPath = `${devDbPath}.backup.${Date.now()}`;
  fs.copyFileSync(devDbPath, backupPath);
  console.log('💾 Backup created:', backupPath);
}

try {
  // Open both databases
  const sourceDb = new Database(nsstockDbPath, { readonly: true });
  const targetDb = new Database(devDbPath);

  // Disable foreign key constraints during migration
  targetDb.pragma('foreign_keys = OFF');

  console.log('📊 Analyzing source database structure...');

  // Get all tables from source database
  const tables = sourceDb.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='table' AND name NOT LIKE 'sqlite_%'
  `).all();

  console.log('📋 Found tables:', tables.map(t => t.name).join(', '));

  // Migration functions
  const migrations = {
    users: () => {
      console.log('👥 Migrating users...');

      // Clear existing users
      targetDb.prepare('DELETE FROM users').run();

      // Get users from source (handle different schema if needed)
      let sourceUsers;
      try {
        sourceUsers = sourceDb.prepare('SELECT * FROM users').all();
      } catch (e) {
        // If users table has different structure, create default users
        console.log('⚠️  Users table not found or incompatible, creating default users...');

        const insertUser = targetDb.prepare(`
          INSERT INTO users (username, password, role, name, active, created_at)
          VALUES (?, ?, ?, ?, ?, datetime('now'))
        `);

        // Create default users with bcrypt hashed passwords
        const bcrypt = require('bcryptjs');
        const ownerPassword = bcrypt.hashSync('owner123', 10);
        const staffPassword = bcrypt.hashSync('staff123', 10);

        insertUser.run('owner', ownerPassword, 'OWNER', 'เจ้าของร้าน', 1);
        insertUser.run('staff', staffPassword, 'STAFF', 'พนักงาน', 1);

        console.log('✅ Default users created');
        return;
      }

      // Migrate existing users
      const insertUser = targetDb.prepare(`
        INSERT INTO users (id, username, password, role, name, active, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      sourceUsers.forEach(user => {
        insertUser.run(
          user.id,
          user.username,
          user.password,
          user.role,
          user.name || user.username,
          user.active !== false ? 1 : 0,
          user.created_at || new Date().toISOString()
        );
      });

      console.log(`✅ Migrated ${sourceUsers.length} users`);
    },

    categories: () => {
      console.log('🏷️  Migrating categories...');

      // Clear existing categories
      targetDb.prepare('DELETE FROM categories').run();

      // Get categories from source
      let sourceCategories;
      try {
        sourceCategories = sourceDb.prepare('SELECT * FROM categories').all();
      } catch (e) {
        console.log('⚠️  Categories table not found, creating default categories...');

        const insertCategory = targetDb.prepare(`
          INSERT INTO categories (name, description, active, created_by, created_at)
          VALUES (?, ?, ?, 1, datetime('now'))
        `);

        const defaultCategories = [
          { name: 'เครื่องดื่ม', description: 'เครื่องดื่มทุกประเภท' },
          { name: 'ขนม', description: 'ขนมและของหวาน' },
          { name: 'กาแฟ', description: 'กาแฟและเครื่องดื่มร้อน' },
          { name: 'ของใช้ทั่วไป', description: 'อุปกรณ์และของใช้ในร้าน' }
        ];

        defaultCategories.forEach(cat => {
          insertCategory.run(cat.name, cat.description, 1);
        });

        console.log('✅ Default categories created');
        return;
      }

      // Migrate existing categories
      const insertCategory = targetDb.prepare(`
        INSERT INTO categories (id, name, description, active, created_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      sourceCategories.forEach(category => {
        insertCategory.run(
          category.id,
          category.name,
          category.description || '',
          category.active !== false ? 1 : 0,
          category.created_by || 1,
          category.created_at || new Date().toISOString()
        );
      });

      console.log(`✅ Migrated ${sourceCategories.length} categories`);
    },

    products: () => {
      console.log('📦 Migrating products...');

      // Clear existing products
      targetDb.prepare('DELETE FROM products').run();

      // Get products from source
      let sourceProducts;
      try {
        sourceProducts = sourceDb.prepare('SELECT * FROM products').all();
      } catch (e) {
        console.log('❌ Products table not found');
        return;
      }

      if (sourceProducts.length === 0) {
        console.log('⚠️  No products found in source database');
        return;
      }

      // Migrate existing products
      const insertProduct = targetDb.prepare(`
        INSERT INTO products (id, name, category_id, unit, minimum_stock, description, active, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      sourceProducts.forEach(product => {
        insertProduct.run(
          product.id,
          product.name,
          product.category_id || null,
          product.unit || 'ชิ้น',
          product.minimum_stock || 0,
          product.description || '',
          product.active !== false ? 1 : 0,
          product.created_by || 1,
          product.created_at || new Date().toISOString(),
          product.updated_at || new Date().toISOString()
        );
      });

      console.log(`✅ Migrated ${sourceProducts.length} products`);
    },

    stock_logs: () => {
      console.log('📊 Migrating stock logs...');

      // Clear existing stock logs
      targetDb.prepare('DELETE FROM stock_logs').run();

      // Get stock logs from source
      let sourceStockLogs;
      try {
        sourceStockLogs = sourceDb.prepare('SELECT * FROM stock_logs ORDER BY date DESC LIMIT 1000').all();
      } catch (e) {
        console.log('⚠️  Stock logs table not found or incompatible');
        return;
      }

      if (sourceStockLogs.length === 0) {
        console.log('⚠️  No stock logs found in source database');
        return;
      }

      // Migrate existing stock logs
      const insertStockLog = targetDb.prepare(`
        INSERT INTO stock_logs (id, product_id, date, quantity_remaining, created_by, notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      sourceStockLogs.forEach(log => {
        insertStockLog.run(
          log.id,
          log.product_id,
          log.date,
          log.quantity_remaining || 0,
          log.created_by || 1,
          log.notes || '',
          log.created_at || new Date().toISOString()
        );
      });

      console.log(`✅ Migrated ${sourceStockLogs.length} stock logs (last 1000 entries)`);
    }
  };

  // Run migrations in order (important for foreign keys)
  console.log('\n🔄 Starting migration process...\n');

  const migrationOrder = ['users', 'categories', 'products', 'stock_logs'];

  for (const tableName of migrationOrder) {
    if (migrations[tableName]) {
      try {
        migrations[tableName]();
      } catch (error) {
        console.error(`❌ Error migrating ${tableName}:`, error.message);
        // Continue with other tables
      }
    }
  }

  // Re-enable foreign key constraints
  targetDb.pragma('foreign_keys = ON');

  // Close databases
  sourceDb.close();
  targetDb.close();

  console.log('\n🎉 Migration completed successfully!');
  console.log('\n📋 Summary:');
  console.log('- Source: nsstock.db (read-only)');
  console.log('- Target: dev.db (updated)');
  console.log('- Production: Not affected');
  console.log('\n💡 You can now test with the migrated data!');

} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
}