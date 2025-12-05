/**
 * Site Guard - validates site access and status
 * Ensures sites are active and accessible
 */
import SiteModel from '../models/SiteModel.js';
import PaymentModel from '../models/PaymentModel.js';

export default function siteGuard(req, res, next) {
  const siteId = req.body.siteId || req.query.siteId || req.params.siteId;
  
  if (!siteId) {
    return res.status(400).json({ 
      error: 'Site ID required',
      message: 'siteId parameter is required'
    });
  }

  req.siteId = siteId;
  next();
}

// Check if site is active
export async function checkSiteActive(req, res, next) {
  const siteModel = new SiteModel();
  const paymentModel = new PaymentModel();
  
  try {
    const site = await siteModel.findBySiteId(req.siteId);
    if (!site) {
      return res.status(404).json({ 
        error: 'Site not found',
        message: 'Invalid site ID'
      });
    }

    // Check payment status
    const hasActivePayment = await paymentModel.hasActivePayment(site.id);
    
    if (!hasActivePayment && site.status !== 'trial') {
      // Auto-suspend if no active payment
      await siteModel.updateStatus(req.siteId, 'suspended');
      site.status = 'suspended';
    }

    if (!siteModel.isActive(site)) {
      return res.status(403).json({ 
        error: 'Site inactive',
        siteStatus: site.status,
        message: 'Chat unavailable - account inactive'
      });
    }

    req.site = site;
    next();
  } catch (error) {
    console.error('Site guard error:', error);
    return res.status(500).json({ 
      error: 'Internal error',
      message: 'Failed to validate site'
    });
  }
}

// Check if user owns the site
export async function checkSiteOwnership(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const siteModel = new SiteModel();
  
  try {
    const site = await siteModel.findBySiteId(req.siteId);
    if (!site) {
      return res.status(404).json({ 
        error: 'Site not found',
        message: 'Invalid site ID'
      });
    }

    // Admin can access any site
    if (req.user.role === 'admin') {
      req.site = site;
      return next();
    }

    // Check if user owns the site
    if (site.user_id !== req.user.id) {
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'You do not have access to this site'
      });
    }

    req.site = site;
    next();
  } catch (error) {
    console.error('Site ownership check error:', error);
    return res.status(500).json({ 
      error: 'Internal error',
      message: 'Failed to validate site ownership'
    });
  }
}