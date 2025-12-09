/**
 * 🐘 PostgreSQL-Only Knex Configuration
 * Forces PostgreSQL usage, removes SQLite fallback
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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

export default {
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