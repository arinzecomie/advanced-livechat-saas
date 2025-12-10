#!/usr/bin/env node

/**
 * Debug startup script with extensive logging
 */

console.log('🚀 DEBUG STARTUP SCRIPT');
console.log('📅 Timestamp:', new Date().toISOString());
console.log('📁 Working directory:', process.cwd());
console.log('📋 Process ID:', process.pid);

// Log all environment variables
console.log('🔍 Environment Variables:');
console.log('  PORT:', process.env.PORT);
console.log('  NODE_ENV:', process.env.NODE_ENV);
console.log('  DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT_SET');
console.log('  MYSQL_URL:', process.env.MYSQL_URL ? 'SET' : 'NOT_SET');
console.log('  FORCE_MYSQL:', process.env.FORCE_MYSQL);
console.log('  RAILWAY_ENVIRONMENT:', process.env.RAILWAY_ENVIRONMENT);
console.log('  RAILWAY_PUBLIC_DOMAIN:', process.env.RAILWAY_PUBLIC_DOMAIN);

// Log directory contents
const fs = require('fs');
const path = require('path');

try {
  console.log('📂 Current directory contents:');
  const files = fs.readdirSync('.');
  files.forEach(file => console.log('  -', file));
} catch (error) {
  console.error('❌ Error reading directory:', error.message);
}

// Try to create a simple server
try {
  console.log('🔧 Creating Express server...');
  const express = require('express');
  const app = express();
  
  const PORT = process.env.PORT || 3000;
  console.log('🎯 Port:', PORT);
  
  // Add logging middleware
  app.use((req, res, next) => {
    console.log(`📨 ${req.method} ${req.url} from ${req.ip}`);
    next();
  });
  
  // Health check endpoint
  app.get('/health', (req, res) => {
    console.log('✅ Health check received');
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      service: 'debug',
      port: PORT
    });
  });
  
  // Root endpoint
  app.get('/', (req, res) => {
    console.log('✅ Root request received');
    res.send('Debug server is running');
  });
  
  // Start server with error handling
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎉 Server successfully started on port ${PORT}`);
    console.log(`🌐 Listening on: http://0.0.0.0:${PORT}`);
    console.log('✨ Health check available at /health');
  });
  
  server.on('error', (error) => {
    console.error('❌ Server error:', error.message);
    process.exit(1);
  });
  
  // Keep process alive
  process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM, shutting down gracefully');
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  });
  
  process.on('SIGINT', () => {
    console.log('🛑 Received SIGINT, shutting down gracefully');
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  });
  
  // Log every 30 seconds to show it's alive
  setInterval(() => {
    console.log('💓 Server heartbeat -', new Date().toISOString());
  }, 30000);
  
} catch (error) {
  console.error('💥 Failed to create server:', error.message);
  console.error(error.stack);
  process.exit(1);
}