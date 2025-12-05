/**
 * Admin Routes - protected admin-only endpoints
 * System management and administrative functions
 */
import express from 'express';
import {
  getSystemStats,
  getUsers,
  getSites,
  updateSiteStatus,
  getPaymentHistory,
  simulatePayment,
  createSite
} from '../controllers/adminController.js';
import authGuard, { adminGuard } from '../middlewares/authGuard.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authGuard, adminGuard);

// System stats
router.get('/stats', getSystemStats);

// User management
router.get('/users', getUsers);

// Site management
router.get('/sites', getSites);
router.put('/sites/:siteId/status', updateSiteStatus);
router.post('/sites', createSite);

// Payment management
router.get('/payments', getPaymentHistory);
router.post('/payments/simulate', simulatePayment);

export default router;