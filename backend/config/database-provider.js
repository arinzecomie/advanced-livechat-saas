/**
 * 🐬 MySQL Database Provider
 * Forces MySQL usage, removes PostgreSQL/SQLite fallback
 */

let db = null;
let dbType = 'unknown';

// Initialize database (this should be called once by server.js)
export async function initializeDatabase() {
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