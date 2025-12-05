#!/usr/bin/env node

/**
 * 🚀 Advanced Live Chat SaaS - Test Runner
 * 
 * This script runs all test suites and provides a comprehensive overview
 * of the system status and feature implementation progress.
 * 
 * Usage:
 *   node test_runner.js              # Run all tests
 *   node test_runner.js basic        # Run only basic tests
 *   node test_runner.js advanced     # Run only advanced feature tests
 *   node test_runner.js quick        # Run quick smoke tests
 */

const fs = require('fs');
const path = require('path');

// Test configuration
const CONFIG = {
  baseURL: 'http://localhost:3000',
  timeout: 30000,
  
  // Test modes
  modes: {
    all: 'Run all tests',
    basic: 'Run basic functionality tests',
    advanced: 'Run advanced features tests',
    quick: 'Run quick smoke tests'
  }
};

// CLI argument parsing
const args = process.argv.slice(2);
const testMode = args[0] || 'all';

console.log('\n🚀 Advanced Live Chat SaaS - Test Runner');
console.log('=' .repeat(60));
console.log(`Test Mode: ${testMode.toUpperCase()}`);
console.log(`Target Server: ${CONFIG.baseURL}`);
console.log('=' .repeat(60));
console.log();

// Test execution based on mode
async function runTestSuite() {
  const startTime = Date.now();
  let results = {
    basic: null,
    advanced: null,
    combined: {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0
    }
  };
  
  try {
    switch (testMode) {
      case 'basic':
        console.log('🧪 Running Basic Functionality Tests...\n');
        await runBasicTests(results);
        break;
        
      case 'advanced':
        console.log('🚀 Running Advanced Features Tests...\n');
        await runAdvancedFeatureTests(results);
        break;
        
      case 'quick':
        console.log('⚡ Running Quick Smoke Tests...\n');
        await runQuickTests(results);
        break;
        
      case 'all':
      default:
        console.log('🎯 Running Complete Test Suite...\n');
        await runCompleteTestSuite(results);
        break;
    }
    
    const endTime = Date.now();
    results.combined.duration = endTime - startTime;
    
    // Generate final report
    generateFinalReport(results);
    
    // Save results
    saveResultsToFile(results);
    
  } catch (error) {
    console.error(`\n❌ Test runner failed: ${error.message}`);
    process.exit(1);
  }
}

async function runBasicTests(results) {
  try {
    // Import and run basic tests
    const basicTests = require('./test_comprehensive');
    await basicTests.runTests();
    results.basic = 'completed';
    console.log('\n✅ Basic tests completed successfully');
  } catch (error) {
    console.error(`\n❌ Basic tests failed: ${error.message}`);
    results.basic = 'failed';
    throw error;
  }
}

async function runAdvancedFeatureTests(results) {
  try {
    // Import and run advanced tests
    const advancedTests = require('./test_advanced_features');
    await advancedTests.runAdvancedTests();
    results.advanced = 'completed';
    console.log('\n✅ Advanced feature tests completed successfully');
  } catch (error) {
    console.error(`\n❌ Advanced feature tests failed: ${error.message}`);
    results.advanced = 'failed';
    throw error;
  }
}

