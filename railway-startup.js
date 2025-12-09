#!/usr/bin/env node

/**
 * 🚂 Railway Startup Script
 * Simplified startup for Railway deployment
 */

console.log('🚀 Starting Advanced Live Chat SaaS for Railway...');

// Set default port if not provided
if (!process.env.PORT) {
  process.env.PORT = '3000';
}

console.log('📋 Environment:');
console.log('  PORT:', process.env.PORT);
console.log('  NODE_ENV:', process.env.NODE_ENV || 'production');
console.log('  RAILWAY_ENVIRONMENT:', process.env.RAILWAY_ENVIRONMENT || 'not set');

// Import and run the improved deploy script
const { singleURLDeploy } = require('./single-url-deploy-improved.js');

singleURLDeploy().catch(error => {
  console.error('❌ Railway startup failed:', error.message);
  process.exit(1);
});
