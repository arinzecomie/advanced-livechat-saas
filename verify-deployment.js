#!/usr/bin/env node

/**
 * 🔍 Advanced Live Chat SaaS - Deployment Verification Script
 * 
 * This script verifies that your deployment is working correctly
 * by testing all critical components and APIs.
 */

const http = require('http');
const https = require('https');

const CONFIG = {
  BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:3000',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  TIMEOUT: 10000,
  RETRIES: 3
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName) {
  log(`🔍 Testing: ${testName}`, 'cyan');
}

function logPass(message) {
  log(`✅ PASS: ${message}`, 'green');
}

function logFail(message) {
  log(`❌ FAIL: ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  WARNING: ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  INFO: ${message}`, 'blue');
}

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const { method = 'GET', headers = {}, body } = options;
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request({
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method,
      headers,
      timeout: CONFIG.TIMEOUT
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
          json: () => {
            try {
              return JSON.parse(data);
            } catch {
              return null;
            }
          }
        });
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Request timeout')));
    
    if (body) {
      req.write(body);
    }
    
    req.end();
  });
}

async function testEndpoint(url, options = {}) {
  const { expectedStatus = 200, description } = options;
  
  try {
    const response = await makeRequest(url, options);
    
    if (response.status === expectedStatus) {
      logPass(description || `Endpoint ${url} responded with ${response.status}`);
      return { success: true, response };
    } else {
      logFail(`${description || url} - Expected ${expectedStatus}, got ${response.status}`);
      return { success: false, response };
    }
  } catch (error) {
    logFail(`${description || url} - ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testBackendHealth() {
  logTest('Backend Health Check');
  return await testEndpoint(`${CONFIG.BACKEND_URL}/health`, {
    description: 'Backend health endpoint'
  });
}

async function testBackendAPI() {
  logTest('Backend API Endpoints');
  
  const tests = [
    {
      url: `${CONFIG.BACKEND_URL}/api/auth/register`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        password: 'test123'
      }),
      description: 'User registration endpoint'
    },
    {
      url: `${CONFIG.BACKEND_URL}/api/auth/login`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'demo@example.com',
        password: 'user123'
      }),
      description: 'User login endpoint'
    },
    {
      url: `${CONFIG.BACKEND_URL}/api/widget/status/demo-site-id`,
      description: 'Widget status endpoint'
    },
    {
      url: `${CONFIG.BACKEND_URL}/api/widget/config/demo-site-id`,
      description: 'Widget config endpoint'
    }
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const test of tests) {
    const result = await testEndpoint(test.url, test);
    if (result.success) passed++;
  }
  
  logInfo(`Backend API: ${passed}/${total} tests passed`);
  return passed === total;
}

async function testFrontend() {
  logTest('Frontend Application');
  
  const result = await testEndpoint(CONFIG.FRONTEND_URL, {
    description: 'Frontend application',
    expectedStatus: 200
  });
  
  return result.success;
}

async function testDemoPage() {
  logTest('Demo Page');
  
  const result = await testEndpoint(`${CONFIG.BACKEND_URL}/demo.html`, {
    description: 'Demo page with widget',
    expectedStatus: 200
  });
  
  return result.success;
}

async function testWidgetAPI() {
  logTest('Widget API');
  
  const tests = [
    {
      url: `${CONFIG.BACKEND_URL}/api/widget/visit`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteId: 'demo-site-id',
        fingerprint: 'test-fingerprint-123',
        page: '/test'
      }),
      description: 'Widget visitor tracking'
    }
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const test of tests) {
    const result = await testEndpoint(test.url, test);
    if (result.success) passed++;
  }
  
  logInfo(`Widget API: ${passed}/${total} tests passed`);
  return passed === total;
}

async function testDatabaseConnection() {
  logTest('Database Connection');
  
  // Test through the users endpoint
  const result = await testEndpoint(`${CONFIG.BACKEND_URL}/api/admin/users`, {
    description: 'Database connection via admin endpoint',
    expectedStatus: [200, 401] // Either success or auth required
  });
  
  return result.success;
}

async function testSocketIO() {
  logTest('Socket.IO Connection');
  
  // This is a basic test - full Socket.IO testing would require socket.io-client
  const result = await testEndpoint(`${CONFIG.BACKEND_URL}/socket.io/socket.io.js`, {
    description: 'Socket.IO client library',
    expectedStatus: 200
  });
  
  if (result.success) {
    logPass('Socket.IO client library is accessible');
  } else {
    logFail('Socket.IO client library not found');
  }
  
  return result.success;
}

async function testCriticalFiles() {
  logTest('Critical Files');
  
  const criticalFiles = [
    `${CONFIG.BACKEND_URL}/widget.js`,
    `${CONFIG.BACKEND_URL}/demo.html`
  ];
  
  let passed = 0;
  let total = criticalFiles.length;
  
  for (const file of criticalFiles) {
    const result = await testEndpoint(file, {
      description: `Critical file: ${file.split('/').pop()}`,
      expectedStatus: 200
    });
    if (result.success) passed++;
  }
  
  logInfo(`Critical Files: ${passed}/${total} tests passed`);
  return passed === total;
}

async function runAllTests() {
  log(`${colors.bright}${colors.cyan}`);
  log('╔══════════════════════════════════════════════════════════════╗');
  log('║              🔍 Advanced Live Chat SaaS Verifier              ║');
  log('║                                                              ║');
  log('║         Comprehensive Deployment Verification                ║');
  log('╚══════════════════════════════════════════════════════════════╝');
  log(`${colors.reset}`);
  
  log(`\n📍 Testing URLs:`, 'blue');
  log(`Backend: ${CONFIG.BACKEND_URL}`, 'blue');
  log(`Frontend: ${CONFIG.FRONTEND_URL}`, 'blue');
  
  const tests = [
    { name: 'Backend Health', test: testBackendHealth },
    { name: 'Backend API', test: testBackendAPI },
    { name: 'Frontend App', test: testFrontend },
    { name: 'Demo Page', test: testDemoPage },
    { name: 'Widget API', test: testWidgetAPI },
    { name: 'Database Connection', test: testDatabaseConnection },
    { name: 'Socket.IO', test: testSocketIO },
    { name: 'Critical Files', test: testCriticalFiles }
  ];
  
  let passed = 0;
  let total = tests.length;
  
  log(`\n🧪 Running ${total} verification tests...`, 'cyan');
  
  for (const { name, test } of tests) {
    try {
      const result = await test();
      if (result) passed++;
    } catch (error) {
      logFail(`${name}: ${error.message}`);
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  log(`\n${colors.bright}`);
  log('╔══════════════════════════════════════════════════════════════╗');
  
  if (passed === total) {
    log(`║                 🎉 DEPLOYMENT VERIFIED!                       ║`, 'green');
    log(`║                                                              ║`, 'green');
    log(`║         All systems are operational! ✅                     ║`, 'green');
  } else {
    log(`║                 ⚠️  ISSUES DETECTED                           ║`, 'yellow');
    log(`║                                                              ║`, 'yellow');
    log(`║         ${passed}/${total} tests passed                     ║`, 'yellow');
  }
  
  log('╚══════════════════════════════════════════════════════════════╝');
  log(`${colors.reset}`);
  
  log(`\n📊 Summary: ${passed}/${total} tests passed`, passed === total ? 'green' : 'yellow');
  
  if (passed < total) {
    log('\n🔧 Troubleshooting Tips:', 'cyan');
    log('1. Check if all services are running: npm run status', 'blue');
    log('2. View logs: npm run logs', 'blue');
    log('3. Restart services: npm run restart', 'blue');
    log('4. Check port availability: netstat -ano | findstr :3000', 'blue');
    log('5. Verify environment files exist in backend/ and frontend/', 'blue');
  }
  
  log('\n📚 Next Steps:', 'cyan');
  log('1. Test the demo page in your browser', 'blue');
  log('2. Login to the admin dashboard', 'blue');
  log('3. Create your first site', 'blue');
  log('4. Embed the widget on your website', 'blue');
  
  return passed === total;
}

// Main execution
if (require.main === module) {
  runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    logError(`Verification script error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { runAllTests, testEndpoint, makeRequest };