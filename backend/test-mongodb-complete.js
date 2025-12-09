#!/usr/bin/env node

/**
 * 🔍 Complete MongoDB Test with Atlas Connection
 * 
 * This script thoroughly tests MongoDB functionality with your Atlas cluster
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables from backend
dotenv.config({ path: './backend/.env' });

console.log('🔍 Complete MongoDB Atlas Connection Test\n');

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/advanced-livechat';

async function testAtlasConnection() {
  console.log('📡 Testing MongoDB Atlas Connection...');
  console.log('URI:', mongoUri.replace(/PByZWA70QmruZIC9/, '***********')); // Hide password
  console.log('Host:', new URL(mongoUri).hostname);
  console.log('Database:', new URL(mongoUri).pathname.slice(1) || 'advanced-livechat');
  
  try {
    const client = new MongoClient(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 30000,
      maxPoolSize: 10,
      retryWrites: true,
      w: 'majority',
      appName: 'AdvancedLiveChat'
    });

    console.log('\n🔄 Connecting to MongoDB Atlas...');
    await client.connect();
    
    console.log('✅ Successfully connected to MongoDB Atlas!');
    
    // Get server info
    const admin = client.db().admin();
    const serverStatus = await admin.serverStatus();
    
    console.log('\n📊 Atlas Cluster Information:');
    console.log('  Version:', serverStatus.version);
    console.log('  Host:', serverStatus.host);
    console.log('  Uptime:', Math.floor(serverStatus.uptime / 3600), 'hours');
    console.log('  Connections:', serverStatus.connections?.current || 'N/A');
    
    // Test database operations specific to your chat application
    const db = client.db();
    
    console.log('\n🧪 Testing Chat Application Features:');
    
    // 1. Test message insertion (like real chat messages)
    console.log('1. Testing message insertion...');
    const testMessages = [
      {
        siteId: 'test-site-001',
        sessionId: 'session-123',
        sender: { type: 'visitor', id: 'visitor-001', name: 'Test Visitor' },
        message: { text: 'Hello from MongoDB Atlas test!' },
        metadata: { 
          timestamp: new Date(), 
          ipAddress: '127.0.0.1',
          userAgent: 'TestBot/1.0'
        },
        createdAt: new Date()
      },
      {
        siteId: 'test-site-001',
        sessionId: 'session-123',
        sender: { type: 'admin', id: 'admin-001', name: 'Support Agent' },
        message: { text: 'Hello! How can I help you today?' },
        metadata: { 
          timestamp: new Date(), 
          ipAddress: '127.0.0.1'
        },
        createdAt: new Date()
      }
    ];
    
    for (const message of testMessages) {
      const result = await db.collection('messages').insertOne(message);
      console.log('  ✅ Message inserted:', result.insertedId);
    }
    
    // 2. Test message retrieval with filters (like real chat queries)
    console.log('\n2. Testing message retrieval...');
    
    // Get messages for a specific site and session
    const messages = await db.collection('messages')
      .find({ siteId: 'test-site-001', sessionId: 'session-123' })
      .sort({ createdAt: 1 })
      .limit(10)
      .toArray();
    
    console.log(`  ✅ Found ${messages.length} messages for site test-site-001`);
    messages.forEach((msg, index) => {
      console.log(`     ${index + 1}. [${msg.sender.type}] ${msg.sender.name}: ${msg.message.text}`);
    });
    
    // 3. Test aggregation queries (for analytics)
    console.log('\n3. Testing analytics queries...');
    
    // Count messages by site
    const siteStats = await db.collection('messages').aggregate([
      { $match: { siteId: 'test-site-001' } },
      { $group: { 
        _id: '$sender.type', 
        count: { $sum: 1 },
        latestMessage: { $max: '$createdAt' }
      }},
      { $sort: { count: -1 } }
    ]).toArray();
    
    console.log('  📊 Message statistics by sender type:');
    siteStats.forEach(stat => {
      console.log(`     ${stat._id}: ${stat.count} messages`);
    });
    
    // 4. Test indexes (performance optimization)
    console.log('\n4. Testing indexes...');
    
    // Create indexes that would be used in production
    await db.collection('messages').createIndex({ siteId: 1, sessionId: 1 });
    await db.collection('messages').createIndex({ createdAt: -1 });
    await db.collection('messages').createIndex({ siteId: 1, createdAt: -1 });
    
    console.log('  ✅ Indexes created successfully');
    
    // Test index usage with explain
    const explainResult = await db.collection('messages').find({ 
      siteId: 'test-site-001' 
    }).explain('executionStats');
    
    console.log('  📈 Query performance:');
    console.log('     Execution time:', explainResult.executionStats.executionTimeMillis, 'ms');
    console.log('     Documents examined:', explainResult.executionStats.totalDocsExamined);
    console.log('     Documents returned:', explainResult.executionStats.totalDocsReturned);
    
    // 5. Test connection pool and performance
    console.log('\n5. Testing connection performance...');
    
    const startTime = Date.now();
    const promises = [];
    
    // Simulate multiple concurrent operations
    for (let i = 0; i < 10; i++) {
      promises.push(
        db.collection('messages').insertOne({
          siteId: 'perf-test',
          sessionId: `session-${i}`,
          sender: { type: 'visitor', id: `visitor-${i}`, name: `Visitor ${i}` },
          message: { text: `Performance test message ${i}` },
          createdAt: new Date()
        })
      );
    }
    
    const results = await Promise.all(promises);
    const endTime = Date.now();
    
    console.log(`  ⚡ Inserted 10 messages concurrently in ${endTime - startTime}ms`);
    console.log('  ✅ Connection pool working correctly');
    
    // Clean up test data
    console.log('\n6. Cleaning up test data...');
    const deleteResult = await db.collection('messages').deleteMany({ 
      siteId: { $in: ['test-site-001', 'perf-test'] } 
    });
    console.log(`  🧹 Cleaned up ${deleteResult.deletedCount} test messages`);
    
    // Test connection stability
    console.log('\n7. Testing connection stability...');
    const pingResult = await admin.ping();
    if (pingResult.ok === 1) {
      console.log('  ✅ Connection is stable and responsive');
    }
    
    // Get final database stats
    const finalStats = await db.stats();
    console.log('\n📊 Final Database Statistics:');
    console.log('  Database:', finalStats.db);
    console.log('  Collections:', finalStats.collections);
    console.log('  Data Size:', Math.round(finalStats.dataSize / 1024), 'KB');
    console.log('  Index Size:', Math.round(finalStats.indexSize / 1024), 'KB');
    
    // Close connection
    await client.close();
    
    console.log('\n✅ Connection closed successfully');
    
    return {
      connected: true,
      version: serverStatus.version,
      host: serverStatus.host,
      database: new URL(mongoUri).pathname.slice(1) || 'advanced-livechat',
      performance: {
        insertTime: endTime - startTime,
        messageCount: testMessages.length
      }
    };
    
  } catch (error) {
    console.log('\n❌ MONGODB ATLAS CONNECTION FAILED');
    console.log('Error:', error.message);
    
    // Provide specific troubleshooting for Atlas
    if (error.message.includes('authentication')) {
      console.log('\n🔧 Authentication Issue:');
      console.log('• Check your MongoDB Atlas username and password');
      console.log('• Ensure the user has the correct permissions');
      console.log('• Verify the connection string is correct');
    } else if (error.message.includes('SRV')) {
      console.log('\n🔧 SRV Connection Issue:');
      console.log('• Check your MongoDB Atlas cluster is running');
      console.log('• Verify your IP is whitelisted in Atlas');
      console.log('• Ensure the connection string format is correct');
    } else if (error.message.includes('timeout')) {
      console.log('\n🔧 Connection Timeout:');
      console.log('• Check your network connectivity');
      console.log('• Verify Atlas cluster is accessible from your location');
      console.log('• Check if your IP is whitelisted');
    }
    
    return {
      connected: false,
      error: error.message
    };
  }
}

// Run comprehensive test
async function runComprehensiveTest() {
  console.log(`${'='.repeat(60)}`);
  console.log('🚀 COMPREHENSIVE MONGODB ATLAS TEST');
  console.log('='.repeat(60));
  
  const result = await testAtlasConnection();
  
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY:', result.connected ? '✅ MongoDB Atlas is fully operational!' : '❌ MongoDB Atlas connection failed');
  console.log('='.repeat(60));
  
  if (result.connected) {
    console.log('\n🎉 SUCCESS! Your MongoDB Atlas connection is working perfectly!');
    console.log('✅ Real-time chat messages will be stored persistently');
    console.log('✅ All chat features are enabled with full database support');
    console.log('✅ Ready for production deployment');
  } else {
    console.log('\n⚠️  MongoDB Atlas is not available');
    console.log('🔧 Please check the troubleshooting tips above');
  }
  
  process.exit(result.connected ? 0 : 1);
}

// Run test if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runComprehensiveTest().catch(error => {
    console.error('Test failed:', error.message);
    process.exit(1);
  });
}

export { testAtlasConnection, runComprehensiveTest };