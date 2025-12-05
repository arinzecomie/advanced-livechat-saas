/**
 * Admin Controller - handles admin-only endpoints
 * Site management, user management, and system analytics
 */
import UserModel from '../models/UserModel.js';
import SiteModel from '../models/SiteModel.js';
import PaymentService from '../services/PaymentService.js';

const userModel = new UserModel();
const siteModel = new SiteModel();
const paymentService = new PaymentService();

// Get system stats
export async function getSystemStats(req, res, next) {
  try {
    // Get user stats
    const totalUsers = await userModel.count();
    const adminUsers = await userModel.count({ role: 'admin' });
    
    // Get site stats
    const totalSites = await siteModel.count();
    const activeSites = await siteModel.count({ status: 'active' });
    const trialSites = await siteModel.count({ status: 'trial' });
    const suspendedSites = await siteModel.count({ status: 'suspended' });
    
    // Get recent payments
    const recentPayments = await paymentService.getAllPayments(10);
    
    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          admins: adminUsers,
          regular: totalUsers - adminUsers
        },
        sites: {
          total: totalSites,
          active: activeSites,
          trial: trialSites,
          suspended: suspendedSites
        },
        recentPayments
      }
    });
  } catch (error) {
    next(error);
  }
}

// Get all users
export async function getUsers(req, res, next) {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const users = await userModel.findAll();
    const totalUsers = users.length;
    
    // Simple pagination
    const start = (page - 1) * limit;
    const end = start + parseInt(limit);
    const paginatedUsers = users.slice(start, end);
    
    res.json({
      success: true,
      data: {
        users: paginatedUsers.map(user => ({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          createdAt: user.created_at,
          updatedAt: user.updated_at
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalUsers,
          pages: Math.ceil(totalUsers / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

// Get all sites
export async function getSites(req, res, next) {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const sites = await siteModel.findAll();
    const totalSites = sites.length;
    
    // Get sites with user info
    const sitesWithUsers = await Promise.all(
      sites.map(async (site) => {
        const siteWithUser = await siteModel.getSiteWithUser(site.site_id);
        return siteWithUser;
      })
    );
    
    // Simple pagination
    const start = (page - 1) * limit;
    const end = start + parseInt(limit);
    const paginatedSites = sitesWithUsers.slice(start, end);
    
    res.json({
      success: true,
      data: {
        sites: paginatedSites,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalSites,
          pages: Math.ceil(totalSites / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

// Update site status
export async function updateSiteStatus(req, res, next) {
  try {
    const { siteId } = req.params;
    const { status } = req.body;
    
    if (!['trial', 'active', 'suspended'].includes(status)) {
      return res.status(400).json({
        error: 'invalid_status',
        message: 'Status must be one of: trial, active, suspended'
      });
    }
    
    const site = await siteModel.updateStatus(siteId, status);
    
    if (!site) {
      return res.status(404).json({
        error: 'site_not_found',
        message: 'Site not found'
      });
    }
    
    res.json({
      success: true,
      data: { site }
    });
  } catch (error) {
    next(error);
  }
}

// Get payment history
export async function getPaymentHistory(req, res, next) {
  try {
    const { page = 1, limit = 50 } = req.query;
    
    const payments = await paymentService.getAllPayments(parseInt(limit));
    const totalPayments = payments.length;
    
    // Simple pagination
    const start = (page - 1) * limit;
    const end = start + parseInt(limit);
    const paginatedPayments = payments.slice(start, end);
    
    res.json({
      success: true,
      data: {
        payments: paginatedPayments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalPayments,
          pages: Math.ceil(totalPayments / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

// Simulate payment (for testing)
export async function simulatePayment(req, res, next) {
  try {
    const { siteId, amount } = req.body;
    
    if (!siteId) {
      return res.status(400).json({
        error: 'missing_site_id',
        message: 'siteId is required'
      });
    }
    
    const payment = await paymentService.simulatePayment(siteId, amount || 29.99);
    
    res.json({
      success: true,
      data: { payment }
    });
  } catch (error) {
    next(error);
  }
}

// Create site for user
export async function createSite(req, res, next) {
  try {
    const { userId, domain } = req.body;
    
    if (!userId || !domain) {
      return res.status(400).json({
        error: 'missing_fields',
        message: 'userId and domain are required'
      });
    }
    
    const site = await siteModel.createSite({
      user_id: userId,
      domain,
      status: 'trial'
    });
    
    res.status(201).json({
      success: true,
      data: { site }
    });
  } catch (error) {
    next(error);
  }
}