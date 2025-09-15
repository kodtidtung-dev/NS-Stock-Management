// scripts/create-realistic-production-data.js
// Script to create realistic data that matches production structure
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

console.log('🚀 Creating realistic production-like data...');

async function main() {
  try {
    // Backup current database
    const backupPath = `./prisma/dev.db.backup.${Date.now()}`;
    if (fs.existsSync('./prisma/dev.db')) {
      fs.copyFileSync('./prisma/dev.db', backupPath);
      console.log(`💾 Database backed up to: ${backupPath}`);
    }

    // Clear existing data (except users)
    console.log('🧹 Clearing existing data...');
    await prisma.stockLog.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();

    // Ensure we have users
    let ownerUser = await prisma.user.findUnique({ where: { username: 'owner' } });
    if (!ownerUser) {
      const bcrypt = require('bcryptjs');
      const ownerPassword = bcrypt.hashSync('owner123', 10);

      ownerUser = await prisma.user.create({
        data: {
          username: 'owner',
          password: ownerPassword,
          role: 'OWNER',
          name: 'Owner',
          active: true
        }
      });
      console.log('✅ Created owner user');
    }

    // Create categories
    const categories = [
      { name: 'เครื่องดื่ม', description: 'กาแฟและเครื่องดื่มต่างๆ' },
      { name: 'วัตถุดิบ', description: 'วัตถุดิบในการทำเครื่องดื่ม' },
      { name: 'อุปกรณ์', description: 'แก้ว ฝา หลอด และอุปกรณ์อื่นๆ' },
      { name: 'ขนม', description: 'ขนมและของหวาน' }
    ];

    const createdCategories = [];
    for (const cat of categories) {
      const category = await prisma.category.create({
        data: {
          ...cat,
          active: true,
          createdBy: ownerUser.id
        }
      });
      createdCategories.push(category);
    }
    console.log(`✅ Created ${createdCategories.length} categories`);

    // Create products with realistic data
    const sampleProducts = [
      // เครื่องดื่ม
      { name: 'Latte', unit: 'แก้ว', minStock: 10, categoryId: createdCategories[0].id },
      { name: 'Cappuccino', unit: 'แก้ว', minStock: 10, categoryId: createdCategories[0].id },
      { name: 'Americano', unit: 'แก้ว', minStock: 15, categoryId: createdCategories[0].id },
      { name: 'Mocha', unit: 'แก้ว', minStock: 8, categoryId: createdCategories[0].id },
      { name: 'Thai Tea', unit: 'แก้ว', minStock: 12, categoryId: createdCategories[0].id },
      { name: 'Green Tea', unit: 'แก้ว', minStock: 10, categoryId: createdCategories[0].id },

      // วัตถุดิบ
      { name: 'Coffee Beans', unit: 'กก.', minStock: 5, categoryId: createdCategories[1].id },
      { name: 'Milk', unit: 'ลิตร', minStock: 20, categoryId: createdCategories[1].id },
      { name: 'Sugar', unit: 'กก.', minStock: 3, categoryId: createdCategories[1].id },
      { name: 'Thai Tea Powder', unit: 'กก.', minStock: 2, categoryId: createdCategories[1].id },
      { name: 'Chocolate Syrup', unit: 'ขวด', minStock: 5, categoryId: createdCategories[1].id },
      { name: 'Vanilla Syrup', unit: 'ขวด', minStock: 3, categoryId: createdCategories[1].id },

      // อุปกรณ์
      { name: 'Paper Cup', unit: 'ใบ', minStock: 100, categoryId: createdCategories[2].id },
      { name: 'Cup Lid', unit: 'ใบ', minStock: 100, categoryId: createdCategories[2].id },
      { name: 'Straw', unit: 'หลอด', minStock: 200, categoryId: createdCategories[2].id },
      { name: 'Paper Bill', unit: 'แผ่น', minStock: 50, categoryId: createdCategories[2].id },
      { name: 'Napkin', unit: 'แผ่น', minStock: 300, categoryId: createdCategories[2].id },
      { name: 'Stirrer', unit: 'ไม้', minStock: 150, categoryId: createdCategories[2].id },

      // ขนม
      { name: 'Croissant', unit: 'ชิ้น', minStock: 10, categoryId: createdCategories[3].id },
      { name: 'Muffin', unit: 'ชิ้น', minStock: 15, categoryId: createdCategories[3].id },
      { name: 'Cookie', unit: 'ชิ้น', minStock: 25, categoryId: createdCategories[3].id },
      { name: 'Donut', unit: 'ชิ้น', minStock: 12, categoryId: createdCategories[3].id }
    ];

    const createdProducts = [];
    for (const prod of sampleProducts) {
      const product = await prisma.product.create({
        data: {
          name: prod.name,
          unit: prod.unit,
          minimumStock: prod.minStock,
          categoryId: prod.categoryId,
          description: `${prod.name} สำหรับร้านกาแฟ`,
          active: true,
          createdBy: ownerUser.id
        }
      });
      createdProducts.push(product);
    }
    console.log(`✅ Created ${createdProducts.length} products`);

    // Create realistic stock data for the past few days
    const dates = [];
    for (let i = 4; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }

    console.log('📊 Creating stock logs...');

    for (const product of createdProducts) {
      let currentStock;

      // Set initial stock based on product type and minimum stock
      if (product.unit === 'แก้ว') {
        currentStock = Math.floor(Math.random() * 30) + product.minimumStock + 10; // Good stock
      } else if (product.unit === 'กก.') {
        currentStock = Math.floor(Math.random() * 10) + product.minimumStock + 2;
      } else if (product.unit === 'ลิตร') {
        currentStock = Math.floor(Math.random() * 30) + product.minimumStock + 10;
      } else if (product.unit === 'ใบ') {
        currentStock = Math.floor(Math.random() * 200) + product.minimumStock + 50;
      } else if (product.unit === 'หลอด' || product.unit === 'ไม้') {
        currentStock = Math.floor(Math.random() * 300) + product.minimumStock + 100;
      } else if (product.unit === 'แผ่น') {
        currentStock = Math.floor(Math.random() * 100) + product.minimumStock + 20;
      } else if (product.unit === 'ขวด') {
        currentStock = Math.floor(Math.random() * 8) + product.minimumStock + 2;
      } else {
        currentStock = Math.floor(Math.random() * 40) + product.minimumStock + 10;
      }

      for (const [index, dateStr] of dates.entries()) {
        // Simulate daily usage
        if (index > 0) {
          let dailyUsage = 0;

          // Different usage patterns for different products
          if (product.unit === 'แก้ว') {
            dailyUsage = Math.floor(Math.random() * 12) + 3; // 3-15 drinks per day
          } else if (product.unit === 'กก.') {
            dailyUsage = Math.random() * 1.5; // 0-1.5 kg per day
          } else if (product.unit === 'ลิตร') {
            dailyUsage = Math.floor(Math.random() * 8) + 2; // 2-10 liters per day
          } else if (product.unit === 'ใบ') {
            dailyUsage = Math.floor(Math.random() * 40) + 15; // 15-55 cups per day
          } else if (product.unit === 'หลอด' || product.unit === 'ไม้') {
            dailyUsage = Math.floor(Math.random() * 60) + 20; // 20-80 per day
          } else if (product.unit === 'แผ่น') {
            dailyUsage = Math.floor(Math.random() * 20) + 5; // 5-25 per day
          } else if (product.unit === 'ขวด') {
            dailyUsage = Math.random() * 0.8; // 0-0.8 bottles per day
          } else {
            dailyUsage = Math.floor(Math.random() * 8) + 2; // default
          }

          currentStock = Math.max(0, currentStock - dailyUsage);
        }

        // Create the stock log
        await prisma.stockLog.create({
          data: {
            productId: product.id,
            date: dateStr,
            quantityRemaining: Math.round(currentStock * 10) / 10, // Round to 1 decimal
            createdBy: ownerUser.id,
            notes: index === 0 ? 'เริ่มต้น' : 'อัพเดทประจำวัน'
          }
        });
      }
    }

    console.log('✅ Created realistic stock history');

    // Show summary
    const productCount = await prisma.product.count();
    const categoryCount = await prisma.category.count();
    const stockLogCount = await prisma.stockLog.count();

    // Get products by status
    const productsWithStock = await prisma.product.findMany({
      include: {
        stockLogs: {
          orderBy: { date: 'desc' },
          take: 1
        }
      }
    });

    let okCount = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    productsWithStock.forEach(product => {
      const latestStock = product.stockLogs[0]?.quantityRemaining || 0;
      if (latestStock === 0) {
        outOfStockCount++;
      } else if (latestStock <= product.minimumStock) {
        lowStockCount++;
      } else {
        okCount++;
      }
    });

    console.log('\n🎉 Database sync completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`- Categories: ${categoryCount}`);
    console.log(`- Products: ${productCount}`);
    console.log(`- Stock logs: ${stockLogCount}`);
    console.log(`\n📊 Stock status:`);
    console.log(`- สถานะปกติ: ${okCount}`);
    console.log(`- ใกล้หมด: ${lowStockCount}`);
    console.log(`- หมดแล้ว: ${outOfStockCount}`);

    console.log('\n💡 Data includes:');
    console.log('- 5 days of stock history');
    console.log('- Realistic usage patterns');
    console.log('- Various product categories');
    console.log('- Ready for dashboard testing');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();