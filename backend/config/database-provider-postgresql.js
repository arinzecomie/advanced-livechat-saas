/**
 * 🐘 PostgreSQL Database Provider
 * Forces PostgreSQL usage, removes SQLite fallback
 */

let db = null;
let dbType = 'unknown';

// Initialize database (this should be called once by server.js)
export async function initializeDatabase() {
  if (db) {
    return { db, dbType }; // Already initialized
  }
  
  try {
    // Force PostgreSQL - no SQLite fallback
    console.log('🐘 Initializing PostgreSQL connection for models...');
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required for PostgreSQL configuration');
    }
    
    const dbModule = await import('./db-postgresql-fixed.js');
    db = dbModule.default;
    dbType = 'postgresql';
    console.log('✅ PostgreSQL database loaded for models');
    
    return { db, dbType };
  } catch (error) {
    console.error('❌ PostgreSQL connection failed for models:', error.message);
    console.error('🔧 Ensure DATABASE_URL is properly set and PostgreSQL is accessible');
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