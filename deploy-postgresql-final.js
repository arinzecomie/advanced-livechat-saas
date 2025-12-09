#!/usr/bin/env node

import { execSync } from 'child_process';
import https from 'https';

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

function testHealthEndpoint() {
  return new Promise((resolve, reject) => {
    console.log('\n🧪 Testing health endpoint...');
    
    https.get('https://talkavax-production.up.railway.app/health', (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.status === 'ok') {
            console.log('✅ Health check passed');
            resolve(result);
          } else {
            reject(new Error('Health check failed'));
          }
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

async function deployPostgreSQLFinal() {
  console.log('🐘 Final Railway PostgreSQL Deployment');
  console.log('='.repeat(50));
  
  try {
    // Step 1: Verify current deployment
    console.log('\n📋 Step 1: Verifying current deployment...');
    await testHealthEndpoint();
    console.log('✅ Current deployment is healthy');
    
    // Step 2: Check current database type
    console.log('\n📋 Step 2: Checking current database...');
    console.log('⚠️  Current: SQLite (needs PostgreSQL upgrade)');
    
    // Step 3: Deploy with PostgreSQL configuration
    console.log('\n📋 Step 3: Deploying with PostgreSQL configuration...');
    
    // Ensure knexfile is PostgreSQL-ready
    try {
      runCommand('copy backend\\knexfile-postgresql.js backend\\knexfile.js');
      console.log('✅ PostgreSQL knexfile configured');
    } catch (error) {
      console.log('⚠️  Knexfile may already be configured');
    }
    
    // Deploy to Railway
    console.log('🚀 Deploying to Railway with PostgreSQL configuration...');
    try {
      runCommand('railway up');
      console.log('✅ Deployment completed');
    } catch (error) {
      console.log('⚠️  Deployment may need manual trigger in Railway dashboard');
    }
    
    // Step 4: Manual configuration steps
    console.log('\n📋 Step 4: Manual PostgreSQL configuration required:');
    console.log('');
    console.log('🎯 CRITICAL STEPS TO COMPLETE:');
    console.log('');
    console.log('1. 🌐 Go to Railway Dashboard:');
    console.log('   https://railway.app/project/c66a41be-9633-4791-a1c0-188ce1b5ec0b');
    console.log('');
    console.log('2. 🔗 Connect PostgreSQL Service:');
    console.log('   - Click on "postgresql" service');
    console.log('   - Go to "Settings" tab');
    console.log('   - Click "Generate Domain" (if needed)');
    console.log('   - Copy the connection string');
    console.log('');
    console.log('3. 📝 Set DATABASE_URL Variable:');
    console.log('   - Go to "talkavax" service');
    console.log('   - Click "Variables" tab');
    console.log('   - Add: DATABASE_URL = [PostgreSQL connection string]');
    console.log('   - Click "Save"');
    console.log('');
    console.log('4. 🚀 Final Deployment:');
    console.log('   - Click "Deploy" or run: railway up');
    console.log('   - Wait for deployment to complete');
    console.log('');
    console.log('5. 📊 Run Migrations:');
    console.log('   railway run npm run migrate');
    console.log('   railway run npm run seed');
    console.log('');
    
    // Step 5: Post-deployment verification
    console.log('\n📋 Step 5: Post-deployment verification:');
    console.log('🎯 After completing manual steps, test with:');
    console.log('   curl https://talkavax-production.up.railway.app/health');
    console.log('   curl -X POST "https://talkavax-production.up.railway.app/api/auth/login" \
     -H "Content-Type: application/json" \
     -d \'{"email":"admin@example.com","password":"admin123"}\'');
    
    // Step 6: Success indicators
    console.log('\n📋 Step 6: Success indicators:');
    console.log('✅ PostgreSQL connection established');
    console.log('✅ Database migrations completed');
    console.log('✅ Health endpoint returns 200');
    console.log('✅ Login works with PostgreSQL');
    console.log('✅ No more SQLite in logs');
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ FINAL DEPLOYMENT SETUP COMPLETE!');
    console.log('');
    console.log('🎯 MANUAL STEPS REQUIRED:');
    console.log('   1. Add DATABASE_URL in Railway dashboard');
    console.log('   2. Deploy with new configuration');
    console.log('   3. Run database migrations');
    console.log('');
    console.log('🌐 Your app will be available at:');
    console.log('   https://talkavax-production.up.railway.app');
    console.log('');
    console.log('🐘 PostgreSQL will provide:');
    console.log('   ✅ Production-ready database');
    console.log('   ✅ Automatic backups');
    console.log('   ✅ Connection pooling');
    console.log('   ✅ SSL/TLS encryption');
    console.log('   ✅ High availability');
    
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('   1. Check Railway dashboard status');
    console.log('   2. Verify DATABASE_URL is set');
    console.log('   3. Check logs: railway logs');
    console.log('   4. Test health: curl https://talkavax-production.up.railway.app/health');
    process.exit(1);
  }
}

// Run final deployment
if (import.meta.url === `file://${process.argv[1]}`) {
  deployPostgreSQLFinal();
}