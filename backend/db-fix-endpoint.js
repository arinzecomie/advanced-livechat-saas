/**
 * 🛠️ Database Fix Endpoint
 * Adds /fix-db route to initialize database
 */

import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';

export function setupDatabaseFix(app) {
  
  // Database fix endpoint
  app.post('/fix-db', async (req, res) => {
    console.log('🔧 Database fix requested...');
    
    try {
      const dbPath = path.join(process.cwd(), 'dev.sqlite3');
      console.log('📁 Database path:', dbPath);
      
      const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error('❌ Database connection failed:', err.message);
          return res.status(500).json({ 
            error: 'Database connection failed', 
            details: err.message 
          });
        }
        
        console.log('✅ Connected to SQLite database');
        
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
            db.close();
            return res.status(500).json({ 
              error: 'Users table creation failed', 
              details: err.message 
            });
          }
          
          console.log('✅ Users table created/verified');
          
          // Create sites table
          const createSitesTable = `
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
          
          db.run(createSitesTable, function(err) {
            if (err) {
              console.error('❌ Sites table creation failed:', err.message);
              db.close();
              return res.status(500).json({ 
                error: 'Sites table creation failed', 
                details: err.message 
              });
            }
            
            console.log('✅ Sites table created/verified');
            
            // Insert default admin user
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
              
              // Insert demo user
              const demoPassword = bcrypt.hashSync('user123', 10);
              
              const insertDemo = `
                INSERT OR IGNORE INTO users (name, email, password_hash, role) 
                VALUES ('Demo User', 'demo@example.com', ?, 'user')
              `;
              
              db.run(insertDemo, [demoPassword], function(err) {
                if (err) {
                  console.error('❌ Demo user insertion failed:', err.message);
                } else {
                  console.log('✅ Demo user inserted/updated');
                }
                
                // Verify admin user was created
                db.get("SELECT id, email, name, role FROM users WHERE email = 'admin@example.com'", (err, row) => {
                  if (err) {
                    console.error('❌ User verification failed:', err.message);
                    db.close();
                    return res.status(500).json({ 
                      error: 'User verification failed', 
                      details: err.message 
                    });
                  }
                  
                  if (!row) {
                    console.error('❌ Admin user not found after insertion');
                    db.close();
                    return res.status(500).json({ 
                      error: 'Admin user not found after insertion' 
                    });
                  }
                  
                  console.log('✅ Admin user verified:', row);
                  
                  db.close(() => {
                    console.log('🎉 Database fix completed successfully!');
                    res.json({ 
                      success: true, 
                      message: 'Database fixed successfully',
                      adminUser: {
                        id: row.id,
                        email: row.email,
                        name: row.name,
                        role: row.role
                      }
                    });
                  });
                });
              });
            });
          });
        });
      });
      
    } catch (error) {
      console.error('❌ Database fix failed:', error.message);
      res.status(500).json({ 
        error: 'Database fix failed', 
        details: error.message 
      });
    }
  });
  
  // Test login endpoint
  app.get('/test-login', async (req, res) => {
    console.log('🧪 Testing login...');
    
    try {
      const dbPath = path.join(process.cwd(), 'dev.sqlite3');
      const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          return res.status(500).json({ 
            error: 'Database connection failed', 
            details: err.message 
          });
        }
        
        db.get("SELECT id, email, name, role FROM users WHERE email = 'admin@example.com'", (err, row) => {
          db.close();
          
          if (err) {
            return res.status(500).json({ 
              error: 'Database query failed', 
              details: err.message 
            });
          }
          
          if (!row) {
            return res.status(404).json({ 
              error: 'Admin user not found' 
            });
          }
          
          res.json({ 
            success: true, 
            user: {
              id: row.id,
              email: row.email,
              name: row.name,
              role: row.role
            }
          });
        });
      });
      
    } catch (error) {
      console.error('❌ Login test failed:', error.message);
      res.status(500).json({ 
        error: 'Login test failed', 
        details: error.message 
      });
    }
  });
  
  console.log('✅ Database fix endpoints added:');
  console.log('  - POST /fix-db     (Initialize database)');
  console.log('  - GET  /test-login (Test admin user)');
}