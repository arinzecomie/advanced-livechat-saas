/**
 * Site Model - manages chat sites for users
 * Multi-tenant support with site-specific configurations
 */
import BaseModel from './BaseModel.js';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/db.js';

export default class SiteModel extends BaseModel {
  constructor() {
    super('sites');
  }

  // Find site by site_id (UUID used in widget)
  async findBySiteId(siteId) {
    return this.findOne({ site_id: siteId });
  }

  // Find sites by user
  async findByUserId(userId) {
    return this.findAll({ user_id: userId });
  }

  // Create site with generated site_id
  async createSite(siteData) {
    return this.create({
      ...siteData,
      site_id: uuidv4()
    });
  }

  // Update site status
  async updateStatus(siteId, status) {
    const site = await this.findBySiteId(siteId);
    if (!site) return null;
    
    return this.update(site.id, { status });
  }

  // Check if site is active
  isActive(site) {
    return site.status === 'active';
  }

  // Get site visitors
  async getVisitors(siteId) {
    const site = await this.findBySiteId(siteId);
    if (!site) return [];
    
    return db('visitors').where({ site_id: site.id });
  }

  // Get active sites (for admin dashboard)
  async getActiveSites() {
    return this.findAll({ status: 'active' });
  }

  // Get site with user info
  async getSiteWithUser(siteId) {
    const site = await this.findBySiteId(siteId);
    if (!site) return null;
    
    const user = await db('users').where({ id: site.user_id }).first();
    return { ...site, user };
  }
}