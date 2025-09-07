// Test del endpoint usando fetch nativo
async function testEndpoint() {
  try {
    const response = await fetch('http://localhost:3000/api/admin/orders?date=2025-09-07');
    const data = await response.text();
    console.log('Response status:', response.status);
    console.log('Response data:', data.substring(0, 500));
    if (data.includes('Panama start:')) {
      const start = data.match(/Panama start: ([^\\n]+)/);
      const end = data.match(/Panama end: ([^\\n]+)/);
      console.log('Found logs:');
      console.log('Start:', start ? start[1] : 'not found');
      console.log('End:', end ? end[1] : 'not found');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testEndpoint();
