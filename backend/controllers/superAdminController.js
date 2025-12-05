/**
 * Super Admin Controller - handles advanced admin-only endpoints
 * User management, site control, subscription management, system tools
 */
import UserModel from '../models/UserModel.js';
import SiteModel from '../models/SiteModel.js';
import PaymentService from '../services/PaymentService.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const userModel = new UserModel();
const siteModel = new SiteModel();
const paymentService = new PaymentService();

// User & Tenant Management
export async function getAllUsers(req, res, next) {
  try {
    const { page = 1, limit = 50, search = '', status = 'all', plan = 'all' } = req.query;
    
    // Get all users from database
    const allUsers = await userModel.findAll();
    
    // Filter users based on search and status
    let filteredUsers = allUsers;
    
    if (search) {
      filteredUsers = filteredUsers.filter(user => 
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (status !== 'all') {
      filteredUsers = filteredUsers.filter(user => user.status === status);
    }
    
    if (plan !== 'all') {
      filteredUsers = filteredUsers.filter(user => user.plan === plan);
    }
    
    // Pagination
    const total = filteredUsers.length;
    const start = (page - 1) * limit;
    const end = start + parseInt(limit);
    const paginatedUsers = filteredUsers.slice(start, end);
    
    // Get additional stats for each user
    const usersWithStats = await Promise.all(
      paginatedUsers.map(async (user) => {
        const sitesCount = await siteModel.count({ user_id: user.id });
        return {
          ...user,
          sites_count: sitesCount
        };
      })
    );
    
    res.json({
      users: usersWithStats,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    next(error);
  }
}

export async function banUser(req, res, next) {
  try {
    const { userId } = req.params;
    const { reason, duration } = req.body;
    
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update user status to banned
    const updatedUser = await userModel.update(userId, {
      status: 'banned',
      banned_reason: reason,
      banned_until: duration ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000) : null,
      banned_by: req.user.id,
      banned_at: new Date()
    });
    
    res.json({ 
      message: 'User banned successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        status: updatedUser.status,
        banned_until: updatedUser.banned_until
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function unbanUser(req, res, next) {
  try {
    const { userId } = req.params;
    
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const updatedUser = await userModel.update(userId, {
      status: 'active',
      banned_reason: null,
      banned_until: null,
      banned_by: null,
      banned_at: null
    });
    
    res.json({ 
      message: 'User unbanned successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        status: updatedUser.status
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function impersonateUser(req, res, next) {
  try {
    const { userId } = req.params;
    
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.status === 'banned') {
      return res.status(403).json({ error: 'Cannot impersonate banned user' });
    }
    
    // Create a special impersonation token
    const impersonationToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        isImpersonation: true,
        originalAdminId: req.user.id,
        originalAdminEmail: req.user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    console.log(`Admin ${req.user.email} is impersonating user ${user.email}`);
    
    res.json({
      message: 'Impersonation started successfully',
      token: impersonationToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.plan
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function resetUserPassword(req, res, next) {
  try {
    const { userId } = req.params;
    const { temporaryPassword, sendEmail } = req.body;
    
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const newPassword = temporaryPassword || Math.random().toString(36).slice(-10);
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const updatedUser = await userModel.update(userId, {
      password_hash: hashedPassword,
      password_reset_at: new Date(),
      password_reset_by: req.user.id
    });
    
    if (sendEmail) {
      console.log(`Password reset email would be sent to ${user.email} with temp password: ${newPassword}`);
    }
    
    res.json({
      message: 'Password reset successfully',
      temporaryPassword: newPassword,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function updateUserDetails(req, res, next) {
  try {
    const { userId } = req.params;
    const { name, email, plan, role } = req.body;
    
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if email is already taken by another user
    if (email && email !== user.email) {
      const existingUser = await userModel.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }
    
    const oldValues = {
      name: user.name,
      email: user.email,
      plan: user.plan,
      role: user.role
    };
    
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (plan) updateData.plan = plan;
    if (role) updateData.role = role;
    updateData.updated_at = new Date();
    
    const updatedUser = await userModel.update(userId, updateData);
    
    res.json({
      message: 'User details updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        plan: updatedUser.plan,
        role: updatedUser.role
      },
      oldValues
    });
  } catch (error) {
    next(error);
  }
}

// Site & Domain Control
export async function getAllSites(req, res, next) {
  try {
    const { page = 1, limit = 50, search = '', status = 'all', verified = 'all' } = req.query;
    
    // Get all sites from database
    const allSites = await siteModel.findAll();
    
    // Filter sites based on search and status
    let filteredSites = allSites;
    
    if (search) {
      filteredSites = filteredSites.filter(site => 
        site.domain.toLowerCase().includes(search.toLowerCase()) ||
        site.site_id.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (status !== 'all') {
      filteredSites = filteredSites.filter(site => site.status === status);
    }
    
    if (verified !== 'all') {
      filteredSites = filteredSites.filter(site => site.domain_verified === (verified === 'true'));
    }
    
    // Pagination
    const total = filteredSites.length;
    const start = (page - 1) * limit;
    const end = start + parseInt(limit);
    const paginatedSites = filteredSites.slice(start, end);
    
    // Get sites with user info
    const sitesWithUsers = await Promise.all(
      paginatedSites.map(async (site) => {
        const user = await userModel.findById(site.user_id);
        return {
          ...site,
          user_id: user
        };
      })
    );
    
    res.json({
      sites: sitesWithUsers,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    next(error);
  }
}

export async function blockDomain(req, res, next) {
  try {
    const { siteId } = req.params;
    const { reason, duration } = req.body;
    
    const site = await siteModel.findById(siteId);
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }
    
    const updatedSite = await siteModel.update(siteId, {
      status: 'blocked',
      blocked_reason: reason,
      blocked_until: duration ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000) : null,
      blocked_by: req.user.id,
      blocked_at: new Date()
    });
    
    res.json({ 
      message: 'Domain blocked successfully',
      site: {
        id: updatedSite.id,
        domain: updatedSite.domain,
        status: updatedSite.status,
        blocked_until: updatedSite.blocked_until
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function unblockDomain(req, res, next) {
  try {
    const { siteId } = req.params;
    
    const site = await siteModel.findById(siteId);
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }
    
    const updatedSite = await siteModel.update(siteId, {
      status: 'active',
      blocked_reason: null,
      blocked_until: null,
      blocked_by: null,
      blocked_at: null
    });
    
    res.json({ 
      message: 'Domain unblocked successfully',
      site: {
        id: updatedSite.id,
        domain: updatedSite.domain,
        status: updatedSite.status
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function verifyDomain(req, res, next) {
  try {
    const { siteId } = req.params;
    
    const site = await siteModel.findById(siteId);
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }
    
    const updatedSite = await siteModel.update(siteId, {
      domain_verified: true,
      domain_verified_at: new Date(),
      domain_verified_by: req.user.id
    });
    
    res.json({ 
      message: 'Domain verified successfully',
      site: {
        id: updatedSite.id,
        domain: updatedSite.domain,
        domain_verified: updatedSite.domain_verified
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function limitWidgetConnections(req, res, next) {
  try {
    const { siteId } = req.params;
    const { maxConnections, duration } = req.body;
    
    const site = await siteModel.findById(siteId);
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }
    
    const updatedSite = await siteModel.update(siteId, {
      connection_limit: maxConnections,
      connection_limit_until: duration ? new Date(Date.now() + duration * 60 * 60 * 1000) : null,
      connection_limit_set_by: req.user.id,
      connection_limit_set_at: new Date()
    });
    
    res.json({ 
      message: 'Connection limit set successfully',
      site: {
        id: updatedSite.id,
        domain: updatedSite.domain,
        connection_limit: updatedSite.connection_limit,
        connection_limit_until: updatedSite.connection_limit_until
      }
    });
  } catch (error) {
    next(error);
  }
}

// Subscription & Revenue Management
export async function getSubscriptionStatus(req, res, next) {
  try {
    const { page = 1, limit = 50, status = 'all', search = '' } = req.query;
    
    // Get all payments
    const allPayments = await paymentService.getAllPayments();
    
    // Filter payments
    let filteredPayments = allPayments;
    
    if (status !== 'all') {
      filteredPayments = filteredPayments.filter(payment => payment.status === status);
    }
    
    if (search) {
      filteredPayments = filteredPayments.filter(payment => 
        payment.user_name?.toLowerCase().includes(search.toLowerCase()) ||
        payment.user_email?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Pagination
    const total = filteredPayments.length;
    const start = (page - 1) * limit;
    const end = start + parseInt(limit);
    const paginatedPayments = filteredPayments.slice(start, end);
    
    res.json({
      subscriptions: paginatedPayments,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    next(error);
  }
}

export async function grantLifetimeAccess(req, res, next) {
  try {
    const { userId } = req.params;
    
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const updatedUser = await userModel.update(userId, {
      plan: 'lifetime',
      lifetime_granted_by: req.user.id,
      lifetime_granted_at: new Date()
    });
    
    // Create a lifetime payment record
    const lifetimePayment = await paymentService.createPayment({
      site_id: null,
      user_id: userId,
      amount: 0,
      currency: 'USD',
      status: 'completed',
      type: 'lifetime_grant',
      expires_at: null,
      granted_by: req.user.id
    });
    
    res.json({ 
      message: 'Lifetime access granted successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        plan: updatedUser.plan
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function extendFreeTrial(req, res, next) {
  try {
    const { userId } = req.params;
    const { days } = req.body;
    
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Find the user's latest payment/trial record
    const allPayments = await paymentService.getAllPayments();
    const userPayments = allPayments.filter(payment => payment.user_id === userId);
    const latestPayment = userPayments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
    
    if (latestPayment) {
      // Extend the trial period
      const extendedPayment = await paymentService.updatePayment(latestPayment.id, {
        expires_at: new Date(new Date(latestPayment.expires_at).getTime() + days * 24 * 60 * 60 * 1000),
        trial_extended_by: req.user.id,
        trial_extended_at: new Date()
      });
    } else {
      // Create a new trial record
      const newTrial = await paymentService.createPayment({
        site_id: null,
        user_id: userId,
        amount: 0,
        currency: 'USD',
        status: 'trial',
        type: 'trial_extension',
        expires_at: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
        trial_extended_by: req.user.id
      });
    }
    
    res.json({ 
      message: `Free trial extended by ${days} days successfully`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        plan: user.plan
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function forceDowngrade(req, res, next) {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const updatedUser = await userModel.update(userId, {
      plan: 'free',
      downgraded_by: req.user.id,
      downgraded_at: new Date(),
      downgrade_reason: reason
    });
    
    // Cancel any active subscriptions
    const allPayments = await paymentService.getAllPayments();
    const userPayments = allPayments.filter(payment => 
      payment.user_id === userId && payment.status === 'active'
    );
    
    await Promise.all(
      userPayments.map(payment => 
        paymentService.updatePayment(payment.id, {
          status: 'canceled',
          canceled_by: req.user.id,
          canceled_at: new Date()
        })
      )
    );
    
    res.json({ 
      message: 'User downgraded to free plan successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        plan: updatedUser.plan
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getRevenueMetrics(req, res, next) {
  try {
    const { period = '30d' } = req.query;
    
    let startDate;
    const now = new Date();
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    // Get all payments
    const allPayments = await paymentService.getAllPayments();
    
    // Filter payments by date
    const recentPayments = allPayments.filter(payment => 
      new Date(payment.created_at) >= startDate
    );
    
    // Calculate revenue metrics
    const revenueData = recentPayments
      .filter(payment => payment.status === 'completed')
      .reduce((acc, payment) => {
        const date = new Date(payment.created_at).toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = { revenue: 0, transactions: 0 };
        }
        acc[date].revenue += payment.amount;
        acc[date].transactions += 1;
        return acc;
      }, {});
    
    // Subscription metrics
    const subscriptionMetrics = allPayments.reduce((acc, payment) => {
      if (!acc[payment.status]) {
        acc[payment.status] = 0;
      }
      acc[payment.status] += 1;
      return acc;
    }, {});
    
    // Calculate MRR (Monthly Recurring Revenue)
    const activeSubscriptions = allPayments.filter(payment => 
      payment.status === 'active' && 
      ['subscription', 'recurring'].includes(payment.type)
    );
    
    const mrr = activeSubscriptions.reduce((sum, payment) => sum + payment.amount, 0);
    
    // Get churn data
    const churnData = recentPayments
      .filter(payment => payment.status === 'canceled')
      .reduce((acc, payment) => {
        const month = new Date(payment.created_at).toISOString().slice(0, 7);
        if (!acc[month]) {
          acc[month] = 0;
        }
        acc[month] += 1;
        return acc;
      }, {});
    
    res.json({
      revenue: Object.entries(revenueData).map(([date, data]) => ({
        _id: { year: parseInt(date.split('-')[0]), month: parseInt(date.split('-')[1]), day: parseInt(date.split('-')[2]) },
        revenue: data.revenue,
        transactions: data.transactions
      })),
      subscriptions: Object.entries(subscriptionMetrics).map(([status, count]) => ({
        _id: status,
        count
      })),
      mrr,
      churn: Object.entries(churnData).map(([month, count]) => ({
        _id: { year: parseInt(month.split('-')[0]), month: parseInt(month.split('-')[1]) },
        churned: count
      })),
      period
    });
  } catch (error) {
    next(error);
  }
}

// System & Communication
export async function createGlobalAnnouncement(req, res, next) {
  try {
    const { title, message, type = 'info', duration = 24, target = 'all' } = req.body;
    
    const announcement = {
      id: uuidv4(),
      title,
      message,
      type,
      duration: duration * 60 * 60 * 1000,
      target,
      created_by: req.user.id,
      created_at: new Date(),
      expires_at: new Date(Date.now() + duration * 60 * 60 * 1000)
    };
    
    res.json({
      message: 'Global announcement created successfully',
      announcement
    });
  } catch (error) {
    next(error);
  }
}

export async function sendPushNotification(req, res, next) {
  try {
    const { message, type = 'system', priority = 'normal' } = req.body;
    
    const notification = {
      id: uuidv4(),
      message,
      type,
      priority,
      created_by: req.user.id,
      created_at: new Date(),
      target: 'all_widgets'
    };
    
    console.log(`Push notification would be sent to all widgets: ${message}`);
    
    res.json({
      message: 'Push notification sent successfully',
      notification
    });
  } catch (error) {
    next(error);
  }
}

export async function toggleMaintenanceMode(req, res, next) {
  try {
    const { enabled, message = 'Site is under maintenance', duration = null } = req.body;
    
    const maintenanceConfig = {
      enabled,
      message,
      duration,
      set_by: req.user.id,
      set_at: new Date(),
      expires_at: duration ? new Date(Date.now() + duration * 60 * 60 * 1000) : null
    };
    
    console.log(`Maintenance mode ${enabled ? 'enabled' : 'disabled'}: ${message}`);
    
    res.json({
      message: `Maintenance mode ${enabled ? 'enabled' : 'disabled'} successfully`,
      maintenance: maintenanceConfig
    });
  } catch (error) {
    next(error);
  }
}

// Content & Compliance
export async function getGlobalStorageUsage(req, res, next) {
  try {
    const storageData = {
      total_usage: '2.3 GB',
      breakdown: {
        images: '1.8 GB',
        files: '0.5 GB'
      },
      by_user_tier: {
        free: '0.8 GB',
        pro: '1.2 GB',
        enterprise: '0.3 GB'
      },
      growth_trend: 'up 15% from last month',
      last_updated: new Date()
    };
    
    res.json(storageData);
  } catch (error) {
    next(error);
  }
}

export async function purgeOldData(req, res, next) {
  try {
    const { days = 90, target = 'free_users', dry_run = true } = req.body;
    
    // This is a simulation - in a real implementation, this would delete actual data
    const mockDeletedCount = Math.floor(Math.random() * 1000) + 100;
    
    if (dry_run) {
      res.json({
        message: 'Dry run completed',
        would_delete: mockDeletedCount,
        criteria: { days, target },
        cutoff_date: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      });
    } else {
      console.log(`Purged ${mockDeletedCount} messages older than ${days} days for target: ${target}`);
      res.json({
        message: 'Data purged successfully',
        deleted_count: mockDeletedCount,
        criteria: { days, target }
      });
    }
  } catch (error) {
    next(error);
  }
}

export async function getReportedChats(req, res, next) {
  try {
    const { page = 1, limit = 50, status = 'all' } = req.query;
    
    const mockReports = [
      {
        id: '1',
        chat_id: 'chat_123',
        site_id: 'site_456',
        reported_by: 'visitor_789',
        reason: 'spam',
        description: 'User was sending spam messages',
        status: 'pending',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
        messages: [
          { content: 'Check out this amazing offer!', timestamp: new Date() }
        ]
      },
      {
        id: '2',
        chat_id: 'chat_456',
        site_id: 'site_789',
        reported_by: 'visitor_123',
        reason: 'harassment',
        description: 'Inappropriate language used',
        status: 'reviewed',
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000),
        reviewed_by: 'admin_1',
        reviewed_at: new Date(Date.now() - 12 * 60 * 60 * 1000),
        action_taken: 'user_warned'
      }
    ];
    
    let filteredReports = mockReports;
    if (status !== 'all') {
      filteredReports = mockReports.filter(report => report.status === status);
    }
    
    const total = filteredReports.length;
    const start = (page - 1) * limit;
    const end = start + parseInt(limit);
    const paginatedReports = filteredReports.slice(start, end);
    
    res.json({
      reports: paginatedReports,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    next(error);
  }
}