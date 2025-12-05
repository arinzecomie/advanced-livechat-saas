/**
 * Authentication Controller - handles login/register endpoints
 * Thin controller layer that delegates to AuthService
 */
import AuthService from '../services/AuthService.js';

const authService = new AuthService();

// Register new user
export async function register(req, res, next) {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({
        error: 'missing_fields',
        message: 'Email, password, and name are required'
      });
    }

    const result = await authService.register({ email, password, name });
    
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

// Login user
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        error: 'missing_fields',
        message: 'Email and password are required'
      });
    }

    const result = await authService.login(email, password);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

// Get current user profile
export async function getProfile(req, res, next) {
  try {
    const user = await authService.getUserById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        error: 'user_not_found',
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    });
  } catch (error) {
    next(error);
  }
}

// Update user profile
export async function updateProfile(req, res, next) {
  try {
    const { name, email } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;

    const user = await authService.updateProfile(req.user.id, updateData);
    
    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
}

// Change password
export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'missing_fields',
        message: 'Current password and new password are required'
      });
    }

    await authService.changePassword(req.user.id, currentPassword, newPassword);
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
}

// Verify token (for frontend)
export async function verifyToken(req, res, next) {
  try {
    // Token already verified by authGuard middleware
    res.json({
      success: true,
      data: {
        user: req.user,
        valid: true
      }
    });
  } catch (error) {
    next(error);
  }
}