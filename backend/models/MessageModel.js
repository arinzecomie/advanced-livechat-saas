/**
 * Message Model - handles chat messages
 * Messages stored in MongoDB for real-time performance
 */
import db from '../config/mongo.js';

export default class MessageModel {
  constructor() {
    this.collection = 'messages';
  }

  // Create message
  async create(messageData) {
    const message = {
      ...messageData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection(this.collection).insertOne(message);
    return { ...message, _id: result.insertedId };
  }

  // Get messages for session
  async getSessionMessages(siteId, sessionId, limit = 100) {
    const messages = await db.collection(this.collection)
      .find({ siteId, sessionId })
      .sort({ createdAt: -1 })
      .toArray();
    
    return messages.reverse(); // Oldest first
  }

  // Get recent messages for site
  async getSiteMessages(siteId, limit = 50) {
    const messages = await db.collection(this.collection)
      .find({ siteId })
      .sort({ createdAt: -1 })
      .toArray();
    
    return messages;
  }

  // Get messages by visitor session
  async getVisitorMessages(siteId, sessionId) {
    return this.getSessionMessages(siteId, sessionId);
  }

  // Get active conversations (distinct session IDs with recent messages)
  async getActiveSessions(siteId, minutes = 30) {
    const since = new Date(Date.now() - minutes * 60 * 1000);
    
    const messages = await db.collection(this.collection)
      .find({ 
        siteId, 
        createdAt: { $gte: since } 
      })
      .toArray();
    
    const sessions = [...new Set(messages.map(msg => msg.sessionId))];
    return sessions;
  }

  // Get last message for each session
  async getLastMessages(siteId, limit = 20) {
    const messages = await this.getSiteMessages(siteId, 1000); // Get more to group
    
    const sessionMap = new Map();
    messages.forEach(msg => {
      const existing = sessionMap.get(msg.sessionId);
      if (!existing || msg.createdAt > existing.createdAt) {
        sessionMap.set(msg.sessionId, msg);
      }
    });

    return Array.from(sessionMap.values())
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }

  // Delete old messages (for cleanup)
  async deleteOldMessages(siteId, days = 90) {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    // This would need proper MongoDB delete implementation
    // For now, we'll just return count (simulated)
    return 0;
  }
}