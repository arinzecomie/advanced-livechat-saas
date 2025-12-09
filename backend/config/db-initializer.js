/**
 * 🔄 Database Initializer
 * Properly initializes the correct database based on environment
 */

import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine which database to use and initialize only that one
export async function initializeDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  
  console.log('🔧 Initializing database...');
  console.log('📊 DATABASE_URL:', databaseUrl ? 'SET' : 'NOT SET');
  
  // If DATABASE_URL is set and looks like PostgreSQL, use PostgreSQL
  if (databaseUrl && databaseUrl.startsWith('postgresql://')) {
    console.log('🐘 Using PostgreSQL with DATABASE_URL');
    try {
      const db = await import('./db-postgresql-fixed.js');
      console.log('✅ PostgreSQL database initialized');
      return { db, type: 'postgresql' };
    } catch (error) {
      console.error('❌ PostgreSQL initialization failed:', error.message);
      console.log('💾 Falling back to SQLite...');
      return await initializeSQLite();
    }
  }
  
  // If PGHOST is set, use PostgreSQL with individual variables
  if (process.env.PGHOST) {
    console.log('🐘 Using PostgreSQL with individual PG variables');
    try {
      const db = await import('./db-postgresql-fixed.js');
      console.log('✅ PostgreSQL database initialized');
      return { db, type: 'postgresql' };
    } catch (error) {
      console.error('❌ PostgreSQL initialization failed:', error.message);
      console.log('💾 Falling back to SQLite...');
      return await initializeSQLite();
    }
  }
  
  // Otherwise, use SQLite
  console.log('💾 Using SQLite fallback');
  return await initializeSQLite();
}

async function initializeSQLite() {
  try {
    const db = await import('./db-sqlite.js');
    console.log('✅ SQLite database initialized');
    return { db, type: 'sqlite' };
  } catch (error) {
    console.error('❌ SQLite initialization failed:', error.message);
    throw error;
  }
}