#!/usr/bin/env node

/**
 * 🚂 Railway Deployment Helper
 * Ensures all files are properly configured for Railway deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Railway Deployment Configuration Check...');

// Check required files
const requiredFiles = [
  'package.json',
  'Dockerfile',
  'railway-final-start.js',
  'backend/server.js',
  'frontend/dist/index.html'
];

const missingFiles = [];
requiredFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (!fs.existsSync(fullPath)) {
    missingFiles.push(file);
    console.error('❌ Missing:', file);
  } else {
    console.log('✅ Found:', file);
  }
});

if (missingFiles.length > 0) {
  console.error('\n🚨 Missing required files for Railway deployment:');
  missingFiles.forEach(f => console.error('  -', f));
  
  if (missingFiles.includes('frontend/dist/index.html')) {
    console.log('\n💡 Frontend not built. Run: npm run build:frontend');
  }
  
  process.exit(1);
}

// Check package.json scripts
console.log('\n📋 Checking package.json scripts...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredScripts = ['start:railway'];

requiredScripts.forEach(script => {
  if (packageJson.scripts && packageJson.scripts[script]) {
    console.log('✅ Script found:', script, '→', packageJson.scripts[script]);
  } else {
    console.error('❌ Missing script:', script);
    missingFiles.push(`package.json:scripts.${script}`);
  }
});

// Check Dockerfile
console.log('\n🐳 Checking Dockerfile...');
const dockerfile = fs.readFileSync('Dockerfile', 'utf8');

if (dockerfile.includes('railway-final-start.js')) {
  console.log('✅ railway-final-start.js is copied in Dockerfile');
} else {
  console.error('❌ railway-final-start.js not found in Dockerfile COPY commands');
  missingFiles.push('Dockerfile: railway-final-start.js copy instruction');
}

if (dockerfile.includes('CMD ["npm", "run", "start:railway"]')) {
  console.log('✅ Dockerfile uses correct Railway startup command');
} else {
  console.error('❌ Dockerfile does not use start:railway command');
  missingFiles.push('Dockerfile: CMD should be ["npm", "run", "start:railway"]');
}

// Check environment variables
console.log('\n🔐 Checking Railway environment variables...');
const requiredEnvVars = ['PORT', 'NODE_ENV', 'JWT_SECRET', 'MONGO_URI'];
const envVars = process.env;

requiredEnvVars.forEach(envVar => {
  if (envVars[envVar]) {
    console.log('✅ Environment variable set:', envVar);
  } else {
    console.log('⚠️  Environment variable not set:', envVar);
  }
});

// Final report
if (missingFiles.length === 0) {
  console.log('\n🎉 All checks passed! Ready for Railway deployment.');
  console.log('\n🚀 To deploy, run:');
  console.log('   railway up');
  console.log('\n📊 After deployment, check:');
  console.log('   railway logs');
  console.log('   railway status');
} else {
  console.error('\n🚨 Deployment configuration issues found:');
  missingFiles.forEach(issue => console.error('  -', issue));
  console.log('\n🔧 Please fix the issues above before deploying.');
  process.exit(1);
}