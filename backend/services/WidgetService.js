/**
 * Widget Service - handles visitor tracking and site validation
 * Core logic for the embeddable chat widget
 */
import SiteModel from '../models/SiteModel.js';
import VisitorModel from '../models/VisitorModel.js';
import PaymentModel from '../models/PaymentModel.js';

export default class WidgetService {
  constructor() {
    this.siteModel = new SiteModel();
    this.visitorModel = new VisitorModel();
    this.paymentModel = new PaymentModel();
  }

  // Process visitor visit
  async processVisit(siteId, fingerprint, visitorData) {
    // Find site
    const site = await this.siteModel.findBySiteId(siteId);
    if (!site) {
      throw new Error('Site not found');
    }

    // Check if site is active
    if (!this.siteModel.isActive(site)) {
      return {
        status: 'error',
        siteStatus: site.status,
        message: 'Chat unavailable - account inactive'
      };
    }

    // Check payment status
    const hasActivePayment = await this.paymentModel.hasActivePayment(site.id);
    if (!hasActivePayment && site.status !== 'trial') {
      // Auto-suspend if no active payment
      await this.siteModel.updateStatus(siteId, 'suspended');
      return {
        status: 'error',
        siteStatus: 'suspended',
        message: 'Chat unavailable - subscription expired'
      };
    }

    // Find or create visitor
    const visitor = await this.visitorModel.findOrCreate(
      site.id,
      fingerprint,
      {
        ip_address: visitorData.ip,
        meta: JSON.stringify({
          userAgent: visitorData.userAgent,
          referrer: visitorData.referrer,
          page: visitorData.page
        }),
        last_seen: new Date()
      }
    );

    // Generate session ID for this visit
    const sessionId = this.generateSessionId(visitor.id);

    return {
      status: 'ok',
      siteStatus: site.status,
      sessionId,
      visitor: {
        id: visitor.id,
        fingerprint: visitor.fingerprint,
        lastSeen: visitor.last_seen
      }
    };
  }

  // Get site configuration for widget
  async getSiteConfig(siteId) {
    const site = await this.siteModel.findBySiteId(siteId);
    if (!site) {
      throw new Error('Site not found');
    }

    return {
      siteId: site.site_id,
      domain: site.domain,
      status: site.status,
      createdAt: site.created_at
    };
  }

  // Track visitor activity
  async trackActivity(siteId, fingerprint, activity) {
    const site = await this.siteModel.findBySiteId(siteId);
    if (!site) return null;

    const visitor = await this.visitorModel.findOrCreate(site.id, fingerprint);
    
    // Update visitor metadata with activity
    await this.visitorModel.updateMeta(visitor.id, {
      lastActivity: activity,
      lastSeen: new Date()
    });

    return visitor;
  }

  // Get widget status
  async getWidgetStatus(siteId) {
    try {
      const site = await this.siteModel.findBySiteId(siteId);
      if (!site) {
        return { status: 'not_found' };
      }

      const hasActivePayment = await this.paymentModel.hasActivePayment(site.id);
      
      return {
        status: site.status,
        hasActivePayment,
        isActive: this.siteModel.isActive(site)
      };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  // Generate unique session ID
  generateSessionId(visitorId) {
    const timestamp = Date.now().toString(36);
    const visitorPart = visitorId.toString(36);
    return `${timestamp}-${visitorPart}`;
  }

  // Get active visitors for site
  async getActiveVisitors(siteId) {
    const site = await this.siteModel.findBySiteId(siteId);
    if (!site) return [];

    return this.visitorModel.getActiveVisitors(site.id);
  }
}