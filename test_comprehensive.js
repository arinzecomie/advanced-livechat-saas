#!/usr/bin/env node

/**
 * 🧪 Advanced Live Chat SaaS - Comprehensive Test Suite
 * 
 * This test suite validates all core functionality including:
 * - Authentication system
 * - Real-time chat features
 * - Visitor tracking
 * - Widget functionality
 * - Image upload capabilities (when implemented)
 * - Geolocation features (when implemented)
 * 
 * Run with: node test_comprehensive.js
 */

const axios = require('axios');
const io = require('socket.io-client');
const fs = require('fs');
const path = require('path');

// Test configuration
const CONFIG = {
  baseURL: 'http://localhost:3000',
  apiURL: 'http://localhost:3000/api',
  socketURL: 'http://localhost:3000',
  timeout: 10000,
  testDuration: 30000, // 30 seconds for real-time tests
  
  // Test credentials
  adminCredentials: {
    email: 'admin@example.com',
    password: 'admin123'
  },
  userCredentials: {
    email: 'demo@example.com',
    password: 'user123'
  },
  
  // Test data
  testSiteId: '96f939b0-8d13-4f43-a0d4-675ec750d4bd',
  suspendedSiteId: 'f977b7b4-064c-4992-9739-ffb55d117932',
  
  // Expected responses
  expectedResponses: {
    healthCheck: { status: 'ok' },
    loginSuccess: { success: true, token: /.+/ },
    visitorRegistration: { success: true, data: { status: 'ok' } }
  }
};

// Test results tracking
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: [],
  warnings: [],
  info: []
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`[${timestamp}] ${prefix} ${message}`);
  
  if (type === 'error') testResults.errors.push({ timestamp, message });
  if (type === 'warning') testResults.warnings.push({ timestamp, message });
  if (type === 'info') testResults.info.push({ timestamp, message });
}

function addResult(passed, testName) {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    log(`${testName} PASSED`, 'success');
  } else {
    testResults.failed++;
    log(`${testName} FAILED`, 'error');
  }
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test functions
async function testHealthCheck() {
  log('Testing health check endpoint...', 'info');
  try {
    const response = await axios.get(`${CONFIG.baseURL}/health`, { timeout: CONFIG.timeout });
    const passed = response.data && response.data.status === 'ok';
    addResult(passed, 'Health Check');
    return passed;
  } catch (error) {
    log(`Health check failed: ${error.message}`, 'error');
    addResult(false, 'Health Check');
    return false;
  }
}

async function testAuthentication() {
  log('Testing authentication system...', 'info');
  
  let authToken = null;
  
  // Test admin login
  try {
    const loginResponse = await axios.post(`${CONFIG.apiURL}/auth/login`, CONFIG.adminCredentials, {
      timeout: CONFIG.timeout
    });
    
    const passed = loginResponse.data && loginResponse.data.token;
    addResult(passed, 'Admin Login');
    
    if (passed) {
      authToken = loginResponse.data.token;
      log(`Admin token obtained: ${authToken.substring(0, 20)}...`, 'info');
    }
  } catch (error) {
    log(`Admin login failed: ${error.message}`, 'error');
    addResult(false, 'Admin Login');
  }
  
  // Test user login
  try {
    const loginResponse = await axios.post(`${CONFIG.apiURL}/auth/login`, CONFIG.userCredentials, {
      timeout: CONFIG.timeout
    });
    
    const passed = loginResponse.data && loginResponse.data.token;
    addResult(passed, 'User Login');
  } catch (error) {
    log(`User login failed: ${error.message}`, 'error');
    addResult(false, 'User Login');
  }
  
  return authToken;
}

async function testWidgetFunctionality() {
  log('Testing widget functionality...', 'info');
  
  // Test visitor registration
  try {
    const visitorData = {
      siteId: CONFIG.testSiteId,
      fingerprint: 'test-fingerprint-' + Date.now(),
      page: '/test-page',
      meta: {
        userAgent: 'Test Browser',
        language: 'en-US'
      }
    };
    
    const response = await axios.post(`${CONFIG.apiURL}/widget/visit`, visitorData, {
      timeout: CONFIG.timeout
    });
    
    const passed = response.data && response.data.success && response.data.data.status === 'ok';
    addResult(passed, 'Widget Visitor Registration');
    
    if (passed) {
      log(`Visitor registered successfully: ${response.data.data.sessionId}`, 'info');
      return response.data.data.sessionId;
    }
  } catch (error) {
    log(`Widget registration failed: ${error.message}`, 'error');
    addResult(false, 'Widget Visitor Registration');
  }
  
  return null;
}

