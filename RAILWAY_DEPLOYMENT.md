# 🚀 Advanced Live Chat SaaS - Railway Deployment Guide

## 📍 Deployment to Asia-Southeast1 Region

This guide walks you through deploying your Advanced Live Chat SaaS to Railway's Asia-Southeast1 region (Singapore) for optimal performance in Southeast Asia.

## ✅ Prerequisites

- Railway account (free tier available)
- Railway CLI installed
- Git repository with your code
- MongoDB Atlas cluster (configured)

## 🛠️ Step 1: Install Railway CLI

```bash
# Install Railway CLI globally
npm install -g @railway/cli

# Verify installation
railway --version
```

## 🔐 Step 2: Login to Railway

```bash
# Login to Railway
railway login

# This will open a browser window for authentication
```

## 📋 Step 3: Initialize Railway Project

```bash
# Navigate to your project directory
cd advanced-livechat-saas

# Initialize Railway project (if not already done)
railway init

# Follow the prompts to create a new project
```

## 🔧 Step 4: Configure Environment Variables

Set up your environment variables for production:

```bash
# Set MongoDB Atlas connection
railway variables set MONGO_URI="mongodb+srv://arinzeezeozue_db_user:PByZWA70QmruZIC9@userschat.tjk5ezx.mongodb.net/?appName=Userschat"

# Set production environment
railway variables set NODE_ENV=production
railway variables set PORT=3000

# Set JWT secret (generate a strong one)
railway variables set JWT_SECRET="your-super-secret-jwt-key-change-this"

# Set region-specific variables
railway variables set REGION=asia-southeast1
railway variables set TIMEZONE=Asia/Singapore
```

## 🏗️ Step 5: Deploy to Railway

### Option 1: Using the Deployment Script
```bash
# Make the script executable
chmod +x deploy-railway.sh

# Run the deployment script
./deploy-railway.sh
```

### Option 2: Manual Deployment
```bash
# Deploy using Railway CLI
railway up

# Or deploy with custom message
railway up --message "Deploying to Asia-Southeast1"
```

