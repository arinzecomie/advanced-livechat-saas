#!/usr/bin/env node

/**
 * Test direct server start without the MySQL startup wrapper
 */

// Set Railway-like environment variables
process.env.MYSQL_URL = 'mysql://root:gwoSTNxPDOeDqdzSmaGEViMUPpvqNsIu@crossover.proxy.rlwy.net:53253/railway';
process.env.PORT = '3000';
process.env.NODE_ENV = 'production';
process.env.FORCE_MYSQL = 'true';
process.env.MYSQL_PUBLIC_URL = 'mysql://root:gwoSTNxPDOeDqdzSmaGEViMUPpvqNsIu@crossover.proxy.rlwy.net:53253/railway';

console.log('🧪 Testing direct server start...');

// Set DATABASE_URL from MYSQL_URL if not already set
if (process.env.MYSQL_URL && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.MYSQL_URL;
  console.log('🔄 Set DATABASE_URL from MYSQL_URL');
}

// Try to start the server directly
console.log('🚀 Starting server directly...');

const { spawn } = require('child_process');

const serverProcess = spawn('node', ['backend/server.js'], {
  cwd: __dirname,
  env: process.env,
  stdio: 'pipe'
});

let serverStarted = false;

serverProcess.stdout.on('data', (data) => {
  const message = data.toString();
  console.log('SERVER:', message.trim());
  
  if (message.includes('running on port') || message.includes('Server running')) {
    serverStarted = true;
    console.log('✅ Server appears to be running');
  }
});

serverProcess.stderr.on('data', (data) => {
  console.error('SERVER ERROR:', data.toString().trim());
});

serverProcess.on('error', (error) => {
  console.error('❌ Failed to start server:', error.message);
  process.exit(1);
});

serverProcess.on('close', (code) => {
  console.log(`Server exited with code ${code}`);
  if (code !== 0 && serverStarted) {
    console.error('❌ Server crashed after starting');
    process.exit(1);
  } else if (code !== 0) {
    console.error('❌ Server failed to start');
    process.exit(1);
  }
});

// Test health endpoint after delay
setTimeout(() => {
  if (serverStarted) {
    console.log('🧪 Testing health endpoint...');
    const https = require('https');
    
    https.get('https://talkavax-production.up.railway.app/health', (res) => {
      console.log('Health check response:', res.statusCode);
      if (res.statusCode === 200) {
        console.log('✅ Health check passed!');
        process.exit(0);
      } else {
        console.log('❌ Health check failed');
        process.exit(1);
      }
    }).on('error', (err) => {
      console.log('❌ Health check request failed:', err.message);
      process.exit(1);
    });
  }
}, 10000);