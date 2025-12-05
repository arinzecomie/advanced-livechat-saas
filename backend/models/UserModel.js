/**
 * User Model - handles user authentication and management
 * Extends BaseModel with user-specific methods
 */
import BaseModel from './BaseModel.js';
import bcrypt from 'bcryptjs';
import db from '../config/db.js';

export default class UserModel extends BaseModel {
  constructor() {
    super('users');
  }

  // Find user by email
  async findByEmail(email) {
    return this.findOne({ email });
  }

  // Create user with hashed password
  async createUser(userData) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    // Extract password from userData to avoid inserting it into the database
    const { password, ...userDataWithoutPassword } = userData;
    return this.create({
      ...userDataWithoutPassword,
      password_hash: hashedPassword
    });
  }

  // Verify password
  async verifyPassword(email, password) {
    const user = await this.findByEmail(email);
    if (!user) return false;
    
    return bcrypt.compare(password, user.password_hash);
  }

  // Get user sites
  async getUserSites(userId) {
    return db('sites').where({ user_id: userId });
  }

  // Check if user is admin
  isAdmin(user) {
    return user.role === 'admin';
  }

  // Update user profile (without password)
  async updateProfile(id, data) {
    const { password, ...updateData } = data;
    return this.update(id, updateData);
  }

  // Update password
  async updatePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    return this.update(id, { password_hash: hashedPassword });
  }
}