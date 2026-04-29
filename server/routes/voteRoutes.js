import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import {
  submitVote,
  getVotes,
  getUserVote,
} from '../controllers/voteController.js';

const router = express.Router();

/**
 * ============================================================
 * Vote Routes
 * ============================================================
 * Base path: /api/votes (mounted in app.js)
 *
 * Endpoints:
 *   POST   /api/votes        → Submit or update a vote (protected)
 *   GET    /api/votes/:newsId → Get vote counts for a news item
 *   GET    /api/votes/:newsId/user → Get current user's vote (protected)
 * ============================================================
 */

// POST /api/votes — Submit or update vote (requires authentication)
router.post('/', authenticate, submitVote);

// GET /api/votes/:newsId — Get aggregated vote counts (public)
router.get('/:newsId', getVotes);

// GET /api/votes/:newsId/user — Get current user's vote (requires authentication)
router.get('/:newsId/user', authenticate, getUserVote);

export default router;

