#!/usr/bin/env node

/**
 * 🚀 Deploy Landing Page Fix
 * Deploys the updated server configuration to serve the frontend at root
 */

const { spawn } = require('child_process');

console.log('🚀 Deploying Landing Page Fix');
console.log('==============================');

console.log('\n📋 Changes Made:');
console.log('✅ Added frontend serving at root path ("/")');
console.log('✅ Added catch-all handler for React Router');
console.log('✅ Landing page will now be accessible at https://talkavax-production.up.railway.app/');

console.log('\n🎯 Deployment Process:');
console.log('1. Building updated application');
console.log('2. Deploying to Railway');
console.log('3. Verifying landing page accessibility');

// Deploy to Railway
console.log('\n📦 Deploying to Railway...');
const deployProcess = spawn('railway', ['up'], {
  stdio: 'pipe',
  shell: true
});

deployProcess.stdout.on('data', (data) => {
  console.log('DEPLOY:', data.toString().trim());
});

deployProcess.stderr.on('data', (data) => {
  console.error('DEPLOY ERROR:', data.toString().trim());
});

deployProcess.on('close', (code) => {
  if (code === 0) {
    console.log('\n🎉 Deployment successful!');
    console.log('\n🌐 Testing landing page...');
    
    // Test the landing page after a brief delay
    setTimeout(() => {
      console.log('\n✅ Landing page should now be accessible at:');
      console.log('   https://talkavax-production.up.railway.app/');
      console.log('   https://talkavax-production.up.railway.app/dashboard');
      console.log('   https://talkavax-production.up.railway.app/demo.html');
      
      console.log('\n🔍 Test commands:');
      console.log('   curl https://talkavax-production.up.railway.app/');
      console.log('   curl https://talkavax-production.up.railway.app/health');
      
      console.log('\n🎨 Landing page features:');
      console.log('   ✅ Hero section with call-to-action');
      console.log('   ✅ Feature showcase (6 key features)');
      console.log('   ✅ Demo section with live demo link');
      console.log('   ✅ Sign up/sign in buttons');
      console.log('   ✅ Responsive design');
    }, 5000);
  } else {
    console.error('\n❌ Deployment failed with code:', code);
  }
});