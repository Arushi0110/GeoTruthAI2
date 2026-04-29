import mongoose from 'mongoose';
import NewsVotes from '../models/NewsVotes.js';
import UserVotes from '../models/UserVotes.js';
import News from '../models/News.js';
import { calculateTrustScore } from '../services/trustScoreService.js';
import logger from '../utils/logger.js';

/**
 * ============================================================
 * Vote Controller
 * ============================================================
 * Handles user voting on news articles with:
 * - Duplicate vote prevention
 * - Vote update support
 * - Atomic counter updates ($inc)
 * - Automatic trust score recalculation
 * ============================================================
 */

// Valid vote types (normalized to lowercase)
const VALID_VOTE_TYPES = ['real', 'fake', 'misleading'];

/**
 * Helper: Validate MongoDB ObjectId
 * @param {string} id
 * @returns {boolean}
 */
function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

/**
 * Helper: Normalize vote type to lowercase
 * @param {string} voteType
 * @returns {string|null}
 */
function normalizeVoteType(voteType) {
  if (!voteType || typeof voteType !== 'string') return null;
  const normalized = voteType.toLowerCase().trim();
  return VALID_VOTE_TYPES.includes(normalized) ? normalized : null;
}

/**
 * POST /api/vote
 * Submit or update a vote on a news article
 *
 * Flow:
 *   1. Validate inputs (newsId, voteType)
 *   2. Check if user already voted on this news
 *   3. If new vote → increment counter, create UserVotes record
 *   4. If existing vote → check if same or different
 *        - Same → no-op (idempotent)
 *        - Different → decrement old, increment new, update record
 *   5. Fetch updated vote counts
 *   6. Recalculate trust score on News document
 *   7. Return response
 */
export async function submitVote(req, res, next) {
  try {
    const userId = req.userId;
    const { newsId, voteType } = req.body;

    // ------------------------------------------------------------------
    // STEP 1: Validate inputs
    // ------------------------------------------------------------------
    if (!newsId || !isValidObjectId(newsId)) {
      res.status(400);
      throw new Error('Invalid or missing newsId');
    }

    const normalizedVote = normalizeVoteType(voteType);
    if (!normalizedVote) {
      res.status(400);
      throw new Error('Invalid voteType. Must be one of: real, fake, misleading');
    }

    logger.info(`Vote request: user=${userId} news=${newsId} type=${normalizedVote}`);

    // ------------------------------------------------------------------
    // STEP 2: Check for existing vote
    // ------------------------------------------------------------------
    const existingVote = await UserVotes.findOne({ userId, newsId });

    // ------------------------------------------------------------------
    // STEP 3: Handle vote creation or update
    // ------------------------------------------------------------------
    if (!existingVote) {
      // ---- NEW VOTE ----
      logger.info(`New vote: user=${userId} news=${newsId} type=${normalizedVote}`);

      // Atomically increment the vote counter
      await NewsVotes.findOneAndUpdate(
        { newsId },
        { $inc: { [`votes.${normalizedVote}`]: 1 } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      // Create user vote record
      await UserVotes.create({
        userId,
        newsId,
        voteType: normalizedVote,
      });
    } else if (existingVote.voteType === normalizedVote) {
      // ---- SAME VOTE → IDEMPOTENT NO-OP ----
      logger.info(`Duplicate vote ignored: user=${userId} news=${newsId} type=${normalizedVote}`);
    } else {
      // ---- VOTE CHANGE ----
      const previousType = existingVote.voteType;
      logger.info(
        `Vote changed: user=${userId} news=${newsId} ${previousType} → ${normalizedVote}`
      );

      // Atomically decrement previous vote and increment new vote
      await NewsVotes.findOneAndUpdate(
        { newsId },
        {
          $inc: {
            [`votes.${previousType}`]: -1,
            [`votes.${normalizedVote}`]: 1,
          },
        },
        { upsert: true, new: true }
      );

      // Update user vote record
      existingVote.voteType = normalizedVote;
      await existingVote.save();
    }

    // ------------------------------------------------------------------
    // STEP 4: Fetch updated vote counts
    // ------------------------------------------------------------------
    const voteCounts = await NewsVotes.findOne({ newsId });
    const votes = voteCounts
      ? {
          real: voteCounts.votes.real || 0,
          fake: voteCounts.votes.fake || 0,
          misleading: voteCounts.votes.misleading || 0,
        }
      : { real: 0, fake: 0, misleading: 0 };

    // ------------------------------------------------------------------
    // STEP 5: Recalculate trust score on News document
    // ------------------------------------------------------------------
    const newsDoc = await News.findById(newsId);
    if (newsDoc) {
      const recalculated = calculateTrustScore({
        ai_score: newsDoc.aiScore,
        image_score: newsDoc.imageScore,
        news_api_score: newsDoc.newsApiScore,
        votes: {
          real: votes.real,
          fake: votes.fake,
          misleading: votes.misleading,
        },
      });

      newsDoc.trustScore = recalculated.trustScore;
      newsDoc.label = recalculated.label;
      await newsDoc.save();

      logger.info(
        `Trust score updated after vote: news=${newsId} score=${recalculated.trustScore}% label=${recalculated.label}`
      );
    }

    // ------------------------------------------------------------------
    // STEP 6: Return response
    // ------------------------------------------------------------------
    res.status(200).json({
      success: true,
      message: existingVote
        ? existingVote.voteType === normalizedVote
          ? 'Vote already recorded'
          : 'Vote updated successfully'
        : 'Vote recorded successfully',
      votes,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/votes/:newsId
 * Fetch aggregated vote counts for a specific news article
 *
 * Returns default zeros if no votes have been recorded yet.
 */
export async function getVotes(req, res, next) {
  try {
    const { newsId } = req.params;

    // Validate newsId
    if (!newsId || !isValidObjectId(newsId)) {
      res.status(400);
      throw new Error('Invalid or missing newsId');
    }

    // Fetch vote counts
    const voteCounts = await NewsVotes.findOne({ newsId });

    const votes = voteCounts
      ? {
          real: voteCounts.votes.real || 0,
          fake: voteCounts.votes.fake || 0,
          misleading: voteCounts.votes.misleading || 0,
        }
      : { real: 0, fake: 0, misleading: 0 };

    res.status(200).json({
      success: true,
      votes,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/votes/:newsId/user
 * Fetch the current user's vote on a specific news article
 */
export async function getUserVote(req, res, next) {
  try {
    const userId = req.userId;
    const { newsId } = req.params;

    if (!newsId || !isValidObjectId(newsId)) {
      res.status(400);
      throw new Error('Invalid or missing newsId');
    }

    const userVote = await UserVotes.findOne({ userId, newsId });

    res.status(200).json({
      success: true,
      hasVoted: !!userVote,
      voteType: userVote ? userVote.voteType : null,
    });
  } catch (error) {
    next(error);
  }
}

