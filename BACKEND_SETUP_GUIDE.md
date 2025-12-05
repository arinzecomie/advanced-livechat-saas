# 🚀 Advanced Live Chat SaaS - Backend Setup Guide

This guide will walk you through setting up and running the backend server for the Advanced Live Chat SaaS platform.

## 📋 Prerequisites

- ✅ Node.js 16+ installed
- ✅ npm (comes with Node.js)
- ✅ Windows Command Prompt or PowerShell
- ✅ Internet connection for downloading dependencies

## 🎯 Quick Start (If you haven't done this yet)

### 1. Navigate to Backend Directory
```cmd
cd C:\Users\Kizito\livechatwithreact\advanced-livechat-saas\backend
```

### 2. Install Dependencies
```cmd
npm install
```

### 3. Run Database Migrations
```cmd
npx knex migrate:latest --knexfile ./knexfile.js
```

### 4. Seed Demo Data
```cmd
npx knex seed:run --knexfile ./knexfile.js
```

### 5. Start the Server
```cmd
npm run dev
```

## ✅ Current Status Check

Your backend should already be set up! Let's verify everything is working:

### Check if Server is Running
Open a new Command Prompt and run:
```cmd
curl http://localhost:3000/health
```

**Expected Response:**
```json
{"status":"ok","timestamp":"2025-11-11T00:11:01.302Z"}
```

### Test the Widget API
```cmd
curl -X POST http://localhost:3000/api/widget/visit -d "{\"siteId\":\"96f939b0-8d13-4f43-a0d4-675ec750d4bd\",\"fingerprint\":\"test123\",\"page\":\"/\"}" -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "siteStatus": "active",
    "sessionId": "session-123",
    "visitor": {
      "id": 1,
      "fingerprint": "test123",
      "lastSeen": "timestamp"
    }
  }
}
```

### Test Authentication
```cmd
curl -X POST http://localhost:3000/api/auth/login -d "{\"email\":\"demo@example.com\",\"password\":\"user123\"}" -H "Content-Type: application/json"
```

**Expected Response:** JWT token and user data

## 🌐 Access Points

Once your server is running, you can access:

- **🔧 Backend API**: http://localhost:3000
- **🎯 Demo Page**: http://localhost:3000/demo.html
- **📊 Dashboard**: http://localhost:3000/dashboard (requires frontend)
- **🔌 API Base**: http://localhost:3000/api
- **❤️ Health Check**: http://localhost:3000/health

## 🔑 Default Credentials

- **Admin**: `admin@example.com` / `admin123`
- **Demo User**: `demo@example.com` / `user123`
- **Active Site ID**: `96f939b0-8d13-4f43-a0d4-675ec750d4bd`
- **Suspended Site ID**: `f977b7b4-064c-4992-9739-ffb55d117932`

## 🧪 Testing the Widget

### Method 1: Use the Test Page
1. Open `test_widget.html` in your browser
2. It will automatically test the widget functionality
3. Look for the chat bubble in the bottom-right corner

### Method 2: Manual Browser Test
1. Open http://localhost:3000/demo.html in your browser
2. You should see a chat bubble appear
3. Click the bubble to open the chat window

### Method 3: Embed in Any Website
Create an HTML file with this code:
```html
<!DOCTYPE html>
<html>
<head>
    <title>My Website</title>
</head>
<body>
    <h1>Welcome to My Website</h1>
    <p>This website has Advanced Live Chat!</p>
    
    <!-- Add this before closing body tag -->
    <script src="http://localhost:3000/widget.js"></script>
    <script>
        window.LiveChatConfig = {
            siteId: '96f939b0-8d13-4f43-a0d4-675ec750d4bd',
            serverUrl: 'http://localhost:3000'
        };
    </script>
</body>
</html>
```

## 📊 Monitoring Your Backend

### Check Server Status
Run the status check script:
```cmd
backend_status.bat
```

### View Logs
The server logs are displayed in the terminal where you ran `npm run dev`

### Check Database
The SQLite database is located at: `backend/dev.sqlite3`

## 🔧 Common Commands

### Start Development Server
```cmd
npm run dev
```

### Start Production Server
```cmd
npm start
```

### Run Database Migrations
```cmd
npx knex migrate:latest --knexfile ./knexfile.js
```

### Run Database Seeds
```cmd
npx knex seed:run --knexfile ./knexfile.js
```

### View Database Schema
```cmd
sqlite3 dev.sqlite3 .schema
```

## 🚨 Troubleshooting

### Server Won't Start
- Check if port 3000 is already in use: `netstat -ano | findstr :3000`
- Try a different port: Set `PORT=3001` in your `.env` file

### Database Errors
- Reset the database: Delete `dev.sqlite3` and run migrations again
- Check migration status: `npx knex migrate:status --knexfile ./knexfile.js`

### Widget Not Loading
- Check browser console for JavaScript errors
- Ensure the backend server is running
- Verify the site ID is correct

### API Connection Issues
- Check if the server is running: `curl http://localhost:3000/health`
- Verify CORS settings if testing from different domains
- Check firewall settings

## 🎯 Next Steps

1. **Test the Widget**: Open http://localhost:3000/demo.html in your browser
2. **Setup Frontend**: Follow the frontend setup guide
3. **Deploy to Production**: Use Railway or your preferred hosting
4. **Customize**: Modify the widget appearance, add features, etc.

## 📚 Additional Resources

- **API Documentation**: Check the backend README for detailed API docs
- **Frontend Setup**: See `frontend/README_FRONTEND.md`
- **Deployment Guide**: Check `README.md` for deployment instructions

---

## 🎉 **Your Backend is Ready!**

The backend server is running successfully with:
- ✅ All API endpoints working
- ✅ Database properly configured
- ✅ Widget functionality verified
- ✅ Authentication system operational
- ✅ Demo data loaded

**Access your backend at: http://localhost:3000**

Happy coding! 🚀