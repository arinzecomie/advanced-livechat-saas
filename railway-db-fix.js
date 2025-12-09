#!/usr/bin/env node

/**
 * 🚂 Railway Database Migration Fix
 * Runs missing migrations on Railway deployment
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚂 Railway Database Migration Fix');

// Set Railway environment
const env = {
  ...process.env,
  NODE_ENV: 'production',
  RAILWAY_ENVIRONMENT: 'true'
};

console.log('📋 Environment:');
console.log('  NODE_ENV:', env.NODE_ENV);
console.log('  RAILWAY_ENVIRONMENT:', env.RAILWAY_ENVIRONMENT);
console.log('  DATABASE_URL:', env.DATABASE_URL || 'Using SQLite');

// Run migrations
console.log('🔄 Running database migrations...');

const migrateProcess = spawn('npm', ['run', 'migrate'], {
  cwd: path.join(__dirname, 'backend'),
  env: env,
  stdio: 'pipe'
});

migrateProcess.stdout.on('data', (data) => {
  console.log('MIGRATION:', data.toString().trim());
});

migrateProcess.stderr.on('data', (data) => {
  console.error('MIGRATION ERROR:', data.toString().trim());
});

migrateProcess.on('error', (error) => {
  console.error('❌ Migration process failed:', error.message);
  process.exit(1);
});

migrateProcess.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Migrations completed successfully!');
    
    // Run seed data
    console.log('🌱 Running seed data...');
    
    const seedProcess = spawn('npm', ['run', 'seed'], {
      cwd: path.join(__dirname, 'backend'),
      env: env,
      stdio: 'pipe'
    });
    
    seedProcess.stdout.on('data', (data) => {
      console.log('SEED:', data.toString().trim());
    });
    
    seedProcess.stderr.on('data', (data) => {
      console.error('SEED ERROR:', data.toString().trim());
    });
    
    seedProcess.on('close', (seedCode) => {
      if (seedCode === 0) {
        console.log('✅ Seed data completed successfully!');
      } else {
        console.log('⚠️  Seed process exited with code:', seedCode);
      }
      process.exit(0);
    });
    
  } else {
    console.error('❌ Migrations failed with code:', code);
    process.exit(1);
  }
});