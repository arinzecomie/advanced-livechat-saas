# 🚂 Railway Deployment Fix Guide

## Problem Summary

Your Railway deployment failed due to:
1. **Database connection issues** - PostgreSQL hostname not found
2. **JSON parsing errors** - PowerShell curl syntax problems  
3. **Missing environment configuration** - Railway PostgreSQL not properly connected

## ✅ Solution Applied

### **Step 1: Run the Railway Deployment Fix**

```bash
# Run the Railway deployment fix script
node railway-deploy-fix.js

# This will:
# ✅ Detect Railway environment
# ✅ Configure PostgreSQL connection
# ✅ Create proper environment files
# ✅ Test database connectivity
```

### **Step 2: Run Railway Migrations & Seeds**

```bash
# Run migrations and seeds for Railway
node migrate-railway.js

# This will:
# ✅ Test PostgreSQL connection
# ✅ Run database migrations
# ✅ Insert default admin/demo data
# ✅ Verify database integrity
```

### **Step 3: Test the Deployment**

```bash
# Test authentication endpoint
node test-railway-auth.js

# This will:
# ✅ Test login endpoint with proper JSON
# ✅ Verify JWT token generation
# ✅ Check health endpoint
# ✅ Confirm deployment success
```

## 🔧 Manual Railway Configuration

### **1. Railway Dashboard Setup**

Go to your Railway dashboard and ensure:

1. **PostgreSQL Service Connected**
   - Navigate to your project
   - Click "Add Service" → "Database" → "PostgreSQL"
   - Wait for service to provision

2. **Environment Variables Set**
   ```env
   # These should be automatically set by Railway:
   DATABASE_URL=postgresql://user:password@host.railway.internal:5432/railway
   PGHOST=host.railway.internal
   PGPORT=5432
   PGDATABASE=railway
   PGUSER=postgres
   PGPASSWORD=your-generated-password
   
   # Application settings:
   NODE_ENV=production
   PORT=3000
   JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
   CORS_ORIGIN=https://your-frontend-domain.up.railway.app
   ```

### **2. Deploy to Railway**

```bash
# Option 1: GitHub Integration (Recommended)
# Push your code to GitHub main branch
# Railway will auto-deploy on push

# Option 2: Railway CLI
git add .
git commit -m "Fix Railway deployment configuration"
git push origin main
```

### **3. Monitor Deployment**

```bash
# Check Railway logs
railway logs

# Check deployment status
railway status

# View live application
railway open
```

## 📋 Verification Steps

### **1. Health Check**
```bash
curl https://your-app.up.railway.app/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-12-09T...",
  "services": {
    "database": "healthy",
    "mongodb": "healthy"
  }
}
```

### **2. Authentication Test**
```bash
curl -X POST https://your-app.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "admin@example.com",
      "name": "Admin User",
      "role": "admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "sites": [...]
  }
}
```

### **3. Widget Test**
Visit: `https://your-app.up.railway.app/demo.html`

You should see the chat widget in the bottom-right corner.

## 🚨 Common Issues & Fixes

### **Issue: "getaddrinfo ENOTFOUND postgres.railway.internal"**

**Fix:**
1. Ensure PostgreSQL service is added to your Railway project
2. Check that DATABASE_URL environment variable is set
3. Run `node railway-deploy-fix.js` to configure properly

### **Issue: "Invalid JSON format"**

**Fix:**
1. Use the provided test script: `node test-railway-auth.js`
2. Ensure Content-Type header is set to "application/json"
3. Use proper JSON formatting in request body

### **Issue: "Database connection failed"**

**Fix:**
1. Verify PostgreSQL service is running in Railway
2. Check environment variables are correctly set
3. Test connection with `node migrate-railway.js`

### **Issue: "Seeds not running"**

**Fix:**
1. Ensure migrations completed successfully first
2. Check that database tables were created
3. Run seeds manually with `node migrate-railway.js`

## ✅ Success Criteria

Your Railway deployment is successful when:

1. **✅ Health endpoint responds** - `GET /health` returns status "ok"
2. **✅ Authentication works** - Login returns JWT token
3. **✅ Database is populated** - Admin user exists with proper credentials
4. **✅ Widget loads** - Demo page shows chat widget
5. **✅ No connection errors** - Railway logs show clean startup

## 🎯 Next Steps

After successful deployment:

1. **Test all API endpoints**
2. **Verify real-time chat functionality**
3. **Check admin dashboard access**
4. **Monitor Railway logs for errors**
5. **Set up custom domain (optional)**

## 📞 Support

If issues persist:
1. Check Railway service status
2. Review application logs in Railway dashboard
3. Verify all environment variables are set
4. Test locally first, then deploy

Your Railway deployment should now work perfectly! 🚀