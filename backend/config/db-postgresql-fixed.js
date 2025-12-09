/**
 * 🐘 PostgreSQL Database Configuration for Railway
 * Production-ready PostgreSQL connection with Railway integration
 * Uses DATABASE_URL environment variable
 */

import knex from 'knex';

// Simple DATABASE_URL parsing without external dependencies
function parseDatabaseUrl(databaseUrl) {
  try {
    const url = new URL(databaseUrl);
    return {
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      database: url.pathname.slice(1), // Remove leading slash
      user: url.username,
      password: url.password,
      ssl: { rejectUnauthorized: false }
    };
  } catch (error) {
    console.error('❌ Failed to parse DATABASE_URL:', error.message);
    throw error;
  }
}

// Parse DATABASE_URL for Railway PostgreSQL
function getPostgreSQLConfig() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.log('⚠️  DATABASE_URL not found, falling back to individual PG variables');
    return {
      client: 'postgresql',
      connection: {
        host: process.env.PGHOST || 'localhost',
        port: process.env.PGPORT || 5432,
        database: process.env.PGDATABASE || 'railway',
        user: process.env.PGUSER || 'postgres',
        password: process.env.PGPASSWORD || 'password',
        ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false
      },
      migrations: {
        directory: './migrations',
        tableName: 'knex_migrations'
      },
      seeds: {
        directory: './seeds'
      },
      pool: {
        min: 2,
        max: 10
      }
    };
  }

  try {
    // Parse Railway DATABASE_URL
    const parsed = parseDatabaseUrl(databaseUrl);
    
    return {
      client: 'postgresql',
      connection: {
        host: parsed.host || 'localhost',
        port: parsed.port || 5432,
        database: parsed.database || 'railway',
        user: parsed.user || 'postgres',
        password: parsed.password || 'password',
        ssl: parsed.ssl || { rejectUnauthorized: false }
      },
      migrations: {
        directory: './migrations',
        tableName: 'knex_migrations'
      },
      seeds: {
        directory: './seeds'
      },
      pool: {
        min: 2,
        max: 20
      }
    };
  } catch (error) {
    console.error('❌ Failed to parse DATABASE_URL:', error.message);
    throw error;
  }
}

const db = knex(getPostgreSQLConfig());

// Test connection and initialize
db.raw('SELECT 1').then(() => {
  console.log('✅ PostgreSQL database connected');
  initializePostgreSQL();
}).catch(err => {
  console.error('❌ PostgreSQL connection failed:', err.message);
  console.log('🔄 Falling back to SQLite...');
  // Let the application continue with SQLite fallback
  process.env.FALLBACK_TO_SQLITE = 'true';
});

// Initialize PostgreSQL tables
async function initializePostgreSQL() {
  try {
    console.log('🔧 Initializing PostgreSQL database...');
    
    // Check if users table exists
    const tables = await db.raw(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    const tableNames = tables.rows ? tables.rows.map(t => t.table_name) : [];
    
    console.log('📊 Current tables:', tableNames);
    
    // Create tables if not exist
    await createTableIfNotExists('users', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.string('email').notNullable().unique();
      table.string('password_hash').notNullable();
      table.enum('role', ['user', 'admin']).defaultTo('user');
      table.timestamps(true, true);
    });
    
    await createTableIfNotExists('sites', (table) => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
      table.string('site_id').notNullable().unique();
      table.string('domain').notNullable();
      table.enum('status', ['trial', 'active', 'suspended']).defaultTo('trial');
      table.timestamps(true, true);
    });
    
    await createTableIfNotExists('visitors', (table) => {
      table.increments('id').primary();
      table.integer('site_id').unsigned().references('id').inTable('sites').onDelete('CASCADE');
      table.string('visitor_id').notNullable();
      table.string('fingerprint');
      table.string('ip_address');
      table.string('user_agent');
      table.string('country', 2);
      table.string('city', 100);
      table.jsonb('device_info');
      table.jsonb('last_pages');
      table.timestamps(true, true);
    });
    
    await createTableIfNotExists('payments', (table) => {
      table.increments('id').primary();
      table.integer('site_id').unsigned().references('id').inTable('sites').onDelete('CASCADE');
      table.decimal('amount', 10, 2).notNullable();
      table.string('currency', 3).defaultTo('USD');
      table.enum('status', ['pending', 'completed', 'failed']).defaultTo('pending');
      table.dateTime('expires_at');
      table.timestamps(true, true);
    });
    
    // Insert default users if not exist
    await insertDefaultUsers();
    
    console.log('🎉 PostgreSQL initialization completed!');
    
  } catch (error) {
    console.error('❌ PostgreSQL initialization failed:', error.message);
    console.log('🔄 Falling back to SQLite...');
    process.env.FALLBACK_TO_SQLITE = 'true';
  }
}

// Helper function to create table if not exists
async function createTableIfNotExists(tableName, tableBuilder) {
  try {
    const exists = await db.schema.hasTable(tableName);
    if (!exists) {
      console.log(`❌ ${tableName} table missing, creating...`);
      await db.schema.createTable(tableName, tableBuilder);
      console.log(`✅ ${tableName} table created`);
    } else {
      console.log(`✅ ${tableName} table exists`);
    }
  } catch (error) {
    console.error(`❌ ${tableName} table creation failed:`, error.message);
  }
}

// Insert default users
async function insertDefaultUsers() {
  try {
    console.log('👤 Inserting default PostgreSQL users...');
    
    const bcrypt = await import('bcryptjs');
    const adminPassword = bcrypt.hashSync('admin123', 10);
    const userPassword = bcrypt.hashSync('user123', 10);
    
    // Insert admin user
    await db('users').insert({
      name: 'Admin User',
      email: 'admin@example.com',
      password_hash: adminPassword,
      role: 'admin'
    }).onConflict('email').ignore();
    
    // Insert demo user
    await db('users').insert({
      name: 'Demo User',
      email: 'demo@example.com',
      password_hash: userPassword,
      role: 'user'
    }).onConflict('email').ignore();
    
    // Insert default sites
    const adminUser = await db('users').where('email', 'admin@example.com').first();
    if (adminUser) {
      await db('sites').insert([
        {
          user_id: adminUser.id,
          site_id: 'demo-site-id',
          domain: 'demo-site.com',
          status: 'active'
        },
        {
          user_id: adminUser.id,
          site_id: 'suspended-site-id',
          domain: 'suspended-site.com',
          status: 'suspended'
        }
      ]).onConflict('site_id').ignore();
      
      console.log('✅ Default PostgreSQL users inserted');
    }
    
  } catch (error) {
    console.error('❌ Default PostgreSQL user insertion failed:', error.message);
  }
}

export default db;