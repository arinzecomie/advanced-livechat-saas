/**
 * 🐬 MySQL Database Configuration
 * Production-ready MySQL connection with Railway integration
 */

import knex from 'knex';

// Parse database URL for MySQL
const parseDatabaseUrl = (databaseUrl) => {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required for MySQL configuration');
  }
  
  try {
    const url = new URL(databaseUrl);
    return {
      host: url.hostname,
      port: parseInt(url.port) || 3306,
      database: url.pathname.slice(1), // Remove leading slash
      user: url.username,
      password: url.password,
      ssl: process.env.NODE_ENV === 'production' ? false : false // MySQL typically doesn't use SSL internally
    };
  } catch (error) {
    console.error('❌ Failed to parse DATABASE_URL:', error.message);
    throw error;
  }
};

// Parse DATABASE_URL for Railway MySQL
function getMySQLConfig() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.log('⚠️  DATABASE_URL not found, using individual MySQL variables');
    return {
      client: 'mysql2',
      connection: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        database: process.env.DB_NAME || 'advanced_livechat',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'password',
        ssl: false
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
  }

  try {
    // Parse Railway DATABASE_URL
    const parsed = parseDatabaseUrl(databaseUrl);
    
    return {
      client: 'mysql2',
      connection: {
        host: parsed.host || 'localhost',
        port: parsed.port || 3306,
        database: parsed.database || 'railway',
        user: parsed.user || 'root',
        password: parsed.password || 'password',
        ssl: parsed.ssl || false
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

const db = knex(getMySQLConfig());

// Test connection and initialize
db.raw('SELECT 1').then(() => {
  console.log('✅ MySQL database connected');
  initializeMySQL();
}).catch(err => {
  console.error('❌ MySQL connection failed:', err.message);
  console.log('🔄 Falling back to SQLite...');
  // Let the application continue with SQLite fallback
  process.env.FALLBACK_TO_SQLITE = 'true';
});

// Initialize MySQL tables
async function initializeMySQL() {
  try {
    console.log('🔧 Initializing MySQL database...');
    
    // Check if users table exists
    const tables = await db.raw(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = DATABASE()
    `);
    const tableNames = tables[0] ? tables[0].map(t => t.table_name) : [];
    
    console.log('📊 Current tables:', tableNames);
    
    // Create tables if not exist
    await createTableIfNotExists('users', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.string('email').notNullable().unique();
      table.string('password_hash').notNullable();
      table.enum('role', ['user', 'admin']).defaultTo('user');
      table.enum('status', ['active', 'inactive']).defaultTo('active');
      table.enum('plan', ['free', 'pro', 'enterprise']).defaultTo('free');
      table.string('avatar_url', 500);
      table.string('avatar_public_id', 255);
      table.json('notification_settings').defaultTo('{}');
      table.timestamps(true, true);
    });
    
    await createTableIfNotExists('sites', (table) => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
      table.string('site_id').notNullable().unique();
      table.string('domain').notNullable();
      table.enum('status', ['trial', 'active', 'suspended']).defaultTo('trial');
      table.boolean('verified').defaultTo(false);
      table.timestamps(true, true);
    });
    
    await createTableIfNotExists('visitors', (table) => {
      table.increments('id').primary();
      table.integer('site_id').unsigned().references('id').inTable('sites').onDelete('CASCADE');
      table.string('visitor_id').notNullable();
      table.string('fingerprint');
      table.string('fingerprint_hash').unique();
      table.string('ip_address');
      table.string('country', 2);
      table.string('city', 100);
      table.string('region', 100);
      table.string('timezone', 50);
      table.string('coordinates', 50);
      table.text('user_agent');
      table.json('device_info').defaultTo('{}');
      table.json('last_pages').defaultTo('[]');
      table.string('session_token', 64);
      table.string('current_page', 500);
      table.timestamp('last_seen');
      table.timestamps(true, true);
    });
    
    await createTableIfNotExists('payments', (table) => {
      table.increments('id').primary();
      table.integer('site_id').unsigned().references('id').inTable('sites').onDelete('CASCADE');
      table.decimal('amount', 10, 2).notNullable();
      table.string('currency', 3).defaultTo('USD');
      table.enum('status', ['pending', 'completed', 'failed']).defaultTo('pending');
      table.timestamp('expires_at');
      table.timestamps(true, true);
    });
    
    // Insert default users if not exist
    await insertDefaultUsers();
    
    console.log('🎉 MySQL initialization completed!');
    
  } catch (error) {
    console.error('❌ MySQL initialization failed:', error.message);
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
    console.log('👤 Inserting default MySQL users...');
    
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
      
      console.log('✅ Default MySQL users inserted');
    }
    
  } catch (error) {
    console.error('❌ Default MySQL user insertion failed:', error.message);
  }
}

export default db;