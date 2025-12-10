# 🐬 MySQL Deployment Fix Guide

## Problem Summary

The deployment was failing because the backend was trying to use PostgreSQL (`pg` module) while the deployment was configured for MySQL. The error "Cannot find module 'pg'" indicated that the PostgreSQL configuration was being loaded despite MySQL being forced.

## Root Cause

The issue was in `backend/config/db.js` which was being executed immediately upon import, trying to create a PostgreSQL connection before any environment variable checks could take place.

## Applied Fixes

### 1. Modified `backend/config/db.js`
- Added checks for `FORCE_MYSQL` and `DISABLE_POSTGRESQL` environment variables
- Returns a dummy database object when PostgreSQL is disabled
- Gracefully handles missing PostgreSQL driver

### 2. Enhanced `backend/config/database-provider.js`
- Added priority check for `FORCE_MYSQL=true`
- Ensures MySQL is used exclusively when forced
- Removes fallback to SQLite when MySQL is forced

### 3. Updated `backend/config/db-initializer.js`
- Added `FORCE_MYSQL` check at the beginning
- Ensures MySQL is prioritized when forced
- Prevents PostgreSQL fallback when MySQL is forced

### 4. Improved `railway-mysql-start.js`
- Added MySQL2 driver availability check
- Automatic installation of missing MySQL2 driver
- Better error handling and logging

## Deployment Steps

### 1. Verify MySQL Service in Railway
```bash
# Check if MySQL service is connected
railway status
```

### 2. Set Environment Variables
In Railway dashboard, ensure these are set:
- `DATABASE_URL=mysql://username:password@host:port/database`
- `MYSQL_URL=mysql://username:password@host:port/database` (alternative)
- `FORCE_MYSQL=true` (automatically set by railway-mysql-start.js)
- `DISABLE_POSTGRESQL=true` (automatically set by railway-mysql-start.js)

### 3. Deploy
```bash
# Deploy to Railway
railway up

# Monitor logs
railway logs
```

### 4. Verify Deployment
```bash
# Check health endpoint
curl https://your-app.railway.app/health

# Expected response:
# {
#   "status": "ok",
#   "timestamp": "2025-12-10T...",
#   "database": "mysql",
#   "mongodb": "configured"
# }
```

## Testing Locally

### Test MySQL Configuration
```bash
# Set test environment variables
export DATABASE_URL=mysql://username:password@localhost:3306/database
export FORCE_MYSQL=true

# Test configuration
node test-mysql-config.js
```

### Test with Railway Environment
```bash
# Use Railway environment variables
railway run node test-mysql-config.js
```

## Files Modified

1. **`backend/config/db.js`** - Added MySQL environment variable checks
2. **`backend/config/database-provider.js`** - Enhanced FORCE_MYSQL support
3. **`backend/config/db-initializer.js`** - Added FORCE_MYSQL priority
4. **`railway-mysql-start.js`** - Added MySQL2 driver check

## Key Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| `DATABASE_URL` | MySQL connection string | Yes |
| `MYSQL_URL` | Alternative MySQL URL | No |
| `FORCE_MYSQL` | Force MySQL usage | Auto-set |
| `DISABLE_POSTGRESQL` | Disable PostgreSQL | Auto-set |
| `MONGO_URI` | MongoDB connection | Yes |

## Troubleshooting

### "Cannot find module 'mysql2'"
- The railway-mysql-start.js will automatically install mysql2
- Ensure mysql2 is in package.json dependencies

### "DATABASE_URL is required"
- Check Railway dashboard for MySQL service connection
- Verify DATABASE_URL format: `mysql://user:pass@host:port/db`

### "MySQL connection failed"
- Check MySQL service status in Railway
- Verify credentials in DATABASE_URL
- Test connection with: `railway run node test-mysql-config.js`

### Health check shows wrong database type
- Ensure FORCE_MYSQL=true is set
- Check that railway-mysql-start.js is being used
- Verify no PostgreSQL environment variables are set

## Success Indicators

✅ **Build Logs**: No "Cannot find module 'pg'" errors  
✅ **Startup Logs**: "🐬 Starting Advanced Live Chat SaaS with MySQL..."  
✅ **Database Logs**: "✅ MySQL database connected"  
✅ **Health Check**: Returns `{ "database": "mysql" }`  
✅ **Application**: Accessible at Railway URL  

## Quick Commands

```bash
# Deploy
railway up

# View logs
railway logs

# Check status
railway status

# Test locally
node deploy-mysql-final.js

# Fix any issues
node fix-mysql-deployment.js
```

## Support

If issues persist after applying these fixes:
1. Check Railway service connections
2. Verify all environment variables
3. Review deployment logs for specific errors
4. Test locally before deploying
5. Ensure MySQL service is properly provisioned

The fixes ensure that MySQL is used exclusively when deployed via railway-mysql-start.js, preventing any PostgreSQL dependencies from being loaded.