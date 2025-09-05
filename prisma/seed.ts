// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // สร้าง Users
  const hashedPassword = await bcrypt.hash('123456', 10)
  
  const owner = await prisma.user.create({
    data: {
      username: 'owner',
      password: hashedPassword,
      role: 'OWNER',
      name: 'เจ้าของร้าน'
    }
  })

  const staff1 = await prisma.user.create({
    data: {
      username: 'staff1',
      password: hashedPassword,
      role: 'STAFF',
      name: 'พนักงานกะเช้า'
    }
  })

  const staff2 = await prisma.user.create({
    data: {
      username: 'staff2',
      password: hashedPassword,
      role: 'STAFF',
      name: 'พนักงานกะบ่าย'
    }
  })

  // สร้าง Products
  const products = await prisma.product.createMany({
    data: [
      { name: 'เมล็ดกาแฟอาราบิก้า', unit: 'กิโลกรัม', minimumStock: 1.0, createdBy: owner.id },
      { name: 'เมล็ดกาแฟโรบัสต้า', unit: 'กิโลกรัม', minimumStock: 0.5, createdBy: owner.id },
      { name: 'นมสด', unit: 'ลิตร', minimumStock: 2.0, createdBy: owner.id },
      { name: 'นมข้นจืด', unit: 'กระป๋อง', minimumStock: 5, createdBy: owner.id },
      { name: 'น้ำตาลทราย', unit: 'กิโลกรัม', minimumStock: 2.0, createdBy: owner.id },
      { name: 'คุกกี้ช็อกโกแลต', unit: 'ชิ้น', minimumStock: 10, createdBy: owner.id },
      { name: 'มัฟฟินบลูเบอร์รี่', unit: 'ชิ้น', minimumStock: 8, createdBy: owner.id },
      { name: 'ถ้วยกาแฟ', unit: 'ใบ', minimumStock: 20, createdBy: owner.id },
      { name: 'ฝากาแฟ', unit: 'ใบ', minimumStock: 50, createdBy: owner.id }
    ]
  })

  // สร้าง Sample Stock Logs
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  today.setHours(0, 0, 0, 0)
  yesterday.setHours(0, 0, 0, 0)

  // Stock logs for yesterday
  await prisma.stockLog.createMany({
    data: [
      { productId: 1, date: yesterday, quantityRemaining: 2.5, createdBy: staff1.id, notes: 'นับตอนปิดร้าน' },
      { productId: 2, date: yesterday, quantityRemaining: 1.2, createdBy: staff1.id, notes: 'นับตอนปิดร้าน' },
      { productId: 3, date: yesterday, quantityRemaining: 3.5, createdBy: staff1.id, notes: 'นับตอนปิดร้าน' },
      { productId: 4, date: yesterday, quantityRemaining: 12, createdBy: staff1.id, notes: 'นับตอนปิดร้าน' },
      { productId: 5, date: yesterday, quantityRemaining: 5.0, createdBy: staff1.id, notes: 'นับตอนปิดร้าน' },
      { productId: 6, date: yesterday, quantityRemaining: 15, createdBy: staff1.id, notes: 'นับตอนปิดร้าน' },
      { productId: 7, date: yesterday, quantityRemaining: 12, createdBy: staff1.id, notes: 'นับตอนปิดร้าน' },
      { productId: 8, date: yesterday, quantityRemaining: 25, createdBy: staff1.id, notes: 'นับตอนปิดร้าน' },
      { productId: 9, date: yesterday, quantityRemaining: 75, createdBy: staff1.id, notes: 'นับตอนปิดร้าน' }
    ]
  })

  // Stock logs for today (showing usage)
  await prisma.stockLog.createMany({
    data: [
      { productId: 1, date: today, quantityRemaining: 2.0, createdBy: staff2.id, notes: 'นับตอนเช้า' },
      { productId: 2, date: today, quantityRemaining: 0.8, createdBy: staff2.id, notes: 'นับตอนเช้า' },
      { productId: 3, date: today, quantityRemaining: 1.5, createdBy: staff2.id, notes: 'นับตอนเช้า - ใกล้หมด' },
      { productId: 4, date: today, quantityRemaining: 8, createdBy: staff2.id, notes: 'นับตอนเช้า' },
      { productId: 5, date: today, quantityRemaining: 4.2, createdBy: staff2.id, notes: 'นับตอนเช้า' },
      { productId: 6, date: today, quantityRemaining: 5, createdBy: staff2.id, notes: 'นับตอนเช้า - ใกล้หมด' },
      { productId: 7, date: today, quantityRemaining: 4, createdBy: staff2.id, notes: 'นับตอนเช้า - ใกล้หมด' },
      { productId: 8, date: today, quantityRemaining: 18, createdBy: staff2.id, notes: 'นับตอนเช้า - ใกล้หมด' },
      { productId: 9, date: today, quantityRemaining: 60, createdBy: staff2.id, notes: 'นับตอนเช้า' }
    ]
  })

  console.log('✅ Seed data สร้างเสร็จแล้ว!')
  console.log('Login ข้อมูลทดสอบ:')
  console.log('👨‍💼 เจ้าของร้าน - username: owner, password: 123456')
  console.log('👤 พนักงาน 1 - username: staff1, password: 123456')
  console.log('👤 พนักงาน 2 - username: staff2, password: 123456')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })