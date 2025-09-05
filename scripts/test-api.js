// =============================================================================
// UPDATED API DEMO SCRIPTS - รวม Product Management
// =============================================================================

// scripts/test-api-complete.js
const API_BASE = 'http://localhost:3000/api'

// Helper Functions
const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE}${endpoint}`
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  }
  
  console.log(`🔗 ${config.method || 'GET'} ${url}`)
  if (config.body && config.method !== 'GET') {
    console.log(`📤 Body:`, JSON.parse(config.body))
  }
  
  try {
    const response = await fetch(url, config)
    const data = await response.json()
    
    console.log(`✅ Status: ${response.status}`)
    console.log('📦 Response:', JSON.stringify(data, null, 2))
    console.log('=' .repeat(80))
    
    return { response, data, success: response.ok }
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.log('=' .repeat(80))
    return { error, success: false }
  }
}

// =============================================================================
// 1. TEST AUTHENTICATION
// =============================================================================
async function testAuth() {
  console.log('\n🔐 TESTING AUTHENTICATION\n')
  
  // Test 1: Login as Owner
  console.log('📝 Test 1: Login as Owner')
  const ownerLogin = await apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      username: 'owner',
      password: '123456'
    })
  })
  
  if (!ownerLogin.success) {
    console.error('❌ Owner login failed!')
    return null
  }
  
  const ownerToken = ownerLogin.data.token
  
  // Test 2: Login as Staff
  console.log('📝 Test 2: Login as Staff')
  const staffLogin = await apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      username: 'staff1',
      password: '123456'
    })
  })
  
  const staffToken = staffLogin.data?.token || 'no-token'
  
  // Test 3: Check current user (Owner)
  console.log('📝 Test 3: Check current user (Owner)')
  await apiCall('/auth/me', {
    headers: {
      'Authorization': `Bearer ${ownerToken}`
    }
  })
  
  // Test 4: Invalid credentials
  console.log('📝 Test 4: Invalid login attempt')
  await apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      username: 'hacker',
      password: 'wrongpass'
    })
  })
  
  return { ownerToken, staffToken }
}

// =============================================================================
// 2. TEST CATEGORIES API (NEW)
// =============================================================================
async function testCategories(ownerToken, staffToken) {
  console.log('\n🏷️ TESTING CATEGORIES API\n')
  
  // Test 1: Get all categories (as Owner)
  console.log('📝 Test 1: Get categories as Owner')
  const categoriesResult = await apiCall('/categories', {
    headers: {
      'Authorization': `Bearer ${ownerToken}`
    }
  })
  
  // Test 2: Add new category (as Owner)
  console.log('📝 Test 2: Add new category as Owner')
  await apiCall('/categories', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ownerToken}`
    },
    body: JSON.stringify({
      name: 'เครื่องดื่มเย็น',
      description: 'เครื่องดื่มเย็นทุกประเภท รวมถึงกาแฟเย็น ชาเย็น'
    })
  })
  
  // Test 3: Try to add duplicate category
  console.log('📝 Test 3: Try to add duplicate category')
  await apiCall('/categories', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ownerToken}`
    },
    body: JSON.stringify({
      name: 'เครื่องดื่มเย็น',
      description: 'ซ้ำ!'
    })
  })
  
  // Test 4: Staff tries to add category (should fail)
  console.log('📝 Test 4: Staff tries to add category (should fail)')
  await apiCall('/categories', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${staffToken}`
    },
    body: JSON.stringify({
      name: 'หมวดหมู่ผิดกฎหมาย',
      description: 'Staff ไม่ควรสามารถทำได้'
    })
  })
  
  // Test 5: Get categories without auth
  console.log('📝 Test 5: Get categories without auth (should fail)')
  await apiCall('/categories')
  
  return categoriesResult.success ? categoriesResult.data : []
}

