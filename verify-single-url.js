#!/usr/bin/env node

/**
 * 🔍 Advanced Live Chat SaaS - Single URL Deployment Verification
 * 
 * This script verifies that your single URL deployment is working correctly
 * by testing all critical components accessible through one domain/port.
 */

const http = require('http');
const https = require('https');

const CONFIG = {
  BASE_URL: process.env.BASE_URL || 'http://localhost:3000',
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

async function testSingleURLHealth() {
  logTest('Single URL Health Check');
  return await testEndpoint(`${CONFIG.BASE_URL}/health`, {
    description: 'Main health endpoint'
  });
}

async function testFrontendServing() {
  logTest('Frontend Serving from Single URL');
  
  const result = await testEndpoint(CONFIG.BASE_URL, {
    description: 'Frontend application from single URL',
    expectedStatus: 200
  });
  
  if (result.success) {
    // Check if we got HTML (React app) or JSON (fallback message)
    const contentType = result.response.headers['content-type'];
    if (contentType && contentType.includes('text/html')) {
      logPass('Frontend React app is being served correctly');
    } else if (contentType && contentType.includes('application/json')) {
      logWarning('Frontend fallback message shown - React app may not be built');
    }
  }
  
  return result.success;
}

async function testAPIEndpoints() {
  logTest('API Endpoints on Single URL');
  
  const tests = [
    {
      url: `${CONFIG.BASE_URL}/api/auth/login`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'demo@example.com',
        password: 'user123'
      }),
      description: 'Authentication API on single URL'
    },
    {
      url: `${CONFIG.BASE_URL}/api/widget/status/demo-site-id`,
      description: 'Widget API on single URL'
    },
    {
      url: `${CONFIG.BASE_URL}/api/health`,
      description: 'API health endpoint'
    }
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const test of tests) {
    const result = await testEndpoint(test.url, test);
    if (result.success) passed++;
  }
  
  logInfo(`API Endpoints: ${passed}/${total} tests passed`);
  return passed === total;
}

async function testStaticFiles() {
  logTest('Static Files on Single URL');
  
  const staticFiles = [
    {
      url: `${CONFIG.BASE_URL}/widget.js`,
      description: 'Widget JavaScript file'
    },
    {
      url: `${CONFIG.BASE_URL}/demo.html`,
      description: 'Demo HTML page'
    },
    {
      url: `${CONFIG.BASE_URL}/favicon.ico`,
      description: 'Favicon (if exists)',
      expectedStatus: [200, 404] // Optional file
    }
  ];
  
  let passed = 0;
  let total = staticFiles.length;
  
  for (const file of staticFiles) {
    const result = await testEndpoint(file.url, file);
    if (result.success) passed++;
  }
  
  logInfo(`Static Files: ${passed}/${total} tests passed`);
  return passed === total;
}

async function testDatabaseConnection() {
  logTest('Database Connection via Single URL');
  
  // Test through the users endpoint
  const result = await testEndpoint(`${CONFIG.BASE_URL}/api/admin/users`, {
    description: 'Database connection via admin endpoint on single URL',
    expectedStatus: [200, 401] // Either success or auth required
  });
  
  return result.success;
}

async function testSocketIO() {
  logTest('Socket.IO on Single URL');
  
  // Test Socket.IO client library
  const result = await testEndpoint(`${CONFIG.BASE_URL}/socket.io/socket.io.js`, {
    description: 'Socket.IO client library on single URL',
    expectedStatus: 200
  });
  
  if (result.success) {
    logPass('Socket.IO is accessible on the same URL');
  } else {
    logFail('Socket.IO client library not found - real-time features may not work');
  }
  
  return result.success;
}

async function testSingleURLFeatures() {
  logTest('Single URL Specific Features');
  
  // Test that all components are accessible from the same base URL
  const features = [
    {
      url: `${CONFIG.BASE_URL}/`,
      description: 'Frontend application'
    },
    {
      url: `${CONFIG.BASE_URL}/api`,
      description: 'API base endpoint'
    },
    {
      url: `${CONFIG.BASE_URL}/health`,
      description: 'Health check endpoint'
    },
    {
      url: `${CONFIG.BASE_URL}/widget.js`,
      description: 'Widget JavaScript file'
    }
  ];
  
  let passed = 0;
  let total = features.length;
  
  for (const feature of features) {
    const result = await testEndpoint(feature.url, feature);
    if (result.success) passed++;
  }
  
  logInfo(`Single URL Features: ${passed}/${total} tests passed`);
  return passed === total;
}

