/**
 * 🐬 MySQL-Only Knex Configuration
 * Forces MySQL usage, removes PostgreSQL/SQLite fallback
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse database URL for MySQL
const parseDatabaseUrl = (databaseUrl) => {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required for MySQL configuration');
  }
  
  try {
    const url = new URL(databaseUrl);
    return {
      user: url.username,
      password: url.password,
      host: url.hostname,
      port: url.port || 3306,
      database: url.pathname.slice(1), // Remove leading slash
      ssl: process.env.NODE_ENV === 'production' ? false : false // MySQL typically doesn't use SSL internally
    };
  } catch (error) {
    console.error('❌ Failed to parse DATABASE_URL:', error.message);
    throw error;
  }
};

export default {
  development: {
    client: 'mysql2',
    connection: process.env.DATABASE_URL ? parseDatabaseUrl(process.env.DATABASE_URL) : {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      database: process.env.DB_NAME || 'advanced_livechat_dev',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'password',
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
    client: 'mysql2',
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