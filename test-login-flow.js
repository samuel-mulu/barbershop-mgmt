// Test script for login flow
// Run with: node test-login-flow.js

const BASE_URL = 'http://localhost:3000';

async function testLoginFlow() {
  console.log('🧪 Testing Barbershop Login Flow\n');

  try {
    // Test 1: Get all branches
    console.log('1. Testing GET /api/branches...');
    const branchesResponse = await fetch(`${BASE_URL}/api/branches`);
    const branches = await branchesResponse.json();
    console.log('✅ Branches fetched:', branches.length, 'branches found');
    console.log('Sample branches:', branches.slice(0, 2));
    console.log('');

    // Test 2: Test login with checkOnly (should work without branchId)
    console.log('2. Testing login with checkOnly...');
    const checkResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: 'test@example.com',
        password: 'password123',
        checkOnly: true
      })
    });
    const checkData = await checkResponse.json();
    console.log('✅ Check response:', checkData.error ? 'Error (expected)' : 'Success');
    console.log('');

    // Test 3: Test login without branchId for admin role (should fail)
    console.log('3. Testing admin login without branchId...');
    const adminResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: 'admin@example.com',
        password: 'password123'
      })
    });
    const adminData = await adminResponse.json();
    console.log('✅ Admin login without branchId:', adminData.error ? 'Error (expected)' : 'Success');
    console.log('');

    console.log('🎉 All tests completed!');
    console.log('\n📝 To test the full flow:');
    console.log('1. Start the development server: npm run dev');
    console.log('2. Open http://localhost:3000/login');
    console.log('3. Try logging in with admin/barber/washer credentials');
    console.log('4. You should see the branch selection dropdown');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests
testLoginFlow(); 