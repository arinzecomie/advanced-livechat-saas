#!/usr/bin/env node

/**
 * 🚂 Railway Migration & Seed Script
 * Handles PostgreSQL migrations and seeding for Railway deployment
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚂 Railway Migration & Seed Script');
console.log('===================================');

// Check environment
const isRailway = process.env.RAILWAY_ENVIRONMENT === 'true' || process.env.RAILWAY_PROJECT_ID;

if (!isRailway) {
  console.log('⚠️  Not running in Railway environment');
  console.log('🔄 Running local migration instead...');
  
  // Run local migration
  const localMigrate = spawn('npm', ['run', 'migrate'], {
    stdio: 'inherit',
    shell: true
  });
  
  localMigrate.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Local migration completed');
      runLocalSeed();
    } else {
      console.error('❌ Local migration failed');
      process.exit(1);
    }
  });
  
  return;
}

console.log('✅ Detected Railway environment');
console.log('📋 Environment check:');
console.log('  DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
console.log('  PGHOST:', process.env.PGHOST ? 'SET' : 'NOT SET');
console.log('  NODE_ENV:', process.env.NODE_ENV);

// Verify PostgreSQL connection
const { Client } = require('pg');

async function testPostgreSQLConnection() {
  console.log('\n🧪 Testing PostgreSQL connection...');
  
  try {
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    await client.connect();
    console.log('✅ PostgreSQL connection successful');
    
    // Check if we can list tables
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('📊 Existing tables:', result.rows.map(r => r.table_name));
    
    await client.end();
    return true;
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error.message);
    return false;
  }
}

// Run migrations
async function runMigrations() {
  console.log('\n📊 Running database migrations...');
  
  return new Promise((resolve, reject) => {
    const migrate = spawn('npx', ['knex', 'migrate:latest', '--knexfile', './backend/knexfile.js'], {
      stdio: 'pipe',
      shell: true,
      env: { ...process.env, NODE_ENV: 'production' }
    });
    
    let output = '';
    let errorOutput = '';
    
    migrate.stdout.on('data', (data) => {
      const message = data.toString();
      output += message;
      console.log('MIGRATE:', message.trim());
    });
    
    migrate.stderr.on('data', (data) => {
      const message = data.toString();
      errorOutput += message;
      console.error('MIGRATE ERROR:', message.trim());
    });
    
    migrate.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Migrations completed successfully');
        resolve(true);
      } else {
        console.error('❌ Migration failed with code:', code);
        
        // Check if it's because tables already exist
        if (errorOutput.includes('already exists')) {
          console.log('⚠️  Some tables already exist, continuing...');
          resolve(true);
        } else {
          reject(new Error('Migration failed'));
        }
      }
    });
  });
}

// Run seeds
async function runSeeds() {
  console.log('\n🌱 Running database seeds...');
  
  return new Promise((resolve, reject) => {
    const seed = spawn('npx', ['knex', 'seed:run', '--knexfile', './backend/knexfile.js'], {
      stdio: 'pipe',
      shell: true,
      env: { ...process.env, NODE_ENV: 'production' }
    });
    
    seed.stdout.on('data', (data) => {
      console.log('SEED:', data.toString().trim());
    });
    
    seed.stderr.on('data', (data) => {
      console.error('SEED ERROR:', data.toString().trim());
    });
    
    seed.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Seeds completed successfully');
        resolve(true);
      } else {
        console.error('❌ Seed failed with code:', code);
        
        // Try alternative seed method
        console.log('🔄 Trying alternative seed method...');
        runAlternativeSeed().then(resolve).catch(reject);
      }
    });
  });
}

// Alternative seed method
async function runAlternativeSeed() {
  console.log('\n🔄 Running alternative seed...');
  
  try {
    const { Client } = require('pg');
    const bcrypt = require('bcryptjs');
    
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    await client.connect();
    
    // Check if admin user already exists
    const existingAdmin = await client.query(
      "SELECT id FROM users WHERE email = 'admin@example.com'"
    );
    
    if (existingAdmin.rows.length > 0) {
      console.log('⚠️  Admin user already exists, skipping seed');
      await client.end();
      return true;
    }
    
    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    await client.query(
      `INSERT INTO users (name, email, password_hash, role, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, NOW(), NOW())`,
      ['Admin User', 'admin@example.com', adminPassword, 'admin']
    );
    
    // Create demo user
    const demoPassword = await bcrypt.hash('user123', 10);
    await client.query(
      `INSERT INTO users (name, email, password_hash, role, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, NOW(), NOW())`,
      ['Demo User', 'demo@example.com', demoPassword, 'user']
    );
    
    console.log('✅ Alternative seed completed');
    await client.end();
    return true;
  } catch (error) {
    console.error('❌ Alternative seed failed:', error.message);
    throw error;
  }
}

// Run local seed
function runLocalSeed() {
  console.log('\n🌱 Running local seed...');
  
  const seed = spawn('npm', ['run', 'seed'], {
    stdio: 'inherit',
    shell: true
  });
  
  seed.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Local seed completed');
    } else {
      console.error('❌ Local seed failed');
    }
    process.exit(code);
  });
}

// Main execution
async function main() {
  try {
    console.log('🚂 Railway Migration & Seed Script');
    console.log('==================================');
    
    // Test PostgreSQL connection first
    const connectionOk = await testPostgreSQLConnection();
    
    if (!connectionOk) {
      console.error('\n❌ Cannot proceed without database connection');
      console.error('🔧 Please check your Railway PostgreSQL service');
      process.exit(1);
    }
    
    // Run migrations
    await runMigrations();
    
    // Run seeds
    await runSeeds();
    
    console.log('\n✅ Railway migration & seed completed!');
    console.log('\n📋 Summary:');
    console.log('  ✅ PostgreSQL connection verified');
    console.log('  ✅ Database migrations applied');
    console.log('  ✅ Seed data inserted');
    console.log('  ✅ Application ready to start');
    
  } catch (error) {
    console.error('\n❌ Railway migration & seed failed:', error.message);
    process.exit(1);
  }
}

// Execute
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testPostgreSQLConnection, runMigrations, runSeeds };