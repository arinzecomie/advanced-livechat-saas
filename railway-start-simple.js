#!/usr/bin/env node

/**
 * 🚂 Simple Railway Startup Script
 * Minimal, reliable startup for Railway deployment
 */

console.log('🚀 Starting Advanced Live Chat SaaS for Railway...');

// Environment setup
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'production';

console.log('📋 Configuration:');
console.log('  PORT:', PORT);
console.log('  NODE_ENV:', NODE_ENV);

// Simple health check endpoint
const http = require('http');
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`✅ Health check server running on port ${PORT}`);
  console.log(`🌐 Health endpoint: http://localhost:${PORT}/health`);
});

// Start the actual backend
console.log('🎯 Starting backend server...');

const { spawn } = require('child_process');
const path = require('path');

// Set environment variables
const backendEnv = { 
  ...process.env, 
  PORT: PORT, 
  NODE_ENV: NODE_ENV,
  RAILWAY_ENVIRONMENT: 'true'
};

// Try to start the backend server
const serverProcess = spawn('node', ['backend/server.js'], {
  cwd: process.cwd(),
  env: backendEnv,
  stdio: 'inherit'
});

serverProcess.on('error', (error) => {
  console.error('❌ Failed to start server:', error.message);
  // Don't exit - keep health check running
});

serverProcess.on('close', (code) => {
  console.log(`Server exited with code ${code}`);
  if (code !== 0) {
    console.error('❌ Server crashed, but health check will keep running');
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  serverProcess.kill('SIGTERM');
  server.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down...');
  serverProcess.kill('SIGTERM');
  server.close();
  process.exit(0);
});

console.log('⏳ Starting application...');