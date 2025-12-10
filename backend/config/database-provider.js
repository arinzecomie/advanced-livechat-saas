
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
    // Continue with original logic() {
  if (db) {
    return { db, dbType }; // Already initialized
  }
  
  try {
    // Force MySQL - no PostgreSQL/SQLite fallback
    console.log('🐬 Initializing MySQL connection for models...');
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required for MySQL configuration');
    }
    
    const dbModule = await import('./db-mysql.js');
    db = dbModule.default;
    dbType = 'mysql';
    console.log('✅ MySQL database loaded for models');
    
    return { db, dbType };
  } catch (error) {
    console.error('❌ MySQL connection failed for models:', error.message);
    console.error('🔧 Ensure DATABASE_URL is properly set and MySQL is accessible');
    throw error; // Don't fall back to SQLite
  }
}

// Get database instance
export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

// Get database type
export function getDatabaseType() {
  return dbType;
}