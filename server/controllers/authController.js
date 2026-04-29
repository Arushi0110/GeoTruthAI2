import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import logger from '../utils/logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

/**
 * Generate JWT token
 * @param {string} userId
 * @param {string} email
 * @returns {string}
 */
const generateToken = (userId, email) => {
  return jwt.sign({ userId, email }, JWT_SECRET, {
    expiresIn: JWT_EXPIRE,
  });
};

/**
 * Auth Controller
 * Handles user authentication
 */
class AuthController {
  /**
   * Register new user
   * POST /auth/signup
   */
  async signup(req, res, next) {
    try {
      const { name, email, password } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        res.status(409);
        throw new Error('Email already registered');
      }

      // Create new user
      const user = await User.create({
        name,
        email: email.toLowerCase(),
        password,
      });

      // Generate token
      const token = generateToken(user._id, user.email);

      logger.info(`New user registered: ${user.email}`);

      res.status(201).json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
        message: 'Account created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user
   * POST /auth/login
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Find user with password
      const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

      if (!user) {
        res.status(401);
        throw new Error('Invalid email or password');
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        res.status(401);
        throw new Error('Invalid email or password');
      }

      // Generate token
      const token = generateToken(user._id, user.email);

      logger.info(`User logged in: ${user.email}`);

      res.status(200).json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
        message: 'Login successful',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user
   * GET /auth/me
   */
  async getMe(req, res, next) {
    try {
      const user = await User.findById(req.userId).select('-password');

      if (!user) {
        res.status(404);
        throw new Error('User not found');
      }

      res.status(200).json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();

