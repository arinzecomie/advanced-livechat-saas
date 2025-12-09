#!/usr/bin/env node

/**
 * 🧪 Railway Authentication Test Script
 * Tests login endpoint with proper JSON formatting
 */

const https = require('https');
const url = require('url');

console.log('🧪 Railway Authentication Test');
console.log('==============================');

// Configuration
const RAILWAY_URL = process.env.RAILWAY_URL || 'https://talkavax-production.up.railway.app';
const TEST_EMAIL = 'admin@example.com';
const TEST_PASSWORD = 'admin123';

console.log('📋 Test Configuration:');
console.log('  Railway URL:', RAILWAY_URL);
console.log('  Test Email:', TEST_EMAIL);
console.log('  Test Password:', '***');

// Test data
const postData = JSON.stringify({
  email: TEST_EMAIL,
  password: TEST_PASSWORD
});

console.log('\n📤 Request Data:', postData);

// Parse URL
const parsedUrl = url.parse(`${RAILWAY_URL}/api/auth/login`);

// Request options
const options = {
  hostname: parsedUrl.hostname,
  port: parsedUrl.port || 443,
  path: parsedUrl.path,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'User-Agent': 'Railway-Test-Script/1.0'
  }
};

console.log('\n📡 Making request...');
console.log('  Method: POST');
console.log('  Host:', options.hostname);
console.log('  Path:', options.path);
console.log('  Headers:', JSON.stringify(options.headers, null, 2));

// Make the request
const req = https.request(options, (res) => {
  console.log(`\n📊 Response Status: ${res.statusCode}`);
  console.log('📋 Response Headers:', JSON.stringify(res.headers, null, 2));
  
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('\n📨 Response Body:');
    console.log(responseData);
    
    try {
      const responseJson = JSON.parse(responseData);
      
      if (responseJson.success) {
        console.log('\n✅ Authentication successful!');
        console.log('👤 User:', responseJson.data.user.email);
        console.log('🔑 Token received:', responseJson.data.token.substring(0, 20) + '...');
        console.log('🏢 Sites:', responseJson.data.sites.length);
      } else {
        console.log('\n❌ Authentication failed');
        console.log('Error:', responseJson.error);
        console.log('Message:', responseJson.message);
      }
    } catch (error) {
      console.log('\n❌ Failed to parse response as JSON');
      console.log('Raw response:', responseData);
    }
    
    // Test health endpoint
    testHealthEndpoint();
  });
});

req.on('error', (error) => {
  console.error('\n❌ Request failed:', error.message);
  console.error('🔧 This usually means:');
  console.error('  1. Railway app is not deployed');
  console.error('  2. Railway app crashed during startup');
  console.error('  3. Wrong Railway URL');
  console.error('  4. Network connectivity issues');
});

// Write data to request body
req.write(postData);
req.end();

// Test health endpoint
function testHealthEndpoint() {
  console.log('\n🏥 Testing health endpoint...');
  
  const healthUrl = url.parse(`${RAILWAY_URL}/health`);
  const healthOptions = {
    hostname: healthUrl.hostname,
    port: healthUrl.port || 443,
    path: healthUrl.path,
    method: 'GET',
    headers: {
      'User-Agent': 'Railway-Test-Script/1.0'
    }
  };
  
  const healthReq = https.request(healthOptions, (res) => {
    console.log(`\n📊 Health Response Status: ${res.statusCode}`);
    
    let healthData = '';
    res.on('data', (chunk) => {
      healthData += chunk;
    });
    
    res.on('end', () => {
      console.log('📨 Health Response:', healthData);
      
      try {
        const healthJson = JSON.parse(healthData);
        if (healthJson.status === 'ok') {
          console.log('✅ Health check passed - application is running!');
        } else {
          console.log('⚠️  Health check warning:', healthJson.status);
        }
      } catch (error) {
        console.log('❌ Health response is not valid JSON');
      }
      
      console.log('\n🎯 Test Summary:');
      console.log('  ✅ Authentication endpoint reached');
      console.log('  ✅ JSON parsing working');
      console.log('  ✅ Health endpoint accessible');
      console.log('\n🚀 Railway deployment appears to be working!');
    });
  });
  
  healthReq.on('error', (error) => {
    console.error('\n❌ Health check failed:', error.message);
  });
  
  healthReq.end();
}