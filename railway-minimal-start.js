#!/usr/bin/env node

/**
 * 🚂 Railway Minimal Startup Script
 * Ultra-simple startup for Railway deployment debugging
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚂 Railway Minimal Startup Script');
console.log('📅 Timestamp:', new Date().toISOString());
console.log('📁 Working directory:', process.cwd());
console.log('📋 Environment variables:');
console.log('  PORT:', process.env.PORT);
console.log('  NODE_ENV:', process.env.NODE_ENV);
console.log('  MYSQL_URL:', process.env.MYSQL_URL ? 'SET' : 'NOT SET');
console.log('  DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');

// Simple environment setup
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'production';

// Set DATABASE_URL from MYSQL_URL if available
if (process.env.MYSQL_URL && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.MYSQL_URL;
  console.log('🔄 Set DATABASE_URL from MYSQL_URL');
}

// Create minimal environment
const backendEnv = { 
  ...process.env, 
  PORT: PORT, 
  NODE_ENV: NODE_ENV,
  FORCE_MYSQL: 'true',
  DISABLE_POSTGRESQL: 'true'
};

console.log('🎯 Starting backend server...');

// Start the server directly
const serverProcess = spawn('node', ['backend/server.js'], {
  cwd: __dirname,
  env: backendEnv,
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
  if (code !== 0) {
    console.error('❌ Server failed to start properly');
    process.exit(1);
  }
});

// Keep the process alive
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully');
  serverProcess.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully');
  serverProcess.kill('SIGINT');
});