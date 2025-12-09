#!/usr/bin/env node

/**
 * 🚂 Railway Remote Database Fix
 * Simple script to fix database on Railway
 */

console.log('🚂 Railway Remote Database Fix');
console.log('📁 Current directory:', process.cwd());
console.log('📂 Directory contents:', require('fs').readdirSync('.'));

// Simple HTTP server to trigger database operations
const http = require('http');

const server = http.createServer((req, res) => {
  if (req.url === '/fix-db') {
    console.log('🔧 Fixing database...');
    
    // Execute database fix
    const sqlite3 = require('sqlite3').verbose();
    const dbPath = './backend/dev.sqlite3';
    
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Database connection failed:', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Database connection failed' }));
        return;
      }
      
      console.log('✅ Connected to database');
      
      // Create users table
      const createUsersTable = `
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
      
      db.run(createUsersTable, function(err) {
        if (err) {
          console.error('❌ Users table creation failed:', err.message);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Users table creation failed' }));
          return;
        }
        
        console.log('✅ Users table created/verified');
        
        // Insert default admin user
        const bcrypt = require('bcryptjs');
        const adminPassword = bcrypt.hashSync('admin123', 10);
        
        const insertAdmin = `
          INSERT OR IGNORE INTO users (name, email, password_hash, role) 
          VALUES ('Admin User', 'admin@example.com', ?, 'admin')
        `;
        
        db.run(insertAdmin, [adminPassword], function(err) {
          if (err) {
            console.error('❌ Admin user insertion failed:', err.message);
          } else {
            console.log('✅ Admin user inserted/updated');
          }
          
          db.close(() => {
            console.log('✅ Database fix completed!');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: 'Database fixed' }));
          });
        });
      });
    });
    
  } else if (req.url === '/test-login') {
    // Test the login
    console.log('🧪 Testing login...');
    
    const sqlite3 = require('sqlite3').verbose();
    const dbPath = './backend/dev.sqlite3';
    
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Database connection failed' }));
        return;
      }
      
      db.get("SELECT * FROM users WHERE email = 'admin@example.com'", (err, row) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Database query failed' }));
        } else if (!row) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Admin user not found' }));
        } else {
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
        }
        
        db.close();
      });
    });
    
  } else {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      message: 'Railway DB Fix Service',
      endpoints: ['/fix-db', '/test-login']
    }));
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 DB Fix service running on port ${PORT}`);
  console.log(`🌐 Test endpoints:`);
  console.log(`   - http://localhost:${PORT}/fix-db`);
  console.log(`   - http://localhost:${PORT}/test-login`);
});