#!/usr/bin/env node

/**
 * Minimal test to debug server startup issues
 */

// Set Railway-like environment variables
process.env.MYSQL_URL = 'mysql://root:gwoSTNxPDOeDqdzSmaGEViMUPpvqNsIu@crossover.proxy.rlwy.net:53253/railway';
process.env.PORT = '3000';
process.env.NODE_ENV = 'production';
process.env.FORCE_MYSQL = 'true';
process.env.MYSQL_PUBLIC_URL = 'mysql://root:gwoSTNxPDOeDqdzSmaGEViMUPpvqNsIu@crossover.proxy.rlwy.net:53253/railway';

console.log('🧪 Testing server startup...');

// Set DATABASE_URL from MYSQL_URL if not already set
if (process.env.MYSQL_URL && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.MYSQL_URL;
  console.log('🔄 Set DATABASE_URL from MYSQL_URL');
}

// Test database connection first
const { createConnection } = require('mysql2/promise');

async function testDatabaseConnection() {
  try {
    console.log('🔍 Testing database connection...');
    const connection = await createConnection({
      uri: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    await connection.execute('SELECT 1');
    console.log('✅ Database connection successful');
    
    // Get database info
    const [rows] = await connection.execute('SELECT DATABASE() as db, VERSION() as version');
    console.log('📊 Database info:', {
      database: rows[0].db,
      version: rows[0].version
    });
    
    await connection.end();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// Test if we can import the backend modules
async function testBackendImports() {
  try {
    console.log('🔍 Testing backend imports...');
    
    // Test database provider
    const { initializeDatabase } = await import('./backend/config/database-provider.js');
    console.log('✅ Database provider imported');
    
    const result = await initializeDatabase();
    console.log('✅ Database provider initialized:', result.dbType);
    
    return true;
  } catch (error) {
    console.error('❌ Backend import failed:', error.message);
    return false;
  }
}

async function runTests() {
  const dbConnected = await testDatabaseConnection();
  if (!dbConnected) {
    console.log('💥 Database connection failed - server will not start');
    process.exit(1);
  }
  
  const importsWorking = await testBackendImports();
  if (!importsWorking) {
    console.log('💥 Backend imports failed - server will not start');
    process.exit(1);
  }
  
  console.log('🎉 All tests passed - server should start successfully');
}

runTests().catch(error => {
  console.error('💥 Test failed:', error.message);
  process.exit(1);
});