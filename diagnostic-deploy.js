#!/usr/bin/env node

/**
 * 🐛 Diagnostic Deployment Script
 * Helps identify why the health check is failing in Railway
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Starting Railway Deployment Diagnostic...\n');

// Environment check
console.log('📋 Environment Variables Check:');
console.log('PORT:', process.env.PORT || 'NOT SET');
console.log('NODE_ENV:', process.env.NODE_ENV || 'NOT SET');
console.log('MONGO_URI:', process.env.MONGO_URI ? 'SET (hidden)' : 'NOT SET');
console.log('RAILWAY_ENVIRONMENT:', process.env.RAILWAY_ENVIRONMENT || 'NOT SET');
console.log('RAILWAY_SERVICE_ID:', process.env.RAILWAY_SERVICE_ID || 'NOT SET');
console.log('');

// Check if required files exist
console.log('📁 File System Check:');
const requiredFiles = [
  'backend/server.js',
  'backend/package.json',
  'frontend/dist/index.html',
  'single-url-deploy.js'
];

requiredFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, file));
  console.log(`${exists ? '✅' : '❌'} ${file}`);
});

console.log('');

// Try to start the server and capture logs
console.log('🚀 Testing Server Startup...');

const serverProcess = spawn('node', ['single-url-deploy.js'], {
  env: { ...process.env, PORT: process.env.PORT || 3000 },
  stdio: 'pipe',
  cwd: __dirname
});

let serverStarted = false;
let healthCheckPassed = false;

serverProcess.stdout.on('data', (data) => {
  const message = data.toString();
  console.log('STDOUT:', message);
  
  if (message.includes('Server running') || message.includes('running on port')) {
    serverStarted = true;
    console.log('✅ Server appears to have started');
    
    // Wait a bit then test health endpoint
    setTimeout(async () => {
      await testHealthEndpoint();
    }, 2000);
  }
});

serverProcess.stderr.on('data', (data) => {
  const message = data.toString();
  console.log('STDERR:', message);
});

serverProcess.on('error', (error) => {
  console.log('❌ Server process error:', error.message);
});

serverProcess.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
  if (code !== 0) {
    console.log('❌ Server crashed or failed to start properly');
  }
});

// Test health endpoint
async function testHealthEndpoint() {
  try {
    const port = process.env.PORT || 3000;
    console.log(`🩺 Testing health endpoint: http://localhost:${port}/health`);
    
    const response = await fetch(`http://localhost:${port}/health`);
    const data = await response.json();
    
    console.log('✅ Health check response:', data);
    healthCheckPassed = true;
    
    // Kill the server process
    serverProcess.kill('SIGTERM');
    process.exit(0);
    
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
    
    // Try a simple TCP connection test
    testPortConnection();
  }
}

// Test if port is accessible
function testPortConnection() {
  const net = require('net');
  const port = process.env.PORT || 3000;
  
  const client = new net.Socket();
  
  client.on('connect', () => {
    console.log(`✅ Port ${port} is accessible`);
    client.destroy();
  });
  
  client.on('error', (err) => {
    console.log(`❌ Port ${port} connection failed:`, err.message);
  });
  
  client.connect(port, 'localhost');
}

// Timeout after 30 seconds
setTimeout(() => {
  console.log('⏰ Diagnostic timeout reached (30s)');
  console.log('Server started:', serverStarted);
  console.log('Health check passed:', healthCheckPassed);
  
  serverProcess.kill('SIGTERM');
  process.exit(1);
}, 30000);

console.log('⏳ Running diagnostic for 30 seconds...');