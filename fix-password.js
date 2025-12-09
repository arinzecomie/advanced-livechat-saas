#!/usr/bin/env node

/**
 * 🔑 Fix Password Script
 * Updates the admin user with the correct password
 */

const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, 'backend', 'dev.sqlite3');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to SQLite database');
});

// Update admin user with correct password
const adminPassword = bcrypt.hashSync('admin123', 10);

const sql = `
  UPDATE users 
  SET name = 'Admin User', 
      password_hash = ?, 
      updated_at = CURRENT_TIMESTAMP 
  WHERE email = 'admin@example.com'
`;

db.run(sql, [adminPassword], function(err) {
  if (err) {
    console.error('❌ Password update failed:', err.message);
    db.close();
    process.exit(1);
  }
  
  console.log('✅ Admin password updated successfully');
  console.log('📊 Rows affected:', this.changes);
  
  // Verify the update
  db.get("SELECT id, email, name, role FROM users WHERE email = 'admin@example.com'", (err, row) => {
    if (err) {
      console.error('❌ Verification failed:', err.message);
    } else {
      console.log('✅ Admin user verified:', row);
    }
    
    db.close(() => {
      console.log('✅ Database connection closed');
      console.log('\n🎉 Password fix completed!');
      console.log('🧪 Test login with:');
      console.log('   Email: admin@example.com');
      console.log('   Password: admin123');
    });
  });
});