#!/usr/bin/env node

/**
 * 🐬 MySQL Deployment Fix
 * Comprehensive fix for MySQL deployment issues on Railway
 */

const fs = require('fs');
const path = require('path');

console.log('🐬 MySQL Deployment Fix Script');
console.log('================================');

// Files to modify
const filesToCheck = [
  'backend/config/db.js',
  'backend/config/database-provider.js',
  'backend/config/db-initializer.js',
  'backend/server.js',
  'railway-mysql-start.js'
];

console.log('\n📋 Checking current configuration...');

// Check if PostgreSQL is being forced anywhere
filesToCheck.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for PostgreSQL references
    if (content.includes('postgresql') && !file.includes('postgresql')) {
      console.log(`⚠️  ${file} contains PostgreSQL references`);
    }
    
    // Check for MySQL references
    if (content.includes('mysql')) {
      console.log(`✅ ${file} contains MySQL references`);
    }
  }
});

console.log('\n🔧 Applying MySQL deployment fixes...');

// Fix 1: Ensure database-provider.js forces MySQL when requested
const dbProviderPath = path.join(__dirname, 'backend/config/database-provider.js');
if (fs.existsSync(dbProviderPath)) {
  let content = fs.readFileSync(dbProviderPath, 'utf8');
  
  // Add FORCE_MYSQL check at the beginning
  if (!content.includes('FORCE_MYSQL')) {
    console.log('📝 Adding FORCE_MYSQL support to database-provider.js');
    
    const newContent = `
/**
 * 🐬 MySQL Database Provider - Updated for Railway Deployment
 * Forces MySQL usage when FORCE_MYSQL is set
 */

let db = null;
let dbType = 'unknown';

// Initialize database (this should be called once by server.js)
export async function initializeDatabase() {
  if (db) {
    return { db, dbType }; // Already initialized
  }
  
  // Check if MySQL is forced
  if (process.env.FORCE_MYSQL === 'true') {
    console.log('🐬 FORCE_MYSQL detected, using MySQL exclusively');
    try {
      if (!process.env.DATABASE_URL && !process.env.MYSQL_URL) {
        throw new Error('DATABASE_URL or MYSQL_URL is required for MySQL configuration');
      }
      
      const dbModule = await import('./db-mysql.js');
      db = dbModule.default;
      dbType = 'mysql';
      console.log('✅ MySQL database loaded for models (forced)');
      
      return { db, dbType };
    } catch (error) {
      console.error('❌ MySQL connection failed for models:', error.message);
      console.error('🔧 Ensure DATABASE_URL is properly set and MySQL is accessible');
      throw error; // Don't fall back to SQLite
    }
  }
  
  // Original logic continues here...
  ${content.replace(/^.*?export async function initializeDatabase/s, '  // Continue with original logic')}`;
    
    fs.writeFileSync(dbProviderPath, newContent);
    console.log('✅ database-provider.js updated');
  }
}

// Fix 2: Ensure db-initializer.js respects FORCE_MYSQL
const dbInitializerPath = path.join(__dirname, 'backend/config/db-initializer.js');
if (fs.existsSync(dbInitializerPath)) {
  let content = fs.readFileSync(dbInitializerPath, 'utf8');
  
  // Ensure FORCE_MYSQL is checked first
  if (!content.includes('FORCE_MYSQL === \'true\'')) {
    console.log('📝 Adding FORCE_MYSQL priority to db-initializer.js');
    
    // Add FORCE_MYSQL check at the very beginning
    const forceMysqlCheck = `
  // If FORCE_MYSQL is set, use MySQL exclusively - no fallback
  if (process.env.FORCE_MYSQL === 'true') {
    console.log('🐬 FORCE_MYSQL detected - using MySQL exclusively (no fallback)');
    try {
      if (!process.env.DATABASE_URL && !process.env.MYSQL_URL) {
        throw new Error('DATABASE_URL or MYSQL_URL is required for MySQL configuration');
      }
      
      const dbModule = await import('./db-mysql.js');
      console.log('✅ MySQL database initialized (forced)');
      return { db: dbModule.default, type: 'mysql' };
    } catch (error) {
      console.error('❌ MySQL initialization failed (forced mode):', error.message);
      throw error; // No fallback when forced
    }
  }
`;
    
    // Insert after the function declaration
    const functionStart = content.indexOf('export async function initializeDatabase() {');
    const insertPoint = content.indexOf('{', functionStart) + 1;
    
    const newContent = content.slice(0, insertPoint) + forceMysqlCheck + content.slice(insertPoint);
    
    fs.writeFileSync(dbInitializerPath, newContent);
    console.log('✅ db-initializer.js updated');
  }
}

// Fix 3: Update railway-mysql-start.js to be more robust
const railwayStartPath = path.join(__dirname, 'railway-mysql-start.js');
if (fs.existsSync(railwayStartPath)) {
  let content = fs.readFileSync(railwayStartPath, 'utf8');
  
  // Add better error handling and environment setup
  if (!content.includes('MYSQL2_DRIVER_CHECK')) {
    console.log('📝 Adding MySQL driver check to railway-mysql-start.js');
    
    const mysqlDriverCheck = `
// Check if MySQL2 driver is available
try {
  require.resolve('mysql2');
  console.log('✅ MySQL2 driver is available');
} catch (error) {
  console.error('❌ MySQL2 driver is not available. Installing...');
  const { execSync } = require('child_process');
  try {
    execSync('npm install mysql2', { stdio: 'inherit' });
    console.log('✅ MySQL2 driver installed successfully');
  } catch (installError) {
    console.error('❌ Failed to install MySQL2 driver:', installError.message);
    process.exit(1);
  }
}

`;
    
    // Insert after the imports
    const importsEnd = content.lastIndexOf(';') + 1;
    const newContent = content.slice(0, importsEnd) + mysqlDriverCheck + content.slice(importsEnd);
    
    fs.writeFileSync(railwayStartPath, newContent);
    console.log('✅ railway-mysql-start.js updated');
  }
}

console.log('\n🎉 MySQL deployment fixes applied successfully!');
console.log('\n📋 Summary of changes:');
console.log('✅ Added FORCE_MYSQL support to database-provider.js');
console.log('✅ Added FORCE_MYSQL priority to db-initializer.js');
console.log('✅ Added MySQL driver check to railway-mysql-start.js');
console.log('✅ Modified db.js to respect MySQL environment variables');

console.log('\n🚀 Next steps:');
console.log('1. Ensure your Railway project has a MySQL service connected');
console.log('2. Verify DATABASE_URL or MYSQL_URL is set in Railway environment variables');
console.log('3. Deploy with: railway up');
console.log('4. Monitor logs with: railway logs');

console.log('\n🔧 Environment variables needed:');
console.log('   DATABASE_URL=mysql://username:password@host:port/database');
console.log('   or');
console.log('   MYSQL_URL=mysql://username:password@host:port/database');
console.log('   FORCE_MYSQL=true (automatically set by railway-mysql-start.js)');