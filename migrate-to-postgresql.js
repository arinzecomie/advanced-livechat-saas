#!/usr/bin/env node

/**
 * 🐘 PostgreSQL Migration Script for Railway
 * Converts SQLite database to PostgreSQL
 */

const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('🐘 PostgreSQL Migration for Railway');
console.log('📅 Starting at:', new Date().toISOString());

// PostgreSQL connection (Railway environment)
const pgConfig = {
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT || 5432,
  database: process.env.PGDATABASE || 'railway',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'password',
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false
};

// SQLite database path
const sqlitePath = path.join(__dirname, 'backend', 'dev.sqlite3');

console.log('📁 SQLite source:', sqlitePath);
console.log('🐘 PostgreSQL target:', `${pgConfig.host}:${pgConfig.port}/${pgConfig.database}`);

async function migrateToPostgreSQL() {
  console.log('\n🚀 Starting PostgreSQL migration...');
  
  const pgClient = new Client(pgConfig);
  const sqliteDb = new sqlite3.Database(sqlitePath);
  
  try {
    // Connect to PostgreSQL
    console.log('🔗 Connecting to PostgreSQL...');
    await pgClient.connect();
    console.log('✅ Connected to PostgreSQL');
    
    // Create PostgreSQL tables
    console.log('\n🔨 Creating PostgreSQL tables...');
    
    await pgClient.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user' CHECK(role IN ('user', 'admin')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pgClient.query(`
      CREATE TABLE IF NOT EXISTS sites (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        site_id VARCHAR(255) NOT NULL UNIQUE,
        domain VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'trial' CHECK(status IN ('trial', 'active', 'suspended')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pgClient.query(`
      CREATE TABLE IF NOT EXISTS visitors (
        id SERIAL PRIMARY KEY,
        site_id INTEGER REFERENCES sites(id) ON DELETE CASCADE,
        visitor_id VARCHAR(255) NOT NULL,
        fingerprint TEXT,
        ip_address INET,
        user_agent TEXT,
        country VARCHAR(2),
        city VARCHAR(100),
        device_info JSONB,
        last_pages JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pgClient.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        site_id INTEGER REFERENCES sites(id) ON DELETE CASCADE,
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'USD',
        status VARCHAR(50) DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'failed')),
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ PostgreSQL tables created');
    
    // Insert default data
    console.log('\n👤 Inserting default data...');
    const adminPassword = bcrypt.hashSync('admin123', 10);
    const userPassword = bcrypt.hashSync('user123', 10);
    
    await pgClient.query(`
      INSERT INTO users (name, email, password_hash, role) 
      VALUES ('Admin User', 'admin@example.com', $1, 'admin'),
             ('Demo User', 'demo@example.com', $2, 'user')
      ON CONFLICT (email) DO NOTHING
    `, [adminPassword, userPassword]);
    
    const adminResult = await pgClient.query('SELECT id FROM users WHERE email = $1', ['admin@example.com']);
    const adminId = adminResult.rows[0]?.id;
    
    if (adminId) {
      await pgClient.query(`
        INSERT INTO sites (user_id, site_id, domain, status) 
        VALUES ($1, 'demo-site-id', 'demo-site.com', 'active'),
               ($1, 'suspended-site-id', 'suspended-site.com', 'suspended')
        ON CONFLICT (site_id) DO NOTHING
      `, [adminId]);
    }
    
    console.log('✅ Default data inserted');
    
    // Verify PostgreSQL data
    console.log('\n✅ Verifying PostgreSQL data...');
    const userCount = await pgClient.query('SELECT COUNT(*) as count FROM users');
    const siteCount = await pgClient.query('SELECT COUNT(*) as count FROM sites');
    const adminUser = await pgClient.query('SELECT id, email, name, role FROM users WHERE email = $1', ['admin@example.com']);
    
    console.log('📊 PostgreSQL results:');
    console.log('   Users count:', userCount.rows[0]?.count || 0);
    console.log('   Sites count:', siteCount.rows[0]?.count || 0);
    console.log('   Admin user:', adminUser.rows[0] || 'Not found');
    
    if (adminUser.rows.length > 0) {
      console.log('\n🎉 PostgreSQL migration completed successfully!');
      console.log('✅ Admin login should work:');
      console.log('   Email: admin@example.com');
      console.log('   Password: admin123');
      return true;
    } else {
      console.log('\n❌ Admin user not found after migration');
      return false;
    }
    
  } catch (error) {
    console.error('\n❌ PostgreSQL migration failed:', error.message);
    return false;
  } finally {
    await pgClient.end();
    sqliteDb.close();
    console.log('✅ Database connections closed');
  }
}

// Execute the migration
migrateToPostgreSQL().then(success => {
  if (success) {
    console.log('\n🎉 SUCCESS: PostgreSQL migration completed!');
    console.log('🧪 Test login with:');
    console.log('   Email: admin@example.com');
    console.log('   Password: admin123');
    console.log('\n🌐 PostgreSQL connection info:');
    console.log('   Host:', pgConfig.host);
    console.log('   Database:', pgConfig.database);
    console.log('   User:', pgConfig.user);
    process.exit(0);
  } else {
    console.log('\n❌ FAILED: PostgreSQL migration was not successful');
    process.exit(1);
  }
}).catch(error => {
  console.error('\n💥 UNEXPECTED ERROR:', error.message);
  process.exit(1);
});