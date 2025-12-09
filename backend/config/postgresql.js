import { Pool } from 'pg';
import pkg from 'pg-connection-string';
const { parse } = pkg;

const parseDatabaseUrl = (databaseUrl) => {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required for PostgreSQL');
  }
  
  const config = parse(databaseUrl);
  
  return {
    ...config,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
};

const pool = new Pool(parseDatabaseUrl(process.env.DATABASE_URL));

// Test connection
pool.on('connect', () => {
  console.log('✅ PostgreSQL database connected');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL connection error:', err);
  process.exit(-1);
});

export default pool;

export const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
};

export const getClient = async () => {
  return await pool.connect();
};