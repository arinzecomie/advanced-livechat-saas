#!/usr/bin/env node

/**
 * 🐬 Final MySQL Deployment Script
 * Complete deployment script for MySQL on Railway
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🐬 Final MySQL Deployment Script');
console.log('==================================');

// Environment setup
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'production';

console.log('\n📋 Deployment Configuration:');
console.log('  PORT:', PORT);
console.log('  NODE_ENV:', NODE_ENV);
console.log('  DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
console.log('  MYSQL_URL:', process.env.MYSQL_URL ? 'SET' : 'NOT SET');
console.log('  FORCE_MYSQL:', process.env.FORCE_MYSQL || 'true');

// Backend environment with MySQL forcing
const backendEnv = { 
  ...process.env, 
  PORT: PORT, 
  NODE_ENV: NODE_ENV,
  FORCE_MYSQL: 'true',
  DISABLE_POSTGRESQL: 'true'
};

console.log('\n🎯 Starting Advanced Live Chat SaaS with MySQL...');

// Use the railway-mysql-start.js script
const serverProcess = spawn('node', ['railway-mysql-start.js'], {
  cwd: __dirname,
  env: backendEnv,
  stdio: 'pipe'
});

let serverStarted = false;

// Monitor server output
serverProcess.stdout.on('data', (data) => {
  const message = data.toString();
  console.log('SERVER:', message.trim());
  
  // Look for server started indication
  if (message.includes('running on port') || message.includes('MySQL database connected')) {
    serverStarted = true;
    console.log('✅ MySQL server appears to be running');
    
    // Test health endpoint after brief delay
    setTimeout(testHealth, 5000);
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
    console.error('❌ MySQL server crashed after starting');
    process.exit(1);
  } else if (code !== 0) {
    console.error('❌ MySQL server failed to start');
    process.exit(1);
  }
});

// Health check function
async function testHealth() {
  try {
    const response = await fetch(`http://localhost:${PORT}/health`);
    const data = await response.json();
    
    if (response.ok && data.database === 'mysql') {
      console.log('✅ MySQL health check passed:', data);
      console.log(`🎉 MySQL application ready at http://localhost:${PORT}`);
      console.log(`🌐 Health endpoint: http://localhost:${PORT}/health`);
      console.log('🎯 Test credentials: admin@example.com / admin123');
    } else {
      console.log('⚠️ Health check response:', data);
      if (data.database !== 'mysql') {
        console.error('❌ Health check shows wrong database type:', data.database);
      }
    }
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
    console.log('🔄 Health check will be retried by Railway');
  }
}