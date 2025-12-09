#!/usr/bin/env node

/**
 * 🚂 Railway Deployment Fix
 * Optimizes the single-url-deploy.js for Railway environment
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Applying Railway deployment fixes...');

// Read the current single-url-deploy.js
const deployScriptPath = path.join(__dirname, 'single-url-deploy.js');
let content = fs.readFileSync(deployScriptPath, 'utf8');

// Fix 1: Add faster startup for Railway environment
const railwayStartupFix = `
// Railway-specific optimizations
if (process.env.RAILWAY_ENVIRONMENT) {
  console.log('🚂 Running in Railway environment');
  
  // Reduce startup timeouts for Railway
  CONFIG.MAX_STARTUP_TIME = 30000; // 30 seconds instead of 60
  CONFIG.HEALTH_CHECK_INTERVAL = 2000; // 2 seconds instead of 5
  
  // Ensure proper port binding for Railway
  if (!process.env.PORT) {
    process.env.PORT = '3000';
  }
}`;

// Insert after CONFIG definition
const configEndIndex = content.indexOf('};', content.indexOf('const CONFIG = {'));
if (configEndIndex !== -1) {
  content = content.slice(0, configEndIndex + 2) + railwayStartupFix + content.slice(configEndIndex + 2);
}

// Fix 2: Add better error handling for MongoDB connection failures
const mongoErrorHandling = `
    // Add MongoDB connection status check
    const mongoStatus = process.env.MONGO_URI ? 'URI configured' : 'URI not set';
    console.log('📊 MongoDB status:', mongoStatus);
    
    // Add startup delay for Railway to ensure all services are ready
    if (process.env.RAILWAY_ENVIRONMENT) {
      console.log('⏳ Railway startup delay...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }`;

// Insert in startServer function before starting the server
const startServerIndex = content.indexOf('log(`Starting server on port ${CONFIG.PORT}...`, \'blue\');');
if (startServerIndex !== -1) {
  content = content.slice(0, startServerIndex) + mongoErrorHandling + '\n  ' + content.slice(startServerIndex);
}

// Fix 3: Add more detailed health check logging
const improvedHealthCheck = `
async function testHealthEndpoint() {
  try {
    const port = process.env.PORT || 3000;
    const healthUrl = \`http://localhost:\${port}/health\`;
    console.log(\`🩺 Testing health endpoint: \${healthUrl}\`);
    
    const response = await fetch(healthUrl);
    const data = await response.json();
    
    console.log('✅ Health check passed:', data);
    return response.ok;
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
    console.log('🔄 Will retry...');
    return false;
  }
}`;

// Replace the existing testHealthEndpoint function
const healthFuncStart = content.indexOf('async function testHealthEndpoint() {');
const healthFuncEnd = content.indexOf('}', content.indexOf('return false;', healthFuncStart)) + 1;
if (healthFuncStart !== -1 && healthFuncEnd !== -1) {
  content = content.slice(0, healthFuncStart) + improvedHealthCheck + content.slice(healthFuncEnd);
}

// Fix 4: Add retry logic for health checks
const retryHealthLogic = `
    // Test health endpoint with retries
    let healthCheckPassed = false;
    for (let attempt = 1; attempt <= 5; attempt++) {
      console.log(\`Health check attempt \${attempt}/5\`);
      healthCheckPassed = await testHealthEndpoint();
      if (healthCheckPassed) break;
      
      if (attempt < 5) {
        console.log(\`Waiting 2 seconds before retry...\`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    if (!healthCheckPassed) {
      throw new Error('Server health check failed after 5 attempts');
    }`;

// Replace the health check section in startServer
const healthTestSection = content.indexOf('// Test health endpoint');
const healthTestEnd = content.indexOf('if (!healthResult)') - 1;
if (healthTestSection !== -1 && healthTestEnd !== -1) {
  content = content.slice(0, healthTestSection) + retryHealthLogic + content.slice(healthTestEnd);
}

// Write the improved script
const improvedScriptPath = path.join(__dirname, 'single-url-deploy-improved.js');
fs.writeFileSync(improvedScriptPath, content);

console.log('✅ Railway fixes applied!');
console.log('📁 Created: single-url-deploy-improved.js');

// Also create a simple startup script for Railway
const railwayStartupScript = `#!/usr/bin/env node

/**
 * 🚂 Railway Startup Script
 * Simplified startup for Railway deployment
 */

console.log('🚀 Starting Advanced Live Chat SaaS for Railway...');

// Set default port if not provided
if (!process.env.PORT) {
  process.env.PORT = '3000';
}

console.log('📋 Environment:');
console.log('  PORT:', process.env.PORT);
console.log('  NODE_ENV:', process.env.NODE_ENV || 'production');
console.log('  RAILWAY_ENVIRONMENT:', process.env.RAILWAY_ENVIRONMENT || 'not set');

// Import and run the improved deploy script
const { singleURLDeploy } = require('./single-url-deploy-improved.js');

singleURLDeploy().catch(error => {
  console.error('❌ Railway startup failed:', error.message);
  process.exit(1);
});
`;

fs.writeFileSync('railway-startup.js', railwayStartupScript);
console.log('📁 Created: railway-startup.js');

// Update railway.toml to use the improved startup
const railwayTomlPath = path.join(__dirname, 'railway.toml');
let railwayToml = fs.readFileSync(railwayTomlPath, 'utf8');

railwayToml = railwayToml.replace(
  'startCommand = "npm run start:single"',
  'startCommand = "node railway-startup.js"'
);

fs.writeFileSync(railwayTomlPath, railwayToml);
console.log('✅ Updated railway.toml with improved startup command');

console.log('\n🎯 Next steps:');
console.log('1. Test locally: node railway-startup.js');
console.log('2. Deploy to Railway: railway up');
console.log('3. Monitor logs: railway logs');