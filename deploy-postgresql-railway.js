#!/usr/bin/env node

/**
 * 🐘 PostgreSQL Railway Deployment Script
 * Deploys the PostgreSQL-only version to Railway
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🐘 PostgreSQL Railway Deployment');
console.log('=================================');

// Configuration
const RAILWAY_SERVICE = 'talkavax'; // Your Railway service name from deployment errors

console.log('📋 Deployment Configuration:');
console.log('  Railway Service:', RAILWAY_SERVICE);
console.log('  Start Command: npm run start:railway');
console.log('  Docker: Dockerfile (updated for PostgreSQL)');

// Step 1: Update Railway configuration files
console.log('\n🔧 Updating Railway configuration files...');

// Copy PostgreSQL configuration files
const filesToUpdate = [
  { source: 'railway-postgresql.toml', target: 'railway.toml' },
  { source: 'railway-postgresql.json', target: 'railway.json' }
];

filesToUpdate.forEach(({ source, target }) => {
  if (fs.existsSync(source)) {
    fs.copyFileSync(source, target);
    console.log(`✅ Updated ${target}`);
  } else {
    console.log(`⚠️  ${source} not found, using existing ${target}`);
  }
});

// Step 2: Verify PostgreSQL configuration
console.log('\n🔍 Verifying PostgreSQL configuration...');

// Check if package.json has the correct start script
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
if (packageJson.scripts['start:railway'] !== 'node railway-postgresql-start.js') {
  console.log('⚠️  Updating package.json start:railway script...');
  packageJson.scripts['start:railway'] = 'node railway-postgresql-start.js';
  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
  console.log('✅ Updated package.json');
}

// Step 3: Test PostgreSQL configuration locally (if possible)
console.log('\n🧪 Testing PostgreSQL configuration...');

// Check if we can connect to Railway PostgreSQL
try {
  console.log('  Testing Railway PostgreSQL connection...');
  
  // This would normally test the connection, but we can't access Railway env vars locally
  console.log('  ⚠️  Cannot test Railway PostgreSQL connection locally');
  console.log('  ✅ Will test after deployment');
  
} catch (error) {
  console.log('  ⚠️  Local PostgreSQL test skipped:', error.message);
}

// Step 4: Deploy to Railway
console.log('\n🚀 Deploying to Railway...');

try {
  // Step 4a: Add environment variables to Railway
  console.log('  Setting Railway environment variables...');
  
  const envVars = [
    'FORCE_POSTGRESQL=true',
    'DISABLE_SQLITE_FALLBACK=true'
  ];
  
  envVars.forEach(envVar => {
    try {
      execSync(`railway variables set ${envVar}`, { stdio: 'inherit' });
      console.log(`  ✅ Set ${envVar}`);
    } catch (error) {
      console.log(`  ⚠️  Could not set ${envVar}: ${error.message}`);
    }
  });
  
  // Step 4b: Deploy using Railway CLI
  console.log('\n  Deploying application...');
  execSync('railway up', { stdio: 'inherit' });
  console.log('✅ Deployment initiated');
  
  // Step 4c: Monitor deployment
  console.log('\n  Monitoring deployment...');
  console.log('  Use: railway logs (to watch deployment progress)');
  console.log('  Use: railway status (to check deployment status)');
  
} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  console.log('\n🔧 Manual deployment steps:');
  console.log('1. Push your code to GitHub');
  console.log('2. Railway will auto-deploy from GitHub');
  console.log('3. Monitor deployment in Railway dashboard');
  process.exit(1);
}

// Step 5: Post-deployment verification
console.log('\n✅ Deployment Configuration Complete!');
console.log('\n📋 Next Steps:');
console.log('1. Monitor deployment logs: railway logs');
console.log('2. Check deployment status: railway status');
console.log('3. Test health endpoint: curl https://talkavax-production.up.railway.app/health');
console.log('4. Test authentication: curl -X POST https://talkavax-production.up.railway.app/api/auth/login \\');
console.log('   -H "Content-Type: application/json" \\');
console.log('   -d \'{"email":"admin@example.com","password":"admin123"}\'');

console.log('\n🎯 Expected Results:');
console.log('  ✅ Health endpoint should show: {"database":"postgresql","mongodb":"configured"}');
console.log('  ✅ Authentication should return JWT token');
console.log('  ✅ No more "Falling back to SQLite" messages in logs');

console.log('\n🚀 Your PostgreSQL deployment is ready!');