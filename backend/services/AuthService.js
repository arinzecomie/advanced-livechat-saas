/**
 * Authentication Service - handles user registration, login, and JWT tokens
 * Business logic for user authentication
 */
import jwt from 'jsonwebtoken';
import UserModel from '../models/UserModel.js';
import SiteModel from '../models/SiteModel.js';

export default class AuthService {
  constructor() {
    this.userModel = new UserModel();
    this.siteModel = new SiteModel();
  }

  // Register new user
  async register(userData) {
    const { email, password, name } = userData;

    // Check if user exists
    const existingUser = await this.userModel.findByEmail(email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Create user
    const user = await this.userModel.createUser({
      email,
      password,
      name
    });

    // Create default site for user
    const site = await this.siteModel.createSite({
      user_id: user.id,
      domain: `${name.toLowerCase().replace(/\s+/g, '-')}.com`,
      status: 'trial'
    });

    // Generate token
    const token = this.generateToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      site: {
        id: site.site_id,
        domain: site.domain,
        status: site.status
      },
      token
    };
  }

  // Login user
  async login(email, password) {
    // Verify credentials
    const isValid = await this.userModel.verifyPassword(email, password);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Get user
    const user = await this.userModel.findByEmail(email);
    
    // Get user's sites
    const sites = await this.siteModel.findByUserId(user.id);

    // Generate token
    const token = this.generateToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      sites: sites.map(site => ({
        id: site.site_id,
        domain: site.domain,
        status: site.status
      })),
      token
    };
  }

  // Verify JWT token
  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  // Generate JWT token
  generateToken(user) {
    return jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  }

  // Get user by ID
  async getUserById(userId) {
    return this.userModel.findById(userId);
  }

  // Update user profile
  async updateProfile(userId, profileData) {
    return this.userModel.updateProfile(userId, profileData);
  }

  // Change password
  async changePassword(userId, currentPassword, newPassword) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isValid = await this.userModel.verifyPassword(user.email, currentPassword);
    if (!isValid) {
      throw new Error('Current password is incorrect');
    }

    // Update password
    return this.userModel.updatePassword(userId, newPassword);
  }
}