#!/usr/bin/env node

/**
 * 🐘 Railway PostgreSQL-Only Startup Script
 * Forces PostgreSQL usage, removes SQLite fallback
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🐘 Starting Advanced Live Chat SaaS with PostgreSQL...');

// Environment setup
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'production';

console.log('📋 PostgreSQL Configuration:');
console.log('  PORT:', PORT);
console.log('  NODE_ENV:', NODE_ENV);
console.log('  DATABASE_URL:', process.env.DATABASE_URL ? 'SET (hidden)' : 'NOT SET');
console.log('  MONGO_URI:', process.env.MONGO_URI ? 'SET (hidden)' : 'NOT SET');

// PostgreSQL validation
if (!process.env.DATABASE_URL && !process.env.PGHOST) {
  console.error('❌ No PostgreSQL configuration found!');
  console.error('🔧 Please set DATABASE_URL or PGHOST environment variable');
  console.error('📋 Go to Railway Dashboard > Your Project > Variables');
  console.error('🔗 Add PostgreSQL service if not connected');
  process.exit(1);
}

// Force PostgreSQL mode
const backendEnv = { 
  ...process.env, 
  PORT: PORT, 
  NODE_ENV: NODE_ENV,
  RAILWAY_ENVIRONMENT: 'true',
  FORCE_POSTGRESQL: 'true',
  DISABLE_SQLITE_FALLBACK: 'true'
};

console.log('✅ PostgreSQL environment configured');

// Check if frontend is built
const fs = require('fs');

console.log('📁 Current working directory:', process.cwd());
console.log('📂 Directory contents:', fs.readdirSync(process.cwd()).slice(0, 10)); // Show first 10 items

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
  console.log('📂 Available in current dir:', fs.readdirSync(process.cwd()).slice(0, 10));
  if (fs.existsSync('frontend')) {
    console.log('📁 Frontend directory contents:', fs.readdirSync('frontend'));
  }
  console.log('🔄 Continuing without frontend - Railway will handle static files');
} else {
  console.log('✅ Using frontend at:', frontendDist);
}

// Check if backend server exists
const serverPath = path.join(__dirname, 'backend', 'server.js');
if (!fs.existsSync(serverPath)) {
  console.error('❌ Backend server not found at:', serverPath);
  console.log('📂 Backend directory contents:', fs.existsSync('backend') ? fs.readdirSync('backend') : 'backend directory not found');
  console.log('📁 Current directory contents:', fs.readdirSync(__dirname).slice(0, 10));
  process.exit(1);
}

console.log('✅ Backend server found');

// Test PostgreSQL connection first
console.log('\n🧪 Testing PostgreSQL connection...');

testPostgreSQLConnection().then((connected) => {
  if (connected) {
    console.log('✅ PostgreSQL connection successful');
    startApplication();
  } else {
    console.error('❌ PostgreSQL connection failed');
    console.error('🔧 Check your Railway PostgreSQL service and DATABASE_URL');
    process.exit(1);
  }
}).catch((error) => {
  console.error('❌ PostgreSQL test error:', error.message);
  process.exit(1);
});

// Test PostgreSQL connection
async function testPostgreSQLConnection() {
  try {
    const { Client } = require('pg');
    
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    await client.connect();
    console.log('✅ PostgreSQL client connected');
    
    // Test basic query
    const result = await client.query('SELECT current_database(), version()');
    console.log('📊 PostgreSQL info:', {
      database: result.rows[0].current_database,
      version: result.rows[0].version.split(' ')[0]
    });
    
    await client.end();
    return true;
  } catch (error) {
    console.error('❌ PostgreSQL connection test failed:', error.message);
    return false;
  }
}

// Start the application
function startApplication() {
  console.log('\n🎯 Starting backend server with PostgreSQL...');

  // Use PostgreSQL-only database provider
  backendEnv.FORCE_POSTGRESQL = 'true';
  backendEnv.DISABLE_SQLITE_FALLBACK = 'true';

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
    if (message.includes('running on port') || message.includes('PostgreSQL database connected')) {
      serverStarted = true;
      console.log('✅ PostgreSQL server appears to be running');
      
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
      console.error('❌ PostgreSQL server crashed after starting');
      process.exit(1);
    } else if (code !== 0) {
      console.error('❌ PostgreSQL server failed to start');
      process.exit(1);
    }
  });
}

// Health check function
async function testHealth() {
  try {
    const response = await fetch(`http://localhost:${PORT}/health`);
    const data = await response.json();
    
    if (response.ok && data.database === 'postgresql') {
      console.log('✅ PostgreSQL health check passed:', data);
      console.log(`🎉 PostgreSQL application ready at http://localhost:${PORT}`);
      console.log(`🌐 Health endpoint: http://localhost:${PORT}/health`);
      console.log('🎯 Test credentials: admin@example.com / admin123');
    } else {
      console.log('⚠️ Health check response:', data);
      if (data.database !== 'postgresql') {
        console.error('❌ Health check shows wrong database type:', data.database);
      }
    }
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
    console.log('🔄 Health check will be retried by Railway');
  }
}