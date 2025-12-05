/**
 * Authentication Guard - JWT token validation middleware
 * Protects routes that require authentication
 */
import AuthService from '../services/AuthService.js';

export default function authGuard(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ 
      error: 'No token provided',
      message: 'Authorization header is required'
    });
  }

  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7) 
    : authHeader;

  try {
    const authService = new AuthService();
    const decoded = authService.verifyToken(token);
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ 
      error: 'Invalid token',
      message: error.message
    });
  }
}

// Admin-only middleware
export function adminGuard(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Admin access required',
      message: 'You must be an admin to access this resource'
    });
  }

  next();
}

// Optional auth - sets req.user if token is valid, but doesn't require it
export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return next(); // Continue without user
  }

  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7) 
    : authHeader;

  try {
    const authService = new AuthService();
    const decoded = authService.verifyToken(token);
    req.user = decoded;
  } catch (error) {
    // Invalid token, but we don't fail the request
    console.warn('Invalid token in optional auth:', error.message);
  }

  next();
}