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
  console.log('🐬 FORCE_MYSQL:', process.env.FORCE_MYSQL);
  console.log('🐘 FORCE_POSTGRESQL:', process.env.FORCE_POSTGRESQL);
  
  // If FORCE_MYSQL is set, use MySQL
  if (process.env.FORCE_MYSQL === 'true') {
    console.log('🐬 Using MySQL (forced)');
    try {
      const db = await import('./db-mysql.js');
      console.log('✅ MySQL database initialized');
      return { db, type: 'mysql' };
    } catch (error) {
      console.error('❌ MySQL initialization failed:', error.message);
      console.log('💾 Falling back to SQLite...');
      return await initializeSQLite();
    }
  }
  
  // If DATABASE_URL is set and looks like MySQL, use MySQL
  if (databaseUrl && databaseUrl.startsWith('mysql://')) {
    console.log('🐬 Using MySQL with DATABASE_URL');
    try {
      const db = await import('./db-mysql.js');
      console.log('✅ MySQL database initialized');
      return { db, type: 'mysql' };
    } catch (error) {
      console.error('❌ MySQL initialization failed:', error.message);
      console.log('💾 Falling back to SQLite...');
      return await initializeSQLite();
    }
  }
  
  // If MYSQL_URL is set, use MySQL
  if (process.env.MYSQL_URL) {
    console.log('🐬 Using MySQL with MYSQL_URL');
    try {
      const db = await import('./db-mysql.js');
      console.log('✅ MySQL database initialized');
      return { db, type: 'mysql' };
    } catch (error) {
      console.error('❌ MySQL initialization failed:', error.message);
      console.log('💾 Falling back to SQLite...');
      return await initializeSQLite();
    }
  }
  
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