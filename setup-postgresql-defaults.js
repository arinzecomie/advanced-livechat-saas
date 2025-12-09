#!/usr/bin/env node

/**
 * 🌱 PostgreSQL Default Data Setup
 * Creates PostgreSQL database with default data (no SQLite migration needed)
 */

const { Client } = require('pg');
const bcrypt = require('bcryptjs');

console.log('🌱 PostgreSQL Default Data Setup');
console.log('==================================');

// Configuration
const POSTGRESQL_URL = process.env.DATABASE_URL || 
  'postgresql://postgres:password@localhost:5432/advanced_livechat_dev';

console.log('📋 Configuration:');
console.log('  PostgreSQL URL:', POSTGRESQL_URL.replace(/:[^:@]+@/, ':***@')); // Hide password

// Connect to PostgreSQL
const client = new Client({
  connectionString: POSTGRESQL_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function setupPostgreSQL() {
  try {
    console.log('\n🔗 Connecting to PostgreSQL...');
    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    // Create tables
    console.log('\n🏗️ Creating PostgreSQL tables...');
    await createTables();

    // Insert default data
    console.log('\n👤 Inserting default users...');
    await insertDefaultUsers();

    console.log('\n🌐 Inserting default sites...');
    await insertDefaultSites();

    console.log('\n✅ PostgreSQL setup completed successfully!');

  } catch (error) {
    console.error('❌ PostgreSQL setup failed:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('  1. Ensure PostgreSQL is running');
    console.error('  2. Check DATABASE_URL format');
    console.error('  3. Verify database exists');
    console.error('  4. Check user permissions');
    process.exit(1);
  } finally {
    await client.end();
  }
}

async function createTables() {
  // Users table
  await client.query(`
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
  await client.query(`
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
  await client.query(`
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
  await client.query(`
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

  // Knex migrations table
  await client.query(`
    CREATE TABLE IF NOT EXISTS knex_migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255),
      batch INTEGER,
      migration_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('✅ PostgreSQL tables created');
}

async function insertDefaultUsers() {
  // Hash passwords
  const adminPassword = bcrypt.hashSync('admin123', 10);
  const userPassword = bcrypt.hashSync('user123', 10);

  // Insert admin user
  const adminResult = await client.query(`
    INSERT INTO users (name, email, password_hash, role, status, plan, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
    ON CONFLICT (email) DO NOTHING
    RETURNING id
  `, ['Admin User', 'admin@example.com', adminPassword, 'admin', 'active', 'free']);

  // Insert demo user
  const userResult = await client.query(`
    INSERT INTO users (name, email, password_hash, role, status, plan, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
    ON CONFLICT (email) DO NOTHING
    RETURNING id
  `, ['Demo User', 'demo@example.com', userPassword, 'user', 'active', 'free']);

  if (adminResult.rows.length > 0) {
    console.log('✅ Admin user created: admin@example.com');
  } else {
    console.log('⚠️  Admin user already exists');
  }

  if (userResult.rows.length > 0) {
    console.log('✅ Demo user created: demo@example.com');
  } else {
    console.log('⚠️  Demo user already exists');
  }
}

async function insertDefaultSites() {
  // Get admin user ID
  const adminResult = await client.query("SELECT id FROM users WHERE email = 'admin@example.com'");
  
  if (adminResult.rows.length === 0) {
    console.log('❌ Admin user not found, skipping sites creation');
    return;
  }

  const adminId = adminResult.rows[0].id;

  // Insert demo sites
  const sitesResult = await client.query(`
    INSERT INTO sites (user_id, site_id, domain, status, verified, created_at, updated_at)
    VALUES 
      ($1, $2, $3, $4, $5, NOW(), NOW()),
      ($1, $6, $7, $8, $9, NOW(), NOW())
    ON CONFLICT (site_id) DO NOTHING
    RETURNING id
  `, [
    adminId,
    'demo-site-id', 'demo-site.com', 'active', false,
    'suspended-site-id', 'suspended-site.com', 'suspended', false
  ]);

  if (sitesResult.rows.length > 0) {
    console.log('✅ Demo sites created');
  } else {
    console.log('⚠️  Demo sites already exist');
  }
}

// Execute setup
setupPostgreSQL().then(() => {
  console.log('\n🎉 PostgreSQL setup completed successfully!');
  console.log('\n📋 Summary:');
  console.log('  ✅ Tables created');
  console.log('  ✅ Default users inserted');
  console.log('  ✅ Demo sites configured');
  console.log('\n🎯 Test credentials:');
  console.log('  Admin: admin@example.com / admin123');
  console.log('  Demo: demo@example.com / user123');
  console.log('\n🚀 Your PostgreSQL database is ready!');
  console.log('\n📋 Next steps:');
  console.log('1. Test the application locally');
  console.log('2. Deploy to Railway with PostgreSQL');
  console.log('3. Monitor performance and logs');
}).catch((error) => {
  console.error('❌ PostgreSQL setup failed:', error.message);
  process.exit(1);
});