import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const parseDatabaseUrl = (databaseUrl) => {
  if (!databaseUrl) {
    console.log('⚠️  DATABASE_URL not provided, using fallback configuration');
    return null;
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
    return null;
  }
};

export default {
  development: {
    client: 'sqlite3',
    connection: {
      filename: join(__dirname, 'dev.sqlite3')
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
      min: 1,
      max: 5
    },
    useNullAsDefault: true
  },

  production: {
    client: process.env.DATABASE_URL ? 'postgresql' : 'sqlite3',
    connection: process.env.DATABASE_URL ? parseDatabaseUrl(process.env.DATABASE_URL) : {
      filename: join(__dirname, 'dev.sqlite3')
    },
    migrations: {
      directory: join(__dirname, 'migrations'),
      extension: 'js'
    },
    seeds: {
      directory: join(__dirname, 'seeds'),
      extension: 'js'
    },
    pool: process.env.DATABASE_URL ? {
      min: 2,
      max: 20
    } : {
      min: 1,
      max: 5
    },
    useNullAsDefault: !process.env.DATABASE_URL
  }
};