#!/usr/bin/env node

/**
 * 🔄 SQLite to PostgreSQL Migration Script
 * Migrates data from SQLite to PostgreSQL
 */

const sqlite3 = require('sqlite3').verbose();
const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

console.log('🔄 SQLite to PostgreSQL Migration');
console.log('==================================');

// Configuration
const SQLITE_DB_PATH = path.join(__dirname, 'backend', 'dev.sqlite3');
const POSTGRESQL_URL = process.env.DATABASE_URL || process.env.PGDATABASE_URL || 
  'postgresql://postgres:password@localhost:5432/advanced_livechat_dev';

console.log('📋 Migration Configuration:');
console.log('  SQLite DB:', SQLITE_DB_PATH);
console.log('  PostgreSQL URL:', POSTGRESQL_URL.replace(/:[^:@]+@/, ':***@')); // Hide password

// Check if SQLite database exists
if (!fs.existsSync(SQLITE_DB_PATH)) {
  console.log('⚠️  SQLite database not found at:', SQLITE_DB_PATH);
  console.log('🔄 Creating PostgreSQL database with default data instead...');
  createPostgreSQLWithDefaults();
  return;
}

// Connect to SQLite
const sqliteDb = new sqlite3.Database(SQLITE_DB_PATH, (err) => {
  if (err) {
    console.error('❌ SQLite connection failed:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to SQLite database');
});

// Connect to PostgreSQL
const pgClient = new Client({
  connectionString: POSTGRESQL_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function migrateData() {
  try {
    console.log('\n🔗 Connecting to PostgreSQL...');
    await pgClient.connect();
    console.log('✅ Connected to PostgreSQL');

    // Get SQLite data
    console.log('\n📊 Reading SQLite data...');
    
    const users = await getSQLiteData('SELECT * FROM users');
    const sites = await getSQLiteData('SELECT * FROM sites');
    const visitors = await getSQLiteData('SELECT * FROM visitors');
    const payments = await getSQLiteData('SELECT * FROM payments');

    console.log(`📈 SQLite data summary:`);
    console.log(`  Users: ${users.length}`);
    console.log(`  Sites: ${sites.length}`);
    console.log(`  Visitors: ${visitors.length}`);
    console.log(`  Payments: ${payments.length}`);

    // Create PostgreSQL tables
    console.log('\n🏗️ Creating PostgreSQL tables...');
    await createPostgreSQLTables();

    // Migrate data
    console.log('\n🔄 Migrating data to PostgreSQL...');
    
    await migrateUsers(users);
    await migrateSites(sites);
    await migrateVisitors(visitors);
    await migratePayments(payments);

    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    sqliteDb.close();
    await pgClient.end();
  }
}

// Get data from SQLite
function getSQLiteData(query) {
  return new Promise((resolve, reject) => {
    sqliteDb.all(query, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Create PostgreSQL tables
async function createPostgreSQLTables() {
  // Users table
  await pgClient.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
      status VARCHAR(50) DEFAULT 'active',
      plan VARCHAR(50) DEFAULT 'free',
      avatar_url VARCHAR(500),
      avatar_public_id VARCHAR(255),
      notification_settings JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Sites table
  await pgClient.query(`
    CREATE TABLE IF NOT EXISTS sites (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      site_id VARCHAR(255) NOT NULL UNIQUE,
      domain VARCHAR(255) NOT NULL,
      status VARCHAR(50) DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'suspended')),
      verified BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Visitors table
  await pgClient.query(`
    CREATE TABLE IF NOT EXISTS visitors (
      id SERIAL PRIMARY KEY,
      site_id INTEGER REFERENCES sites(id) ON DELETE CASCADE,
      visitor_id VARCHAR(255) NOT NULL,
      fingerprint VARCHAR(255),
      fingerprint_hash VARCHAR(64) UNIQUE,
      ip_address VARCHAR(45),
      country VARCHAR(2),
      city VARCHAR(100),
      region VARCHAR(100),
      timezone VARCHAR(50),
      coordinates VARCHAR(50),
      user_agent TEXT,
      device_info JSONB DEFAULT '{}',
      last_pages JSONB DEFAULT '[]',
      session_token VARCHAR(64),
      current_page VARCHAR(500),
      last_seen TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Payments table
  await pgClient.query(`
    CREATE TABLE IF NOT EXISTS payments (
      id SERIAL PRIMARY KEY,
      site_id INTEGER REFERENCES sites(id) ON DELETE CASCADE,
      amount DECIMAL(10,2) NOT NULL,
      currency VARCHAR(3) DEFAULT 'USD',
      status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
      expires_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('✅ PostgreSQL tables created');
}

// Migrate users
async function migrateUsers(users) {
  console.log(`🔄 Migrating ${users.length} users...`);
  
  for (const user of users) {
    try {
      await pgClient.query(`
        INSERT INTO users (id, name, email, password_hash, role, status, plan, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (email) DO UPDATE SET
          name = EXCLUDED.name,
          password_hash = EXCLUDED.password_hash,
          role = EXCLUDED.role,
          status = EXCLUDED.status,
          plan = EXCLUDED.plan,
          updated_at = EXCLUDED.updated_at
      `, [
        user.id,
        user.name,
        user.email,
        user.password_hash,
        user.role,
        user.status || 'active',
        user.plan || 'free',
        user.created_at,
        user.updated_at
      ]);
    } catch (error) {
      console.error(`❌ Failed to migrate user ${user.email}:`, error.message);
    }
  }
  
  console.log('✅ Users migrated');
}

// Migrate sites
async function migrateSites(sites) {
  console.log(`🔄 Migrating ${sites.length} sites...`);
  
  for (const site of sites) {
    try {
      await pgClient.query(`
        INSERT INTO sites (id, user_id, site_id, domain, status, verified, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (site_id) DO UPDATE SET
          user_id = EXCLUDED.user_id,
          domain = EXCLUDED.domain,
          status = EXCLUDED.status,
          verified = EXCLUDED.verified,
          updated_at = EXCLUDED.updated_at
      `, [
        site.id,
        site.user_id,
        site.site_id,
        site.domain,
        site.status,
        site.verified || false,
        site.created_at,
        site.updated_at
      ]);
    } catch (error) {
      console.error(`❌ Failed to migrate site ${site.domain}:`, error.message);
    }
  }
  
  console.log('✅ Sites migrated');
}

// Migrate visitors
async function migrateVisitors(visitors) {
  console.log(`🔄 Migrating ${visitors.length} visitors...`);
  
  for (const visitor of visitors) {
    try {
      await pgClient.query(`
        INSERT INTO visitors (id, site_id, visitor_id, fingerprint, fingerprint_hash, ip_address, 
                            country, city, region, timezone, coordinates, user_agent, device_info, 
                            last_pages, session_token, current_page, last_seen, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        ON CONFLICT (fingerprint_hash) DO UPDATE SET
          site_id = EXCLUDED.site_id,
          visitor_id = EXCLUDED.visitor_id,
          ip_address = EXCLUDED.ip_address,
          country = EXCLUDED.country,
          city = EXCLUDED.city,
          region = EXCLUDED.region,
          timezone = EXCLUDED.timezone,
          coordinates = EXCLUDED.coordinates,
          user_agent = EXCLUDED.user_agent,
          device_info = EXCLUDED.device_info,
          last_pages = EXCLUDED.last_pages,
          session_token = EXCLUDED.session_token,
          current_page = EXCLUDED.current_page,
          last_seen = EXCLUDED.last_seen,
          updated_at = EXCLUDED.updated_at
      `, [
        visitor.id,
        visitor.site_id,
        visitor.visitor_id,
        visitor.fingerprint,
        visitor.fingerprint_hash,
        visitor.ip_address,
        visitor.country,
        visitor.city,
        visitor.region,
        visitor.timezone,
        visitor.coordinates,
        visitor.user_agent,
        visitor.device_info || {},
        visitor.last_pages || [],
        visitor.session_token,
        visitor.current_page,
        visitor.last_seen,
        visitor.created_at,
        visitor.updated_at
      ]);
    } catch (error) {
      console.error(`❌ Failed to migrate visitor ${visitor.visitor_id}:`, error.message);
    }
  }
  
  console.log('✅ Visitors migrated');
}

// Migrate payments
async function migratePayments(payments) {
  console.log(`🔄 Migrating ${payments.length} payments...`);
  
  for (const payment of payments) {
    try {
      await pgClient.query(`
        INSERT INTO payments (id, site_id, amount, currency, status, expires_at, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          site_id = EXCLUDED.site_id,
          amount = EXCLUDED.amount,
          currency = EXCLUDED.currency,
          status = EXCLUDED.status,
          expires_at = EXCLUDED.expires_at,
          updated_at = EXCLUDED.updated_at
      `, [
        payment.id,
        payment.site_id,
        payment.amount,
        payment.currency || 'USD',
        payment.status,
        payment.expires_at,
        payment.created_at,
        payment.updated_at
      ]);
    } catch (error) {
      console.error(`❌ Failed to migrate payment ${payment.id}:`, error.message);
    }
  }
  
  console.log('✅ Payments migrated');
}

// Create PostgreSQL with defaults if no SQLite data
async function createPostgreSQLWithDefaults() {
  try {
    console.log('\n🏗️ Creating PostgreSQL database with default data...');
    
    const pgClient = new Client({
      connectionString: POSTGRESQL_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    
    await pgClient.connect();
    console.log('✅ Connected to PostgreSQL');
    
    // Create tables
    await createPostgreSQLTables();
    
    // Insert default data
    console.log('\n👤 Inserting default users...');
    
    const adminPassword = bcrypt.hashSync('admin123', 10);
    const userPassword = bcrypt.hashSync('user123', 10);
    
    // Insert admin user
    await pgClient.query(`
      INSERT INTO users (name, email, password_hash, role, status, plan, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      ON CONFLICT (email) DO NOTHING
    `, ['Admin User', 'admin@example.com', adminPassword, 'admin', 'active', 'free']);
    
    // Insert demo user
    await pgClient.query(`
      INSERT INTO users (name, email, password_hash, role, status, plan, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      ON CONFLICT (email) DO NOTHING
    `, ['Demo User', 'demo@example.com', userPassword, 'user', 'active', 'free']);
    
    // Get admin user ID
    const adminResult = await pgClient.query("SELECT id FROM users WHERE email = 'admin@example.com'");
    const adminId = adminResult.rows[0].id;
    
    // Insert demo sites
    console.log('\n🌐 Inserting default sites...');
    
    await pgClient.query(`
      INSERT INTO sites (user_id, site_id, domain, status, verified, created_at, updated_at)
      VALUES 
        ($1, $2, $3, $4, $5, NOW(), NOW()),
        ($1, $6, $7, $8, $9, NOW(), NOW())
      ON CONFLICT (site_id) DO NOTHING
    `, [
      adminId,
      'demo-site-id', 'demo-site.com', 'active', false,
      'suspended-site-id', 'suspended-site.com', 'suspended', false
    ]);
    
    console.log('✅ Default PostgreSQL data inserted');
    
    await pgClient.end();
    
    console.log('\n✅ PostgreSQL database created with default data!');
    console.log('\n🎯 Test credentials:');
    console.log('  Admin: admin@example.com / admin123');
    console.log('  Demo: demo@example.com / user123');
    
  } catch (error) {
    console.error('❌ Failed to create PostgreSQL with defaults:', error.message);
    process.exit(1);
  }
}

// Execute migration
migrateData().then(() => {
  console.log('\n🎉 Migration completed successfully!');
  console.log('\n📋 Next steps:');
  console.log('1. Update your .env file to use PostgreSQL DATABASE_URL');
  console.log('2. Test the application with PostgreSQL');
  console.log('3. Remove SQLite database files if migration is successful');
  console.log('4. Update your Railway deployment to use PostgreSQL-only configuration');
}).catch((error) => {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
});