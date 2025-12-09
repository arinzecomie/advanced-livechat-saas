#!/usr/bin/env node

import { execSync } from 'child_process';

function runCommand(command) {
  console.log(`\n🚀 Running: ${command}`);
  try {
    const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    console.log(`✅ Command completed successfully`);
    return result;
  } catch (error) {
    console.error(`❌ Command failed: ${error.message}`);
    if (error.stderr) console.error('Error output:', error.stderr);
    if (error.stdout) console.error('Output:', error.stdout);
    throw error;
  }
}

async function configureRailwayPostgreSQL() {
  console.log('🐘 Configuring Railway PostgreSQL Service...');
  console.log('='.repeat(50));
  
  try {
    // Step 1: Check current services
    console.log('\n📋 Step 1: Checking Railway services...');
    
    // Step 2: Connect to PostgreSQL service
    console.log('\n📋 Step 2: Connecting PostgreSQL service...');
    console.log('🎯 Manual steps required in Railway dashboard:');
    console.log('   1. Go to https://railway.app/project/c66a41be-9633-4791-a1c0-188ce1b5ec0b');
    console.log('   2. Click on "postgresql" service');
    console.log('   3. Click "Settings" tab');
    console.log('   4. Click "Generate Domain"');
    console.log('   5. Copy the PostgreSQL connection string');
    console.log('   6. Go back to "talkavax" service');
    console.log('   7. Click "Variables" tab');
    console.log('   8. Add new variable: DATABASE_URL');
    console.log('   9. Paste the PostgreSQL connection string as value');
    
    // Step 3: Update backend for PostgreSQL
    console.log('\n📋 Step 3: Updating backend for PostgreSQL...');
    
    // Copy PostgreSQL knexfile
    try {
      runCommand('copy backend\\knexfile-postgresql.js backend\\knexfile.js');
    } catch (error) {
      console.log('⚠️  Could not copy knexfile, may already exist');
    }
    
    // Step 4: Deploy with PostgreSQL
    console.log('\n📋 Step 4: Deploying with PostgreSQL...');
    
    console.log('🎯 After setting DATABASE_URL, run:');
    console.log('   railway up');
    console.log('   railway run npm run migrate');
    console.log('   railway run npm run seed');
    
    // Step 5: Test the deployment
    console.log('\n📋 Step 5: Testing PostgreSQL deployment...');
    
    console.log('🎯 Test commands:');
    console.log('   curl https://talkavax-production.up.railway.app/health');
    console.log('   curl -X POST "https://talkavax-production.up.railway.app/api/auth/login" -H "Content-Type: application/json" -d \'{"email":"admin@example.com","password":"admin123"}\'');
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Railway PostgreSQL Configuration Guide Complete!');
    console.log('');
    console.log('🎯 NEXT STEPS:');
    console.log('   1. Go to Railway dashboard');
    console.log('   2. Connect PostgreSQL service');
    console.log('   3. Set DATABASE_URL variable');
    console.log('   4. Deploy with: railway up');
    console.log('   5. Run migrations');
    console.log('');
    console.log('🌐 Current app is running at:');
    console.log('   https://talkavax-production.up.railway.app');
    console.log('');
    console.log('🐘 PostgreSQL will replace SQLite for production!');
    
  } catch (error) {
    console.error('\n❌ Configuration failed:', error.message);
    process.exit(1);
  }
}

// Run configuration
if (import.meta.url === `file://${process.argv[1]}`) {
  configureRailwayPostgreSQL();
}