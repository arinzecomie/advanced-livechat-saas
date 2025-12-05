/**
 * Payment Service - handles subscription management
 * Simple payment simulation without external gateways
 */
import PaymentModel from '../models/PaymentModel.js';
import SiteModel from '../models/SiteModel.js';

export default class PaymentService {
  constructor() {
    this.paymentModel = new PaymentModel();
    this.siteModel = new SiteModel();
  }

  // Create payment for site
  async createPayment(siteId, amount, currency = 'USD', days = 30) {
    const site = await this.siteModel.findBySiteId(siteId);
    if (!site) {
      throw new Error('Site not found');
    }

    const payment = await this.paymentModel.createPayment(
      site.id,
      amount,
      currency,
      days
    );

    // Simulate payment processing
    setTimeout(async () => {
      await this.completePayment(payment.id);
    }, 2000);

    return payment;
  }

  // Complete payment
  async completePayment(paymentId) {
    const payment = await this.paymentModel.completePayment(paymentId);
    
    // Activate site if payment completed
    if (payment.status === 'completed') {
      await this.siteModel.updateStatus(payment.site_id, 'active');
    }

    return payment;
  }

  // Get payment history for site
  async getSitePayments(siteId) {
    const site = await this.siteModel.findBySiteId(siteId);
    if (!site) {
      throw new Error('Site not found');
    }

    return this.paymentModel.getSitePayments(site.id);
  }

  // Check subscription status
  async getSubscriptionStatus(siteId) {
    const site = await this.siteModel.findBySiteId(siteId);
    if (!site) {
      throw new Error('Site not found');
    }

    const hasActivePayment = await this.paymentModel.hasActivePayment(site.id);
    const activePayment = await this.paymentModel.getActivePayment(site.id);

    return {
      status: site.status,
      hasActivePayment,
      activePayment,
      isTrial: site.status === 'trial',
      isActive: site.status === 'active',
      isSuspended: site.status === 'suspended'
    };
  }

  // Renew subscription
  async renewSubscription(siteId, days = 30) {
    const status = await this.getSubscriptionStatus(siteId);
    
    if (status.hasActivePayment) {
      // Extend current payment
      const activePayment = status.activePayment;
      const newExpiry = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      
      return this.paymentModel.update(activePayment.id, {
        expires_at: newExpiry
      });
    } else {
      // Create new payment
      return this.createPayment(siteId, 29.99, 'USD', days);
    }
  }

  // Cancel subscription
  async cancelSubscription(siteId) {
    const site = await this.siteModel.findBySiteId(siteId);
    if (!site) {
      throw new Error('Site not found');
    }

    // Suspend site
    await this.siteModel.updateStatus(siteId, 'suspended');

    // Cancel active payments
    const payments = await this.paymentModel.getSitePayments(site.id);
    const activePayments = payments.filter(p => p.status === 'completed');

    for (const payment of activePayments) {
      await this.paymentModel.update(payment.id, {
        status: 'cancelled',
        expires_at: new Date() // Expire immediately
      });
    }

    return { success: true, message: 'Subscription cancelled' };
  }

  // Get all payments (admin)
  async getAllPayments(limit = 50) {
    return this.paymentModel.getPaymentsWithSites(limit);
  }

  // Create payment with custom data (admin function)
  async createPayment(paymentData) {
    return this.paymentModel.create(paymentData);
  }

  // Update payment (admin function)
  async updatePayment(paymentId, updateData) {
    return this.paymentModel.update(paymentId, updateData);
  }

  // Simulate payment (for testing)
  async simulatePayment(siteId, amount = 29.99) {
    return this.paymentModel.simulatePayment(siteId, amount);
  }
}