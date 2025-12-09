#!/usr/bin/env node

/**
 * 🚂 Railway Simple Startup Script
 * Direct server startup for Railway deployment
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
const frontendDist = path.join(__dirname, 'frontend', 'dist');
if (!fs.existsSync(frontendDist) || !fs.readdirSync(frontendDist).length) {
  console.error('❌ Frontend not built. Run: npm run build');
  process.exit(1);
}

// Configure backend to serve frontend
console.log('🔧 Configuring backend to serve frontend...');
const backendServerPath = path.join(__dirname, 'backend', 'server.js');

if (fs.existsSync(backendServerPath)) {
  let backendCode = fs.readFileSync(backendServerPath, 'utf8');
  
  // Add frontend serving if not already present
  if (!backendCode.includes('frontend/dist')) {
    const frontendServingCode = `
// Serve frontend static files for single URL deployment
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendPath));

// Handle React Router client-side routing
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/socket.io') || req.path.includes('.')) {
    return next();
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});
`;
    
    // Add before the error handling or listen
    const insertPoint = backendCode.indexOf('// Error handling middleware') || 
                       backendCode.indexOf('httpServer.listen');
    
    if (insertPoint !== -1) {
      backendCode = backendCode.slice(0, insertPoint) + frontendServingCode + backendCode.slice(insertPoint);
      fs.writeFileSync(backendServerPath, backendCode);
      console.log('✅ Frontend serving configured');
    }
  }
}

// Start the backend server directly
console.log('🎯 Starting backend server...');

const serverProcess = spawn('node', ['server.js'], {
  cwd: path.join(__dirname, 'backend'),
  env: { 
    ...process.env, 
    PORT: PORT, 
    NODE_ENV: NODE_ENV,
    RAILWAY_ENVIRONMENT: 'true'
  },
  stdio: 'pipe'
});

// Monitor server output
serverProcess.stdout.on('data', (data) => {
  const message = data.toString();
  console.log('SERVER:', message.trim());
  
  // Look for server started indication
  if (message.includes('running on port') || message.includes('Server running')) {
    console.log('✅ Server appears to be running');
    
    // Test health endpoint after brief delay
    setTimeout(testHealth, 3000);
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
  if (code !== 0) {
    console.error('❌ Server crashed');
    process.exit(1);
  }
});

// Health check function
async function testHealth() {
  try {
    const response = await fetch(`http://localhost:${PORT}/health`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Health check passed:', data);
      console.log(`🎉 Application ready at http://localhost:${PORT}`);
    } else {
      console.log('⚠️ Health check response:', data);
    }
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
    console.log('🔄 Server might still be starting, will retry...');
    
    // Retry in 5 seconds
    setTimeout(testHealth, 5000);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  serverProcess.kill('SIGTERM');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down...');
  serverProcess.kill('SIGTERM');
  process.exit(0);
});

console.log('⏳ Waiting for server to start...');

// Keep script running
process.stdin.resume();