#!/usr/bin/env node

/**
 * 🧪 Advanced Live Chat SaaS - Simple Integration Test
 * 
 * This test validates the current system functionality using only
 * existing dependencies (no axios or socket.io required).
 * 
 * Run with: node test_simple.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Test configuration
const CONFIG = {
  host: 'localhost',
  port: 3000,
  timeout: 5000,
  
  // Test data
  testSiteId: '96f939b0-8d13-4f43-a0d4-675ec750d4bd',
  testCredentials: {
    email: 'demo@example.com',
    password: 'user123'
  }
};

// Simple HTTP request utility
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData,
            rawData: data
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: null,
            rawData: data
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(CONFIG.timeout, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

// Test functions
async function testHealthCheck() {
  console.log('🩺 Testing health check endpoint...');
  
  try {
    const response = await makeRequest({
      hostname: CONFIG.host,
      port: CONFIG.port,
      path: '/health',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const passed = response.statusCode === 200 && 
                   response.data && 
                   response.data.status === 'ok';
    
    console.log(`Health Check: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
    if (passed) {
      console.log(`  Response: ${JSON.stringify(response.data)}`);
    } else {
      console.log(`  Status Code: ${response.statusCode}`);
      console.log(`  Response: ${response.rawData}`);
    }
    
    return passed;
  } catch (error) {
    console.log(`Health Check: ❌ FAILED - ${error.message}`);
    return false;
  }
}

async function testWidgetStatus() {
  console.log('\n🎯 Testing widget status endpoint...');
  
  try {
    const response = await makeRequest({
      hostname: CONFIG.host,
      port: CONFIG.port,
      path: `/api/widget/status/${CONFIG.testSiteId}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const passed = response.statusCode === 200;
    
    console.log(`Widget Status: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`  Status Code: ${response.statusCode}`);
    if (response.data) {
      console.log(`  Response Data: ${JSON.stringify(response.data, null, 2)}`);
    } else {
      console.log(`  Raw Response: ${response.rawData}`);
    }
    
    return passed;
  } catch (error) {
    console.log(`Widget Status: ❌ FAILED - ${error.message}`);
    return false;
  }
}

async function testAuthentication() {
  console.log('\n🔐 Testing authentication system...');
  
  try {
    const postData = JSON.stringify(CONFIG.testCredentials);
    
    const response = await makeRequest({
      hostname: CONFIG.host,
      port: CONFIG.port,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, postData);
    
    const passed = response.statusCode === 200 && 
                   response.data && 
                   response.data.token;
    
    console.log(`Authentication: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`  Status Code: ${response.statusCode}`);
    
    if (passed) {
      console.log(`  Token Obtained: ${response.data.token.substring(0, 20)}...`);
      console.log(`  User Data: ${JSON.stringify(response.data.user || response.data, null, 2)}`);
      return response.data.token;
    } else {
      console.log(`  Error Response: ${response.rawData}`);
      return null;
    }
  } catch (error) {
    console.log(`Authentication: ❌ FAILED - ${error.message}`);
    return null;
  }
}

async function testWidgetVisit() {
  console.log('\n👤 Testing widget visitor registration...');
  
  try {
    const visitData = {
      siteId: CONFIG.testSiteId,
      fingerprint: 'test-fingerprint-' + Date.now(),
      page: '/test-page',
      meta: {
        userAgent: 'Test Browser',
        language: 'en-US'
      }
    };
    
    const postData = JSON.stringify(visitData);
    
    const response = await makeRequest({
      hostname: CONFIG.host,
      port: CONFIG.port,
      path: '/api/widget/visit',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, postData);
    
    const passed = response.statusCode === 200 && 
                   response.data && 
                   response.data.success && 
                   response.data.data.status === 'ok';
    
    console.log(`Widget Visit: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`  Status Code: ${response.statusCode}`);
    
    if (passed) {
      console.log(`  Visitor Registered: ${JSON.stringify(response.data, null, 2)}`);
      return response.data.data.sessionId;
    } else {
      console.log(`  Error Response: ${response.rawData}`);
      return null;
    }
  } catch (error) {
    console.log(`Widget Visit: ❌ FAILED - ${error.message}`);
    return null;
  }
}

async function testStaticFiles() {
  console.log('\n📁 Testing static file serving...');
  
  const staticFiles = [
    { path: '/demo.html', name: 'Demo Page' },
    { path: '/widget.js', name: 'Widget JavaScript' }
  ];
  
  let allPassed = true;
  
  for (const file of staticFiles) {
    try {
      const response = await makeRequest({
        hostname: CONFIG.host,
        port: CONFIG.port,
        path: file.path,
        method: 'GET',
        headers: {}
      });
      
      const passed = response.statusCode === 200;
      console.log(`${file.name}: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
      console.log(`  Status Code: ${response.statusCode}`);
      
      if (!passed) allPassed = false;
    } catch (error) {
      console.log(`${file.name}: ❌ FAILED - ${error.message}`);
      allPassed = false;
    }
  }
  
  return allPassed;
}

// Main test execution
async function runSimpleTests() {
  console.log('\n🚀 Advanced Live Chat SaaS - Simple Integration Test');
  console.log('=' .repeat(60));
  console.log(`Testing server at: http://${CONFIG.host}:${CONFIG.port}`);
  console.log('=' .repeat(60));
  console.log();
  
  const testResults = {
    total: 0,
    passed: 0,
    failed: 0
  };
  
  try {
    // Test 1: Health Check
    testResults.total++;
    if (await testHealthCheck()) {
      testResults.passed++;
    } else {
      testResults.failed++;
    }
    
    // Test 2: Widget Status
    testResults.total++;
    if (await testWidgetStatus()) {
      testResults.passed++;
    } else {
      testResults.failed++;
    }
    
    // Test 3: Authentication
    testResults.total++;
    const token = await testAuthentication();
    if (token) {
      testResults.passed++;
    } else {
      testResults.failed++;
    }
    
    // Test 4: Widget Visit Registration
    testResults.total++;
    const sessionId = await testWidgetVisit();
    if (sessionId) {
      testResults.passed++;
    } else {
      testResults.failed++;
    }
    
    // Test 5: Static Files
    testResults.total++;
    if (await testStaticFiles()) {
      testResults.passed++;
    } else {
      testResults.failed++;
    }
    
  } catch (error) {
    console.error(`\n❌ Test execution failed: ${error.message}`);
  }
  
  // Generate report
  generateSimpleReport(testResults);
}

function generateSimpleReport(results) {
  console.log('\n' + '=' .repeat(60));
  console.log('📊 SIMPLE TEST REPORT');
  console.log('=' .repeat(60));
  console.log();
  console.log(`Total Tests: ${results.total}`);
  console.log(`Passed: ${results.passed} (${(results.passed / results.total * 100).toFixed(1)}%)`);
  console.log(`Failed: ${results.failed} (${(results.failed / results.total * 100).toFixed(1)}%)`);
  console.log();
  
  // Overall assessment
  const passRate = results.passed / results.total;
  let assessment = '';
  
  if (passRate >= 0.8) {
    assessment = '🎉 EXCELLENT - System is working very well!';
  } else if (passRate >= 0.6) {
    assessment = '✅ GOOD - System is functional with minor issues';
  } else if (passRate >= 0.4) {
    assessment = '⚠️  FAIR - System has some issues that need attention';
  } else {
    assessment = '❌ POOR - System has major issues requiring immediate attention';
  }
  
  console.log(`OVERALL ASSESSMENT: ${assessment}`);
  console.log();
  
  // Next steps
  console.log('💡 NEXT STEPS:');
  if (results.failed > 0) {
    console.log('  - Check failed tests above for specific issues');
    console.log('  - Verify server is running on the correct port');
    console.log('  - Check server logs for detailed error information');
  }
  console.log('  - Run comprehensive tests: node test_comprehensive.js');
  console.log('  - Test advanced features: node test_advanced_features.js');
  console.log('  - Consider implementing formal testing frameworks');
  console.log();
  
  console.log('=' .repeat(60));
  
  // Save simple report
  saveSimpleReport(results);
}

function saveSimpleReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    testType: 'simple_integration',
    results: results,
    overallAssessment: results.passed / results.total >= 0.8 ? 'EXCELLENT' : 
                      results.passed / results.total >= 0.6 ? 'GOOD' : 
                      results.passed / results.total >= 0.4 ? 'FAIR' : 'POOR',
    recommendations: [
      'Check failed tests for specific issues',
      'Verify server is running correctly',
      'Run comprehensive test suite',
      'Consider implementing formal testing frameworks'
    ]
  };
  
  const reportPath = path.join(__dirname, 'test_results', `simple_test_report_${Date.now()}.json`);
  
  // Ensure directory exists
  const reportDir = path.dirname(reportPath);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Simple test report saved to: ${reportPath}`);
}

// Error handling
process.on('unhandledRejection', (error) => {
  console.error(`\n❌ Unhandled rejection: ${error.message}`);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error(`\n❌ Uncaught exception: ${error.message}`);
  process.exit(1);
});

// Run tests if this file is executed directly
if (require.main === module) {
  runSimpleTests().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error(`\n❌ Test failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  runSimpleTests,
  testHealthCheck,
  testAuthentication,
  testWidgetVisit,
  CONFIG
};