#!/usr/bin/env node

/**
 * 🚂 Railway Direct Database Fix
 * Simple HTTP server to fix Railway database
 */

const http = require('http');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

console.log('🚂 Railway Direct Database Fix');
console.log('📅 Starting at:', new Date().toISOString());

// Database path (Railway location)
const dbPath = path.join(process.cwd(), 'backend', 'dev.sqlite3');

console.log('📁 Database path:', dbPath);
console.log('📂 Current directory:', process.cwd());

// Check if database file exists
const fs = require('fs');
if (fs.existsSync(dbPath)) {
  console.log('✅ Database file exists');
  const stats = fs.statSync(dbPath);
  console.log('📊 Database size:', stats.size, 'bytes');
} else {
  console.log('❌ Database file does not exist, will create');
}

// Create HTTP server
const server = http.createServer((req, res) => {
  console.log(`📨 ${req.method} ${req.url}`);
  
  // Enable CORS for Railway frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  if (req.url === '/fix-db' && req.method === 'POST') {
    console.log('🔧 Fixing Railway database...');
    
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Database connection failed:', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false, 
          error: 'Database connection failed', 
          details: err.message 
        }));
        return;
      }
      
      console.log('✅ Connected to Railway SQLite database');
      
      // SQL commands to create tables and insert data
      const sqlCommands = [
        // Create users table
        `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        
        // Create sites table
        `CREATE TABLE IF NOT EXISTS sites (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          site_id TEXT NOT NULL UNIQUE,
          domain TEXT NOT NULL,
          status TEXT DEFAULT 'trial' CHECK(status IN ('trial', 'active', 'suspended')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`,
        
        // Insert admin user (password: admin123)
        `INSERT OR IGNORE INTO users (name, email, password_hash, role) 
         VALUES ('Admin User', 'admin@example.com', ?, 'admin')`,
        
        // Insert demo user (password: user123)
        `INSERT OR IGNORE INTO users (name, email, password_hash, role) 
         VALUES ('Demo User', 'demo@example.com', ?, 'user')`,
        
        // Insert default sites
        `INSERT OR IGNORE INTO sites (user_id, site_id, domain, status) 
         SELECT id, 'demo-site-id', 'demo-site.com', 'active' FROM users WHERE email = 'admin@example.com'`,
        
        `INSERT OR IGNORE INTO sites (user_id, site_id, domain, status) 
         SELECT id, 'suspended-site-id', 'suspended-site.com', 'suspended' FROM users WHERE email = 'admin@example.com'`
      ];
      
      // Hash passwords
      const adminPassword = bcrypt.hashSync('admin123', 10);
      const userPassword = bcrypt.hashSync('user123', 10);
      
      console.log('🔨 Executing SQL commands...');
      
      // Execute SQL commands one by one
      let successCount = 0;
      let errorCount = 0;
      
      function executeNext(index) {
        if (index >= sqlCommands.length) {
          // All commands executed
          console.log(`✅ SQL execution completed. Success: ${successCount}, Errors: ${errorCount}`);
          
          // Verify data
          db.get("SELECT id, email, name, role FROM users WHERE email = 'admin@example.com'", (err, row) => {
            db.close();
            
            if (err) {
              console.error('❌ Verification failed:', err.message);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ 
                success: false, 
                error: 'Verification failed', 
                details: err.message 
              }));
              return;
            }
            
            if (!row) {
              console.error('❌ Admin user not found after insertion');
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ 
                success: false, 
                error: 'Admin user not found after insertion' 
              }));
              return;
            }
            
            console.log('🎉 Railway database fix completed successfully!');
            console.log('✅ Admin user verified:', row);
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
              success: true, 
              message: 'Railway database fixed successfully',
              adminUser: {
                id: row.id,
                email: row.email,
                name: row.name,
                role: row.role
              },
              loginTest: 'https://talkavax-production.up.railway.app/api/auth/login',
              credentials: {
                email: 'admin@example.com',
                password: 'admin123'
              }
            }));
          });
          
          return;
        }
        
        const sql = sqlCommands[index];
        const params = index === 2 ? [adminPassword] : index === 3 ? [userPassword] : [];
        
        console.log(`🔨 Executing SQL ${index + 1}/${sqlCommands.length}...`);
        
        db.run(sql, params, function(err) {
          if (err) {
            console.error(`❌ SQL ${index + 1} failed:`, err.message);
            errorCount++;
          } else {
            console.log(`✅ SQL ${index + 1} executed successfully`);
            successCount++;
          }
          
          // Execute next command
          executeNext(index + 1);
        });
      }
      
      // Start executing SQL commands
      executeNext(0);
      
    });
    
  } else if (req.url === '/test-login' && req.method === 'GET') {
    console.log('🧪 Testing Railway login...');
    
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false, 
          error: 'Database connection failed' 
        }));
        return;
      }
      
      db.get("SELECT id, email, name, role FROM users WHERE email = 'admin@example.com'", (err, row) => {
        db.close();
        
        if (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            success: false, 
            error: 'Database query failed', 
            details: err.message 
          }));
          return;
        }
        
        if (!row) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            success: false, 
            error: 'Admin user not found' 
          }));
          return;
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: true, 
          user: {
            id: row.id,
            email: row.email,
            name: row.name,
            role: row.role
          }
        }));
      });
    });
    
  } else {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      message: 'Railway Direct DB Fix Service',
      endpoints: ['/fix-db (POST)', '/test-login (GET)'],
      railwayApp: 'https://talkavax-production.up.railway.app',
      instructions: 'Call POST /fix-db to fix the database, then test login at /api/auth/login'
    }));
  }
});

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`🚀 Railway DB Fix service running on port ${PORT}`);
  console.log(`🌐 Test endpoints:`);
  console.log(`   - http://localhost:${PORT}/fix-db (POST)`);
  console.log(`   - http://localhost:${PORT}/test-login (GET)`);
  
  if (PORT === 3002) {
    console.log(`\n🎯 To fix Railway database, run in another terminal:`);
    console.log(`   curl -X POST http://localhost:3002/fix-db`);
  } else {
    console.log(`\n🎯 Railway deployment detected!`);
    console.log(`   Fix database: curl -X POST https://talkavax-production.up.railway.app:3002/fix-db`);
  }
});