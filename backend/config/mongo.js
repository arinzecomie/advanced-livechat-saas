/**
 * MongoDB configuration for chat messages
 * Stores chat messages in MongoDB for better performance with real-time data
 */
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

let db;

async function connectMongo() {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/advanced-livechat';
    
    // Configure MongoDB client with proper options for Atlas
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 10000, // 10 second timeout
      connectTimeoutMS: 30000, // 30 second connection timeout
      socketTimeoutMS: 30000, // 30 second socket timeout
      maxPoolSize: 10, // Connection pool size
      retryWrites: true,
      w: 'majority', // Write concern
      appName: 'AdvancedLiveChat' // Application name for Atlas
    });
    
    console.log('🔄 Connecting to MongoDB...');
    await client.connect();
    
    // Get the database name from the connection string or use default
    const dbName = new URL(uri).pathname.slice(1) || 'advanced-livechat';
    db = client.db(dbName);
    
    console.log('✅ MongoDB connected successfully to Atlas!');
    console.log('📊 Database:', db.databaseName);
    
    // Test the connection with a ping
    const admin = db.admin();
    const pingResult = await admin.ping();
    if (pingResult.ok === 1) {
      console.log('✅ MongoDB connection verified');
    }
    
    // Create indexes for better performance
    console.log('🔧 Creating indexes...');
    try {
      await db.collection('messages').createIndex({ siteId: 1, sessionId: 1 });
      await db.collection('messages').createIndex({ createdAt: -1 });
      await db.collection('messages').createIndex({ siteId: 1, createdAt: -1 });
      console.log('✅ Indexes created successfully');
    } catch (indexError) {
      console.warn('⚠️  Some indexes may already exist:', indexError.message);
    }
    
    // Get server info for logging
    try {
      const serverStatus = await admin.serverStatus();
      console.log('📋 MongoDB Version:', serverStatus.version);
      console.log('🏠 Host:', serverStatus.host);
    } catch (infoError) {
      console.log('📋 Connected to MongoDB (server info not available)');
    }
    
  } catch (error) {
    console.warn('⚠️  MongoDB connection failed, falling back to in-memory storage');
    console.warn('Error:', error.message);
    
    // Provide helpful troubleshooting information
    if (error.message.includes('ECONNREFUSED')) {
      console.warn('💡 MongoDB server appears to be down or not accessible');
    } else if (error.message.includes('authentication')) {
      console.warn('💡 Check your MongoDB credentials in the connection string');
    } else if (error.message.includes('SRV')) {
      console.warn('💡 MongoDB SRV connection issue - check your Atlas cluster status');
    }
    
    // Fallback to in-memory storage
    console.log('🔄 Setting up in-memory storage fallback...');
    db = {
      messages: [],
      collection: (name) => ({
        insertOne: async (doc) => {
          db[name].push({ ...doc, _id: Date.now().toString() });
          return { insertedId: Date.now().toString() };
        },
        find: (query = {}) => ({
          sort: (sort) => ({ 
            toArray: async () => {
              let results = db[name].filter(item => {
                for (const [key, value] of Object.entries(query)) {
                  if (item[key] !== value) return false;
                }
                return true;
              });
              if (sort && sort.createdAt === -1) {
                results = results.sort((a, b) => b.createdAt - a.createdAt);
              }
              return results;
            }
          })
        }),
        createIndex: async () => {
          console.log('ℹ️  Index creation skipped in fallback mode');
        }
      })
    };
  }
}

export { connectMongo, db as default };

// Auto-connect
connectMongo();