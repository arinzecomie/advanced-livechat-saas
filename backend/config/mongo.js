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
    const client = new MongoClient(uri);
    
    await client.connect();
    db = client.db();
    
    console.log('✅ MongoDB connected');
    
    // Create indexes for better performance
    await db.collection('messages').createIndex({ siteId: 1, sessionId: 1 });
    await db.collection('messages').createIndex({ createdAt: -1 });
    
  } catch (error) {
    console.warn('⚠️  MongoDB connection failed, falling back to in-memory storage');
    console.warn('Error:', error.message);
    
    // Fallback to in-memory storage
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
        createIndex: async () => {}
      })
    };
  }
}

export { connectMongo, db as default };

// Auto-connect
connectMongo();