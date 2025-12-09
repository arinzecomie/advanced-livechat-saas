#!/usr/bin/env node

/**
 * 🚀 Advanced Live Chat SaaS - One-Command Deployment Script
 * 
 * This script handles the complete deployment of both backend and frontend
 * with a single command: npm start
 * 
 * Features:
 * - Automatic dependency installation
 * - Database setup and migrations
 * - Environment configuration
 * - Process management with PM2
 * - Health checks and monitoring
 * - Graceful shutdown handling
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Configuration
const CONFIG = {
  BACKEND_PORT: process.env.BACKEND_PORT || 3000,
  FRONTEND_PORT: process.env.FRONTEND_PORT || 5173,
  NODE_ENV: process.env.NODE_ENV || 'production',
  MAX_STARTUP_TIME: 60000, // 60 seconds
  HEALTH_CHECK_INTERVAL: 5000, // 5 seconds
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000 // 2 seconds
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, description) {
  log(`\n📋 ${step}: ${description}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

// Utility functions
async function checkPort(port) {
  try {
    await execAsync(`netstat -ano | findstr :${port}`);
    return false; // Port is in use
  } catch {
    return true; // Port is available
  }
}

async function waitForPort(port, timeout = 30000) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (await checkPort(port)) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    } else {
      return true;
    }
  }
  return false;
}

async function checkHealth(url, maxRetries = 10) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) return true;
    } catch {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  return false;
}

async function runCommand(command, options = {}) {
  return new Promise((resolve, reject) => {
    const { cwd, env = process.env } = options;
    const [cmd, ...args] = command.split(' ');
    
    const child = spawn(cmd, args, {
      cwd,
      env,
      stdio: 'pipe',
      shell: true
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
      if (options.verbose) {
        process.stdout.write(data);
      }
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
      if (options.verbose) {
        process.stderr.write(data);
      }
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr, code });
      } else {
        reject(new Error(`Command failed with code ${code}: ${stderr}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

// Main deployment steps
async function installDependencies() {
  logStep('1', 'Installing Dependencies');
  
  try {
    // Install root dependencies
    log('Installing root dependencies...', 'blue');
    await runCommand('npm install', { verbose: true });
    
    // Install backend dependencies
    log('Installing backend dependencies...', 'blue');
    await runCommand('npm install', { 
      cwd: path.join(__dirname, 'backend'),
      verbose: true 
    });
    
    // Install frontend dependencies
    log('Installing frontend dependencies...', 'blue');
    await runCommand('npm install', { 
      cwd: path.join(__dirname, 'frontend'),
      verbose: true 
    });
    
    logSuccess('All dependencies installed successfully');
  } catch (error) {
    logError(`Failed to install dependencies: ${error.message}`);
    throw error;
  }
}

async function setupDatabase() {
  logStep('2', 'Setting up Database');
  
  try {
    // Check if database exists
    const dbPath = path.join(__dirname, 'backend', 'dev.sqlite3');
    if (fs.existsSync(dbPath)) {
      logWarning('Database already exists, skipping migration');
      return;
    }
    
    // Run database migrations
    log('Running database migrations...', 'blue');
    await runCommand('npx knex migrate:latest --knexfile ./knexfile.js', {
      cwd: path.join(__dirname, 'backend'),
      verbose: true
    });
    
    // Seed database with demo data
    log('Seeding database with demo data...', 'blue');
    await runCommand('npx knex seed:run --knexfile ./knexfile.js', {
      cwd: path.join(__dirname, 'backend'),
      verbose: true
    });
    
    logSuccess('Database setup completed successfully');
  } catch (error) {
    logError(`Failed to setup database: ${error.message}`);
    throw error;
  }
}

async function checkEnvironment() {
  logStep('3', 'Checking Environment');
  
  try {
    // Check Node.js version
    const { stdout } = await runCommand('node --version');
    const nodeVersion = stdout.trim();
    log(`Node.js version: ${nodeVersion}`, 'blue');
    
    // Check if ports are available
    const backendPortAvailable = await checkPort(CONFIG.BACKEND_PORT);
    const frontendPortAvailable = await checkPort(CONFIG.FRONTEND_PORT);
    
    if (!backendPortAvailable) {
      logWarning(`Port ${CONFIG.BACKEND_PORT} is already in use`);
    }
    if (!frontendPortAvailable) {
      logWarning(`Port ${CONFIG.FRONTEND_PORT} is already in use`);
    }
    
    // Check environment files
    const backendEnvPath = path.join(__dirname, 'backend', '.env');
    const frontendEnvPath = path.join(__dirname, 'frontend', '.env');
    
    if (!fs.existsSync(backendEnvPath)) {
      logWarning('Backend .env file not found, using defaults');
      createDefaultBackendEnv();
    }
    
    if (!fs.existsSync(frontendEnvPath)) {
      logWarning('Frontend .env file not found, using defaults');
      createDefaultFrontendEnv();
    }
    
    logSuccess('Environment check completed');
  } catch (error) {
    logError(`Environment check failed: ${error.message}`);
    throw error;
  }
}

function createDefaultBackendEnv() {
  const envContent = `PORT=${CONFIG.BACKEND_PORT}
DATABASE_URL=sqlite://./dev.sqlite3
MONGO_URI=mongodb://localhost:27017/advanced-livechat
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=${CONFIG.NODE_ENV}
CORS_ORIGIN=http://localhost:${CONFIG.FRONTEND_PORT}`;
  
  fs.writeFileSync(path.join(__dirname, 'backend', '.env'), envContent);
  log('Created default backend .env file', 'blue');
}

function createDefaultFrontendEnv() {
  const envContent = `VITE_API_URL=http://localhost:${CONFIG.BACKEND_PORT}`;
  
  fs.writeFileSync(path.join(__dirname, 'frontend', '.env'), envContent);
  log('Created default frontend .env file', 'blue');
}

async function startBackend() {
  logStep('4', 'Starting Backend Server');
  
  try {
    log(`Starting backend on port ${CONFIG.BACKEND_PORT}...`, 'blue');
    
    // Start backend with PM2 in production, npm run dev in development
    const command = CONFIG.NODE_ENV === 'production' 
      ? 'pm2 start server.js --name "livechat-backend"' 
      : 'npm run dev';
    
    const backendProcess = spawn(command, [], {
      cwd: path.join(__dirname, 'backend'),
      env: { ...process.env, PORT: CONFIG.BACKEND_PORT },
      stdio: 'pipe',
      shell: true
    });
    
    // Wait for backend to start
    log('Waiting for backend to start...', 'blue');
    const backendStarted = await waitForPort(CONFIG.BACKEND_PORT, 30000);
    
    if (!backendStarted) {
      throw new Error('Backend failed to start within 30 seconds');
    }
    
    // Check health endpoint
    const healthCheck = await checkHealth(`http://localhost:${CONFIG.BACKEND_PORT}/health`);
    
    if (!healthCheck) {
      throw new Error('Backend health check failed');
    }
    
    logSuccess(`Backend server started successfully on port ${CONFIG.BACKEND_PORT}`);
    
    return backendProcess;
  } catch (error) {
    logError(`Failed to start backend: ${error.message}`);
    throw error;
  }
}

async function startFrontend() {
  logStep('5', 'Starting Frontend Server');
  
  try {
    log(`Starting frontend on port ${CONFIG.FRONTEND_PORT}...`, 'blue');
    
    // Build frontend first if in production
    if (CONFIG.NODE_ENV === 'production') {
      log('Building frontend for production...', 'blue');
      await runCommand('npm run build', {
        cwd: path.join(__dirname, 'frontend'),
        verbose: true
      });
    }
    
    
    // Start frontend
    const command = CONFIG.NODE_ENV === 'production' 
      ? 'pm2 start dist --name "livechat-frontend"' 
      : 'npm run dev';
    
    const frontendProcess = spawn(command, [], {
      cwd: path.join(__dirname, 'frontend'),
      env: { ...process.env, PORT: CONFIG.FRONTEND_PORT },
      stdio: 'pipe',
      shell: true
    });
    
    // Wait for frontend to start
    log('Waiting for frontend to start...', 'blue');
    const frontendStarted = await waitForPort(CONFIG.FRONTEND_PORT, 30000);
    
    if (!frontendStarted) {
      throw new Error('Frontend failed to start within 30 seconds');
    }
    
    logSuccess(`Frontend server started successfully on port ${CONFIG.FRONTEND_PORT}`);
    
    return frontendProcess;
  } catch (error) {
    logError(`Failed to start frontend: ${error.message}`);
    throw error;
  }
}

function displayStartupInfo() {
  logStep('6', 'Deployment Complete');
  
  logSuccess('🎉 Advanced Live Chat SaaS deployed successfully!');
  
  log('\n📊 Application URLs:', 'cyan');
  log(`   Backend API: http://localhost:${CONFIG.BACKEND_PORT}`, 'blue');
  log(`   Frontend App: http://localhost:${CONFIG.FRONTEND_PORT}`, 'blue');
  log(`   Demo Page: http://localhost:${CONFIG.BACKEND_PORT}/demo.html`, 'blue');
  log(`   Health Check: http://localhost:${CONFIG.BACKEND_PORT}/health`, 'blue');
  
  log('\n🔑 Default Credentials:', 'cyan');
  log('   Admin: admin@example.com / admin123', 'blue');
  log('   Demo User: demo@example.com / user123', 'blue');
  
  log('\n📋 Available Commands:', 'cyan');
  log('   npm run health    - Check application health', 'blue');
  log('   npm run logs      - View application logs', 'blue');
  log('   npm run stop      - Stop all services', 'blue');
  log('   npm run restart   - Restart all services', 'blue');
  
  log('\n🧪 Testing:', 'cyan');
  log('   Widget Test: Open http://localhost:3000/demo.html', 'blue');
  log('   API Test: npm test', 'blue');
  
  log('\n📚 Documentation:', 'cyan');
  log('   README: Check the project README.md', 'blue');
  log('   Setup Guide: BACKEND_SETUP_GUIDE.md', 'blue');
  log('   Feature Specs: FEATURE_SPECIFICATION.md', 'blue');
  
  log('\n⚡ Next Steps:', 'cyan');
  log('   1. Test the demo page in your browser', 'blue');
  log('   2. Login to the admin dashboard', 'blue');
  log('   3. Create your first site', 'blue');
  log('   4. Embed the widget on your website', 'blue');
  
  log('\n🛠️  Management:', 'cyan');
  log('   View logs: npm run logs', 'blue');
  log('   Stop services: npm run stop', 'blue');
  log('   Check status: npm run status', 'blue');
}

async function handleGracefulShutdown(processes) {
  log('\n🛑 Shutting down gracefully...', 'yellow');
  
  for (const proc of processes) {
    if (proc && !proc.killed) {
      proc.kill('SIGTERM');
    }
  }
  
  // Wait for processes to exit
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  logSuccess('All services stopped gracefully');
  process.exit(0);
}

// Main deployment function
async function deploy() {
  log(`${colors.bright}${colors.cyan}`);
  log('╔══════════════════════════════════════════════════════════════╗');
  log('║              🚀 Advanced Live Chat SaaS Deployer              ║');
  log('║                                                              ║');
  log('║         One-Command Deployment & Process Management          ║');
  log('╚══════════════════════════════════════════════════════════════╝');
  log(`${colors.reset}`);
  
  const startTime = Date.now();
  const processes = [];
  
  try {
    // Setup graceful shutdown
    process.on('SIGINT', () => handleGracefulShutdown(processes));
    process.on('SIGTERM', () => handleGracefulShutdown(processes));
    
    // Check if dependencies are already installed
    const nodeModulesExists = fs.existsSync(path.join(__dirname, 'node_modules'));
    const backendNodeModulesExists = fs.existsSync(path.join(__dirname, 'backend', 'node_modules'));
    const frontendNodeModulesExists = fs.existsSync(path.join(__dirname, 'frontend', 'node_modules'));
    
    if (!nodeModulesExists || !backendNodeModulesExists || !frontendNodeModulesExists) {
      await installDependencies();
    } else {
      logSuccess('Dependencies already installed, skipping...');
    }
    
    await checkEnvironment();
    await setupDatabase();
    
    // Start services
    const backendProcess = await startBackend();
    processes.push(backendProcess);
    
    // Give backend a moment to fully initialize
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const frontendProcess = await startFrontend();
    processes.push(frontendProcess);
    
    // Final setup
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const endTime = Date.now();
    const deploymentTime = ((endTime - startTime) / 1000).toFixed(1);
    
    displayStartupInfo();
    
    log(`\n⏱️  Total deployment time: ${deploymentTime}s`, 'cyan');
    logSuccess('Application is ready for production use!');
    
    // Keep the script running
    process.stdin.resume();
    
  } catch (error) {
    logError(`Deployment failed: ${error.message}`);
    log('Check the logs above for more details', 'yellow');
    process.exit(1);
  }
}

// Run deployment if this script is executed directly
if (require.main === module) {
  deploy().catch(error => {
    logError(`Unhandled error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { deploy, runCommand, checkHealth };