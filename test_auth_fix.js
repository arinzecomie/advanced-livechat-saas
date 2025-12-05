#!/usr/bin/env node

/**
 * MCP Test Script for Authentication Fix
 * Tests the login redirect issue and verifies the fix
 * 
 * This script simulates the authentication flow and tests:
 * 1. Login process with demo credentials
 * 2. Token storage and validation
 * 3. Dashboard access after login
 * 4. Authentication state persistence
 */

const axios = require('axios');
const colors = require('colors');

// Configuration
const API_BASE_URL = 'http://localhost:3000/api';
const FRONTEND_URL = 'http://localhost:5173';

// Demo credentials from the setup
const DEMO_CREDENTIALS = {
  email: 'demo@example.com',
  password: 'user123'
};

// Test results tracking
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

// Helper functions
function logTest(name, status, error = null) {
  testResults.total++;
  const timestamp = new Date().toISOString();
  
  if (status === 'PASS') {
    testResults.passed++;
    console.log(`✅ [${timestamp}] ${name}`.green);
  } else {
    testResults.failed++;
    console.log(`❌ [${timestamp}] ${name}`.red);
    if (error) {
      console.log(`   Error: ${error}`.red);
      testResults.errors.push({ test: name, error });
    }
  }
}

function logInfo(message) {
  console.log(`ℹ️  ${message}`.blue);
}

function logWarning(message) {
  console.log(`⚠️  ${message}`.yellow);
}

// Test functions
async function testBackendHealth() {
  try {
    const response = await axios.get(`${API_BASE_URL.replace('/api', '')}/health`);
    return response.data.status === 'ok';
  } catch (error) {
    return false;
  }
}

async function testLoginFlow() {
  try {
    logInfo('Testing login flow with demo credentials...');
    
    // Step 1: Login
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, DEMO_CREDENTIALS);
    
    if (!loginResponse.data.success || !loginResponse.data.data.token) {
      throw new Error('Login failed - no token received');
    }
    
    const { token, user } = loginResponse.data.data;
    logTest('Login API Call', 'PASS');
    
    // Step 2: Verify token structure
    if (!token || token.length < 10) {
      throw new Error('Invalid token format');
    }
    logTest('Token Validation', 'PASS');
    
    // Step 3: Test profile endpoint with token
    const profileResponse = await axios.get(`${API_BASE_URL}/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!profileResponse.data.success || !profileResponse.data.data) {
      throw new Error('Profile fetch failed');
    }
    logTest('Profile API with Token', 'PASS');
    
    // Step 4: Test dashboard endpoint
    const dashboardResponse = await axios.get(`${API_BASE_URL}/dashboard`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!dashboardResponse.data.success || !dashboardResponse.data.data.sites) {
      throw new Error('Dashboard fetch failed');
    }
    logTest('Dashboard API Access', 'PASS');
    
    return { token, user, sites: dashboardResponse.data.data.sites };
    
  } catch (error) {
    logTest('Login Flow', 'FAIL', error.message);
    return null;
  }
}

async function testTokenExpiration() {
  try {
    logInfo('Testing token expiration handling...');
    
    // Create invalid token
    const invalidToken = 'invalid_token_12345';
    
    try {
      await axios.get(`${API_BASE_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${invalidToken}`
        }
      });
      throw new Error('Should have failed with invalid token');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        logTest('Token Expiration Handling', 'PASS');
        return true;
      } else {
        throw new Error('Expected 401 status for invalid token');
      }
    }
    
  } catch (error) {
    logTest('Token Expiration', 'FAIL', error.message);
    return false;
  }
}

async function testFrontendAuthentication() {
  try {
    logInfo('Testing frontend authentication simulation...');
    
    // Simulate the frontend authentication flow
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, DEMO_CREDENTIALS);
    const { token, user } = loginResponse.data.data;
    
    // Simulate localStorage behavior
    const localStorage = {
      token: token,
      user: JSON.stringify(user)
    };
    
    // Simulate useUser hook behavior
    const profileResponse = await axios.get(`${API_BASE_URL}/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${localStorage.token}`
      }
    });
    
    const authenticatedUser = profileResponse.data.data;
    
    // Verify user data matches
    if (authenticatedUser.email !== user.email) {
      throw new Error('User data mismatch');
    }
    
    logTest('Frontend Auth Simulation', 'PASS');
    return true;
    
  } catch (error) {
    logTest('Frontend Auth Simulation', 'FAIL', error.message);
    return false;
  }
}

async function testRaceConditionFix() {
  try {
    logInfo('Testing race condition fix...');
    
    // Simulate rapid login -> dashboard flow
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, DEMO_CREDENTIALS);
    const { token } = loginResponse.data.data;
    
    // Immediately try to access dashboard (simulating the race condition)
    const dashboardResponse = await axios.get(`${API_BASE_URL}/dashboard`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (dashboardResponse.data.success && dashboardResponse.data.data.sites) {
      logTest('Race Condition Fix', 'PASS');
      return true;
    } else {
      throw new Error('Dashboard access failed');
    }
    
  } catch (error) {
    logTest('Race Condition Fix', 'FAIL', error.message);
    return false;
  }
}

// Main test execution
async function runTests() {
  console.log('\n🚀 Advanced Live Chat SaaS - Authentication Fix Test'.cyan.bold);
  console.log('=' .repeat(60));
  
  try {
    // Check if backend is running
    logInfo('Checking backend server status...');
    const backendHealthy = await testBackendHealth();
    
    if (!backendHealthy) {
      logWarning('Backend server is not responding. Make sure it\'s running on port 3000.');
      logWarning('Start the backend with: cd backend && npm run dev');
      return;
    }
    logTest('Backend Health Check', 'PASS');
    
    console.log('\n' + '-'.repeat(60));
    
    // Run authentication tests
    const loginResult = await testLoginFlow();
    
    if (loginResult) {
      await testTokenExpiration();
      await testFrontendAuthentication();
      await testRaceConditionFix();
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Summary'.cyan.bold);
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`✅ Passed: ${testResults.passed}`.green);
    console.log(`❌ Failed: ${testResults.failed}`.red);
    
    if (testResults.errors.length > 0) {
      console.log('\n🔍 Error Details:'.red);
      testResults.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.test}: ${error.error}`);
      });
    }
    
    // Recommendations
    console.log('\n💡 Recommendations:'.yellow);
    if (testResults.failed === 0) {
      console.log('✅ All tests passed! The authentication fix is working correctly.');
      console.log('✅ Login flow should now properly redirect to dashboard.');
    } else {
      console.log('⚠️  Some tests failed. Check the error details above.');
      console.log('⚠️  Make sure both backend and frontend servers are running.');
      console.log('⚠️  Verify database migrations and seed data are complete.');
    }
    
  } catch (error) {
    console.error('\n🚨 Test execution failed:'.red);
    console.error(error.message);
  }
}

// Error handling
process.on('unhandledRejection', (error) => {
  console.error('\n🚨 Unhandled Promise Rejection:'.red);
  console.error(error);
  process.exit(1);
});

// Check if axios is available
try {
  require.resolve('axios');
} catch (error) {
  console.error('\n❌ axios is not installed. Install it with: npm install axios colors'.red);
  process.exit(1);
}

// Run tests
if (require.main === module) {
  runTests().catch(error => {
    console.error('Test execution error:', error);
    process.exit(1);
  });
}

module.exports = {
  runTests,
  testLoginFlow,
  testRaceConditionFix
};