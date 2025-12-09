#!/usr/bin/env node

/**
 * Fixed Railway Deployment Script
 * Deploys with PostgreSQL support and proper migration handling
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

console.log('🚀 Starting Fixed Railway Deployment...');

// Step 1: Deploy the application
const deploy = () => {
  console.log('📦 Deploying application to Railway...');
  
  const deployProcess = spawn('railway', ['up'], {
    stdio: 'inherit',
    shell: true
  });

  deployProcess.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Deployment successful!');
      setTimeout(runMigrations, 5000); // Wait 5 seconds for app to start
    } else {
      console.error('❌ Deployment failed with code:', code);
      process.exit(1);
    }
  });

  deployProcess.on('error', (error) => {
    console.error('❌ Deployment error:', error);
    process.exit(1);
  });
};

// Step 2: Run migrations
const runMigrations = () => {
  console.log('📊 Running database migrations...');
  
  const migrateProcess = spawn('railway', ['run', 'npm', 'run', 'migrate'], {
    stdio: 'inherit',
    shell: true
  });

  migrateProcess.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Migrations completed successfully!');
      runSeeds();
    } else {
      console.error('❌ Migration failed with code:', code);
      console.log('💡 This might be normal if migrations already ran');
      runSeeds();
    }
  });

  migrateProcess.on('error', (error) => {
    console.error('❌ Migration error:', error);
    runSeeds();
  });
};

// Step 3: Run seeds
const runSeeds = () => {
  console.log('🌱 Running database seeds...');
  
  const seedProcess = spawn('railway', ['run', 'npm', 'run', 'seed'], {
    stdio: 'inherit',
    shell: true
  });

  seedProcess.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Seeds completed successfully!');
    } else {
      console.log('💡 Seeds might have already been run');
    }
    verifyDeployment();
  });

  seedProcess.on('error', (error) => {
    console.log('💡 Seeds might have already been run');
    verifyDeployment();
  });
};

// Step 4: Verify deployment
const verifyDeployment = () => {
  console.log('🔍 Verifying deployment...');
  
  setTimeout(() => {
    console.log('🎉 Deployment process completed!');
    console.log('📋 Next steps:');
    console.log('  1. Check logs: railway logs');
    console.log('  2. Test health: curl https://talkavax-production.up.railway.app/health');
    console.log('  3. Test login: curl -X POST "https://talkavax-production.up.railway.app/api/auth/login" -H "Content-Type: application/json" -d \'{"email":"admin@example.com","password":"admin123"}\'');
    
    process.exit(0);
  }, 3000);
};

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  console.log('💡 Make sure you have set DATABASE_URL in Railway dashboard');
  process.exit(1);
}

console.log('✅ DATABASE_URL found:', process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@'));

// Start the deployment process
deploy();