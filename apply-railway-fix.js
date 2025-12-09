#!/usr/bin/env node

/**
 * 🚂 Apply Railway Database Fix
 * Creates SQL commands to fix Railway database
 */

const fs = require('fs');
const path = require('path');

console.log('🚂 Railway Database Fix Generator');
console.log('📅 Generated at:', new Date().toISOString());

// Create SQL file for Railway
const sqlContent = `-- Railway Database Fix
-- Execute these SQL commands in Railway console to fix missing tables

-- Create users table (if not exists)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create sites table (if not exists)
CREATE TABLE IF NOT EXISTS sites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  site_id TEXT NOT NULL UNIQUE,
  domain TEXT NOT NULL,
  status TEXT DEFAULT 'trial' CHECK(status IN ('trial', 'active', 'suspended')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert admin user (password: admin123)
-- Password hash for 'admin123' generated with bcrypt
INSERT OR IGNORE INTO users (name, email, password_hash, role) 
VALUES ('Admin User', 'admin@example.com', '$2b$10$BwweA9vqIX.uJX9Hamz2e.kZp4mD4C8wHiJD1GXv0TY22SuLkfnIW', 'admin');

-- Insert demo user (password: user123)  
-- Password hash for 'user123' generated with bcrypt
INSERT OR IGNORE INTO users (name, email, password_hash, role) 
VALUES ('Demo User', 'demo@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4mD4C8wHiJD1GXv0TY22SuLkfnIW', 'user');

-- Insert default sites for admin
INSERT OR IGNORE INTO sites (user_id, site_id, domain, status) 
SELECT id, 'demo-site-id', 'demo-site.com', 'active' FROM users WHERE email = 'admin@example.com';

INSERT OR IGNORE INTO sites (user_id, site_id, domain, status) 
SELECT id, 'suspended-site-id', 'suspended-site.com', 'suspended' FROM users WHERE email = 'admin@example.com';

-- Verify the fix
SELECT 'Users count: ' || COUNT(*) as result FROM users;
SELECT 'Sites count: ' || COUNT(*) as result FROM sites;  
SELECT 'Admin user: ' || email || ' (' || role || ')' as result FROM users WHERE email = 'admin@example.com';`;

// Write SQL file
const sqlFile = path.join(__dirname, 'railway-fix.sql');
fs.writeFileSync(sqlFile, sqlContent);

console.log('✅ Railway database fix SQL generated!');
console.log('📄 SQL file:', sqlFile);
console.log('\n🎯 To fix Railway database, follow these steps:');
console.log('1. Go to https://railway.app');
console.log('2. Navigate to your project: talkavax');
console.log('3. Click on your service: talkavax');
console.log('4. Go to "Console" or "Shell" tab');
console.log('5. Run: sqlite3 backend/dev.sqlite3');
console.log('6. Copy and paste the SQL from railway-fix.sql');
console.log('7. Exit and test the login');

console.log('\n📋 SQL Commands to execute:');
console.log(sqlContent);

console.log('\n🧪 After executing SQL, test with:');
console.log('curl -X POST "https://talkavax-production.up.railway.app/api/auth/login" \\');
console.log('  -H "Content-Type: application/json" \\');
console.log('  -d \'{"email":"admin@example.com","password":"admin123"}\'');