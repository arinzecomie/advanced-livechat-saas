/**
 * Debug Zustand Authentication Test
 */

const testDebug = async () => {
  console.log('🔍 Debugging Zustand Authentication Test...\n');

  try {
    // Test login with detailed error handling
    console.log('Testing Login API with detailed debugging...');
    
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123'
      }),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('Raw response text:', text);
    
    let data;
    try {
      data = JSON.parse(text);
      console.log('Parsed response data:', JSON.stringify(data, null, 2));
    } catch (e) {
      console.log('Failed to parse JSON:', e.message);
      console.log('Raw text was:', text);
    }

    if (response.ok && data?.token) {
      console.log('✅ Login successful');
      console.log('👤 User:', data.user?.name);
      console.log('🔑 Token:', data.token?.substring(0, 20) + '...');
    } else {
      console.log('❌ Login failed');
      console.log('Error message:', data?.message || 'Unknown error');
    }

  } catch (error) {
    console.error('❌ Request failed:', error.message);
    console.error('Stack:', error.stack);
  }
};

testDebug();