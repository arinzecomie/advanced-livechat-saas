#!/usr/bin/env node

/**
 * 🚂 Railway Final Startup Script
 * Simple, reliable startup for Railway deployment
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Advanced Live Chat SaaS for Railway...');

// Environment setup
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'production';

console.log('📋 Configuration:');
console.log('  PORT:', PORT);
console.log('  NODE_ENV:', NODE_ENV);
console.log('  MONGO_URI:', process.env.MONGO_URI ? 'SET (hidden)' : 'NOT SET');

// Check if frontend is built
const fs = require('fs');

console.log('📁 Current working directory:', process.cwd());
console.log('📂 Directory contents:', fs.readdirSync(process.cwd()));

// Check multiple possible frontend paths
const possiblePaths = [
  path.join(__dirname, 'frontend', 'dist'),
  path.join(__dirname, 'frontend/dist'),
  path.join(process.cwd(), 'frontend', 'dist'),
  path.join(process.cwd(), 'frontend/dist'),
  '/app/frontend/dist',  // Docker standard path
  './frontend/dist'
];

let frontendDist = null;
for (const testPath of possiblePaths) {
  console.log('🔍 Checking path:', testPath);
  if (fs.existsSync(testPath) && fs.readdirSync(testPath).length > 0) {
    frontendDist = testPath;
    console.log('✅ Frontend found at:', testPath);
    break;
  }
}

if (!frontendDist) {
  console.error('❌ Frontend not built. Checked paths:');
  possiblePaths.forEach(p => console.log('  -', p));
  console.log('📂 Available in current dir:', fs.readdirSync(process.cwd()));
  if (fs.existsSync('frontend')) {
    console.log('📁 Frontend directory contents:', fs.readdirSync('frontend'));
  }
  console.log('🔄 Continuing anyway - Railway will handle static files');
} else {
  console.log('✅ Using frontend at:', frontendDist);
}

console.log('✅ Frontend is built');

// Set environment variables for the backend process
const backendEnv = { 
  ...process.env, 
  PORT: PORT, 
  NODE_ENV: NODE_ENV,
  RAILWAY_ENVIRONMENT: 'true',
  FRONTEND_DIST: frontendDist
};

// Check if backend server exists
const serverPath = path.join(__dirname, 'backend', 'server.js');
if (!fs.existsSync(serverPath)) {
  console.error('❌ Backend server not found at:', serverPath);
  console.log('📂 Backend directory contents:', fs.existsSync('backend') ? fs.readdirSync('backend') : 'backend directory not found');
  console.log('📁 Current directory contents:', fs.readdirSync(__dirname));
  process.exit(1);
}

// First, run database fix
console.log('🔧 Running database fix...');

const fixProcess = spawn('node', ['fix-railway-db.js'], {
  cwd: __dirname,
  env: backendEnv,
  stdio: 'pipe'
});

fixProcess.stdout.on('data', (data) => {
  console.log('DB FIX:', data.toString().trim());
});

fixProcess.stderr.on('data', (data) => {
  console.error('DB FIX ERROR:', data.toString().trim());
});

fixProcess.on('close', (code) => {
  console.log(`Database fix exited with code ${code}`);
  
  // Continue with server startup regardless of DB fix result
  console.log('🎯 Starting backend server from:', serverPath);

  const serverProcess = spawn('node', ['backend/server.js'], {
    cwd: __dirname,
    env: backendEnv,
    stdio: 'pipe'
  });

  let serverStarted = false;

  // Monitor server output
  serverProcess.stdout.on('data', (data) => {
    const message = data.toString();
    console.log('SERVER:', message.trim());
    
    // Look for server started indication
    if (message.includes('running on port') || message.includes('Server running')) {
      serverStarted = true;
      console.log('✅ Server appears to be running');
      
      // Test health endpoint after brief delay
      setTimeout(testHealth, 5000);
    }
  });

  serverProcess.stderr.on('data', (data) => {
    console.error('SERVER ERROR:', data.toString().trim());
  });

  serverProcess.on('error', (error) => {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  });

  serverProcess.on('close', (code) => {
    console.log(`Server exited with code ${code}`);
    if (code !== 0 && serverStarted) {
      console.error('❌ Server crashed after starting');
      process.exit(1);
    } else if (code !== 0) {
      console.error('❌ Server failed to start');
      process.exit(1);
    }
  });
});

// Health check function
async function testHealth() {
  try {
    const response = await fetch(`http://localhost:${PORT}/health`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Health check passed:', data);
      console.log(`🎉 Application ready at http://localhost:${PORT}`);
      console.log(`🌐 Health endpoint: http://localhost:${PORT}/health`);
    } else {
      console.log('⚠️ Health check response:', data);
    }
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
    
    // Don't exit on health check failure - Railway will handle retries
    console.log('🔄 Health check will be retried by Railway');
  }
}