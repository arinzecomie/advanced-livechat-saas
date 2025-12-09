#!/usr/bin/env node

/**
 * 🐘 Force PostgreSQL Deployment Fix
 * Forces Railway to use PostgreSQL-only configuration
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🐘 Force PostgreSQL Deployment');
console.log('===============================');

console.log('🔧 Forcing PostgreSQL configuration...');

// Step 1: Create a new deployment with PostgreSQL configuration
const deploymentConfig = {
  build: {
    builder: 'DOCKERFILE',
    dockerfilePath: 'Dockerfile'
  },
  deploy: {
    startCommand: 'npm run start:railway',
    restartPolicyType: 'ON_FAILURE',
    restartPolicyMaxRetries: 3,
    healthcheckPath: '/health',
    healthcheckTimeout: 300,
    healthcheckInterval: 30000
  },
  environments: {
    production: {
      variables: {
        NODE_ENV: 'production',
        PORT: '3000',
        FORCE_POSTGRESQL: 'true',
        DISABLE_SQLITE_FALLBACK: 'true'
      }
    }
  }
};

// Write the configuration
fs.writeFileSync('railway.json', JSON.stringify(deploymentConfig, null, 2));
console.log('✅ Created railway.json with PostgreSQL configuration');

// Step 2: Update package.json to ensure correct start command
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
if (packageJson.scripts['start:railway'] !== 'node railway-postgresql-start.js') {
  packageJson.scripts['start:railway'] = 'node railway-postgresql-start.js';
  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
  console.log('✅ Updated package.json start:railway script');
}

// Step 3: Update railway.toml
const railwayToml = `[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"

[deploy]
startCommand = "npm run start:railway"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
healthcheckPath = "/health"
healthcheckTimeout = 300
healthcheckInterval = 30000

[environments]
production:
  variables:
    NODE_ENV = "production"
    PORT = "3000"
    FORCE_POSTGRESQL = "true"
    DISABLE_SQLITE_FALLBACK = "true"`;

fs.writeFileSync('railway.toml', railwayToml);
console.log('✅ Updated railway.toml with PostgreSQL configuration');

// Step 4: Force a new deployment
console.log('\n🚀 Forcing new deployment...');

try {
  // Force a new deployment by making a small change to trigger rebuild
  const timestamp = new Date().toISOString();
  const deploymentMarker = `# PostgreSQL deployment forced: ${timestamp}
# This file forces Railway to use PostgreSQL configuration
FORCE_POSTGRESQL=true
DISABLE_SQLITE_FALLBACK=true
`;

  fs.writeFileSync('.railway-deploy-marker', deploymentMarker);
  console.log('✅ Created deployment marker');

  // Deploy with force flag
  console.log('  Deploying to Railway...');
  execSync('railway up --detach', { stdio: 'inherit' });
  console.log('✅ Deployment initiated with PostgreSQL configuration');

} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  console.log('\n🔧 Manual deployment steps:');
  console.log('1. Commit your changes to GitHub');
  console.log('2. Railway will auto-deploy from the main branch');
  console.log('3. Monitor deployment in Railway dashboard');
  process.exit(1);
}

console.log('\n✅ PostgreSQL deployment configuration complete!');
console.log('\n📋 Next Steps:');
console.log('1. Monitor deployment: railway logs');
console.log('2. Check status: railway status');
console.log('3. Test endpoints after deployment completes');
console.log('4. Verify PostgreSQL is being used (no more SQLite fallback messages)');