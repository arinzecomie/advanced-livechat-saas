/**
 * Authentication Routes - login, register, profile management
 * Public and protected authentication endpoints
 */
import express from 'express';
import {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  verifyToken
} from '../controllers/authController.js';
import authGuard from '../middlewares/authGuard.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/profile', authGuard, getProfile);
router.put('/profile', authGuard, updateProfile);
router.put('/password', authGuard, changePassword);
router.get('/verify', authGuard, verifyToken);

export default router;