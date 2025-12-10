/**
 * Test Dashboard Endpoint
 * Debug the dashboard API issue
 */

const fetch = require('node-fetch');

async function testDashboardEndpoint() {
  const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2NTM5Njc3MywiZXhwIjoxNzY2MDAxNTczfQ.SRvU736pQz_RBBPwV7mZsClRTchBJEGphPxe3X0hJKc";
  
  try {
    console.log('🧪 Testing dashboard endpoint...');
    
    const response = await fetch('https://talkavax-production.up.railway.app/api/dashboard/', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('📄 Raw response:', text);
    
    try {
      const data = JSON.parse(text);
      console.log('📦 Parsed data:', data);
    } catch (e) {
      console.log('❌ Failed to parse JSON:', e.message);
    }
    
  } catch (error) {
    console.error('💥 Network error:', error.message);
  }
}

// Use dynamic import for node-fetch
import('node-fetch').then(({ default: fetch }) => {
  global.fetch = fetch;
  return testDashboardEndpoint();
}).catch(err => {
  console.error('Failed to load node-fetch:', err);
});