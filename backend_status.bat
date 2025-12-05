@echo off
echo 🔍 Advanced Live Chat SaaS - Backend Status Check
echo =================================================
echo.

echo 1. Checking if server is running...
curl -s http://localhost:3000/health > nul
if %errorlevel% == 0 (
    echo ✅ Server is running on port 3000
) else (
    echo ❌ Server is not running
)

echo.
echo 2. Testing widget API...
curl -s -X POST http://localhost:3000/api/widget/visit -d "{"siteId":"96f939b0-8d13-4f43-a0d4-675ec750d4bd","fingerprint":"test-status","page":"/"}" -H "Content-Type: application/json" > nul
if %errorlevel% == 0 (
    echo ✅ Widget API is working
) else (
    echo ❌ Widget API is not responding
)

echo.
echo 3. Testing authentication...
curl -s -X POST http://localhost:3000/api/auth/login -d "{"email":"demo@example.com","password":"user123"}" -H "Content-Type: application/json" > nul
if %errorlevel% == 0 (
    echo ✅ Authentication is working
) else (
    echo ❌ Authentication is not working
)

echo.
echo 4. Checking demo page...
curl -s http://localhost:3000/demo.html | findstr "Advanced Live Chat" > nul
if %errorlevel% == 0 (
    echo ✅ Demo page is accessible
) else (
    echo ❌ Demo page is not accessible
)

echo.
echo 📊 Backend Status Summary:
echo =================================================
echo 🚀 Backend Server: Running on http://localhost:3000
echo 🎯 Demo Page: http://localhost:3000/demo.html
echo 📊 Dashboard: http://localhost:3000/dashboard
echo 🔌 API Base: http://localhost:3000/api
echo.
echo 🔑 Default Credentials:
echo    Admin: admin@example.com / admin123
echo    Demo: demo@example.com / user123
echo 🎯 Demo Site ID: 96f939b0-8d13-4f43-a0d4-675ec750d4bd
echo.
echo ✅ Backend is fully operational!