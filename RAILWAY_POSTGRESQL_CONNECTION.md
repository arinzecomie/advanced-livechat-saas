# 🐘 Railway PostgreSQL Connection Guide

## Current Status
✅ **Application is RUNNING on Railway**: https://talkavax-production.up.railway.app  
✅ **Health endpoint working**: `{"status":"ok","timestamp":"2025-12-08T23:35:57.044Z"}`  
⚠️ **Still using SQLite**: Need to connect PostgreSQL service  

## 🎯 Objective
Replace SQLite with PostgreSQL for production-ready database on Railway.

## 🔗 Step-by-Step PostgreSQL Connection

### Step 1: Access Railway Dashboard
1. Go to https://railway.app/project/c66a41be-9633-4791-a1c0-188ce1b5ec0b
2. You should see:
   - `talkavax` service (your main app)
   - `postgresql` service (PostgreSQL database)
   - `Postgres` service (another PostgreSQL instance)

### Step 2: Get PostgreSQL Connection String
1. Click on `postgresql` service
2. Go to "Settings" tab
3. Click "Generate Domain" (if not already generated)
4. Copy the PostgreSQL connection string (starts with `postgresql://`)

### Step 3: Set DATABASE_URL Variable
1. Go back to main project view
2. Click on `talkavax` service
3. Click "Variables" tab
4. Click "New Variable"
5. Name: `DATABASE_URL`
6. Value: Paste the PostgreSQL connection string
7. Click "Save"

### Step 4: Update Backend for PostgreSQL
```bash
# Copy PostgreSQL knexfile
copy backend\knexfile-postgresql.js backend\knexfile.js

# Deploy with new configuration
railway up
```

### Step 5: Run Database Migrations
```bash
# Run migrations on Railway
railway run npm run migrate

# Seed test data
railway run npm run seed
```

### Step 6: Verify PostgreSQL Connection
```bash
# Check logs
railway logs

# Test health endpoint
curl https://talkavax-production.up.railway.app/health

# Test login
curl -X POST "https://talkavax-production.up.railway.app/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

## 📊 Expected Changes After PostgreSQL

### Application Logs Should Show:
```
✅ PostgreSQL database connected
✅ Database migrations completed
✅ Connection pool established
```

### Instead of Current SQLite:
```
SERVER: ✅ SQLite database connected
```

## 🔧 PostgreSQL Configuration Details

### Connection String Format:
```
postgresql://username:password@hostname:port/database
```

### Environment Variables:
```env
DATABASE_URL=postgresql://user:pass@host:port/db
NODE_ENV=production
JWT_SECRET=your_secret
PORT=3000
```

### Connection Pool Settings:
```javascript
const pool = new Pool({
  max: 20,                    // Max connections
  idleTimeoutMillis: 30000,   // 30s idle timeout
  connectionTimeoutMillis: 2000, // 2s connection timeout
  ssl: { rejectUnauthorized: false } // For Railway
});
```

## 🚨 Common Issues & Solutions

### Issue: "DATABASE_URL not found"
**Solution**: Make sure to add the DATABASE_URL variable in Railway dashboard

### Issue: "Connection refused"
**Solution**: Check PostgreSQL service is running and domain is generated

### Issue: "Migration failed"
**Solution**: Run `railway run npm run migrate` after setting DATABASE_URL

### Issue: "Still using SQLite"
**Solution**: Make sure `knexfile.js` is copied from `knexfile-postgresql.js`

## 🎯 Success Indicators

✅ **Database Connected**: PostgreSQL connection established  
✅ **Migrations Complete**: All tables created successfully  
✅ **Health Check**: `/health` endpoint returns 200  
✅ **Login Working**: JWT authentication with PostgreSQL  
✅ **Chat Functional**: Real-time messaging operational  

## 🚀 Quick Commands

```bash
# Deploy with PostgreSQL
railway up

# Check deployment status
railway status

# View logs
railway logs

# Run migrations
railway run npm run migrate

# Test database connection
railway run node -e "console.log('DATABASE_URL:', process.env.DATABASE_URL)"
```

## 🌐 Current Application Status

- **URL**: https://talkavax-production.up.railway.app
- **Health**: ✅ Working
- **Database**: ⚠️ SQLite (needs PostgreSQL)
- **MongoDB**: ✅ Connected to Atlas
- **Status**: Ready for PostgreSQL upgrade

---

**🎯 Next Action**: Add `DATABASE_URL` variable to your Railway project to connect PostgreSQL and replace SQLite for production-ready database performance!