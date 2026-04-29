import express from 'express';
import { body } from 'express-validator';
import authController from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { handleValidationErrors } from '../middleware/validationMiddleware.js';

const router = express.Router();

/**
 * @route   POST /auth/signup
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/signup',
  [
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please enter a valid email address'),
    body('password')
      .isLength({ min: 6, max: 128 })
      .withMessage('Password must be between 6 and 128 characters'),
  ],
  handleValidationErrors,
  authController.signup
);

/**
 * @route   POST /auth/login
 * @desc    Authenticate user and get token
 * @access  Public
 */
router.post(
  '/login',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please enter a valid email address'),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
  ],
  handleValidationErrors,
  authController.login
);

/**
 * @route   GET /auth/me
 * @desc    Get current logged in user
 * @access  Private
 */
router.get('/me', authenticate, authController.getMe);

export default router;

