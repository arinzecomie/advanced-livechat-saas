import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const parseDatabaseUrl = (databaseUrl) => {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required for PostgreSQL');
  }
  
  const url = new URL(databaseUrl);
  return {
    user: url.username,
    password: url.password,
    host: url.hostname,
    port: url.port || 5432,
    database: url.pathname.slice(1), // Remove leading slash
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  };
};

export default {
  development: {
    client: 'postgresql',
    connection: process.env.DATABASE_URL ? parseDatabaseUrl(process.env.DATABASE_URL) : {
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: 'postgres',
      database: 'livechat_development'
    },
    migrations: {
      directory: join(__dirname, 'migrations'),
      extension: 'js'
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
      extension: 'js'
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