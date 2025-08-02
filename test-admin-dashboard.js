// Test script for admin dashboard functionality
// Run with: node test-admin-dashboard.js

const BASE_URL = 'http://localhost:3000';

async function testAdminDashboard() {
  console.log('🧪 Testing Admin Dashboard Functionality\n');

  try {
    // Test 1: Get workers for a specific branch
    console.log('1. Testing GET /api/workers with branchId...');
    const workersResponse = await fetch(`${BASE_URL}/api/workers?branchId=688294f5743c94e2c19b8487`);
    const workers = await workersResponse.json();
    console.log('✅ Workers response:', workersResponse.status);
    console.log('Workers found:', workers.length);
    console.log('Sample worker:', workers[0]);
    console.log('');

    // Test 2: Get services for a specific branch
    console.log('2. Testing GET /api/services/[branchId]...');
    const servicesResponse = await fetch(`${BASE_URL}/api/services/688294f5743c94e2c19b8487`);
    const services = await servicesResponse.json();
    console.log('✅ Services response:', servicesResponse.status);
    console.log('Services found:', services.length);
    console.log('Sample service:', services[0]);
    console.log('');

    // Test 3: Add a new service to branch
    console.log('3. Testing POST /api/branches/[id]/services...');
    const addServiceResponse = await fetch(`${BASE_URL}/api/branches/688294f5743c94e2c19b8487/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Service',
        price: 50
      })
    });
    const newService = await addServiceResponse.json();
    console.log('✅ Add service response:', addServiceResponse.status);
    console.log('New service:', newService);
    console.log('');

    console.log('🎉 All admin dashboard tests completed!');
    console.log('\n📝 To test the full admin dashboard:');
    console.log('1. Start the development server: npm run dev');
    console.log('2. Login as an admin user');
    console.log('3. Navigate to /dashboard/admin');
    console.log('4. You should see services and workers for your branch');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests
testAdminDashboard(); 