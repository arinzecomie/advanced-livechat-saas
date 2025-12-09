#!/usr/bin/env node

/**
 * 🚂 Railway SQL Database Fix
 * Executes SQL to fix missing tables
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

console.log('🚂 Railway SQL Database Fix');

// Database path (Railway location)
const dbPath = path.join(__dirname, 'backend', 'dev.sqlite3');

console.log('📁 Connecting to database at:', dbPath);

// Connect to database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to SQLite database');
});

// Read SQL file
const sqlContent = fs.readFileSync(path.join(__dirname, 'railway-db-init.sql'), 'utf8');

console.log('📜 Executing SQL commands...');

// Execute SQL commands one by one
const commands = sqlContent.split(';').filter(cmd => cmd.trim());

async function executeCommands() {
  for (const command of commands) {
    const trimmedCmd = command.trim();
    if (!trimmedCmd) continue;
    
    try {
      await new Promise((resolve, reject) => {
        db.run(trimmedCmd, function(err) {
          if (err) {
            // Ignore "already exists" errors
            if (err.message.includes('already exists')) {
              console.log('⚠️  Skipping (already exists):', trimmedCmd.substring(0, 50) + '...');
              resolve();
            } else {
              reject(err);
            }
          } else {
            console.log('✅ Executed:', trimmedCmd.substring(0, 50) + '...');
            resolve();
          }
        });
      });
    } catch (error) {
      console.error('❌ SQL Error:', error.message);
      // Continue with other commands
    }
  }
}

// Verify data after execution
function verifyData() {
  return new Promise((resolve, reject) => {
    db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
      if (err) {
        reject(err);
      } else {
        console.log('📊 Users count:', row.count);
        resolve(row);
      }
    });
  });
}

// Main execution
async function main() {
  try {
    await executeCommands();
    
    console.log('✅ SQL execution completed!');
    
    // Verify data
    const result = await verifyData();
    
    if (result.count > 0) {
      console.log('🎉 Database fixed successfully!');
      console.log('✅ Admin user should be available: admin@example.com / admin123');
    } else {
      console.log('⚠️  No users found. Database may need manual inspection.');
    }
    
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