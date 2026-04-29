import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

/**
 * JWT Authentication Middleware
 * Verifies JWT token from Authorization header
 * Attaches userId to request object
 */
export const authenticate = (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check for token in cookies (optional)
    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      res.status(401);
      throw new Error('Not authorized, no token');
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to request
    req.userId = decoded.userId;
    req.userEmail = decoded.email;

    next();
  } catch (error) {
    logger.error(`Auth middleware error: ${error.message}`);
    res.status(401);
    next(new Error('Not authorized, token failed'));
  }
};

/**
 * Optional authentication middleware
 * Attaches userId if token exists, but doesn't require it
 */
export const optionalAuth = (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.userId;
      req.userEmail = decoded.email;
    }

    next();
  } catch (error) {
    // Token invalid but optional, continue without user
    next();
  }
};

