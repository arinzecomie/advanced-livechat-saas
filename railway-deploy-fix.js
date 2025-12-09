#!/usr/bin/env node

/**
 * 🚂 Railway Deployment Fix - PostgreSQL Configuration
 * Fixes database connection issues for Railway deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Railway Deployment Fix Starting...');

// Check if we're in Railway environment
const isRailway = process.env.RAILWAY_ENVIRONMENT === 'true' || process.env.RAILWAY_PROJECT_ID;

if (!isRailway) {
  console.log('⚠️  Not running in Railway environment. Exiting.');
  process.exit(0);
}

console.log('✅ Detected Railway environment');
console.log('📋 Environment variables check:');
console.log('  DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
console.log('  PGHOST:', process.env.PGHOST ? 'SET' : 'NOT SET');
console.log('  RAILWAY_PROJECT_ID:', process.env.RAILWAY_PROJECT_ID || 'NOT SET');

// Railway PostgreSQL connection details
const railwayDatabaseUrl = process.env.DATABASE_URL;
const railwayPgHost = process.env.PGHOST;
const railwayPgPort = process.env.PGPORT || 5432;
const railwayPgDatabase = process.env.PGDATABASE;
const railwayPgUser = process.env.PGUSER;
const railwayPgPassword = process.env.PGPASSWORD;

// Create proper database configuration for Railway
function createRailwayConfig() {
  console.log('\n🔧 Creating Railway database configuration...');
  
  // Build DATABASE_URL if not provided
  let databaseUrl = railwayDatabaseUrl;
  
  if (!databaseUrl && railwayPgHost && railwayPgUser && railwayPgPassword) {
    databaseUrl = `postgresql://${railwayPgUser}:${railwayPgPassword}@${railwayPgHost}:${railwayPgPort}/${railwayPgDatabase}`;
    console.log('✅ Built DATABASE_URL from individual components');
  }
  
  if (!databaseUrl) {
    console.error('❌ No PostgreSQL configuration found!');
    console.error('Please ensure Railway PostgreSQL service is connected.');
    console.error('Go to Railway Dashboard > Your Project > Services');
    console.error('Add PostgreSQL service if not present.');
    return null;
  }
  
  console.log('✅ Database URL configured');
  return databaseUrl;
}

// Test database connection
async function testDatabaseConnection(databaseUrl) {
  console.log('\n🧪 Testing database connection...');
  
  try {
    const { Client } = require('pg');
    const client = new Client({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    });
    
    await client.connect();
    console.log('✅ Database connection successful');
    
    // Test basic query
    const result = await client.query('SELECT current_database(), version()');
    console.log('📊 Database info:', result.rows[0]);
    
    await client.end();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// Create environment file for Railway
function createRailwayEnvFile(databaseUrl) {
  console.log('\n📝 Creating Railway environment configuration...');
  
  const envContent = `# Railway Environment Configuration
# Generated automatically by railway-deploy-fix.js

# Database Configuration
DATABASE_URL=${databaseUrl}
PGSSL=true

# Application Configuration
NODE_ENV=production
PORT=${process.env.PORT || 3000}
JWT_SECRET=${process.env.JWT_SECRET || 'railway-generated-jwt-secret-change-this'}
CORS_ORIGIN=${process.env.CORS_ORIGIN || '*'}

# MongoDB Configuration (if available)
MONGO_URI=${process.env.MONGO_URI || ''}

# Railway Specific
RAILWAY_ENVIRONMENT=true
RAILWAY_PROJECT_ID=${process.env.RAILWAY_PROJECT_ID || ''}
`;

  fs.writeFileSync('.env.railway', envContent);
  console.log('✅ Created .env.railway file');
}

// Update backend configuration
function updateBackendConfig(databaseUrl) {
  console.log('\n🔧 Updating backend configuration...');
  
  // Update backend .env file
  const backendEnvPath = path.join(__dirname, 'backend', '.env');
  const backendEnvContent = `PORT=3000
DATABASE_URL=${databaseUrl}
MONGO_URI=${process.env.MONGO_URI || ''}
JWT_SECRET=${process.env.JWT_SECRET || 'railway-generated-jwt-secret-change-this'}
NODE_ENV=production
CORS_ORIGIN=${process.env.CORS_ORIGIN || '*'}`;

  fs.writeFileSync(backendEnvPath, backendEnvContent);
  console.log('✅ Updated backend .env file');
  
  // Update knexfile.js for Railway
  const knexfilePath = path.join(__dirname, 'backend', 'knexfile.js');
  
  // Read current knexfile
  let knexfileContent = fs.readFileSync(knexfilePath, 'utf8');
  
  // Ensure production section uses PostgreSQL
  if (!knexfileContent.includes('railway')) {
    knexfileContent = knexfileContent.replace(
      'production: {',
      `production: {
    client: 'postgresql',
    connection: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },`
    );
    
    fs.writeFileSync(knexfilePath, knexfileContent);
    console.log('✅ Updated knexfile.js for Railway PostgreSQL');
  }
}

// Main execution
async function main() {
  try {
    console.log('🚂 Railway Deployment Fix');
    console.log('==========================');
    
    // Create database configuration
    const databaseUrl = createRailwayConfig();
    
    if (!databaseUrl) {
      console.error('\n❌ Cannot proceed without database configuration');
      console.error('🔧 Please connect PostgreSQL service in Railway dashboard');
      process.exit(1);
    }
    
    // Test connection
    const connectionOk = await testDatabaseConnection(databaseUrl);
    
    if (!connectionOk) {
      console.error('\n❌ Database connection test failed');
      console.error('🔧 Check your Railway PostgreSQL service status');
      process.exit(1);
    }
    
    // Create configuration files
    createRailwayEnvFile(databaseUrl);
    updateBackendConfig(databaseUrl);
    
    console.log('\n✅ Railway deployment fix completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Commit these changes to your repository');
    console.log('2. Push to Railway');
    console.log('3. Monitor deployment logs in Railway dashboard');
    console.log('4. Test the application endpoints');
    
    console.log('\n🔗 Test endpoints after deployment:');
    console.log(`   Health: https://${process.env.RAILWAY_PUBLIC_DOMAIN}/health`);
    console.log(`   Login: https://${process.env.RAILWAY_PUBLIC_DOMAIN}/api/auth/login`);
    
  } catch (error) {
    console.error('❌ Railway deployment fix failed:', error.message);
    process.exit(1);
  }
}

// Run the fix
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { createRailwayConfig, testDatabaseConnection };