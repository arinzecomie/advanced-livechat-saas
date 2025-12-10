#!/usr/bin/env node

/**
 * 🐬 MySQL Configuration Test
 * Tests if MySQL configuration works correctly
 */

import dotenv from 'dotenv';
dotenv.config();

console.log('🐬 Testing MySQL Configuration...');
console.log('📊 Environment Variables:');
console.log('  FORCE_MYSQL:', process.env.FORCE_MYSQL);
console.log('  DISABLE_POSTGRESQL:', process.env.DISABLE_POSTGRESQL);
console.log('  DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
console.log('  MYSQL_URL:', process.env.MYSQL_URL ? 'SET' : 'NOT SET');

async function testMySQLConfig() {
  try {
    console.log('\n🔧 Testing database provider...');
    
    // Test database provider
    const { initializeDatabase } = await import('./backend/config/database-provider.js');
    const { db, dbType } = await initializeDatabase();
    
    console.log('✅ Database provider initialized');
    console.log('📊 Database type:', dbType);
    
    // Test connection
    console.log('\n🔗 Testing database connection...');
    await db.raw('SELECT 1');
    console.log('✅ Database connection successful');
    
    // Test db-initializer
    console.log('\n🔧 Testing db-initializer...');
    const { initializeDatabase: initDb } = await import('./backend/config/db-initializer.js');
    const result = await initDb();
    console.log('✅ db-initializer successful');
    console.log('📊 Database type:', result.type);
    
    console.log('\n🎉 All MySQL configuration tests passed!');
    
  } catch (error) {
    console.error('❌ MySQL configuration test failed:', error.message);
    console.error('📋 Error stack:', error.stack);
    process.exit(1);
  }
}

// Run test
testMySQLConfig();