async function testSiteStatus() {
  log('Testing site status endpoints...', 'info');
  
  // Test active site
  try {
    const response = await axios.get(`${CONFIG.apiURL}/widget/status/${CONFIG.testSiteId}`, {
      timeout: CONFIG.timeout
    });
    
    const passed = response.data && response.data.status === 'active';
    addResult(passed, 'Active Site Status');
  } catch (error) {
    log(`Active site status failed: ${error.message}`, 'error');
    addResult(false, 'Active Site Status');
  }
  
  // Test suspended site
  try {
    const response = await axios.get(`${CONFIG.apiURL}/widget/status/${CONFIG.suspendedSiteId}`, {
      timeout: CONFIG.timeout
    });
    
    const passed = response.data && response.data.error;
    addResult(passed, 'Suspended Site Status');
  } catch (error) {
    // Suspended site should return error, so this is expected
    addResult(true, 'Suspended Site Status');
  }
}

async function testRealTimeChat(authToken, sessionId) {
  log('Testing real-time chat functionality...', 'info');
  
  if (!authToken) {
    log('Skipping real-time chat tests - no auth token', 'warning');
    return;
  }
  
  return new Promise((resolve) => {
    const socket = io(CONFIG.socketURL, {
      transports: ['websocket', 'polling'],
      timeout: CONFIG.timeout
    });
    
    let testsPassed = 0;
    let testsTotal = 0;
    
    socket.on('connect', () => {
      log('Socket connected successfully', 'success');
      addResult(true, 'Socket.IO Connection');
      
      // Join site room
      socket.emit('join_site', CONFIG.testSiteId);
      
      // Test message exchange
      setTimeout(() => {
        const testMessage = {
          siteId: CONFIG.testSiteId,
          sessionId: sessionId || 'test-session',
          text: 'Test message from automated testing',
          senderType: 'admin'
        };
        
        socket.emit('send_message', testMessage);
        log('Test message sent via Socket.IO', 'info');
      }, 1000);
    });
    
    socket.on('new_message', (data) => {
      if (data.text && data.text.includes('Test message from automated testing')) {
        log('Test message received successfully', 'success');
        addResult(true, 'Real-time Message Exchange');
      }
    });
    
    socket.on('disconnect', () => {
      log('Socket disconnected', 'info');
      resolve();
    });
    
    socket.on('error', (error) => {
      log(`Socket error: ${error.message}`, 'error');
      addResult(false, 'Socket.IO Connection');
      resolve();
    });
    
    // Auto-disconnect after test duration
    setTimeout(() => {
      socket.disconnect();
      resolve();
    }, CONFIG.testDuration);
  });
}

async function testDashboardAccess(authToken) {
  log('Testing dashboard access...', 'info');
  
  if (!authToken) {
    log('Skipping dashboard tests - no auth token', 'warning');
    return;
  }
  
  try {
    const response = await axios.get(`${CONFIG.apiURL}/dashboard`, {
      headers: { Authorization: `Bearer ${authToken}` },
      timeout: CONFIG.timeout
    });
    
    const passed = response.data && response.data.success;
    addResult(passed, 'Dashboard Access');
    
    if (passed) {
      log(`Dashboard data retrieved: ${response.data.sites?.length || 0} sites`, 'info');
    }
  } catch (error) {
    log(`Dashboard access failed: ${error.message}`, 'error');
    addResult(false, 'Dashboard Access');
  }
}

async function testVisitorAnalytics(authToken) {
  log('Testing visitor analytics...', 'info');
  
  if (!authToken) {
    log('Skipping analytics tests - no auth token', 'warning');
    return;
  }
  
  try {
    const response = await axios.get(`${CONFIG.apiURL}/dashboard/sites/${CONFIG.testSiteId}/visitors`, {
      headers: { Authorization: `Bearer ${authToken}` },
      timeout: CONFIG.timeout
    });
    
    const passed = response.data && response.data.success;
    addResult(passed, 'Visitor Analytics');
    
    if (passed) {
      log(`Visitor analytics retrieved: ${response.data.data?.length || 0} visitors`, 'info');
    }
  } catch (error) {
    log(`Visitor analytics failed: ${error.message}`, 'error');
    addResult(false, 'Visitor Analytics');
  }
}

