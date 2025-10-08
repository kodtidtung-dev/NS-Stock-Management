// scripts/test-login-flow.ts
import { PrismaClient } from '@prisma/client'
import { comparePassword, createToken, verifyToken } from '../src/lib/auth'

const prisma = new PrismaClient()

async function testLoginFlow() {
  try {
    console.log('🔍 Testing login flow...')
    console.log('JWT_SECRET:', process.env.JWT_SECRET ? `SET (${process.env.JWT_SECRET.substring(0, 10)}...)` : 'NOT SET ✗')

    // Find user
    const user = await prisma.user.findUnique({
      where: { username: 'owner', active: true }
    })

    if (!user) {
      console.error('❌ User "owner" not found')
      process.exit(1)
    }

    console.log('✅ User found:', { id: user.id, username: user.username, role: user.role })

    // Test password (assume default password is "password123")
    const testPasswords = ['password', 'password123', '123456', 'owner123']

    for (const pwd of testPasswords) {
      const match = await comparePassword(pwd, user.password)
      console.log(`🔐 Password "${pwd}": ${match ? '✅ MATCH' : '❌ NO MATCH'}`)
    }

    // Test JWT creation
    console.log('\n🎫 Testing JWT token creation...')
    const token = createToken({
      userId: user.id,
      username: user.username,
      role: user.role,
      name: user.name
    })
    console.log('✅ Token created:', token.substring(0, 50) + '...')

    // Test JWT verification
    const payload = verifyToken(token)
    console.log('✅ Token verified:', payload ? 'SUCCESS' : 'FAILED')
    if (payload) {
      console.log('   Payload:', payload)
    }

  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testLoginFlow()
