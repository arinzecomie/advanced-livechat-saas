#!/usr/bin/env node

/**
 * Ultra-minimal startup script for debugging
 */

console.log('🚀 ULTRA-MINIMAL STARTUP');
console.log('📅', new Date().toISOString());
console.log('📋 ENV:', {
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT_SET',
  MYSQL_URL: process.env.MYSQL_URL ? 'SET' : 'NOT_SET',
  FORCE_MYSQL: process.env.FORCE_MYSQL
});

const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('✅ Health check received');
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'ultra-minimal'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  console.log('✅ Root request received');
  res.send('Ultra-minimal server is running');
});

app.listen(PORT, () => {
  console.log(`🎯 Server listening on port ${PORT}`);
});