async function runQuickTests(results) {
  console.log('Running quick smoke tests...\n');
  
  // Quick health check and basic functionality
  const axios = require('axios');
  const CONFIG = {
    baseURL: 'http://localhost:3000',
    timeout: 5000
  };
  
  const quickTests = [
    {
      name: 'Health Check',
      test: async () => {
        const response = await axios.get(`${CONFIG.baseURL}/health`, { timeout: CONFIG.timeout });
        return response.data && response.data.status === 'ok';
      }
    },
    {
      name: 'API Connectivity',
      test: async () => {
        const response = await axios.get(`${CONFIG.baseURL}/api/widget/status/demo-site-id`, { timeout: CONFIG.timeout });
        return response.status === 200;
      }
    },
    {
      name: 'Authentication',
      test: async () => {
        const response = await axios.post(`${CONFIG.baseURL}/api/auth/login`, {
          email: 'demo@example.com',
          password: 'user123'
        }, { timeout: CONFIG.timeout });
        return response.data && response.data.token;
      }
    }
  ];
  
  let passed = 0;
  let total = quickTests.length;
  
  for (const test of quickTests) {
    try {
      const result = await test.test();
      if (result) {
        console.log(`✅ ${test.name}: PASSED`);
        passed++;
      } else {
        console.log(`❌ ${test.name}: FAILED`);
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ERROR - ${error.message}`);
    }
  }
  
  console.log(`\nQuick Tests: ${passed}/${total} passed`);
  results.basic = passed === total ? 'passed' : 'failed';
}

async function runCompleteTestSuite(results) {
  console.log('🎯 PHASE 1: Basic Functionality Tests\n');
  console.log('=' .repeat(50));
  
  try {
    await runBasicTests(results);
  } catch (error) {
    console.log('\n⚠️  Continuing with advanced tests despite basic test failures...\n');
  }
  
  console.log('\n🎯 PHASE 2: Advanced Features Tests\n');
  console.log('=' .repeat(50));
  
  try {
    await runAdvancedFeatureTests(results);
  } catch (error) {
    console.log('\n⚠️  Some advanced tests failed - check implementation status\n');
  }
}

function generateFinalReport(results) {
  console.log('\n' + '=' .repeat(60));
  console.log('📊 FINAL TEST REPORT');
  console.log('=' .repeat(60));
  console.log();
  
  // Basic tests summary
  if (results.basic) {
    console.log('🧪 Basic Functionality Tests:');
    console.log(`   Status: ${results.basic.toUpperCase()}`);
    console.log();
  }
  
  // Advanced tests summary
  if (results.advanced) {
    console.log('🚀 Advanced Features Tests:');
    console.log(`   Status: ${results.advanced.toUpperCase()}`);
    console.log();
  }
  
  // Overall assessment
  const hasFailures = results.basic === 'failed' || results.advanced === 'failed';
  const hasSuccess = results.basic === 'completed' || results.basic === 'passed' || 
                    results.advanced === 'completed';
  
  let overallStatus = '';
  if (testMode === 'all') {
    if (!hasFailures && hasSuccess) {
      overallStatus = '🎉 EXCELLENT - All systems operational!';
    } else if (hasSuccess) {
      overallStatus = '✅ GOOD - Most systems working with some issues';
    } else {
      overallStatus = '❌ CRITICAL - Major system issues detected';
    }
  } else {
    overallStatus = hasFailures ? '❌ Issues detected' : '✅ Tests passed';
  }
  
  console.log(`🎯 OVERALL ASSESSMENT: ${overallStatus}`);
  console.log();
  
  // Recommendations based on test mode
  console.log('💡 RECOMMENDATIONS:');
  
  if (testMode === 'all' || testMode === 'basic') {
    console.log('  Basic Tests:');
    if (results.basic === 'failed') {
      console.log('    - Check server logs for detailed error information');
      console.log('    - Verify all services are running properly');
      console.log('    - Check network connectivity and firewall settings');
    } else {
      console.log('    - Basic functionality is working well');
      console.log('    - Consider adding more comprehensive unit tests');
    }
  }
  
  if (testMode === 'all' || testMode === 'advanced') {
    console.log('  Advanced Features:');
    if (results.advanced === 'failed') {
      console.log('    - Review implementation guides for technical specifications');
      console.log('    - Check which features are not yet implemented');
      console.log('    - Prioritize features based on business requirements');
    } else {
      console.log('    - Advanced features are working well');
      console.log('    - Consider performance optimization');
    }
  }
  
  console.log();
  console.log('  General:');
  console.log('    - Set up monitoring and alerting for production');
  console.log('    - Implement proper unit testing frameworks');
  console.log('    - Consider load testing for scalability validation');
  console.log();
  
  console.log('=' .repeat(60));
}

function saveResultsToFile(results) {
  const report = {
    timestamp: new Date().toISOString(),
    testMode: testMode,
    results: results,
    config: CONFIG,
    summary: {
      basicTests: results.basic,
      advancedTests: results.advanced,
      duration: results.combined.duration,
      status: results.basic === 'completed' && results.advanced === 'completed' ? 'SUCCESS' : 'PARTIAL_SUCCESS'
    }
  };
  
  const reportPath = path.join(__dirname, 'test_results', `test_runner_report_${Date.now()}.json`);
  
  // Ensure directory exists
  const reportDir = path.dirname(reportPath);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Test runner report saved to: ${reportPath}`);
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
  runTestSuite().then(() => {
    console.log('\n✅ Test runner completed successfully');
    process.exit(0);
  }).catch(error => {
    console.error(`\n❌ Test runner failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  runTestSuite,
  CONFIG
};