async function testAdvancedFeatures() {
  log('Testing advanced features (placeholder for new features)...', 'info');
  
  // Placeholder tests for features we'll implement
  const advancedFeatures = [
    'Image Upload API',
    'Geolocation Detection',
    'Advanced Fingerprinting',
    'Sound Notifications',
    'Typing Preview',
    'Visitor Journey Tracking',
    'Canned Responses',
    'Offline Email Form',
    'Chat Transcripts'
  ];
  
  for (const feature of advancedFeatures) {
    log(`Testing ${feature}... (feature not yet implemented)`, 'info');
    addResult(false, feature); // Mark as not implemented
  }
}

async function testPerformance() {
  log('Testing performance metrics...', 'info');
  
  const endpoints = [
    { url: '/health', name: 'Health Check' },
    { url: '/api/auth/login', name: 'Login Endpoint', method: 'post', data: CONFIG.userCredentials },
    { url: `/api/widget/status/${CONFIG.testSiteId}`, name: 'Widget Status' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const startTime = Date.now();
      
      if (endpoint.method === 'post') {
        await axios.post(`${CONFIG.baseURL}${endpoint.url}`, endpoint.data, { timeout: CONFIG.timeout });
      } else {
        await axios.get(`${CONFIG.baseURL}${endpoint.url}`, { timeout: CONFIG.timeout });
      }
      
      const responseTime = Date.now() - startTime;
      const passed = responseTime < 1000; // Should respond within 1 second
      
      addResult(passed, `${endpoint.name} Performance (${responseTime}ms)`);
      
      if (!passed) {
        log(`${endpoint.name} is slow: ${responseTime}ms`, 'warning');
      }
    } catch (error) {
      addResult(false, `${endpoint.name} Performance`);
      log(`${endpoint.name} failed: ${error.message}`, 'error');
    }
  }
}

async function testSecurity() {
  log('Testing security measures...', 'info');
  
  // Test unauthorized access
  try {
    await axios.get(`${CONFIG.apiURL}/dashboard`, {
      timeout: CONFIG.timeout
      // No auth token
    });
    addResult(false, 'Unauthorized Dashboard Access');
  } catch (error) {
    if (error.response && error.response.status === 401) {
      addResult(true, 'Unauthorized Dashboard Access');
    } else {
      addResult(false, 'Unauthorized Dashboard Access');
    }
  }
  
  // Test invalid token
  try {
    await axios.get(`${CONFIG.apiURL}/dashboard`, {
      headers: { Authorization: 'Bearer invalid-token' },
      timeout: CONFIG.timeout
    });
    addResult(false, 'Invalid Token Handling');
  } catch (error) {
    if (error.response && error.response.status === 401) {
      addResult(true, 'Invalid Token Handling');
    } else {
      addResult(false, 'Invalid Token Handling');
    }
  }
  
  // Test input validation (basic)
  try {
    await axios.post(`${CONFIG.apiURL}/auth/login`, {
      email: 'invalid-email',
      password: ''
    }, { timeout: CONFIG.timeout });
    addResult(false, 'Input Validation');
  } catch (error) {
    if (error.response && error.response.status === 400) {
      addResult(true, 'Input Validation');
    } else {
      addResult(false, 'Input Validation');
    }
  }
}

// Main test execution
async function runTests() {
  console.log('\n🚀 Starting Advanced Live Chat SaaS Comprehensive Test Suite\n');
  console.log('=' .repeat(80));
  console.log(`Test Server: ${CONFIG.baseURL}`);
  console.log(`Test Duration: ${CONFIG.testDuration / 1000} seconds`);
  console.log('=' .repeat(80));
  console.log();
  
  const startTime = Date.now();
  
  try {
    // Phase 1: Basic Functionality
    log('PHASE 1: Basic Functionality Tests', 'info');
    await testHealthCheck();
    const authToken = await testAuthentication();
    await testSiteStatus();
    
    // Phase 2: Real-Time Features
    log('\nPHASE 2: Real-Time Features Tests', 'info');
    const sessionId = await testWidgetFunctionality();
    await testRealTimeChat(authToken, sessionId);
    
    // Phase 3: Dashboard & Analytics
    log('\nPHASE 3: Dashboard & Analytics Tests', 'info');
    await testDashboardAccess(authToken);
    await testVisitorAnalytics(authToken);
    
    // Phase 4: Performance & Security
    log('\nPHASE 4: Performance & Security Tests', 'info');
    await testPerformance();
    await testSecurity();
    
    // Phase 5: Advanced Features (Future)
    log('\nPHASE 5: Advanced Features Tests (Future Implementation)', 'info');
    await testAdvancedFeatures();
    
  } catch (error) {
    log(`Test execution failed: ${error.message}`, 'error');
  }
  
  const endTime = Date.now();
  const totalDuration = endTime - startTime;
  
  // Generate test report
  generateTestReport(totalDuration);
}