// =============================================================================
// 3. TEST PRODUCT MANAGEMENT API (NEW)
// =============================================================================
async function testProductManagement(ownerToken, staffToken, categories) {
  console.log('\n📦 TESTING PRODUCT MANAGEMENT API\n')
  
  // Test 1: Get all products for management (Owner only)
  console.log('📝 Test 1: Get products for management as Owner')
  await apiCall('/products/manage', {
    headers: {
      'Authorization': `Bearer ${ownerToken}`
    }
  })
  
  // Test 2: Add new product
  console.log('📝 Test 2: Add new product')
  const newProductResult = await apiCall('/products/manage', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ownerToken}`
    },
    body: JSON.stringify({
      name: 'น้ำแข็ง',
      categoryId: categories.find(c => c.name === 'อุปกรณ์')?.id || null,
      unit: 'กิโลกรัม',
      minimumStock: 5.0,
      description: 'น้ำแข็งสำหรับเครื่องดื่มเย็น'
    })
  })
  
  // Test 3: Add another product
  console.log('📝 Test 3: Add iced coffee syrup')
  await apiCall('/products/manage', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ownerToken}`
    },
    body: JSON.stringify({
      name: 'ไซรัปกาแฟเย็น',
      categoryId: categories.find(c => c.name === 'เครื่องปรุง')?.id || null,
      unit: 'ขวด',
      minimumStock: 2,
      description: 'ไซรัปสำหรับปรุงกาแฟเย็น รสหวานมัน'
    })
  })
  
  // Test 4: Add product with invalid data
  console.log('📝 Test 4: Add product with invalid data')
  await apiCall('/products/manage', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ownerToken}`
    },
    body: JSON.stringify({
      name: '',
      unit: 'ชิ้น',
      minimumStock: -5 // Invalid negative number
    })
  })
  
  // Test 5: Staff tries to add product (should fail)
  console.log('📝 Test 5: Staff tries to add product (should fail)')
  await apiCall('/products/manage', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${staffToken}`
    },
    body: JSON.stringify({
      name: 'สินค้าผิดกฎหมาย',
      unit: 'ชิ้น',
      minimumStock: 1
    })
  })
  
  const productId = newProductResult.success ? newProductResult.data.id : 1
  
  // Test 6: Update product
  console.log('📝 Test 6: Update product')
  await apiCall(`/products/manage/${productId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${ownerToken}`
    },
    body: JSON.stringify({
      name: 'น้ำแข็งคุณภาพพิเศษ',
      minimumStock: 10.0,
      description: 'น้ำแข็งคุณภาพสูง ทำจากน้ำบริสุทธิ์'
    })
  })
  
  // Test 7: Disable product (soft delete)
  console.log('📝 Test 7: Disable product')
  await apiCall(`/products/manage/${productId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${ownerToken}`
    }
  })
  
  // Test 8: Update non-existent product
  console.log('📝 Test 8: Update non-existent product')
  await apiCall('/products/manage/999999', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${ownerToken}`
    },
    body: JSON.stringify({
      name: 'ไม่มีสินค้านี้'
    })
  })
  
  return productId
}

// =============================================================================
// 4. TEST EXISTING APIs WITH NEW DATA
// =============================================================================
async function testExistingAPIs(ownerToken, staffToken) {
  console.log('\n🔄 TESTING EXISTING APIs WITH NEW PRODUCTS\n')
  
  // Test 1: Get products (should include new ones)
  console.log('📝 Test 1: Get all products (should include new ones)')
  await apiCall('/products', {
    headers: {
      'Authorization': `Bearer ${ownerToken}`
    }
  })
  
  // Test 2: Submit stock data including new products
  console.log('📝 Test 2: Submit stock data with new products')
  const today = new Date().toISOString().split('T')[0]
  
  const stockData = [
    { productId: 1, quantityRemaining: 1.5 }, // เมล็ดกาแฟอาราบิก้า
    { productId: 2, quantityRemaining: 0.4 }, // เมล็ดกาแฟโรบัสต้า
    { productId: 3, quantityRemaining: 1.8 }, // นมสด
    { productId: 10, quantityRemaining: 12.0 }, // น้ำแข็ง (สินค้าใหม่)
    { productId: 11, quantityRemaining: 3 }   // ไซรัปกาแฟเย็น (สินค้าใหม่)
  ]
  
  await apiCall('/stock-logs', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${staffToken}`
    },
    body: JSON.stringify({
      date: today,
      stockData: stockData,
      notes: 'ทดสอบระบบหลังเพิ่มสินค้าใหม่'
    })
  })
  
  // Test 3: Get dashboard (should show new alerts)
  console.log('📝 Test 3: Get dashboard with new products')
  await apiCall('/dashboard', {
    headers: {
      'Authorization': `Bearer ${ownerToken}`
    }
  })
  
  // Test 4: Get stock logs
  console.log('📝 Test 4: Get recent stock logs')
  await apiCall('/stock-logs', {
    headers: {
      'Authorization': `Bearer ${ownerToken}`
    }
  })
}

