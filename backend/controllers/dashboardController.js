/**
 * Dashboard Controller - handles dashboard API endpoints
 * User dashboard for managing sites and viewing analytics
 */
import SiteModel from '../models/SiteModel.js';
import VisitorModel from '../models/VisitorModel.js';
import MessageModel from '../models/MessageModel.js';
import PaymentService from '../services/PaymentService.js';

const siteModel = new SiteModel();
const visitorModel = new VisitorModel();
const messageModel = new MessageModel();
const paymentService = new PaymentService();

// Get user dashboard data
export async function getDashboard(req, res, next) {
  try {
    const userId = req.user.id;
    
    // Get user's sites
    const sites = await siteModel.findByUserId(userId);
    
    // Get site statistics
    const siteStats = await Promise.all(
      sites.map(async (site) => {
        const visitorCount = await visitorModel.getVisitorCount(site.id);
        const activeVisitors = await visitorModel.getActiveVisitors(site.id);
        const subscription = await paymentService.getSubscriptionStatus(site.site_id);
        
        return {
          ...site,
          stats: {
            totalVisitors: visitorCount,
            activeVisitors: activeVisitors.length,
            subscription
          }
        };
      })
    );

    res.json({
      success: true,
      data: {
        sites: siteStats
      }
    });
  } catch (error) {
    next(error);
  }
}

// Get site analytics
export async function getSiteAnalytics(req, res, next) {
  try {
    const { siteId } = req.params;
    const site = req.site; // Added by siteGuard middleware
    
    // Get visitors
    const visitors = await visitorModel.getSiteVisitors(site.id, 100);
    const activeVisitors = await visitorModel.getActiveVisitors(site.id);
    
    // Get recent messages
    const recentMessages = await messageModel.getSiteMessages(siteId, 50);
    const activeSessions = await messageModel.getActiveSessions(siteId, 30);
    
    // Get subscription status
    const subscription = await paymentService.getSubscriptionStatus(siteId);

    res.json({
      success: true,
      data: {
        site: {
          id: site.site_id,
          domain: site.domain,
          status: site.status,
          createdAt: site.created_at
        },
        analytics: {
          totalVisitors: visitors.length,
          activeVisitors: activeVisitors.length,
          recentMessages: recentMessages.length,
          activeSessions: activeSessions.length
        },
        visitors,
        recentMessages,
        subscription
      }
    });
  } catch (error) {
    next(error);
  }
}

// Get site visitors
export async function getSiteVisitors(req, res, next) {
  try {
    const { siteId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const site = req.site;
    
    const visitors = await visitorModel.getRecentVisitors(site.id, page, limit);
    const totalCount = await visitorModel.getVisitorCount(site.id);
    
    res.json({
      success: true,
      data: {
        visitors,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

// Get chat conversations
export async function getChatConversations(req, res, next) {
  try {
    const { siteId } = req.params;
    const site = req.site;
    
    // Get active sessions
    const activeSessions = await messageModel.getActiveSessions(siteId, 60);
    
    // Get last message for each session
    const conversations = await messageModel.getLastMessages(siteId, 20);
    
    res.json({
      success: true,
      data: {
        activeSessions,
        conversations
      }
    });
  } catch (error) {
    next(error);
  }
}

// Get chat messages for session
export async function getChatMessages(req, res, next) {
  try {
    const { siteId, sessionId } = req.params;
    const site = req.site;
    
    const messages = await messageModel.getSessionMessages(siteId, sessionId);
    
    res.json({
      success: true,
      data: { messages }
    });
  } catch (error) {
    next(error);
  }
}

// Create payment for site
export async function createPayment(req, res, next) {
  try {
    const { siteId } = req.params;
    const { amount, currency, days } = req.body;
    const site = req.site;
    
    const payment = await paymentService.createPayment(
      siteId,
      amount || 29.99,
      currency || 'USD',
      days || 30
    );
    
    res.json({
      success: true,
      data: { payment }
    });
  } catch (error) {
    next(error);
  }
}

// Get payment history
export async function getPaymentHistory(req, res, next) {
  try {
    const { siteId } = req.params;
    const site = req.site;
    
    const payments = await paymentService.getSitePayments(siteId);
    
    res.json({
      success: true,
      data: { payments }
    });
  } catch (error) {
    next(error);
  }
}