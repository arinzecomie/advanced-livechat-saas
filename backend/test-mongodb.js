#!/usr/bin/env node

/**
 * 🔍 MongoDB Connection Test Script
 * 
 * This script tests the MongoDB connection from the backend directory
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables from backend .env
dotenv.config();

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

async function testMongoDBConnection() {
  log(`${colors.bright}${colors.cyan}`);
  log('╔══════════════════════════════════════════════════════════════╗');
  log('║              🔍 MongoDB Connection Test                      ║');
  log('║                                                              ║');
  log('║         Testing MongoDB from Backend Directory              ║');
  log('╚══════════════════════════════════════════════════════════════╝');
  log(`${colors.reset}`);

  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/advanced-livechat';
  
  log(`\n📍 Testing MongoDB Connection:`, 'cyan');
  log(`URI: ${mongoUri}`, 'blue');
  log(`Host: ${new URL(mongoUri).hostname}`, 'blue');
  log(`Port: ${new URL(mongoUri).port || 27017}`, 'blue');
  log(`Database: ${new URL(mongoUri).pathname.slice(1) || 'advanced-livechat'}`, 'blue');

  try {
    log(`\n🔄 Connecting to MongoDB...`, 'cyan');
    
    const client = new MongoClient(mongoUri, {
      serverSelectionTimeoutMS: 5000, // 5 second timeout
      connectTimeoutMS: 10000, // 10 second connection timeout
    });

    await client.connect();
    
    logSuccess('Successfully connected to MongoDB!');
    
    // Get server info
    const admin = client.db().admin();
    const serverStatus = await admin.serverStatus();
    
    log(`\n📊 MongoDB Server Information:`, 'cyan');
    log(`Version: ${serverStatus.version}`, 'green');
    log(`Uptime: ${Math.floor(serverStatus.uptime / 3600)}h ${Math.floor((serverStatus.uptime % 3600) / 60)}m`, 'green');
    log(`Host: ${serverStatus.host}`, 'green');
    log(`Port: ${serverStatus.port}`, 'green');
    
    // Test database operations
    const db = client.db();
    
    log(`\n🧪 Testing Database Operations:`, 'cyan');
    
    // Test message insertion
    const testMessage = {
      siteId: 'test-site',
      sessionId: 'test-session',
      sender: { type: 'visitor', id: 'test-visitor', name: 'Test Visitor' },
      message: { text: 'MongoDB connection test message' },
      metadata: { timestamp: new Date(), ipAddress: '127.0.0.1' },
      createdAt: new Date()
    };
    
    log('Inserting test message...', 'blue');
    const insertResult = await db.collection('messages').insertOne(testMessage);
    logSuccess(`Message inserted with ID: ${insertResult.insertedId}`);
    
    // Test message retrieval
    log('Retrieving messages...', 'blue');
    const messages = await db.collection('messages')
      .find({ siteId: 'test-site' })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();
    
    logSuccess(`Found ${messages.length} messages for test site`);
    
    if (messages.length > 0) {
      log(`Latest message: "${messages[0].message.text}"`, 'green');
    }
    
    // Test database stats
    const stats = await db.stats();
    log(`\n📈 Database Statistics:`, 'cyan');
    log(`Database: ${stats.db}`, 'green');
    log(`Collections: ${stats.collections}`, 'green');
    log(`Data Size: ${Math.round(stats.dataSize / 1024)}KB`, 'green');
    log(`Index Size: ${Math.round(stats.indexSize / 1024)}KB`, 'green');
    
    // Clean up test data
    log(`\n🧹 Cleaning up test data...`, 'cyan');
    const deleteResult = await db.collection('messages').deleteMany({ 
      siteId: 'test-site' 
    });
    logSuccess(`Cleaned up ${deleteResult.deletedCount} test messages`);
    
    // Test connection stability
    log(`\n🔌 Testing Connection Stability:`, 'cyan');
    const pingResult = await admin.ping();
    if (pingResult.ok === 1) {
      logSuccess('Connection is stable and responsive');
    } else {
      logWarning('Connection may have issues');
    }
    
    // Close connection
    await client.close();
    
    log(`\n${colors.bright}${colors.green}`);
    log('╔══════════════════════════════════════════════════════════════╗');
    log('║                 🎉 MONGODB CONNECTION SUCCESSFUL!            ║');
    log('║                                                              ║');
    log('║         ✅ MongoDB is connected and operational             ║');
    log('║         ✅ Database operations working correctly            ║');
    log('║         ✅ Ready for production use                         ║');
    log('╚══════════════════════════════════════════════════════════════╝');
    log(`${colors.reset}`);
    
    return {
      connected: true,
      version: serverStatus.version,
      host: serverStatus.host,
      port: serverStatus.port,
      database: new URL(mongoUri).pathname.slice(1) || 'advanced-livechat',
      stats: stats
    };
    
  } catch (error) {
    log(`\n${colors.bright}${colors.red}`);
    log('╔══════════════════════════════════════════════════════════════╗');
    log('║                 ❌ MONGODB CONNECTION FAILED                 ║');
    log('║                                                              ║');
    log('║         ⚠️  Falling back to in-memory storage              ║');
    log('╚══════════════════════════════════════════════════════════════╝');
    log(`${colors.reset}`);
    
    logError(`Connection failed: ${error.message}`);
    logWarning('The application will use in-memory storage for messages');
    logInfo('To enable MongoDB, ensure MongoDB is running and update MONGO_URI in backend/.env');
    
    return {
      connected: false,
      error: error.message,
      fallback: true
    };
  }
}

async function runMongoDBTest() {
  const result = await testMongoDBConnection();
  
  log(`\n${colors.bright}`);
  log('╔══════════════════════════════════════════════════════════════╗');
  
  if (result.connected) {
    log(`║                 🎉 MONGODB IS OPERATIONAL!                   ║`, 'green');
    log(`║                                                              ║`, 'green');
    log(`║         Version: ${result.version}                              ║`, 'green');
    log(`║         Host: ${result.host}                                    ║`, 'green');
    log(`║         Database: ${result.database}                            ║`, 'green');
    log(`║                                                              ║`, 'green');
    log(`║         ✅ Ready for production messages                    ║`, 'green');
    log(`║         ✅ All features enabled                             ║`, 'green');
  } else {
    log(`║                 ⚠️  MONGODB NOT AVAILABLE                    ║`, 'yellow');
    log(`║                                                              ║`, 'yellow');
    log(`║         Using in-memory fallback storage                   ║`, 'yellow');
    log(`║         Suitable for development                           ║`, 'yellow');
  }
  
  log('╚══════════════════════════════════════════════════════════════╝');
  log(`${colors.reset}`);
  
  return result;
}

// Run test if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMongoDBTest().then(result => {
    process.exit(result.connected ? 0 : 1);
  }).catch(error => {
    console.error('Test script error:', error.message);
    process.exit(1);
  });
}

export { runMongoDBTest, testMongoDBConnection };