#!/usr/bin/env node

/**
 * 🐬 MySQL Railway Startup Script
 * Forces MySQL usage, removes PostgreSQL/SQLite fallback
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🐬 Starting Advanced Live Chat SaaS with MySQL...');

// Environment setup
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'production';

console.log('📋 MySQL Configuration:');
console.log('  PORT:', PORT);
console.log('  NODE_ENV:', NODE_ENV);
console.log('  DATABASE_URL:', process.env.DATABASE_URL ? 'SET (hidden)' : 'NOT SET');
console.log('  MONGO_URI:', process.env.MONGO_URI ? 'SET (hidden)' : 'NOT SET');

// MySQL validation
if (!process.env.DATABASE_URL && !process.env.DB_HOST) {
  console.error('❌ No MySQL configuration found!');
  console.error('🔧 Please set DATABASE_URL or DB_HOST environment variable');
  console.error('📋 Go to Railway Dashboard > Your Project > Variables');
  console.error('🔗 Add MySQL service if not connected');
  process.exit(1);
}

// Force MySQL mode
const backendEnv = { 
  ...process.env, 
  PORT: PORT, 
  NODE_ENV: NODE_ENV,
  FORCE_MYSQL: 'true',
  DISABLE_POSTGRESQL: 'true'
};

console.log('✅ MySQL environment configured');

// Test MySQL connection first
console.log('\n🧪 Testing MySQL connection...');

testMySQLConnection().then((connected) => {
  if (connected) {
    console.log('✅ MySQL connection successful');
    startApplication();
  } else {
    console.error('❌ MySQL connection failed');
    console.error('🔧 Check your Railway MySQL service and DATABASE_URL');
    process.exit(1);
  }
}).catch((error) => {
  console.error('❌ MySQL test error:', error.message);
  process.exit(1);
});

// Test MySQL connection
async function testMySQLConnection() {
  try {
    const { createConnection } = require('mysql2/promise');
    
    const connection = await createConnection({
      uri: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    await connection.execute('SELECT 1');
    console.log('✅ MySQL client connected');
    
    // Get database info
    const [rows] = await connection.execute('SELECT DATABASE() as db, VERSION() as version');
    console.log('📊 MySQL info:', {
      database: rows[0].db,
      version: rows[0].version
    });
    
    await connection.end();
    return true;
  } catch (error) {
    console.error('❌ MySQL connection test failed:', error.message);
    return false;
  }
}

// Start the application
function startApplication() {
  console.log('\n🎯 Starting backend server with MySQL...');

  // Use MySQL-only database provider
  backendEnv.FORCE_MYSQL = 'true';
  backendEnv.DISABLE_POSTGRESQL = 'true';

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
    if (message.includes('running on port') || message.includes('MySQL database connected')) {
      serverStarted = true;
      console.log('✅ MySQL server appears to be running');
      
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
      console.error('❌ MySQL server crashed after starting');
      process.exit(1);
    } else if (code !== 0) {
      console.error('❌ MySQL server failed to start');
      process.exit(1);
    }
  });
}

// Health check function
async function testHealth() {
  try {
    const response = await fetch(`http://localhost:${PORT}/health`);
    const data = await response.json();
    
    if (response.ok && data.database === 'mysql') {
      console.log('✅ MySQL health check passed:', data);
      console.log(`🎉 MySQL application ready at http://localhost:${PORT}`);
      console.log(`🌐 Health endpoint: http://localhost:${PORT}/health`);
      console.log('🎯 Test credentials: admin@example.com / admin123');
    } else {
      console.log('⚠️ Health check response:', data);
      if (data.database !== 'mysql') {
        console.error('❌ Health check shows wrong database type:', data.database);
      }
    }
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
    console.log('🔄 Health check will be retried by Railway');
  }
}