function generateTestReport(duration) {
  console.log('\n' + '=' .repeat(80));
  console.log('📊 TEST EXECUTION REPORT');
  console.log('=' .repeat(80));
  console.log();
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed} (${(testResults.passed / testResults.total * 100).toFixed(1)}%)`);
  console.log(`Failed: ${testResults.failed} (${(testResults.failed / testResults.total * 100).toFixed(1)}%)`);
  console.log(`Test Duration: ${(duration / 1000).toFixed(2)} seconds`);
  console.log();
  
  if (testResults.errors.length > 0) {
    console.log('❌ ERRORS:');
    testResults.errors.forEach(error => {
      console.log(`  - ${error.message}`);
    });
    console.log();
  }
  
  if (testResults.warnings.length > 0) {
    console.log('⚠️  WARNINGS:');
    testResults.warnings.forEach(warning => {
      console.log(`  - ${warning.message}`);
    });
    console.log();
  }
  
  // Overall assessment
  const passRate = testResults.passed / testResults.total;
  let assessment = '';
  
  if (passRate >= 0.9) {
    assessment = '🎉 EXCELLENT - System is working very well!';
  } else if (passRate >= 0.7) {
    assessment = '✅ GOOD - System is functional with minor issues';
  } else if (passRate >= 0.5) {
    assessment = '⚠️  FAIR - System has significant issues that need attention';
  } else {
    assessment = '❌ POOR - System has major issues requiring immediate attention';
  }
  
  console.log(`OVERALL ASSESSMENT: ${assessment}`);
  console.log();
  
  // Recommendations
  console.log('💡 RECOMMENDATIONS:');
  if (testResults.failed > 0) {
    console.log('  - Review failed tests and fix underlying issues');
    console.log('  - Check server logs for detailed error information');
    console.log('  - Verify all services are running properly');
  }
  console.log('  - Consider implementing formal unit testing frameworks');
  console.log('  - Set up continuous integration for automated testing');
  console.log('  - Implement monitoring and alerting for production');
  console.log();
  
  console.log('=' .repeat(80));
  
  // Save detailed report to file
  saveDetailedReport(duration);
}

function saveDetailedReport(duration) {
  const report = {
    timestamp: new Date().toISOString(),
    config: CONFIG,
    results: testResults,
    duration: duration,
    passRate: testResults.passed / testResults.total,
    overallAssessment: testResults.passed / testResults.total >= 0.9 ? 'EXCELLENT' : 
                      testResults.passed / testResults.total >= 0.7 ? 'GOOD' : 
                      testResults.passed / testResults.total >= 0.5 ? 'FAIR' : 'POOR',
    recommendations: [
      'Review failed tests and fix underlying issues',
      'Check server logs for detailed error information',
      'Verify all services are running properly',
      'Consider implementing formal unit testing frameworks',
      'Set up continuous integration for automated testing',
      'Implement monitoring and alerting for production'
    ]
  };
  
  const reportPath = path.join(__dirname, 'test_results', `test_report_${Date.now()}.json`);
  
  // Ensure directory exists
  const reportDir = path.dirname(reportPath);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📄 Detailed report saved to: ${reportPath}`);
}

// Error handling
process.on('unhandledRejection', (error) => {
  log(`Unhandled rejection: ${error.message}`, 'error');
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  log(`Uncaught exception: ${error.message}`, 'error');
  process.exit(1);
});

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().then(() => {
    process.exit(testResults.failed > 0 ? 1 : 0);
  }).catch(error => {
    log(`Fatal error: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = {
  runTests,
  testHealthCheck,
  testAuthentication,
  testWidgetFunctionality,
  testRealTimeChat,
  CONFIG
};