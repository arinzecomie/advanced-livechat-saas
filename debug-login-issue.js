/**
 * Debug Login Issue Script
 * Tests the login flow and identifies the redirect problem
 */

const fetch = require('node-fetch');

async function testLogin() {
  console.log('🐛 Testing login flow...');
  
  const loginData = {
    email: 'admin@example.com',
    password: 'admin123'
  };

  try {
    console.log('📡 Sending login request...');
    const response = await fetch('https://talkavax-production.up.railway.app/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData),
    });

    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', response.headers.raw());
    
    const data = await response.json();
    console.log('📦 Response data:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('✅ Login successful!');
      console.log('🔑 Token:', data.token);
      console.log('👤 User:', data.user);
      
      // Test token validation
      console.log('\n🔍 Testing token validation...');
      const profileResponse = await fetch('https://talkavax-production.up.railway.app/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${data.token}`,
        },
      });
      
      console.log('📊 Profile response status:', profileResponse.status);
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        console.log('✅ Token validation successful!');
        console.log('👤 Profile data:', profileData);
      } else {
        console.log('❌ Token validation failed!');
        const errorText = await profileResponse.text();
        console.log('❌ Error:', errorText);
      }
      
      // Test dashboard data fetch
      console.log('\n🔍 Testing dashboard data fetch...');
      const dashboardResponse = await fetch('https://talkavax-production.up.railway.app/api/dashboard/sites', {
        headers: {
          'Authorization': `Bearer ${data.token}`,
        },
      });
      
      console.log('📊 Dashboard response status:', dashboardResponse.status);
      
      if (dashboardResponse.ok) {
        const dashboardData = await dashboardResponse.json();
        console.log('✅ Dashboard data fetch successful!');
        console.log('📊 Sites count:', dashboardData.sites?.length || 0);
      } else {
        console.log('❌ Dashboard data fetch failed!');
        const errorText = await dashboardResponse.text();
        console.log('❌ Error:', errorText);
      }
      
    } else {
      console.log('❌ Login failed!');
      console.log('❌ Error message:', data.message || data.error || 'Unknown error');
    }
    
  } catch (error) {
    console.error('💥 Network error:', error.message);
  }
}

testLogin();