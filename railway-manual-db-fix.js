#!/usr/bin/env node

/**
 * 🚂 Manual Railway Database Fix
 * Creates a simple HTTP server to fix the database
 */

const http = require('http');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

console.log('🚂 Manual Railway Database Fix');
console.log('📅 Starting at:', new Date().toISOString());

// Database path
const dbPath = path.join(process.cwd(), 'backend', 'dev.sqlite3');

// Create HTTP server
const server = http.createServer((req, res) => {
  console.log(`📨 ${req.method} ${req.url}`);
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
 res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  if (req.url === '/fix-db' && req.method === 'POST') {
    console.log('🔧 Fixing database...');
    
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
      
      console.log('✅ Connected to SQLite database');
      
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
        
        // Insert admin user
        `INSERT OR IGNORE INTO users (name, email, password_hash, role) 
         VALUES ('Admin User', 'admin@example.com', ?, 'admin')`,
        
        // Insert demo user
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
      
      // Execute SQL commands
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
            
            console.log('🎉 Database fix completed successfully!');
            console.log('✅ Admin user:', row);
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
              success: true, 
              message: 'Database fixed successfully',
              adminUser: {
                id: row.id,
                email: row.email,
                name: row.name,
                role: row.role
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
    console.log('🧪 Testing login...');
    
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
      message: 'Railway Manual DB Fix Service',
      endpoints: ['/fix-db (POST)', '/test-login (GET)']
    }));
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 DB Fix service running on port ${PORT}`);
  console.log(`🌐 Test endpoints:`);
  console.log(`   - http://localhost:${PORT}/fix-db (POST)`);
  console.log(`   - http://localhost:${PORT}/test-login (GET)`);
  console.log(`\n🎯 To fix the database, run:`);
  console.log(`   curl -X POST http://localhost:${PORT}/fix-db`);
});