### Option 3: Using Railway Dashboard
1. Go to [railway.app](https://railway.app)
2. Connect your GitHub repository
3. Configure environment variables
4. Deploy automatically on push

## 📊 Step 6: Monitor Deployment

```bash
# Check deployment status
railway status

# View logs
railway logs

# View real-time logs
railway logs --follow

# Check health
railway run curl http://localhost:3000/health
```

## 🌐 Step 7: Access Your Application

After successful deployment:

```bash
# Get your deployment URL
railway status | grep -o 'https://[^[:space:]]*.railway.app'

# Test your application
curl https://your-app.railway.app/health

# Test the widget
curl https://your-app.railway.app/demo.html
```

## 🔍 Step 8: Verify Single URL Deployment

Test that everything works on a single URL:

```bash
# Get your Railway URL
RAILWAY_URL=$(railway status | grep -o 'https://[^[:space:]]*.railway.app')

# Test health endpoint
curl $RAILWAY_URL/health

# Test API
curl $RAILWAY_URL/api/widget/status/demo-site-id

# Test frontend
curl $RAILWAY_URL/
```

## ⚙️ Railway Configuration Files

### railway.toml
```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"

[deploy]
startCommand = "npm run start:single"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
healthcheckPath = "/health"
healthcheckTimeout = 300
healthcheckInterval = 30000
```

### Dockerfile
The Dockerfile is already configured for:
- Multi-stage build (frontend + backend)
- Single URL deployment
- Production optimization
- Health checks

## 🌍 Asia-Southeast1 Region Features

### Performance Benefits
- **Low Latency**: <50ms for Southeast Asia users
- **High Availability**: 99.9% uptime SLA
- **Auto-scaling**: Handles traffic spikes automatically
- **CDN Ready**: Static assets served from edge locations

### Regional Considerations
- **Data Residency**: Data stays in Singapore
- **Compliance**: GDPR and local data protection laws
- **Timezone**: UTC+8 (Singapore time)
- **Currency**: SGD billing available

## 📈 Monitoring & Scaling

### Built-in Monitoring
```bash
# View application metrics
railway metrics

# Check resource usage
railway usage

# View deployment history
railway deployments
```

### Auto-scaling Configuration
Railway automatically scales based on:
- CPU usage
- Memory consumption
- Request volume
- Response time

### Custom Scaling (Pro Plan)
```bash
# Set custom scaling limits
railway variables set MIN_REPLICAS=2
railway variables set MAX_REPLICAS=10
railway variables set TARGET_CPU=70
```

## 🔧 Advanced Configuration

### Custom Domain
```bash
# Add custom domain (Pro feature)
railway domain add yourdomain.com

# Configure DNS
# Add CNAME record pointing to your-app.railway.app
```

### SSL/HTTPS
- SSL certificates are automatically provisioned
- HTTPS is enforced by default
- HTTP to HTTPS redirect is automatic

### Environment Variables Management
```bash
# View all variables
railway variables

# Add new variable
railway variables set NEW_VAR=value

# Remove variable
railway variables delete OLD_VAR

# Import from .env file
railway variables import .env
```

## 🚨 Troubleshooting

### Common Issues

1. **Build Fails**
   ```bash
   # Check build logs
   railway logs --build
   
   # Rebuild
   railway up --force
   ```

2. **MongoDB Connection Issues**
   ```bash
   # Verify MongoDB Atlas is accessible
   railway run node test-mongo-quick.js
   
   # Check IP whitelist in Atlas
   # Add Railway IP to Atlas whitelist
   ```

3. **Health Check Fails**
   ```bash
   # Check application logs
   railway logs
   
   # Test health endpoint manually
   railway run curl http://localhost:3000/health
   ```

4. **Region Issues**
   ```bash
   # Check current region
   railway info
   
   # Contact Railway support for region-specific issues
   ```

### Performance Optimization

1. **Database Indexes**
   - Ensure MongoDB indexes are created
   - Monitor query performance
   - Use Atlas Performance Advisor

2. **Connection Pooling**
   - Already configured in backend
   - Monitor connection usage

3. **Caching**
   - Implement Redis for session caching
   - Use CDN for static assets

## 📊 Cost Optimization

### Free Tier Limits
- 500 hours/month
- 1GB memory
- 100GB bandwidth
- Shared CPU

### Pro Plan Benefits
- Custom domains
- Priority support
- Advanced metrics
- Team collaboration

### Usage Monitoring
```bash
# Check current usage
railway usage

# Set spending alerts
railway alerts create --type=spending --threshold=50
```

## 🎯 Deployment Checklist

- [ ] MongoDB Atlas cluster configured
- [ ] Environment variables set
- [ ] Railway CLI installed and logged in
- [ ] Project initialized with Railway
- [ ] Application deployed successfully
- [ ] Health checks passing
- [ ] Custom domain configured (optional)
- [ ] Monitoring setup
- [ ] Backup strategy in place

## 🚀 Next Steps

1. **Monitor Performance**: Use Railway dashboard to monitor metrics
2. **Set Up Alerts**: Configure spending and performance alerts
3. **Scale as Needed**: Upgrade plan based on usage
4. **Add Monitoring**: Integrate with monitoring tools
5. **Backup Strategy**: Regular database backups

## 📞 Support

- **Railway Support**: https://help.railway.app
- **Discord Community**: https://discord.gg/railway
- **Status Page**: https://status.railway.app
- **Email**: support@railway.app

## 🎉 Success!

Your Advanced Live Chat SaaS is now deployed to Railway's Asia-Southeast1 region with:
- ✅ Single URL deployment
- ✅ MongoDB Atlas integration
- ✅ Automatic scaling
- ✅ SSL/HTTPS enabled
- ✅ Health monitoring
- ✅ Production-ready configuration

**Your application is live and ready for Southeast Asian users!** 🚀