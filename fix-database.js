#!/usr/bin/env node

/**
 * 🛠️ Database Fix Script for Railway
 * Checks and runs missing migrations
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

console.log('🔧 Railway Database Fix Script');

// Database path
const dbPath = path.join(__dirname, 'backend', 'dev.sqlite3');

console.log('📁 Checking database at:', dbPath);

// Check if database exists
if (!fs.existsSync(dbPath)) {
  console.log('❌ Database file not found. Creating new database...');
  // Database will be created when we connect
} else {
  console.log('✅ Database file exists');
}

// Connect to database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to SQLite database');
});

// Check if users table exists
function checkUsersTable() {
  return new Promise((resolve, reject) => {
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'", (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(!!row);
      }
    });
  });
}

// Create users table
function createUsersTable() {
  return new Promise((resolve, reject) => {
    const sql = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    db.run(sql, (err) => {
      if (err) {
        reject(err);
      } else {
        console.log('✅ Users table created/verified');
        resolve();
      }
    });
  });
}

// Create sites table
function createSitesTable() {
  return new Promise((resolve, reject) => {
    const sql = `
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
    `;
    
    db.run(sql, (err) => {
      if (err) {
        reject(err);
      } else {
        console.log('✅ Sites table created/verified');
        resolve();
      }
    });
  });
}

// Insert default admin user
function insertDefaultUsers() {
  return new Promise((resolve, reject) => {
    const bcrypt = require('bcryptjs');
    const adminPassword = bcrypt.hashSync('admin123', 10);
    const userPassword = bcrypt.hashSync('user123', 10);
    
    const sql = `
      INSERT OR IGNORE INTO users (name, email, password_hash, role) VALUES 
      ('Admin User', 'admin@example.com', ?, 'admin'),
      ('Demo User', 'demo@example.com', ?, 'user')
    `;
    
    db.run(sql, [adminPassword, userPassword], function(err) {
      if (err) {
        reject(err);
      } else {
        console.log('✅ Default users inserted/updated');
        resolve();
      }
    });
  });
}

// Check current tables
function listTables() {
  return new Promise((resolve, reject) => {
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
      if (err) {
        reject(err);
      } else {
        console.log('📊 Current tables:', rows.map(r => r.name));
        resolve(rows);
      }
    });
  });
}

// Main execution
async function main() {
  try {
    console.log('🔍 Checking database structure...');
    
    const tables = await listTables();
    const hasUsersTable = tables.some(t => t.name === 'users');
    
    if (!hasUsersTable) {
      console.log('❌ Users table missing. Creating tables...');
      
      await createUsersTable();
      await createSitesTable();
      await insertDefaultUsers();
      
      console.log('🎉 Database fixed successfully!');
    } else {
      console.log('✅ Users table exists. Checking data...');
      
      // Check if admin user exists
      const adminUser = await new Promise((resolve, reject) => {
        db.get("SELECT * FROM users WHERE email = 'admin@example.com'", (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
      
      if (!adminUser) {
        console.log('❌ Admin user missing. Adding default users...');
        await insertDefaultUsers();
      } else {
        console.log('✅ Admin user exists');
      }
    }
    
    console.log('✅ Database verification complete!');
    
  } catch (error) {
    console.error('❌ Database fix failed:', error.message);
  } finally {
    db.close((err) => {
      if (err) {
        console.error('❌ Error closing database:', err.message);
      } else {
        console.log('✅ Database connection closed');
      }
    });
  }
}

// Run the fix
main();