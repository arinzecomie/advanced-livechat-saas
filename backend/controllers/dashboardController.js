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
    console.log('📊 Dashboard request received');
    console.log('👤 User from token:', req.user);
    
    if (!req.user || !req.user.id) {
      console.log('❌ No user ID found in request');
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: No user ID found'
      });
    }
    
    const userId = req.user.id;
    console.log('🔍 Fetching dashboard for user ID:', userId);
    
    try {
      // Get user's sites
      console.log('🔍 Fetching sites for user:', userId);
      const sites = await siteModel.findByUserId(userId);
      console.log('📋 Found sites:', sites.length);
      
      if (sites.length === 0) {
        console.log('⚠️  No sites found for user, returning empty array');
        // Set cache headers to prevent caching of empty responses
        res.set({
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        });
        return res.json({
          success: true,
          data: {
            sites: []
          }
        });
      }
      
      // Get site statistics
      console.log('📊 Processing site statistics...');
      const siteStats = await Promise.all(
        sites.map(async (site) => {
          console.log(`🔍 Processing site: ${site.domain} (ID: ${site.id})`);
          
          try {
            const visitorCount = await visitorModel.getVisitorCount(site.id);
            const activeVisitors = await visitorModel.getActiveVisitors(site.id);
            const subscription = await paymentService.getSubscriptionStatus(site.site_id);
            
            console.log(`✅ Site ${site.domain} stats:`, {
              visitorCount,
              activeVisitors: activeVisitors.length,
              subscription: subscription ? 'has subscription' : 'no subscription'
            });
            
            return {
              ...site,
              stats: {
                totalVisitors: visitorCount,
                activeVisitors: activeVisitors.length,
                subscription
              }
            };
          } catch (error) {
            console.error(`❌ Error processing site ${site.id}:`, error.message);
            return {
              ...site,
              stats: {
                totalVisitors: 0,
                activeVisitors: 0,
                subscription: null
              }
            };
          }
        })
      );

      console.log('✅ Dashboard data prepared successfully');
      
      // Set cache headers to prevent caching of dynamic dashboard data
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'ETag': null, // Remove ETag to prevent 304 responses
        'Last-Modified': null // Remove Last-Modified to prevent 304 responses
      });
      
      res.json({
        success: true,
        data: {
          sites: siteStats
        }
      });
    } catch (dbError) {
      console.error('💥 Database error in dashboard:', dbError.message);
      // Set cache headers for error response too
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      // Return empty sites array as fallback
      res.json({
        success: true,
        data: {
          sites: []
        }
      });
    }
  } catch (error) {
    console.error('💥 Dashboard controller error:', error.message);
    console.error(error.stack);
    // Set cache headers for error response too
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    // Return empty data as fallback instead of error
    res.json({
      success: true,
      data: {
        sites: []
      }
    });
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

    // Set cache headers to prevent caching of dynamic analytics data
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'ETag': null,
      'Last-Modified': null
    });
    
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
    
    // Set cache headers to prevent caching of visitor data
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'ETag': null,
      'Last-Modified': null
    });
    
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
    
    // Set cache headers to prevent caching of chat data
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'ETag': null,
      'Last-Modified': null
    });
    
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
    
    // Set cache headers to prevent caching of message data
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'ETag': null,
      'Last-Modified': null
    });
    
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
    
    // Set cache headers to prevent caching of payment data
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'ETag': null,
      'Last-Modified': null
    });
    
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
    
    // Set cache headers to prevent caching of payment history
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'ETag': null,
      'Last-Modified': null
    });
    
    res.json({
      success: true,
      data: { payments }
    });
  } catch (error) {
    next(error);
  }
}