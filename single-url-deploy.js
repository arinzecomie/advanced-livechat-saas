#!/usr/bin/env node

/**
 * 🚀 Advanced Live Chat SaaS - Single URL Deployment Script
 * 
 * This script deploys both backend and frontend to run on a single URL.
 * The backend serves the frontend static files, so you only need one port.
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Configuration
const CONFIG = {
  PORT: process.env.PORT || 3000,
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

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
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

// Configure backend to serve frontend
async function configureBackendForSingleURL() {
  logStep('1', 'Configuring Backend for Single URL Deployment');
  
  // Create backend configuration for serving frontend
  const backendServerPath = path.join(__dirname, 'backend', 'server.js');
  
  if (!fs.existsSync(backendServerPath)) {
    throw new Error('Backend server.js not found');
  }
  
  // Add static file serving configuration to backend
  const staticServingConfig = `
// Single URL Deployment Configuration
const path = require('path');

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Handle React Router client-side routing
app.get('*', (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith('/api') || req.path.startsWith('/socket.io') || req.path.includes('.')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});
`;

  // Read current backend server
  let backendCode = fs.readFileSync(backendServerPath, 'utf8');
  
  // Add static serving before error handling middleware
  const insertPoint = backendCode.indexOf('// Error handling middleware');
  if (insertPoint !== -1) {
    backendCode = backendCode.slice(0, insertPoint) + staticServingConfig + '\n' + backendCode.slice(insertPoint);
  } else {
    // Add at the end before app.listen
    const listenPoint = backendCode.indexOf('app.listen');
    if (listenPoint !== -1) {
      backendCode = backendCode.slice(0, listenPoint) + staticServingConfig + '\n' + backendCode.slice(listenPoint);
    } else {
      // Append to end
      backendCode += '\n' + staticServingConfig;
    }
  }
  
  // Backup original server.js
  fs.writeFileSync(backendServerPath + '.backup', fs.readFileSync(backendServerPath, 'utf8'));
  fs.writeFileSync(backendServerPath, backendCode);
  
  logSuccess('Backend configured to serve frontend static files');
}

// Build frontend
async function buildFrontend() {
  logStep('2', 'Building Frontend for Production');
  
  try {
    log('Installing frontend dependencies...', 'blue');
    await runCommand('npm install', {
      cwd: path.join(__dirname, 'frontend'),
      verbose: true
    });
    
    log('Building frontend...', 'blue');
    await runCommand('npm run build', {
      cwd: path.join(__dirname, 'frontend'),
      verbose: true
    });
    
    logSuccess('Frontend built successfully');
  } catch (error) {
    logError(`Frontend build failed: ${error.message}`);
    throw error;
  }
}

// Setup backend
async function setupBackend() {
  logStep('3', 'Setting up Backend');
  
  try {
    log('Installing backend dependencies...', 'blue');
    await runCommand('npm install', {
      cwd: path.join(__dirname, 'backend'),
      verbose: true
    });
    
    // Setup database if needed
    const dbPath = path.join(__dirname, 'backend', 'dev.sqlite3');
    if (!fs.existsSync(dbPath)) {
      log('Setting up database...', 'blue');
      await runCommand('npm run migrate', {
        cwd: path.join(__dirname, 'backend'),
        verbose: true
      });
      
      await runCommand('npm run seed', {
        cwd: path.join(__dirname, 'backend'),
        verbose: true
      });
    }
    
    logSuccess('Backend setup completed');
  } catch (error) {
    logError(`Backend setup failed: ${error.message}`);
    throw error;
  }
}

// Start server
async function startServer() {
  logStep('4', 'Starting Single URL Server');
  
  try {
    log(`Starting server on port ${CONFIG.PORT}...`, 'blue');
    
    const serverProcess = spawn('npm', ['start'], {
      cwd: path.join(__dirname, 'backend'),
      env: { ...process.env, PORT: CONFIG.PORT, NODE_ENV: CONFIG.NODE_ENV },
      stdio: 'pipe'
    });
    
    // Log server output
    serverProcess.stdout.on('data', (data) => {
      const message = data.toString();
      if (message.includes('Server running') || message.includes('listening')) {
        logSuccess(`Server started on port ${CONFIG.PORT}`);
      }
      if (CONFIG.NODE_ENV === 'development') {
        process.stdout.write(data);
      }
    });
    
    serverProcess.stderr.on('data', (data) => {
      process.stderr.write(data);
    });
    
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test health endpoint
    const healthResult = await testHealthEndpoint();
    if (!healthResult) {
      throw new Error('Server health check failed');
    }
    
    logSuccess(`Server is running at http://localhost:${CONFIG.PORT}`);
    
    return serverProcess;
  } catch (error) {
    logError(`Failed to start server: ${error.message}`);
    throw error;
  }
}

async function testHealthEndpoint() {
  try {
    const response = await fetch(`http://localhost:${CONFIG.PORT}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

function displayCompletionInfo() {
  log(`${colors.bright}${colors.cyan}`);
  log('╔══════════════════════════════════════════════════════════════╗');
  log('║              🎉 SINGLE URL DEPLOYMENT COMPLETE!              ║');
  log('║                                                              ║');
  log('║         Your Live Chat SaaS is Ready to Use!                ║');
  log('╚══════════════════════════════════════════════════════════════╝');
  log(`${colors.reset}`);
  
  log(`\n🌐 Access Your Application:`, 'cyan');
  log(`   Main URL: http://localhost:${CONFIG.PORT}`, 'blue');
  log(`   Dashboard: http://localhost:${CONFIG.PORT}/dashboard`, 'blue');
  log(`   Demo Page: http://localhost:${CONFIG.PORT}/demo.html`, 'blue');
  log(`   Health Check: http://localhost:${CONFIG.PORT}/health`, 'blue');
  
  log(`\n🔑 Default Credentials:`, 'cyan');
  log(`   Admin: admin@example.com / admin123`, 'blue');
  log(`   Demo User: demo@example.com / user123`, 'blue');
  
  log(`\n📋 API Endpoints:`, 'cyan');
  log(`   API Base: http://localhost:${CONFIG.PORT}/api`, 'blue');
  log(`   Auth: http://localhost:${CONFIG.PORT}/api/auth/*`, 'blue');
  log(`   Widget: http://localhost:${CONFIG.PORT}/api/widget/*`, 'blue');
  log(`   Admin: http://localhost:${CONFIG.PORT}/api/admin/*`, 'blue');
  
  log(`\n🛠️  Management:`, 'cyan');
  log(`   View logs: npm run logs`, 'blue');
  log(`   Stop server: Ctrl+C`, 'blue');
  log(`   Health check: curl http://localhost:${CONFIG.PORT}/health`, 'blue');
  
  log(`\n📚 Next Steps:`, 'cyan');
  log(`   1. Open http://localhost:${CONFIG.PORT} in your browser`, 'blue');
  log(`   2. Login to the admin dashboard`, 'blue');
  log(`   3. Create your first site`, 'blue');
  log(`   4. Embed the widget on your website`, 'blue');
  
  log(`\n🎯 Single URL Benefits:`, 'cyan');
  log(`   ✅ One domain for everything`, 'blue');
  log(`   ✅ Simplified CORS configuration`, 'blue');
  log(`   ✅ Easier SSL/HTTPS setup`, 'blue');
  log(`   ✅ Cleaner architecture`, 'blue');
  log(`   ✅ Better for production deployment`, 'blue');
}

// Main deployment function
async function singleURLDeploy() {
  log(`${colors.bright}${colors.cyan}`);
  log('╔══════════════════════════════════════════════════════════════╗');
  log('║              🚀 Single URL Deployment Script                  ║');
  log('║                                                              ║');
  log('║         Backend + Frontend on One Domain/Port               ║');
  log('╚══════════════════════════════════════════════════════════════╝');
  log(`${colors.reset}`);
  
  const startTime = Date.now();
  
  try {
    // Check if frontend is built
    const frontendDistPath = path.join(__dirname, 'frontend', 'dist');
    const frontendBuilt = fs.existsSync(frontendDistPath) && fs.readdirSync(frontendDistPath).length > 0;
    
    if (!frontendBuilt) {
      await buildFrontend();
    } else {
      logSuccess('Frontend already built, skipping build step');
    }
    
    // Configure backend to serve frontend
    await configureBackendForSingleURL();
    
    // Setup backend
    await setupBackend();
    
    // Start server
    const serverProcess = await startServer();
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      log('\n🛑 Shutting down gracefully...', 'yellow');
      serverProcess.kill('SIGTERM');
      process.exit(0);
    });
    
    const endTime = Date.now();
    const deploymentTime = ((endTime - startTime) / 1000).toFixed(1);
    
    displayCompletionInfo();
    
    log(`\n⏱️  Deployment time: ${deploymentTime}s`, 'cyan');
    logSuccess('Single URL deployment complete!');
    
    // Keep script running
    process.stdin.resume();
    
  } catch (error) {
    logError(`Deployment failed: ${error.message}`);
    process.exit(1);
  }
}

// Update package.json with single URL scripts
function updatePackageJson() {
  const packageJsonPath = path.join(__dirname, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Add single URL deployment scripts
  packageJson.scripts = {
    ...packageJson.scripts,
    "build:single": "npm install --prefix backend && npm install --prefix frontend && npm run build --prefix frontend",
    "deploy:single": "node single-url-deploy.js",
    "deploy:single:prod": "NODE_ENV=production node single-url-deploy.js",
    "build": "npm run build:single",
    "start:single": "node single-url-deploy.js"
  };
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  logSuccess('Updated package.json with single URL deployment scripts');
}

// Run deployment if this script is executed directly
if (require.main === module) {
  // Update package.json first
  updatePackageJson();
  
  singleURLDeploy().catch(error => {
    logError(`Unhandled error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { singleURLDeploy, updatePackageJson };