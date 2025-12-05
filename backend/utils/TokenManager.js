/**
 * Token Manager Utility - JWT token helpers
 * Utility functions for token management
 */
import jwt from 'jsonwebtoken';

export default class TokenManager {
  static generateToken(payload, expiresIn = '7d') {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
  }

  static verifyToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET);
  }

  static decodeToken(token) {
    return jwt.decode(token);
  }

  static generateRefreshToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });
  }

  static generateTemporaryToken(payload, expiresIn = '1h') {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
  }

  static getTokenExpiration(token) {
    try {
      const decoded = jwt.decode(token);
      return decoded.exp ? new Date(decoded.exp * 1000) : null;
    } catch (error) {
      return null;
    }
  }

  static isTokenExpired(token) {
    const expiration = this.getTokenExpiration(token);
    if (!expiration) return true;
    
    return new Date() > expiration;
  }
}