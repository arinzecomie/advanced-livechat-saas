#!/bin/bash

# 🚀 Advanced Live Chat SaaS - Quick Deploy Script for Unix/Linux/MacOS
# One-command deployment for Unix-based systems

set -e  # Exit on any error

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║              🚀 Advanced Live Chat SaaS Deployer              ║"
echo "║                                                              ║"
echo "║         One-Command Deployment for Unix/Linux/MacOS          ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    echo "📥 Download from: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2)
REQUIRED_VERSION="16.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please install Node.js 16+"
    exit 1
fi

echo "📋 Step 1: Installing global dependencies..."
npm install -g pm2 npm-run-all concurrently || echo "⚠️  Warning: Failed to install some global dependencies"

echo "📋 Step 2: Installing project dependencies..."
npm run install:all

echo "📋 Step 3: Setting up database..."
npm run setup:db

echo "📋 Step 4: Building frontend..."
npm run build:frontend

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                 🎉 DEPLOYMENT COMPLETE!                       ║"
echo "║                                                              ║"
echo "║  Backend API: http://localhost:3000                          ║"
echo "║  Frontend App: http://localhost:5173                         ║"
echo "║  Demo Page: http://localhost:3000/demo.html                  ║"
echo "║                                                              ║"
echo "║  Default Login: admin@example.com / admin123                 ║"
echo "║                                                              ║"
echo "║  Commands:                                                   ║"
echo "║    npm run logs      - View logs                             ║"
echo "║    npm run stop      - Stop services                         ║"
echo "║    npm run health    - Health check                          ║"
echo "║                                                              ║"
echo "║  Press Ctrl+C to stop all services                           ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Start the application
npm start

# If we get here, the user stopped the application
echo ""
echo "🛑 Application stopped. To restart, run: npm start"
echo ""