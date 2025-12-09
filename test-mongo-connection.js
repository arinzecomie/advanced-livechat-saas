#!/usr/bin/env node

/**
 * Test MongoDB connection
 */

const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://arinzeezeozue_db_user:PByZWA70QmruZIC9@userschat.tjk5ezx.mongodb.net/?appName=Userschat";

console.log('Testing MongoDB connection...');
console.log('URI:', uri.replace(/PByZWA70QmruZIC9/, '***'));

async function testConnection() {
  try {
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000, // 5 second timeout
      connectTimeoutMS: 10000,
      socketTimeoutMS: 10000,
    });
    
    console.log('Connecting...');
    await client.connect();
    
    console.log('✅ Connected successfully!');
    
    // Test ping
    const admin = client.db().admin();
    const pingResult = await admin.ping();
    console.log('✅ Ping result:', pingResult);
    
    // Get database info
    const databases = await client.db().admin().listDatabases();
    console.log('Available databases:', databases.databases.map(d => d.name));
    
    await client.close();
    console.log('✅ Connection closed');
    
  } catch (error) {
    console.log('❌ Connection failed:', error.message);
    console.log('Error code:', error.code);
    console.log('Error details:', error);
  }
}

testConnection();