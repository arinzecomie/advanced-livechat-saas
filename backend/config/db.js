/**
 * Database configuration - Knex instance for SQLite
 * Provides SQL database connection for users, sites, payments, visitors
 */
import knex from 'knex';
import knexConfig from '../knexfile.js';

const environment = process.env.NODE_ENV || 'development';
const config = knexConfig[environment];

const db = knex(config);

// Test connection
db.raw('SELECT 1').then(() => {
  console.log('✅ SQLite database connected');
}).catch(err => {
  console.error('❌ Database connection failed:', err);
});

export default db;