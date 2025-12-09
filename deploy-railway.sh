#!/bin/bash

# 🚀 Advanced Live Chat SaaS - Railway Deployment Script
# For asia-southeast1 region deployment

set -e

echo "🚀 Starting Railway deployment for Advanced Live Chat SaaS..."
echo "📍 Region: asia-southeast1"
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Login to Railway (if not already logged in)
echo "🔐 Checking Railway authentication..."
railway login || {
    echo "❌ Please login to Railway first: railway login"
    exit 1
}

# Initialize Railway project if not already done
if [ ! -f "railway.json" ]; then
    echo "📋 Initializing Railway project..."
    railway init
fi

# Set environment variables
echo "🔧 Setting up environment variables..."
railway variables set NODE_ENV=production
railway variables set PORT=3000
railway variables set MONGO_URI="mongodb+srv://arinzeezeozue_db_user:PByZWA70QmruZIC9@userschat.tjk5ezx.mongodb.net/?appName=Userschat"

# Add region-specific environment variables
railway variables set REGION=asia-southeast1
railway variables set TIMEZONE=Asia/Singapore

# Build and deploy
echo "🏗️  Building and deploying..."
railway up --detach

# Wait for deployment to complete
echo "⏳ Waiting for deployment to complete..."
sleep 10

# Get deployment URL
echo "🌐 Getting deployment URL..."
DEPLOYMENT_URL=$(railway status | grep -o 'https://[^[:space:]]*.railway.app')

if [ -n "$DEPLOYMENT_URL" ]; then
    echo ""
    echo "🎉 Deployment successful!"
    echo "🔗 Application URL: $DEPLOYMENT_URL"
    echo ""
    echo "🧪 Testing deployment..."
    curl -s "$DEPLOYMENT_URL/health" || echo "Health check failed"
else
    echo "⚠️  Could not get deployment URL. Check Railway dashboard for status."
fi

echo ""
echo "✅ Railway deployment complete!"
echo "📝 Check Railway dashboard for logs and metrics"
echo "🔍 Run 'railway logs' to view application logs"