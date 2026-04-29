import express from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import newsController from '../controllers/newsController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// File filter for images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, and GIF are allowed.'), false);
  }
};

// Multer upload configuration
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});

/**
 * @route   POST /api/news/analyze
 * @desc    Analyze news content (text + optional image + location)
 * @access  Private (JWT required)
 */
router.post(
  '/analyze',
  authenticate,
  upload.single('image'),
  newsController.analyzeNews
);

/**
 * @route   GET /api/news/history
 * @desc    Get user's news analysis history
 * @access  Private (JWT required)
 */
router.get('/history', authenticate, newsController.getHistory);

/**
 * @route   GET /api/news/:id
 * @desc    Get single news analysis by ID
 * @access  Private (JWT required)
 */
router.get('/:id', authenticate, newsController.getById);

/**
 * @route   POST /api/news/:id/vote
 * @desc    Vote on news authenticity
 * @access  Private (JWT required)
 */
router.post('/:id/vote', authenticate, newsController.vote);

export default router;

