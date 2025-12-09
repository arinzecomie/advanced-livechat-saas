# 🚀 Advanced Live Chat SaaS - One-Command Deployment Guide

This guide shows you how to deploy the entire Advanced Live Chat SaaS platform (both backend and frontend) with a single command.

## 📋 Prerequisites

### System Requirements
- **Node.js**: 16.0.0 or higher
- **npm**: 8.0.0 or higher
- **Windows**: Windows 10/11 with Command Prompt/PowerShell
- **Linux/Mac**: Bash terminal
- **Memory**: Minimum 2GB RAM
- **Storage**: 1GB free space

### Required Software
- Node.js (download from [nodejs.org](https://nodejs.org/))
- Git (for cloning repositories)

## ⚡ Quick Start - One Command Deployment

### Option 1: Automatic Deployment Script (Recommended)

**For Windows:**
```cmd
# Clone or navigate to your project directory
cd C:\Users\Kizito\livechatwithreact\advanced-livechat-saas

# Run the quick deploy script
quick-deploy.bat
```

**For Linux/Mac:**
```bash
# Clone or navigate to your project directory
cd /path/to/advanced-livechat-saas

# Make script executable and run
chmod +x deploy.sh
./deploy.sh
```

### Option 2: Manual One-Command Deployment

**Using npm start (Universal):**
```bash
# Navigate to project root
cd advanced-livechat-saas

# Single command deployment
npm start
```

**Using Node.js directly:**
```bash
# Navigate to project root
cd advanced-livechat-saas

# Run the deployment script
node deploy.js
```

## 🎯 What the Deployment Script Does

### Automatic Setup Process
1. **Dependency Installation**
   - Installs all npm packages for root, backend, and frontend
   - Sets up PM2 for process management
   - Configures global dependencies

2. **Database Setup**
   - Creates SQLite database if not exists
   - Runs database migrations
   - Seeds demo data with default users and sites

3. **Environment Configuration**
   - Creates `.env` files with default configurations
   - Sets up ports and API URLs
   - Configures CORS and security settings

4. **Build Process**
   - Builds frontend for production
   - Optimizes assets and bundles
   - Sets up static file serving

5. **Service Startup**
   - Starts backend server on port 3000
   - Starts frontend server on port 5173
   - Configures PM2 for process management
   - Runs health checks to ensure services are running

6. **Final Verification**
   - Checks API endpoints
   - Validates database connections
   - Tests Socket.IO connections
   - Displays deployment summary

## 📊 Deployment Progress

During deployment, you'll see:

```
╔══════════════════════════════════════════════════════════════╗
║              🚀 Advanced Live Chat SaaS Deployer              ║
╚══════════════════════════════════════════════════════════════╝

📋 Step 1: Installing Dependencies
📋 Step 2: Setting up Database
📋 Step 3: Checking Environment
📋 Step 4: Starting Backend Server
📋 Step 5: Starting Frontend Server
📋 Step 6: Deployment Complete

✅ All services started successfully!
```

## 🌐 Access Your Application

After successful deployment, access your application at:

- **Backend API**: http://localhost:3000
- **Frontend Dashboard**: http://localhost:5173
- **Demo Page**: http://localhost:3000/demo.html
- **Health Check**: http://localhost:3000/health

### Default Login Credentials
- **Admin**: `admin@example.com` / `admin123`
- **Demo User**: `demo@example.com` / `user123`

## 🛠️ Management Commands

### Process Management
```bash
# View all logs
npm run logs

# Check service status
npm run status

# Stop all services
npm run stop

# Restart all services
npm run restart

# Health check
npm run health
```

### Individual Service Control
```bash
# Start only backend
npm run start:backend

# Start only frontend
npm run start:frontend

# Development mode (with hot reload)
npm run dev
```

## 🔧 Configuration Options

### Environment Variables
The deployment script automatically creates `.env` files with sensible defaults. You can customize them:

**Backend Configuration** (`backend/.env`):
```env
PORT=3000
DATABASE_URL=sqlite://./dev.sqlite3
MONGO_URI=mongodb://localhost:27017/advanced-livechat
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=production
CORS_ORIGIN=http://localhost:5173
```

**Frontend Configuration** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:3000
```

### Custom Ports
If you need to use different ports:

```bash
# Set custom ports before running deployment
set BACKEND_PORT=4000    # Windows
set FRONTEND_PORT=6000   # Windows

export BACKEND_PORT=4000   # Linux/Mac
export FRONTEND_PORT=6000  # Linux/Mac

# Then run deployment
npm start
```

## 🧪 Testing Your Deployment

### Quick Health Check
```bash
# Check if services are running
npm run health

# Manual health check
curl http://localhost:3000/health
```

### Test the Widget
1. Open browser to: http://localhost:3000/demo.html
2. You should see a chat bubble in the bottom-right
3. Click the bubble to open chat

### Test Authentication
```bash
# Test login endpoint
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

## 🚨 Troubleshooting

### Common Issues

**1. Port Already in Use**
```bash
# Error: Port 3000 is already in use
# Solution: Use different ports or kill existing processes

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

**2. Database Errors**
```bash
# Reset database
rm backend/dev.sqlite3
cd backend && npm run migrate && npm run seed
```

**3. Dependencies Issues**
```bash
# Clear node_modules and reinstall
rm -rf node_modules backend/node_modules frontend/node_modules
npm run install:all
```

**4. Build Failures**
```bash
# Clear build cache and rebuild
rm -rf frontend/dist
npm run build:frontend
```

### Logs and Debugging
```bash
# View all logs
npm run logs

# View specific service logs
pm2 logs advanced-livechat-backend
pm2 logs advanced-livechat-frontend

# Check PM2 status
pm2 status

# View log files
cat logs/backend-error.log
cat logs/frontend-error.log
```

## 📈 Performance Optimization

### Production Deployment
For production deployment with better performance:

1. **Use Production Build**
   ```bash
   NODE_ENV=production npm start
   ```

2. **Enable PM2 Cluster Mode**
   ```bash
   # Edit ecosystem.config.js to increase instances
   apps: [{
     instances: 2,  // Use 2 instances
     exec_mode: 'cluster'
   }]
   ```

3. **Database Optimization**
   ```bash
   # For high traffic, consider PostgreSQL
   # Update backend/.env
   DATABASE_URL=postgresql://user:pass@localhost:5432/livechat
   ```

## 🔒 Security Considerations

### Production Security
- Change default JWT secret
- Use HTTPS with SSL certificates
- Configure proper CORS origins
- Set up rate limiting
- Use environment-specific configurations

### SSL/HTTPS Setup
```bash
# Install SSL certificates (using Let's Encrypt)
certbot --nginx -d yourdomain.com

# Update configuration for HTTPS
CORS_ORIGIN=https://yourdomain.com
```

## 🚀 Advanced Deployment Options

### Docker Deployment
```bash
# Build Docker images
docker build -t livechat-backend ./backend
docker build -t livechat-frontend ./frontend

# Run with Docker Compose
docker-compose up -d
```

### Railway Deployment
```bash
# Install Railway CLI
npm i -g @railway/cli

# Deploy to Railway
railway login
railway init
railway up
```

### PM2 Advanced Configuration
```bash
# Start with ecosystem file
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

## 📚 Additional Resources

### Documentation
- [Feature Specifications](FEATURE_SPECIFICATION.md)
- [Backend Setup Guide](BACKEND_SETUP_GUIDE.md)
- [Architecture Diagrams](ARCHITECTURE_DIAGRAM.md)
- [Implementation Guides](IMPLEMENTATION_*.md)

### Support
- Check existing test files for examples
- Review logs in `logs/` directory
- Use health check endpoints for monitoring

## 🎉 Success!

Your Advanced Live Chat SaaS is now deployed and running! You can:

1. **Access the dashboard** at http://localhost:5173
2. **Test the widget** at http://localhost:3000/demo.html
3. **Login as admin** using admin@example.com / admin123
4. **Create your first site** in the dashboard
5. **Embed the widget** on your website

The deployment is complete and ready for production use! 🚀