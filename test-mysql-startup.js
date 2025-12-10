#!/usr/bin/env node

/**
 * Test script to simulate Railway MySQL startup locally
 */

// Set Railway-like environment variables
process.env.MYSQL_URL = 'mysql://root:gwoSTNxPDOeDqdzSmaGEViMUPpvqNsIu@mysql.railway.internal:3306/railway';
process.env.MYSQL_PUBLIC_URL = 'mysql://root:gwoSTNxPDOeDqdzSmaGEViMUPpvqNsIu@crossover.proxy.rlwy.net:53253/railway';
process.env.PORT = '3000';
process.env.NODE_ENV = 'production';
process.env.FORCE_MYSQL = 'true';

console.log('🧪 Testing MySQL startup script...');
console.log('📋 Environment:');
console.log('  MYSQL_URL:', process.env.MYSQL_URL ? 'SET' : 'NOT SET');
console.log('  PORT:', process.env.PORT);
console.log('  NODE_ENV:', process.env.NODE_ENV);

// Test the environment variable mapping logic
if (process.env.MYSQL_URL && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.MYSQL_URL;
  console.log('🔄 Set DATABASE_URL from MYSQL_URL');
  console.log('  DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
}

// Test MySQL connection
const { createConnection } = require('mysql2/promise');

async function testConnection() {
  // Try each available URL
  const testUrls = [];
  if (process.env.MYSQL_URL) testUrls.push({ url: process.env.MYSQL_URL, name: 'Internal' });
  if (process.env.MYSQL_PUBLIC_URL) testUrls.push({ url: process.env.MYSQL_PUBLIC_URL, name: 'Public' });
  if (process.env.DATABASE_URL && !testUrls.some(u => u.url === process.env.DATABASE_URL)) {
    testUrls.push({ url: process.env.DATABASE_URL, name: 'DATABASE_URL' });
  }
  
  for (const { url, name } of testUrls) {
    try {
      console.log(`🔍 Testing ${name} MySQL connection...`);
      const connection = await createConnection({
        uri: url,
        ssl: { rejectUnauthorized: false }
      });
      
      await connection.execute('SELECT 1');
      console.log(`✅ ${name} MySQL connection test passed`);
      
      // Update DATABASE_URL to use the working URL
      if (process.env.DATABASE_URL !== url) {
        process.env.DATABASE_URL = url;
        console.log(`🔄 Switched to ${name} URL`);
      }
      
      await connection.end();
      return true;
    } catch (error) {
      console.error(`❌ ${name} MySQL connection test failed:`, error.message);
      continue;
    }
  }
  
  console.error('❌ All MySQL connection tests failed');
  return false;
}

testConnection().then(connected => {
  if (connected) {
    console.log('🎉 MySQL startup should work!');
  } else {
    console.log('💥 MySQL startup will fail');
  }
  process.exit(connected ? 0 : 1);
});