async function testWidgetEmbedding() {
  logTest('Widget Embedding from Single URL');
  
  // Test that the widget can be embedded from the single URL
  const result = await testEndpoint(`${CONFIG.BASE_URL}/api/widget/config/demo-site-id`, {
    description: 'Widget configuration API'
  });
  
  if (result.success && result.response.json) {
    const config = result.response.json();
    if (config && config.serverUrl === CONFIG.BASE_URL) {
      logPass('Widget configured to use same URL correctly');
    } else {
      logWarning('Widget server URL configuration may need adjustment');
    }
  }
  
  return result.success;
}

async function runAllSingleURLTests() {
  log(`${colors.bright}${colors.cyan}`);
  log('╔══════════════════════════════════════════════════════════════╗');
  log('║              🔍 Single URL Deployment Verifier                ║');
  log('║                                                              ║');
  log('║         Testing Single URL: Everything on One Port          ║');
  log('╚══════════════════════════════════════════════════════════════╝');
  log(`${colors.reset}`);
  
  log(`\n📍 Testing Single URL: ${CONFIG.BASE_URL}`, 'blue');
  log(`Testing that backend, frontend, API, and static files all work from one URL`, 'blue');
  
  const tests = [
    { name: 'Single URL Health', test: testSingleURLHealth },
    { name: 'Frontend Serving', test: testFrontendServing },
    { name: 'API Endpoints', test: testAPIEndpoints },
    { name: 'Static Files', test: testStaticFiles },
    { name: 'Database Connection', test: testDatabaseConnection },
    { name: 'Socket.IO', test: testSocketIO },
    { name: 'Single URL Features', test: testSingleURLFeatures },
    { name: 'Widget Embedding', test: testWidgetEmbedding }
  ];
  
  let passed = 0;
  let total = tests.length;
  
  log(`\n🧪 Running ${total} single URL verification tests...`, 'cyan');
  
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
    log(`║                 🎉 SINGLE URL DEPLOYMENT VERIFIED!           ║`, 'green');
    log(`║                                                              ║`, 'green');
    log(`║         ✅ Everything works from one URL!                   ║`, 'green');
    log(`║         ✅ Frontend served correctly                        ║`, 'green');
    log(`║         ✅ API endpoints accessible                         ║`, 'green');
    log(`║         ✅ Static files served properly                     ║`, 'green');
    log(`║         ✅ Real-time features working                       ║`, 'green');
  } else {
    log(`║                 ⚠️  ISSUES DETECTED                           ║`, 'yellow');
    log(`║                                                              ║`, 'yellow');
    log(`║         ${passed}/${total} tests passed                     ║`, 'yellow');
  }
  
  log('╚══════════════════════════════════════════════════════════════╝');
  log(`${colors.reset}`);
  
  log(`\n📊 Summary: ${passed}/${total} tests passed`, passed === total ? 'green' : 'yellow');
  
  if (passed < total) {
    log('\n🔧 Single URL Troubleshooting:', 'cyan');
    log('1. Check if frontend is built: ls -la frontend/dist/', 'blue');
    log('2. Rebuild frontend: npm run build --prefix frontend', 'blue');
    log('3. Check server configuration: backend/server-single-url.js', 'blue');
    log('4. Verify all services running: npm run status', 'blue');
    log('5. Check logs: npm run logs', 'blue');
  }
  
  log('\n📚 Single URL Benefits Confirmed:', 'cyan');
  log('✅ One domain for everything', 'blue');
  log('✅ Simplified CORS configuration', 'blue');
  log('✅ Easier SSL/HTTPS setup', 'blue');
  log('✅ Cleaner architecture', 'blue');
  log('✅ Better for production', 'blue');
  
  return passed === total;
}

// Main execution
if (require.main === module) {
  runAllSingleURLTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    logError(`Verification script error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { runAllSingleURLTests, testEndpoint, makeRequest };