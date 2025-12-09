#!/usr/bin/env node

/**
 * 🔍 Simple MongoDB Status Check
 * 
 * Run this from the backend directory where MongoDB is installed
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🔍 Checking MongoDB Connection Status...\n');

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/advanced-livechat';

console.log('MongoDB URI:', mongoUri);
console.log('Testing connection to:', new URL(mongoUri).hostname, 'on port', new URL(mongoUri).port || '27017');

async function checkMongoDB() {
  try {
    const client = new MongoClient(mongoUri, {
      serverSelectionTimeoutMS: 3000, // 3 second timeout
      connectTimeoutMS: 5000, // 5 second timeout
    });

    console.log('\n🔄 Attempting to connect...');
    await client.connect();
    
    console.log('✅ SUCCESS: Connected to MongoDB!');
    
    // Get basic server info
    const admin = client.db().admin();
    const serverStatus = await admin.serverStatus();
    
    console.log('\n📊 Server Info:');
    console.log('  Version:', serverStatus.version);
    console.log('  Host:', serverStatus.host);
    console.log('  Uptime:', Math.floor(serverStatus.uptime / 3600), 'hours');
    
    await client.close();
    console.log('\n✅ Connection closed successfully');
    
    return { connected: true, version: serverStatus.version };
    
  } catch (error) {
    console.log('\n❌ CONNECTION FAILED');
    console.log('Error:', error.message);
    console.log('\n📋 This means:');
    console.log('• MongoDB server is not running');
    console.log('• Connection string is incorrect');
    console.log('• Network/firewall issues');
    console.log('\n🔧 The application will use in-memory storage for messages');
    console.log('   This is suitable for development and testing');
    
    return { connected: false, error: error.message };
  }
}

checkMongoDB().then(result => {
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY:', result.connected ? '✅ MongoDB is connected' : '❌ MongoDB not available');
  console.log('='.repeat(60));
  process.exit(result.connected ? 0 : 1);
}).catch(error => {
  console.error('Check failed:', error.message);
  process.exit(1);
});