/**
 * 💾 SQLite Database Configuration
 * Fallback database when PostgreSQL is not available
 */

import knex from 'knex';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = knex({
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
});

// Test connection and initialize
db.raw('SELECT 1').then(() => {
  console.log('✅ SQLite database connected');
  initializeSQLite();
}).catch(err => {
  console.error('❌ SQLite connection failed:', err);
});

// Initialize SQLite tables
async function initializeSQLite() {
  try {
    console.log('🔧 Initializing SQLite database...');
    
    // Check if users table exists
    const tables = await db.raw("SELECT name FROM sqlite_master WHERE type='table'");
    const tableNames = tables.map(t => t.name);
    
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
      table.json('device_info');
      table.json('last_pages');
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
    
    console.log('🎉 SQLite initialization completed!');
    
  } catch (error) {
    console.error('❌ SQLite initialization failed:', error.message);
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
    console.log('👤 Inserting default SQLite users...');
    
    let bcrypt;
    try {
      bcrypt = await import('bcryptjs');
    } catch (importError) {
      console.error('❌ Failed to import bcryptjs:', importError.message);
      return;
    }
    
    const bcryptModule = bcrypt.default || bcrypt;
    const adminPassword = bcryptModule.hashSync('admin123', 10);
    const userPassword = bcryptModule.hashSync('user123', 10);
    
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
      
      console.log('✅ Default SQLite users inserted');
    }
    
  } catch (error) {
    console.error('❌ Default SQLite user insertion failed:', error.message);
  }
}

export default db;