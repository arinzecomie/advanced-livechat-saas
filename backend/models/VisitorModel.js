/**
 * Visitor Model - tracks website visitors
 * Uses fingerprinting to identify unique visitors per site
 */
import BaseModel from './BaseModel.js';
import db from '../config/db.js';

export default class VisitorModel extends BaseModel {
  constructor() {
    super('visitors');
  }

  // Find or create visitor by fingerprint and site
  async findOrCreate(siteId, fingerprint, visitorData = {}) {
    let visitor = await this.findOne({ 
      site_id: siteId, 
      fingerprint 
    });

    if (!visitor) {
      visitor = await this.create({
        site_id: siteId,
        fingerprint,
        ...visitorData
      });
    } else {
      // Update last_seen
      await this.update(visitor.id, { 
        last_seen: new Date(),
        ...visitorData 
      });
      visitor = await this.findById(visitor.id);
    }

    return visitor;
  }

  // Get visitors for a site
  async getSiteVisitors(siteId, limit = 100) {
    return db('visitors')
      .where({ site_id: siteId })
      .orderBy('last_seen', 'desc')
      .limit(limit);
  }

  // Get active visitors (seen in last 5 minutes)
  async getActiveVisitors(siteId) {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    return db('visitors')
      .where({ site_id: siteId })
      .where('last_seen', '>', fiveMinutesAgo)
      .orderBy('last_seen', 'desc');
  }

  // Update visitor metadata
  async updateMeta(visitorId, meta) {
    const visitor = await this.findById(visitorId);
    if (!visitor) return null;

    const updatedMeta = { ...visitor.meta, ...meta };
    return this.update(visitorId, { meta: JSON.stringify(updatedMeta) });
  }

  // Get visitor count for site
  async getVisitorCount(siteId) {
    return this.count({ site_id: siteId });
  }

  // Get recent visitors with pagination
  async getRecentVisitors(siteId, page = 1, perPage = 20) {
    const offset = (page - 1) * perPage;
    
    return db('visitors')
      .where({ site_id: siteId })
      .orderBy('last_seen', 'desc')
      .offset(offset)
      .limit(perPage);
  }
}