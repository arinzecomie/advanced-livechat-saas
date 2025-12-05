/**
 * Widget Controller - handles widget API endpoints
 * Visitor tracking and chat widget functionality
 */
import WidgetService from '../services/WidgetService.js';
import MessageModel from '../models/MessageModel.js';

const widgetService = new WidgetService();
const messageModel = new MessageModel();

// Process visitor visit
export async function processVisit(req, res, next) {
  try {
    const { siteId, fingerprint } = req.body;
    
    if (!siteId || !fingerprint) {
      return res.status(400).json({
        error: 'missing_fields',
        message: 'siteId and fingerprint are required'
      });
    }

    const visitorData = {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      referrer: req.headers.referer,
      page: req.body.page || '/'
    };

    const result = await widgetService.processVisit(siteId, fingerprint, visitorData);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

// Get site configuration
export async function getSiteConfig(req, res, next) {
  try {
    const { siteId } = req.params;
    
    if (!siteId) {
      return res.status(400).json({
        error: 'missing_site_id',
        message: 'Site ID is required'
      });
    }

    const config = await widgetService.getSiteConfig(siteId);
    
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    next(error);
  }
}

// Get widget status
export async function getWidgetStatus(req, res, next) {
  try {
    const { siteId } = req.params;
    
    if (!siteId) {
      return res.status(400).json({
        error: 'missing_site_id',
        message: 'Site ID is required'
      });
    }

    const status = await widgetService.getWidgetStatus(siteId);
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    next(error);
  }
}

// Track visitor activity
export async function trackActivity(req, res, next) {
  try {
    const { siteId, fingerprint, activity } = req.body;
    
    if (!siteId || !fingerprint) {
      return res.status(400).json({
        error: 'missing_fields',
        message: 'siteId and fingerprint are required'
      });
    }

    const visitor = await widgetService.trackActivity(siteId, fingerprint, activity);
    
    res.json({
      success: true,
      data: { visitor }
    });
  } catch (error) {
    next(error);
  }
}

// Get chat history for session
export async function getChatHistory(req, res, next) {
  try {
    const { siteId, sessionId } = req.query;
    
    if (!siteId || !sessionId) {
      return res.status(400).json({
        error: 'missing_fields',
        message: 'siteId and sessionId are required'
      });
    }

    const messages = await messageModel.getSessionMessages(siteId, sessionId);
    
    res.json({
      success: true,
      data: { messages }
    });
  } catch (error) {
    next(error);
  }
}

// Get active visitors for site
export async function getActiveVisitors(req, res, next) {
  try {
    const { siteId } = req.params;
    
    if (!siteId) {
      return res.status(400).json({
        error: 'missing_site_id',
        message: 'Site ID is required'
      });
    }

    const visitors = await widgetService.getActiveVisitors(siteId);
    
    res.json({
      success: true,
      data: { visitors }
    });
  } catch (error) {
    next(error);
  }
}