import express from 'express';
import {
  getAllUsers,
  banUser,
  unbanUser,
  impersonateUser,
  resetUserPassword,
  updateUserDetails,
  getAllSites,
  blockDomain,
  unblockDomain,
  verifyDomain,
  limitWidgetConnections,
  getSubscriptionStatus,
  grantLifetimeAccess,
  extendFreeTrial,
  forceDowngrade,
  getRevenueMetrics,
  createGlobalAnnouncement,
  sendPushNotification,
  toggleMaintenanceMode,
  getGlobalStorageUsage,
  purgeOldData,
  getReportedChats
} from '../controllers/superAdminController.js';
import authGuard, { adminGuard } from '../middlewares/authGuard.js';

const router = express.Router();

// All super admin routes require authentication and admin privileges
router.use(authGuard, adminGuard);

// User & Tenant Management Routes
router.get('/users', getAllUsers);
router.put('/users/:userId/ban', banUser);
router.put('/users/:userId/unban', unbanUser);
router.post('/users/:userId/impersonate', impersonateUser);
router.post('/users/:userId/reset-password', resetUserPassword);
router.put('/users/:userId/update', updateUserDetails);

// Site & Domain Control Routes
router.get('/sites', getAllSites);
router.put('/sites/:siteId/block', blockDomain);
router.put('/sites/:siteId/unblock', unblockDomain);
router.put('/sites/:siteId/verify', verifyDomain);
router.put('/sites/:siteId/limit-connections', limitWidgetConnections);

// Subscription & Revenue Management Routes
router.get('/subscriptions', getSubscriptionStatus);
router.post('/users/:userId/grant-lifetime', grantLifetimeAccess);
router.post('/users/:userId/extend-trial', extendFreeTrial);
router.post('/users/:userId/force-downgrade', forceDowngrade);
router.get('/revenue-metrics', getRevenueMetrics);

// System & Communication Routes
router.post('/announcements', createGlobalAnnouncement);
router.post('/push-notifications', sendPushNotification);
router.post('/maintenance-mode', toggleMaintenanceMode);

// Content & Compliance Routes
router.get('/storage-usage', getGlobalStorageUsage);
router.post('/purge-data', purgeOldData);
router.get('/reported-chats', getReportedChats);

export default router;