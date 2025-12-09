#!/usr/bin/env node

/**
 * 🔍 Quick MongoDB Atlas Test
 * 
 * Simple test to verify MongoDB Atlas connection
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Quick MongoDB Atlas Test\n');

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/advanced-livechat';

async function quickTest() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    console.log('URI:', mongoUri.replace(/PByZWA70QmruZIC9/, '***********'));
    
    const client = new MongoClient(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });

    await client.connect();
    
    console.log('✅ Successfully connected to MongoDB Atlas!');
    
    // Simple ping test
    const admin = client.db().admin();
    const result = await admin.ping();
    
    if (result.ok === 1) {
      console.log('✅ Connection verified with ping');
    }
    
    // Get basic info
    const serverStatus = await admin.serverStatus();
    console.log('📊 Server Version:', serverStatus.version);
    console.log('🏠 Host:', serverStatus.host);
    
    await client.close();
    console.log('✅ Connection closed');
    
    return { connected: true, version: serverStatus.version };
    
  } catch (error) {
    console.log('❌ CONNECTION FAILED');
    console.log('Error:', error.message);
    return { connected: false, error: error.message };
  }
}

quickTest().then(result => {
  console.log('\n' + '='.repeat(50));
  console.log('RESULT:', result.connected ? '✅ MongoDB Atlas connected!' : '❌ Connection failed');
  console.log('='.repeat(50));
  process.exit(result.connected ? 0 : 1);
}).catch(error => {
  console.error('Test failed:', error.message);
  process.exit(1);
});