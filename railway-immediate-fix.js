#!/usr/bin/env node

/**
 * 🚂 Railway Immediate Database Fix
 * Executes SQL directly to create missing tables
 */

const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

console.log('🚂 Railway Immediate Database Fix');
console.log('📅 Starting at:', new Date().toISOString());

// Database path (Railway location)
const dbPath = path.join(process.cwd(), 'backend', 'dev.sqlite3');

console.log('📁 Database path:', dbPath);
console.log('📂 Current working directory:', process.cwd());

// Check if database file exists
const fs = require('fs');
if (fs.existsSync(dbPath)) {
  console.log('✅ Database file exists');
  const stats = fs.statSync(dbPath);
  console.log('📊 Database size:', stats.size, 'bytes');
} else {
  console.log('❌ Database file does not exist, will create');
}

// Connect to database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to Railway SQLite database');
});

// Function to execute SQL
function executeSQL(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        console.error('❌ SQL Error:', err.message);
        console.error('   SQL:', sql.substring(0, 100));
        reject(err);
      } else {
        console.log('✅ SQL executed successfully');
        console.log('   Rows affected:', this.changes);
        resolve(this);
      }
    });
  });
}

// Function to query database
function querySQL(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('❌ Query Error:', err.message);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Main database fix function
async function fixRailwayDatabase() {
  try {
    console.log('\n🔧 Starting Railway database fix...');
    
    // Check current tables
    console.log('📊 Checking current tables...');
    const tables = await querySQL("SELECT name FROM sqlite_master WHERE type='table'");
    console.log('Current tables:', tables.map(t => t.name));
    
    // Check if users table exists
    const hasUsersTable = tables.some(t => t.name === 'users');
    
    if (hasUsersTable) {
      console.log('✅ Users table exists');
      
      // Check if admin user exists
      const adminUser = await querySQL("SELECT * FROM users WHERE email = 'admin@example.com'");
      if (adminUser.length > 0) {
        console.log('✅ Admin user exists:', adminUser[0]);
      } else {
        console.log('❌ Admin user missing, will create');
      }
    } else {
      console.log('❌ Users table missing, will create');
    }
    
    // Create users table
    console.log('\n🔨 Creating users table...');
    await executeSQL(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create sites table
    console.log('\n🔨 Creating sites table...');
    await executeSQL(`
      CREATE TABLE IF NOT EXISTS sites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        site_id TEXT NOT NULL UNIQUE,
        domain TEXT NOT NULL,
        status TEXT DEFAULT 'trial' CHECK(status IN ('trial', 'active', 'suspended')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // Create visitors table
    console.log('\n🔨 Creating visitors table...');
    await executeSQL(`
      CREATE TABLE IF NOT EXISTS visitors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        site_id INTEGER,
        visitor_id TEXT NOT NULL,
        fingerprint TEXT,
        ip_address TEXT,
        user_agent TEXT,
        country TEXT,
        city TEXT,
        device_info TEXT,
        last_pages TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
      )
    `);
    
    // Create payments table
    console.log('\n🔨 Creating payments table...');
    await executeSQL(`
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        site_id INTEGER,
        amount DECIMAL(10,2) NOT NULL,
        currency TEXT DEFAULT 'USD',
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'failed')),
        expires_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
      )
    `);
    
    // Insert default admin user
    console.log('\n👤 Inserting default admin user...');
    const adminPassword = bcrypt.hashSync('admin123', 10);
    await executeSQL(`
      INSERT OR IGNORE INTO users (name, email, password_hash, role) 
      VALUES ('Admin User', 'admin@example.com', ?, 'admin')
    `, [adminPassword]);
    
    // Insert demo user
    console.log('\n👤 Inserting demo user...');
    const userPassword = bcrypt.hashSync('user123', 10);
    await executeSQL(`
      INSERT OR IGNORE INTO users (name, email, password_hash, role) 
      VALUES ('Demo User', 'demo@example.com', ?, 'user')
    `, [userPassword]);
    
    // Insert default sites
    console.log('\n🌐 Inserting default sites...');
    await executeSQL(`
      INSERT OR IGNORE INTO sites (user_id, site_id, domain, status) 
      SELECT id, 'demo-site-id', 'demo-site.com', 'active' FROM users WHERE email = 'admin@example.com'
    `);
    
    await executeSQL(`
      INSERT OR IGNORE INTO sites (user_id, site_id, domain, status) 
      SELECT id, 'suspended-site-id', 'suspended-site.com', 'suspended' FROM users WHERE email = 'admin@example.com'
    `);
    
    // Verify final data
    console.log('\n✅ Verifying final data...');
    const userCount = await querySQL("SELECT COUNT(*) as count FROM users");
    const siteCount = await querySQL("SELECT COUNT(*) as count FROM sites");
    const adminUser = await querySQL("SELECT id, email, name, role FROM users WHERE email = 'admin@example.com'");
    
    console.log('📊 Final results:');
    console.log('   Users count:', userCount[0]?.count || 0);
    console.log('   Sites count:', siteCount[0]?.count || 0);
    console.log('   Admin user:', adminUser[0] || 'Not found');
    
    if (adminUser.length > 0) {
      console.log('\n🎉 Railway database fix completed successfully!');
      console.log('✅ Admin login should now work:');
      console.log('   Email: admin@example.com');
      console.log('   Password: admin123');
      return true;
    } else {
      console.log('\n❌ Admin user not found after fix');
      return false;
    }
    
  } catch (error) {
    console.error('\n❌ Railway database fix failed:', error.message);
    return false;
  } finally {
    db.close(() => {
      console.log('✅ Database connection closed');
    });
  }
}

// Execute the fix
console.log('\n🚀 Executing Railway database fix...');
fixRailwayDatabase().then(success => {
  if (success) {
    console.log('\n🎉 SUCCESS: Railway database has been fixed!');
    console.log('🧪 Test login with:');
    console.log('   Email: admin@example.com');
    console.log('   Password: admin123');
    console.log('\n🌐 Test URLs:');
    console.log('   Health: https://talkavax-production.up.railway.app/health');
    console.log('   Login: https://talkavax-production.up.railway.app/api/auth/login');
    console.log('   Dashboard: https://talkavax-production.up.railway.app/dashboard');
    process.exit(0);
  } else {
    console.log('\n❌ FAILED: Railway database fix was not successful');
    process.exit(1);
  }
}).catch(error => {
  console.error('\n💥 UNEXPECTED ERROR:', error.message);
  process.exit(1);
});