// =============================================================================
// 5. TEST EDGE CASES & ERROR HANDLING
// =============================================================================
async function testEdgeCases(ownerToken) {
  console.log('\n🧪 TESTING EDGE CASES & ERROR HANDLING\n')
  
  // Test 1: Very long product name
  console.log('📝 Test 1: Product with very long name')
  await apiCall('/products/manage', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ownerToken}`
    },
    body: JSON.stringify({
      name: 'สินค้าที่มีชื่อยาวมากๆๆๆๆๆๆๆๆๆๆๆๆๆๆๆๆๆๆๆๆๆๆๆๆๆๆๆๆๆๆๆๆๆๆๆๆๆๆๆๆๆๆ',
      unit: 'ชิ้น',
      minimumStock: 1
    })
  })
  
  // Test 2: Special characters in category name
  console.log('📝 Test 2: Category with special characters')
  await apiCall('/categories', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ownerToken}`
    },
    body: JSON.stringify({
      name: 'หมวดหมู่ @#$%^&*()',
      description: 'ทดสอบอักขระพิเศษ'
    })
  })
  
  // Test 3: Submit stock with non-existent product
  console.log('📝 Test 3: Stock log with non-existent product')
  const today = new Date().toISOString().split('T')[0]
  
  await apiCall('/stock-logs', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ownerToken}`
    },
    body: JSON.stringify({
      date: today,
      stockData: [
        { productId: 999999, quantityRemaining: 100 }
      ]
    })
  })
  
  // Test 4: Extremely high minimum stock
  console.log('📝 Test 4: Product with extremely high minimum stock')
  await apiCall('/products/manage', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ownerToken}`
    },
    body: JSON.stringify({
      name: 'สินค้าขั้นต่ำสูง',
      unit: 'ชิ้น',
      minimumStock: 999999999.99
    })
  })
  
  // Test 5: Invalid date format in stock logs
  console.log('📝 Test 5: Invalid date format in stock logs')
  await apiCall('/stock-logs', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ownerToken}`
    },
    body: JSON.stringify({
      date: 'invalid-date',
      stockData: [
        { productId: 1, quantityRemaining: 5 }
      ]
    })
  })
}

// =============================================================================
// 6. MAIN TEST RUNNER
// =============================================================================
async function runCompleteAPITests() {
  console.log('🚀 COFFEE SHOP COMPLETE API TESTING STARTING...\n')
  console.log('Make sure your Next.js server is running on http://localhost:3000')
  console.log('And database has been migrated with Categories table\n')
  
  try {
    // Step 1: Authentication
    const tokens = await testAuth()
    if (!tokens) {
      console.error('❌ Authentication failed. Cannot continue.')
      return
    }
    
    // Step 2: Categories Management
    const categories = await testCategories(tokens.ownerToken, tokens.staffToken)
    
    // Step 3: Product Management
    const newProductId = await testProductManagement(tokens.ownerToken, tokens.staffToken, categories)
    
    // Step 4: Test existing APIs with new data
    await testExistingAPIs(tokens.ownerToken, tokens.staffToken)
    
    // Step 5: Edge cases and error handling
    await testEdgeCases(tokens.ownerToken)
    
    // Step 6: Final verification - check if everything still works
    console.log('\n🔍 FINAL VERIFICATION\n')
    console.log('📝 Final Test: Get complete dashboard')
    await apiCall('/dashboard', {
      headers: {
        'Authorization': `Bearer ${tokens.ownerToken}`
      }
    })
    
    console.log('\n🎉 ALL TESTS COMPLETED!\n')
    console.log('📊 EXPECTED RESULTS:')
    console.log('- ✅ Authentication should work for both owner and staff')
    console.log('- ✅ Owner can manage categories and products')
    console.log('- ✅ Staff cannot access management endpoints')
    console.log('- ✅ New products appear in stock entry and dashboard')
    console.log('- ✅ Stock logs work with new products')
    console.log('- ✅ Dashboard shows alerts for new products')
    console.log('- ✅ Error handling works for invalid data')
    console.log('- ❌ Edge cases should be handled gracefully')
    
  } catch (error) {
    console.error('💥 Test suite failed:', error)
  }
}

// =============================================================================
// 7. SPECIFIC WORKFLOW TESTS
// =============================================================================
async function testRealWorldWorkflow() {
  console.log('\n🌍 TESTING REAL-WORLD WORKFLOW\n')
  
  // Login as owner
  const ownerLogin = await apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'owner', password: '123456' })
  })
  
  if (!ownerLogin.success) return
  const ownerToken = ownerLogin.data.token
  
  // Scenario: Owner wants to add new iced coffee menu
  console.log('🎬 SCENARIO: Adding new iced coffee menu\n')
  
  console.log('Step 1: Add "Iced Beverages" category')
  await apiCall('/categories', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${ownerToken}` },
    body: JSON.stringify({
      name: 'เครื่องดื่มเย็น',
      description: 'กาแฟเย็น ชาเย็น และเครื่องดื่มเย็นอื่นๆ'
    })
  })
  
  console.log('Step 2: Add ice cubes product')
  await apiCall('/products/manage', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${ownerToken}` },
    body: JSON.stringify({
      name: 'น้ำแข็งก้อน',
      unit: 'กิโลกรัม',
      minimumStock: 10.0,
      description: 'น้ำแข็งสำหรับเครื่องดื่มเย็น'
    })
  })
  
  console.log('Step 3: Add cold brew coffee')
  await apiCall('/products/manage', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${ownerToken}` },
    body: JSON.stringify({
      name: 'Cold Brew Coffee',
      unit: 'ลิตร',
      minimumStock: 2.0,
      description: 'กาแฟสกัดเย็น พร้อมเสิร์ฟ'
    })
  })
  
  console.log('Step 4: Staff logs stock for new products')
  const staffLogin = await apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'staff1', password: '123456' })
  })
  
  if (staffLogin.success) {
    const staffToken = staffLogin.data.token
    const today = new Date().toISOString().split('T')[0]
    
    await apiCall('/stock-logs', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${staffToken}` },
      body: JSON.stringify({
        date: today,
        stockData: [
          { productId: 1, quantityRemaining: 2.0 },  // กาแฟอาราบิก้า
          { productId: 12, quantityRemaining: 8.5 }, // น้ำแข็ง (ต่ำกว่า min 10)
          { productId: 13, quantityRemaining: 1.5 }  // Cold brew (ต่ำกว่า min 2)
        ],
        notes: 'วันแรกขายเครื่องดื่มเย็น - น้ำแข็งและ cold brew ใกล้หมด!'
      })
    })
  }
  
  console.log('Step 5: Owner checks dashboard for alerts')
  await apiCall('/dashboard', {
    headers: { 'Authorization': `Bearer ${ownerToken}` }
  })
  
  console.log('\n✅ REAL-WORLD WORKFLOW COMPLETED!')
}

// Export functions
if (typeof module !== 'undefined') {
  module.exports = { 
    runCompleteAPITests,
    testRealWorldWorkflow,
    testAuth,
    testCategories,
    testProductManagement,
    testExistingAPIs,
    testEdgeCases
  }
}

// Auto-run if called directly
if (typeof window === 'undefined' && require.main === module) {
  // Run complete test suite
  runCompleteAPITests()
  
  // Uncomment to run real-world workflow test
  // setTimeout(() => {
  //   console.log('\n' + '='.repeat(100))
  //   testRealWorldWorkflow()
  // }, 2000)
}

// =============================================================================
// 8. CURL COMMANDS FOR MANUAL TESTING
// =============================================================================
console.log(`
// =============================================================================
// MANUAL TESTING WITH CURL - UPDATED COMMANDS
// =============================================================================

// 1. Login as Owner
curl -X POST http://localhost:3000/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"username":"owner","password":"123456"}' \\
  -c cookies.txt

// 2. Add new category
curl -X POST http://localhost:3000/api/categories \\
  -H "Content-Type: application/json" \\
  -b cookies.txt \\
  -d '{"name":"เครื่องดื่มเย็น","description":"กาแฟเย็น ชาเย็น"}'

// 3. Get all categories  
curl -X GET http://localhost:3000/api/categories \\
  -b cookies.txt

// 4. Add new product
curl -X POST http://localhost:3000/api/products/manage \\
  -H "Content-Type: application/json" \\
  -b cookies.txt \\
  -d '{
    "name": "น้ำแข็ง", 
    "unit": "กิโลกรัม",
    "minimumStock": 5.0,
    "description": "น้ำแข็งสำหรับเครื่องดื่มเย็น"
  }'

// 5. Get products for management
curl -X GET http://localhost:3000/api/products/manage \\
  -b cookies.txt

// 6. Update product (replace {id} with actual product ID)
curl -X PUT http://localhost:3000/api/products/manage/{id} \\
  -H "Content-Type: application/json" \\
  -b cookies.txt \\
  -d '{"name":"น้ำแข็งพิเศษ","minimumStock":10.0}'

// 7. Disable product  
curl -X DELETE http://localhost:3000/api/products/manage/{id} \\
  -b cookies.txt

// 8. Submit stock with new products
curl -X POST http://localhost:3000/api/stock-logs \\
  -H "Content-Type: application/json" \\
  -b cookies.txt \\
  -d '{
    "date": "2024-01-16",
    "stockData": [
      {"productId": 1, "quantityRemaining": 1.5},
      {"productId": 10, "quantityRemaining": 8.0}
    ],
    "notes": "ทดสอบสินค้าใหม่"
  }'
`)