# 🚀 Advanced Live Chat SaaS - Single URL Deployment

This guide shows you how to deploy the entire application (backend + frontend) to run on a **single URL/domain**, perfect for production deployments.

## 🎯 **One-Command Single URL Deployment**

### ⚡ **Primary Command**
```bash
# Builds frontend and deploys everything on port 3000
npm run build:single
```

### 🚀 **Alternative Commands**
```bash
# Single URL deployment with build
npm run deploy:single

# Production single URL deployment
npm run deploy:single:prod

# Just start with existing build
npm run start:single
```

## 📊 **What Gets Deployed (Single URL)**

### ✅ **Complete Application on One Port (3000)**
- **Backend API**: All API endpoints at `/api/*`
- **Frontend Dashboard**: React app served at `/`
- **Static Widget Files**: `/widget.js`, `/demo.html`
- **Socket.IO**: Real-time chat functionality
- **Health Check**: `/health` endpoint

### ✅ **URL Structure**
```
http://yourdomain.com:3000/          # Frontend Dashboard
http://yourdomain.com:3000/api/*     # Backend API
http://yourdomain.com:3000/demo.html # Widget Demo
http://yourdomain.com:3000/widget.js # Embeddable Widget
http://yourdomain.com:3000/health    # Health Check
```

## 🛠️ **Build Process**

The `npm run build:single` command:

1. **Installs Backend Dependencies**
   ```bash
   npm install --prefix backend
   ```

2. **Installs Frontend Dependencies**
   ```bash
   npm install --prefix frontend
   ```

3. **Builds Frontend for Production**
   ```bash
   npm run build --prefix frontend
   ```

4. **Configures Backend to Serve Frontend**
   - Static file serving from `frontend/dist`
   - React Router fallback handling
   - API route precedence

5. **Starts Server on Single Port**
   - Backend serves both API and frontend
   - Socket.IO for real-time features
   - Health monitoring

## 🌐 **Access Points (Single URL)**

After deployment, everything is accessible at:
- **Main URL**: `http://localhost:3000`
- **Dashboard**: `http://localhost:3000/dashboard`
- **Demo**: `http://localhost:3000/demo.html`
- **API**: `http://localhost:3000/api`

## 🔑 **Default Credentials**
- **Admin**: `admin@example.com` / `admin123`
- **Demo User**: `demo@example.com` / `user123`

## 📋 **Single URL Benefits**

### ✅ **Simplified Deployment**
- One port to manage
- One domain to configure
- One SSL certificate needed
- One server to monitor

### ✅ **Better for Production**
- Cleaner architecture
- Easier load balancing
- Simpler CORS configuration
- Better security posture

### ✅ **Cost Effective**
- Single server instance
- One domain registration
- Reduced infrastructure complexity

## 🔧 **Configuration**

### **Environment Variables**
Create `backend/.env`:
```env
PORT=3000
DATABASE_URL=sqlite://./dev.sqlite3
MONGO_URI=mongodb://localhost:27017/advanced-livechat
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
```

### **Custom Port**
```bash
# Use custom port
PORT=8080 npm run deploy:single
```

### **Production Environment**
```bash
# Production deployment
NODE_ENV=production npm run deploy:single:prod
```

## 🚀 **Production Deployment Examples**

### **Railway.app Deployment**
```bash
# Build command in Railway
npm run build:single

# Start command
npm run start:single
```

### **Heroku Deployment**
```json
// package.json
{
  "scripts": {
    "build": "npm run build:single",
    "start": "npm run start:single"
  }
}
```

### **DigitalOcean Deployment**
```bash
# On your Droplet
git clone your-repo
cd advanced-livechat-saas
npm install
npm run build:single
npm run start:single
```

## 🔒 **SSL/HTTPS Setup**

### **Using Let's Encrypt (Certbot)**
```bash
# Install Certbot
sudo apt install certbot

# Get SSL certificate
sudo certbot certonly --standalone -d yourdomain.com

# Update environment
CORS_ORIGIN=https://yourdomain.com
```

### **Using Nginx Reverse Proxy**
```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🧪 **Testing Single URL Deployment**

### **Health Check**
```bash
curl http://localhost:3000/health
```

### **API Test**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

### **Frontend Test**
```bash
curl http://localhost:3000/
```

### **Widget Test**
```bash
curl http://localhost:3000/widget.js
curl http://localhost:3000/demo.html
```

## 📊 **Performance Optimization**

### **Frontend Build Optimization**
The build process automatically:
- Minifies JavaScript and CSS
- Optimizes images
- Creates production bundles
- Enables gzip compression

### **Backend Performance**
- Express static file serving with caching
- Efficient Socket.IO configuration
- Database connection pooling
- Memory optimization

## 🚨 **Troubleshooting**

### **Frontend Not Loading**
```bash
# Check if frontend is built
ls -la frontend/dist/

# Rebuild frontend
npm run build --prefix frontend

# Check server logs
npm run logs
```

### **API Routes Not Working**
```bash
# Check API endpoint
curl http://localhost:3000/api/health

# Verify backend is running
curl http://localhost:3000/health
```

### **Build Fails**
```bash
# Clear node_modules and rebuild
rm -rf node_modules frontend/node_modules backend/node_modules
npm install
npm run build:single
```

### **Port Already in Use**
```bash
# Use different port
PORT=8080 npm run deploy:single
```

## 📈 **Monitoring & Management**

### **PM2 Process Management**
```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start backend/server-single-url.js --name "livechat-app"

# Monitor
pm2 logs
pm2 status
pm2 restart livechat-app
```

### **Health Monitoring**
```bash
# Setup monitoring script
# Add to crontab for automatic restart
*/5 * * * * curl -f http://localhost:3000/health || pm2 restart livechat-app
```

## 🎯 **Comparison: Single URL vs Separate URLs**

| Feature | Single URL | Separate URLs |
|---------|------------|---------------|
| **Deployment** | One command | Multiple commands |
| **Domain Setup** | One domain | Two domains |
| **SSL Certificate** | One needed | Two needed |
| **CORS Configuration** | Simplified | Complex |
| **Load Balancing** | Easier | More complex |
| **Cost** | Lower | Higher |
| **Maintenance** | Simpler | More complex |

## 🎉 **Success!**

Your Advanced Live Chat SaaS is now deployed on a **single URL**! 

**Access everything at**: `http://localhost:3000`

The single URL deployment provides:
- ✅ **Simplified architecture**
- ✅ **Easier maintenance**
- ✅ **Lower costs**
- ✅ **Better for production**
- ✅ **One domain to rule them all!**

---

**Next Steps**: Test your single URL deployment, configure your domain, and go live! 🚀**