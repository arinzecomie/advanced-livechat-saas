/**
 * Test Login Response Structure
 * Debug the login API response format
 */

async function testLoginResponse() {
  try {
    console.log('🧪 Testing login API response structure...');
    
    const response = await fetch('https://talkavax-production.up.railway.app/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123'
      })
    });

    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    console.log('📦 Complete response:', JSON.stringify(data, null, 2));
    
    // Analyze the response structure
    console.log('\n🔍 Response structure analysis:');
    console.log('Response has success field:', 'success' in data);
    console.log('Response has data field:', 'data' in data);
    console.log('data.user exists:', data.data && 'user' in data.data);
    console.log('data.token exists:', data.data && 'token' in data.data);
    console.log('data.sites exists:', data.data && 'sites' in data.data);
    
    if (data.data && data.data.user && data.data.token) {
      console.log('✅ Response structure is correct - token and user found in data.data');
      console.log('Token:', data.data.token.substring(0, 50) + '...');
      console.log('User:', data.data.user.name, `(${data.data.user.role})`);
    } else {
      console.log('❌ Response structure issue - token or user not found in expected location');
    }
    
  } catch (error) {
    console.error('💥 Test error:', error.message);
  }
}

// Use dynamic import for node-fetch
import('node-fetch').then(({ default: fetch }) => {
  global.fetch = fetch;
  return testLoginResponse();
}).catch(err => {
  console.error('Failed to load node-fetch:', err);
});