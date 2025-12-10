#!/usr/bin/env node

/**
 * Debug Frontend API Connection Issue
 * Comprehensive test to identify why frontend isn't connecting to backend
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const FRONTEND_URL = 'https://talkavax-production.up.railway.app';
const API_URL = 'https://talkavax-production.up.railway.app/api';

console.log('🔍 Debugging Frontend API Connection Issue');
console.log('==========================================');

// Test 1: Check if frontend is serving the latest build
console.log('\n1️⃣  Testing Frontend Deployment...');
https.get(FRONTEND_URL, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(`   ✅ Frontend responding with status: ${res.statusCode}`);
    
    // Check if it's serving the built React app
    if (data.includes('assets/index-') && data.includes('assets/vendor-')) {
      console.log('   ✅ Frontend is serving built React application');
      
      // Extract the main JS file name
      const jsMatch = data.match(/src="(\/assets\/index-[^"]+)"/);
      if (jsMatch) {
        console.log(`   📄 Main JS file: ${jsMatch[1]}`);
        
        // Test if the JS file is accessible
        https.get(`${FRONTEND_URL}${jsMatch[1]}`, (jsRes) => {
          console.log(`   ✅ Main JS file accessible: ${jsRes.statusCode}`);
        }).on('error', err => {
          console.log(`   ❌ Main JS file error: ${err.message}`);
        });
      }
    } else {
      console.log('   ⚠️  Frontend may not be serving the built React app');
    }
  });
}).on('error', err => {
  console.log(`   ❌ Frontend error: ${err.message}`);
});

// Test 2: Check CORS configuration
setTimeout(() => {
  console.log('\n2️⃣  Testing CORS Configuration...');
  const options = {
    hostname: 'talkavax-production.up.railway.app',
    port: 443,
    path: '/api/auth/login',
    method: 'OPTIONS',
    headers: {
      'Origin': FRONTEND_URL,
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'content-type'
    }
  };

  const req = https.request(options, (res) => {
    console.log(`   ✅ CORS preflight status: ${res.statusCode}`);
    console.log(`   📋 CORS headers:`);
    console.log(`      Access-Control-Allow-Origin: ${res.headers['access-control-allow-origin']}`);
    console.log(`      Access-Control-Allow-Methods: ${res.headers['access-control-allow-methods']}`);
    console.log(`      Access-Control-Allow-Headers: ${res.headers['access-control-allow-headers']}`);
  });

  req.on('error', err => {
    console.log(`   ❌ CORS test error: ${err.message}`);
  });

  req.end();
}, 1000);

// Test 3: Test actual API endpoint
setTimeout(() => {
  console.log('\n3️⃣  Testing API Endpoint...');
  const postData = JSON.stringify({
    email: 'admin@example.com',
    password: 'admin123'
  });

  const options = {
    hostname: 'talkavax-production.up.railway.app',
    port: 443,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'Origin': FRONTEND_URL
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log(`   ✅ API response status: ${res.statusCode}`);
      try {
        const response = JSON.parse(data);
        console.log(`   ✅ API response: ${response.success ? 'SUCCESS' : 'FAILED'}`);
        if (response.success) {
          console.log(`   🔑 Token received: ${response.data.token ? 'Yes' : 'No'}`);
        }
      } catch (e) {
        console.log(`   ⚠️  Could not parse API response: ${data.substring(0, 100)}...`);
      }
    });
  });

  req.on('error', err => {
    console.log(`   ❌ API test error: ${err.message}`);
  });

  req.write(postData);
  req.end();
}, 2000);

// Test 4: Check if frontend files contain correct API URLs
setTimeout(() => {
  console.log('\n4️⃣  Checking Frontend Build...');
  
  // Check if we can access the built frontend files locally
  const frontendDist = path.join(__dirname, 'frontend', 'dist');
  if (fs.existsSync(frontendDist)) {
    console.log('   ✅ Frontend build directory exists');
    
    // Check main JS file
    const jsFiles = fs.readdirSync(path.join(frontendDist, 'assets'))
      .filter(file => file.startsWith('index-') && file.endsWith('.js'));
    
    if (jsFiles.length > 0) {
      console.log(`   📄 Found main JS file: ${jsFiles[0]}`);
      
      const jsContent = fs.readFileSync(path.join(frontendDist, 'assets', jsFiles[0]), 'utf8');
      
      if (jsContent.includes('talkavax-production.up.railway.app')) {
        console.log('   ✅ Frontend build contains production API URL');
      } else if (jsContent.includes('localhost:3000')) {
        console.log('   ❌ Frontend build still contains localhost references');
      } else {
        console.log('   ⚠️  Could not determine API URL in frontend build');
      }
    }
  } else {
    console.log('   ⚠️  Frontend build directory not found locally');
  }
}, 3000);

// Summary
setTimeout(() => {
  console.log('\n📋 Summary & Recommendations:');
  console.log('=============================');
  console.log('');
  console.log('If API is working but frontend not connecting:');
  console.log('1. Frontend may need to be rebuilt and redeployed');
  console.log('2. Check browser console for JavaScript errors');
  console.log('3. Verify environment variables are set during build');
  console.log('4. Ensure frontend is making requests to correct API endpoint');
  console.log('');
  console.log('Next steps:');
  console.log('1. Rebuild frontend: cd frontend && npm run build');
  console.log('2. Redeploy to Railway: railway up');
  console.log('3. Check browser Network tab for failed requests');
  console.log('4. Test login functionality in browser');
}, 4000);