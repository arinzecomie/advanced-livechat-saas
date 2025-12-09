/**
 * 🔄 Database Fallback Configuration
 * Automatically chooses between PostgreSQL and SQLite based on environment
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine which database to use
function getDatabaseConfig() {
  const databaseUrl = process.env.DATABASE_URL;
  
  // If DATABASE_URL is set and looks like PostgreSQL, use PostgreSQL
  if (databaseUrl && databaseUrl.startsWith('postgresql://')) {
    console.log('🐘 Using PostgreSQL with DATABASE_URL');
    return 'postgresql';
  }
  
  // If PGHOST is set, use PostgreSQL with individual variables
  if (process.env.PGHOST) {
    console.log('🐘 Using PostgreSQL with individual PG variables');
    return 'postgresql';
  }
  
  // Otherwise, fall back to SQLite
  console.log('💾 Using SQLite fallback');
  return 'sqlite';
}

// SQLite configuration
const sqliteConfig = {
  client: 'sqlite3',
  connection: {
    filename: path.join(__dirname, '..', 'dev.sqlite3')
  },
  migrations: {
    directory: path.join(__dirname, '..', 'migrations'),
    tableName: 'knex_migrations'
  },
  seeds: {
    directory: path.join(__dirname, '..', 'seeds')
  },
  useNullAsDefault: true,
  pool: {
    min: 1,
    max: 5
  }
};

// PostgreSQL configuration using DATABASE_URL
const postgresqlConfig = {
  client: 'postgresql',
  connection: process.env.DATABASE_URL || {
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    database: process.env.PGDATABASE || 'railway',
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'password',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  },
  migrations: {
    directory: path.join(__dirname, '..', 'migrations'),
    tableName: 'knex_migrations'
  },
  seeds: {
    directory: path.join(__dirname, '..', 'seeds')
  },
  pool: {
    min: 2,
    max: 10
  }
};

// Export the appropriate configuration
const dbType = getDatabaseConfig();
let db;

if (dbType === 'postgresql') {
  try {
    // Try to use the PostgreSQL configuration
    db = await import('./db-postgresql-fixed.js');
    console.log('✅ PostgreSQL database loaded');
  } catch (error) {
    console.error('❌ PostgreSQL failed, falling back to SQLite:', error.message);
    db = await import('./db-sqlite.js');
    console.log('✅ SQLite database loaded as fallback');
  }
} else {
  // Use SQLite
  db = await import('./db-sqlite.js');
  console.log('✅ SQLite database loaded');
}

export default db;