/**
 * 🐘 PostgreSQL Database Configuration
 * Forces PostgreSQL usage, removes SQLite fallback
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import knex from 'knex';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse database URL for PostgreSQL
const parseDatabaseUrl = (databaseUrl) => {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required for PostgreSQL configuration');
  }
  
  try {
    const url = new URL(databaseUrl);
    return {
      user: url.username,
      password: url.password,
      host: url.hostname,
      port: url.port || 5432,
      database: url.pathname.slice(1), // Remove leading slash
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    };
  } catch (error) {
    console.error('❌ Failed to parse DATABASE_URL:', error.message);
    throw error;
  }
};

// Database configuration - PostgreSQL only
const config = {
  development: {
    client: 'postgresql',
    connection: process.env.DATABASE_URL ? parseDatabaseUrl(process.env.DATABASE_URL) : {
      host: process.env.PGHOST || 'localhost',
      port: process.env.PGPORT || 5432,
      database: process.env.PGDATABASE || 'advanced_livechat_dev',
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'password',
      ssl: false
    },
    migrations: {
      directory: join(__dirname, 'migrations'),
      extension: 'js',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: join(__dirname, 'seeds'),
      extension: 'js'
    },
    pool: {
      min: 2,
      max: 10
    }
  },

  production: {
    client: 'postgresql',
    connection: parseDatabaseUrl(process.env.DATABASE_URL),
    migrations: {
      directory: join(__dirname, 'migrations'),
      extension: 'js',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: join(__dirname, 'seeds'),
      extension: 'js'
    },
    pool: {
      min: 2,
      max: 20
    }
  }
};

// Create and export database instance - respect MySQL environment variables
let db;

// If FORCE_MYSQL is set, don't use PostgreSQL
if (process.env.FORCE_MYSQL === 'true' || process.env.DISABLE_POSTGRESQL === 'true') {
  console.log('🐬 PostgreSQL disabled by environment variables, skipping PostgreSQL initialization');
  // Return a dummy object that will be replaced by the actual MySQL configuration
  db = {
    raw: () => Promise.resolve(),
    select: () => ({ from: () => Promise.resolve([]) }),
    insert: () => ({ into: () => Promise.resolve() }),
    update: () => ({ table: () => Promise.resolve() }),
    delete: () => ({ from: () => Promise.resolve() }),
    schema: {
      hasTable: () => Promise.resolve(false),
      createTable: () => Promise.resolve()
    }
  };
} else {
  // Only initialize PostgreSQL if not disabled
  const environment = process.env.NODE_ENV || 'development';
  
  // Check if we have the required PostgreSQL driver
  try {
    db = knex(config[environment]);
    console.log(`🔧 PostgreSQL configured for ${environment} environment`);
  } catch (error) {
    if (error.message.includes("Cannot find module 'pg'")) {
      console.log('🐬 PostgreSQL driver not available, skipping PostgreSQL initialization');
      // Return a dummy object that will be replaced by the actual MySQL configuration
      db = {
        raw: () => Promise.resolve(),
        select: () => ({ from: () => Promise.resolve([]) }),
        insert: () => ({ into: () => Promise.resolve() }),
        update: () => ({ table: () => Promise.resolve() }),
        delete: () => ({ from: () => Promise.resolve() }),
        schema: {
          hasTable: () => Promise.resolve(false),
          createTable: () => Promise.resolve()
        }
      };
    } else {
      throw error;
    }
  }
}

export default db;