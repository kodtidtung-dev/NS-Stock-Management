import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearDatabaseExceptUsers() {
  try {
    console.log('🗑️  Starting to clear database (keeping users)...');
    
    // ลบข้อมูลในลำดับที่ถูกต้องตาม foreign key constraints
    
    // 1. ลบ StockLog ก่อน (มี foreign key ไป Product และ User)
    console.log('Clearing StockLog...');
    const deletedStockLogs = await prisma.stockLog.deleteMany({});
    console.log(`✅ Deleted ${deletedStockLogs.count} stock logs`);
    
    // 2. ลบ Product (มี foreign key ไป Category และ User)  
    console.log('Clearing Product...');
    const deletedProducts = await prisma.product.deleteMany({});
    console.log(`✅ Deleted ${deletedProducts.count} products`);
    
    // 3. ลบ Category (มี foreign key ไป User)
    console.log('Clearing Category...');
    const deletedCategories = await prisma.category.deleteMany({});
    console.log(`✅ Deleted ${deletedCategories.count} categories`);
    
    console.log('🎉 Database cleared successfully (users preserved)!');
    
    // แสดงจำนวน users ที่เหลือ
    const userCount = await prisma.user.count();
    console.log(`👥 Remaining users: ${userCount}`);
    
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// รัน script
clearDatabaseExceptUsers()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });