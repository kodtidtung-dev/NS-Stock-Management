// scripts/backup-production-postgresql.js
// Script ที่ใช้ PostgreSQL schema เฉพาะสำหรับ backup production

const fs = require('fs')
const path = require('path')

// สร้าง temporary schema file สำหรับ PostgreSQL
const createPostgreSQLSchema = () => {
  const schemaContent = `
generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/.prisma/production-client"
}

datasource db {
  provider = "postgresql"
  url      = env("PRODUCTION_DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  username  String   @unique
  password  String
  role      Role
  name      String
  active    Boolean  @default(true)
  createdAt DateTime @default(now()) @map("created_at")

  stockLogs           StockLog[]
  createdCategories   Category[] @relation("CategoryCreatedBy")
  createdProducts     Product[]  @relation("CreatedBy")

  @@map("users")
}

model Category {
  id          Int      @id @default(autoincrement())
  name        String   @unique
  description String?
  active      Boolean  @default(true)
  createdBy   Int      @map("created_by")
  createdAt   DateTime @default(now()) @map("created_at")

  creator  User      @relation("CategoryCreatedBy", fields: [createdBy], references: [id])
  products Product[]

  @@index([active])
  @@index([createdAt])
  @@map("categories")
}

model Product {
  id           Int      @id @default(autoincrement())
  name         String   @unique
  categoryId   Int?     @map("category_id")
  unit         String
  minimumStock Float    @map("minimum_stock")
  description  String?
  active       Boolean  @default(true)
  createdBy    Int      @map("created_by")
  createdAt    DateTime @default(now()) @map("created_at")

  category  Category?  @relation(fields: [categoryId], references: [id])
  creator   User       @relation("CreatedBy", fields: [createdBy], references: [id])
  stockLogs StockLog[]

  @@index([active])
  @@index([categoryId])
  @@index([createdAt])
  @@index([active, categoryId])
  @@map("products")
}

model StockLog {
  id                Int      @id @default(autoincrement())
  productId         Int      @map("product_id")
  date              DateTime
  quantityRemaining Float    @map("quantity_remaining")
  createdBy         Int      @map("created_by")
  notes             String?
  createdAt         DateTime @default(now()) @map("created_at")

  product Product @relation(fields: [productId], references: [id])
  user    User    @relation(fields: [createdBy], references: [id])

  @@unique([productId, date])
  @@index([date])
  @@index([productId])
  @@index([createdAt])
  @@index([date, productId])
  @@map("stock_logs")
}

enum Role {
  STAFF
  OWNER
}
`

  const tempSchemaPath = path.join(__dirname, 'temp-postgresql-schema.prisma')
  fs.writeFileSync(tempSchemaPath, schemaContent)
  return tempSchemaPath
}

async function backupProductionData() {
  const tempSchemaPath = createPostgreSQLSchema()

  try {
    console.log('🔄 Starting production data backup...')

    // Import PrismaClient dynamically with custom schema
    const { execSync } = require('child_process')

    // Generate client for PostgreSQL schema
    console.log('📦 Generating PostgreSQL client...')
    execSync(`npx prisma generate --schema="${tempSchemaPath}"`, { stdio: 'inherit' })

    // Import the generated client
    const { PrismaClient } = require('../node_modules/.prisma/production-client')
    const productionPrisma = new PrismaClient()

    // Fetch all data from production
    const [users, categories, products, stockLogs] = await Promise.all([
      productionPrisma.user.findMany(),
      productionPrisma.category.findMany(),
      productionPrisma.product.findMany(),
      productionPrisma.stockLog.findMany()
    ])

    const backupData = {
      timestamp: new Date().toISOString(),
      users,
      categories,
      products,
      stockLogs
    }

    // Create backup directory if it doesn't exist
    const backupDir = path.join(__dirname, '..', 'backups')
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }

    // Save backup file with timestamp
    const backupFileName = `production-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    const backupFilePath = path.join(backupDir, backupFileName)

    fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2))

    console.log('✅ Backup completed successfully!')
    console.log(`📁 Backup saved to: ${backupFilePath}`)
    console.log(`📊 Data summary:`)
    console.log(`   - Users: ${users.length}`)
    console.log(`   - Categories: ${categories.length}`)
    console.log(`   - Products: ${products.length}`)
    console.log(`   - Stock Logs: ${stockLogs.length}`)

    await productionPrisma.$disconnect()
    return backupFilePath

  } catch (error) {
    console.error('❌ Backup failed:', error)
    throw error
  } finally {
    // Clean up temporary files
    if (fs.existsSync(tempSchemaPath)) {
      fs.unlinkSync(tempSchemaPath)
    }
  }
}

if (require.main === module) {
  backupProductionData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

module.exports = { backupProductionData }