/**
 * Widget Routes - public widget API endpoints
 * Handles visitor tracking and chat widget functionality
 */
import express from 'express';
import {
  processVisit,
  getSiteConfig,
  getWidgetStatus,
  trackActivity,
  getChatHistory,
  getActiveVisitors
} from '../controllers/widgetController.js';
import siteGuard, { checkSiteActive } from '../middlewares/siteGuard.js';

const router = express.Router();

// Public widget endpoints
router.post('/visit', siteGuard, checkSiteActive, processVisit);
router.post('/activity', siteGuard, checkSiteActive, trackActivity);
router.get('/status/:siteId', getWidgetStatus);
router.get('/config/:siteId', getSiteConfig);
router.get('/visitors/:siteId', getActiveVisitors);
router.get('/history', getChatHistory);

export default router;