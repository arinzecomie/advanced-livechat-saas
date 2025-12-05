/**
 * Payment Model - handles subscription payments for sites
 * Simple payment tracking without external gateway integration
 */
import BaseModel from './BaseModel.js';
import db from '../config/db.js';

export default class PaymentModel extends BaseModel {
  constructor() {
    super('payments');
  }

  // Get active payment for site
  async getActivePayment(siteId) {
    const now = new Date();
    return db('payments')
      .where({ site_id: siteId, status: 'completed' })
      .where('expires_at', '>', now)
      .first();
  }

  // Check if site has active payment
  async hasActivePayment(siteId) {
    const payment = await this.getActivePayment(siteId);
    return !!payment;
  }

  // Create payment for site
  async createPayment(siteId, amount, currency = 'USD', days = 30) {
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    
    return this.create({
      site_id: siteId,
      amount,
      currency,
      status: 'pending',
      expires_at: expiresAt
    });
  }

  // Complete payment
  async completePayment(paymentId) {
    return this.update(paymentId, {
      status: 'completed',
      updated_at: new Date()
    });
  }

  // Get payments for site
  async getSitePayments(siteId) {
    return this.findAll({ site_id: siteId });
  }

  // Get recent payments
  async getRecentPayments(limit = 50) {
    return db('payments')
      .orderBy('created_at', 'desc')
      .limit(limit);
  }

  // Get payments with site info
  async getPaymentsWithSites(limit = 50) {
    return db('payments')
      .join('sites', 'payments.site_id', 'sites.id')
      .join('users', 'sites.user_id', 'users.id')
      .select(
        'payments.*',
        'sites.site_id',
        'sites.domain',
        'users.email as user_email'
      )
      .orderBy('payments.created_at', 'desc')
      .limit(limit);
  }

  // Simulate payment processing (for development)
  async simulatePayment(siteId, amount = 29.99) {
    const payment = await this.createPayment(siteId, amount);
    
    // Simulate payment completion after 1 second
    setTimeout(async () => {
      await this.completePayment(payment.id);
      console.log(`✅ Payment ${payment.id} completed for site ${siteId}`);
    }, 1000);

    return payment;
  }
}