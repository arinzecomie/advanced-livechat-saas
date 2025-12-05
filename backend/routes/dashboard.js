/**
 * Dashboard Routes - protected user dashboard endpoints
 * Site management, analytics, and chat management
 */
import express from 'express';
import {
  getDashboard,
  getSiteAnalytics,
  getSiteVisitors,
  getChatConversations,
  getChatMessages,
  createPayment,
  getPaymentHistory
} from '../controllers/dashboardController.js';
import authGuard from '../middlewares/authGuard.js';
import { checkSiteOwnership } from '../middlewares/siteGuard.js';

const router = express.Router();

// All dashboard routes require authentication
router.use(authGuard);

// Dashboard overview
router.get('/', getDashboard);

// Site-specific routes
router.get('/sites/:siteId/analytics', checkSiteOwnership, getSiteAnalytics);
router.get('/sites/:siteId/visitors', checkSiteOwnership, getSiteVisitors);
router.get('/sites/:siteId/conversations', checkSiteOwnership, getChatConversations);
router.get('/sites/:siteId/messages/:sessionId', checkSiteOwnership, getChatMessages);
router.post('/sites/:siteId/payments', checkSiteOwnership, createPayment);
router.get('/sites/:siteId/payments', checkSiteOwnership, getPaymentHistory);

export default router;