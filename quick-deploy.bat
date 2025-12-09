@echo off
REM 🚀 Advanced Live Chat SaaS - Quick Deploy Script for Windows
REM One-command deployment for Windows systems

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║              🚀 Advanced Live Chat SaaS Deployer              ║
echo ║                                                              ║
echo ║         One-Command Deployment for Windows                   ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 16+ first.
    echo 📥 Download from: https://nodejs.org/
    pause
    exit /b 1
)

echo 📋 Step 1: Installing global dependencies...
call npm install -g pm2 npm-run-all concurrently
if %errorlevel% neq 0 (
    echo ⚠️  Warning: Failed to install global dependencies
)

echo 📋 Step 2: Installing project dependencies...
call npm run install:all
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo 📋 Step 3: Setting up database...
call npm run setup:db
if %errorlevel% neq 0 (
    echo ❌ Failed to setup database
    pause
    exit /b 1
)

echo 📋 Step 4: Building frontend...
call npm run build:frontend
if %errorlevel% neq 0 (
    echo ❌ Failed to build frontend
    pause
    exit /b 1
)

echo 📋 Step 5: Starting application...
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                 🎉 DEPLOYMENT COMPLETE!                       ║
echo ║                                                              ║
echo ║  Backend API: http://localhost:3000                          ║
echo ║  Frontend App: http://localhost:5173                         ║
echo ║  Demo Page: http://localhost:3000/demo.html                  ║
echo ║                                                              ║
echo ║  Default Login: admin@example.com / admin123                 ║
echo ║                                                              ║
echo ║  Commands:                                                   ║
echo ║    npm run logs      - View logs                             ║
echo ║    npm run stop      - Stop services                         ║
echo ║    npm run health    - Health check                          ║
echo ║                                                              ║
echo ║  Press Ctrl+C to stop all services                           ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

REM Start the application
call npm start

REM If we get here, the user stopped the application
echo.
echo 🛑 Application stopped. To restart, run: npm start
echo.
pause