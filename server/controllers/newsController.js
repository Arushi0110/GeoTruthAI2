import path from 'path';
import { fileURLToPath } from 'url';
import News from '../models/News.js';
import aiService from '../services/aiService.js';
import imageService from '../services/imageService.js';
import newsApiService from '../services/newsApiService.js';
import {
  calculateTrustScore,
} from '../services/trustScoreService.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * News Controller
 * Handles news analysis requests
 */
class NewsController {
  /**
   * Analyze news content
   * POST /api/news/analyze
   */
  async analyzeNews(req, res, next) {
    let imagePath = null;

    try {
      const { text, location } = req.body;
      const userId = req.userId;

      // Validate input
      if (!text || text.trim().length < 10) {
        res.status(400);
        throw new Error('News text is required (minimum 10 characters)');
      }

      logger.info(`News analysis started for user: ${userId}`);

      // Parse location if provided
      let parsedLocation = null;
      if (location) {
        try {
          parsedLocation = typeof location === 'string' ? JSON.parse(location) : location;
        } catch (e) {
          logger.warn('Invalid location format');
        }
      }

      // Get image path if uploaded
      if (req.file) {
        imagePath = path.join(__dirname, '..', req.file.path);
        logger.info(`Image uploaded: ${req.file.originalname}`);
      }

      // Step 1: AI Text Analysis
      logger.info('Step 1: AI text analysis');
      const aiResult = await aiService.analyzeText(text);

      // Step 2: Image Verification (if image provided)
      let imageResult = {
        imageScore: null,
        hashScore: null,
        cnnScore: null,
      };

      if (imagePath) {
        logger.info('Step 2: Image verification');
        imageResult = await imageService.verifyImage(imagePath);
      }

      // Step 3: NewsAPI Validation
      logger.info('Step 3: NewsAPI validation');
      const newsApiResult = await newsApiService.validateNews(text);

      // Step 4: Calculate Trust Score
      logger.info('Step 4: Trust score calculation');
      const trustResult = calculateTrustScore({
        ai_score: aiResult.aiScore,
        image_score: imageResult.imageScore,
        news_api_score: newsApiResult.newsApiScore,
        votes: { real: 0, fake: 0, misleading: 0 }, // Default neutral votes for new entries
      });

      // Step 5: Save to Database
      logger.info('Step 5: Saving to database');
      const newsEntry = await News.create({
        userId,
        text: text.trim(),
        imageUrl: req.file ? `/uploads/${req.file.filename}` : null,
        aiScore: aiResult.aiScore,
        imageScore: imageResult.imageScore,
        hashScore: imageResult.hashScore,
        cnnScore: imageResult.cnnScore,
        newsApiScore: newsApiResult.newsApiScore,
        trustScore: trustResult.trustScore,
        label: trustResult.label,
        location: parsedLocation,
        votes: [],
      });

      logger.info(
        `News analysis completed: id=${newsEntry._id}, trustScore=${trustResult.trustScore}%, label=${trustResult.label}`
      );

      // Step 6: Return response
      res.status(200).json({
        success: true,
        trustScore: trustResult.trustScore,
        label: trustResult.label,
        confidence: trustResult.confidence,
        breakdown: {
          ...trustResult.breakdown,
          hashScore: imageResult.hashScore,
          cnnScore: imageResult.cnnScore,
        },
        message: 'News analysis completed successfully',
      });
    } catch (error) {
      next(error);
    } finally {
      // Cleanup uploaded file
      if (imagePath) {
        imageService.cleanupFile(imagePath);
      }
    }
  }

  /**
   * Get user's news history
   * GET /api/news/history
   */
  async getHistory(req, res, next) {
    try {
      const userId = req.userId;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const news = await News.find({ userId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('-__v');

      const total = await News.countDocuments({ userId });

      res.status(200).json({
        success: true,
        data: news,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single news analysis by ID
   * GET /api/news/:id
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.userId;

      const news = await News.findOne({ _id: id, userId }).select('-__v');

      if (!news) {
        res.status(404);
        throw new Error('News analysis not found');
      }

      res.status(200).json({
        success: true,
        data: news,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Vote on news authenticity
   * POST /api/news/:id/vote
   */
  async vote(req, res, next) {
    try {
      const { id } = req.params;
      const { vote } = req.body;
      const userId = req.userId;

      if (!vote || !['Real', 'Fake'].includes(vote)) {
        res.status(400);
        throw new Error('Vote must be either "Real" or "Fake"');
      }

      const news = await News.findById(id);

      if (!news) {
        res.status(404);
        throw new Error('News analysis not found');
      }

      // Check if user already voted
      const existingVoteIndex = news.votes.findIndex(
        (v) => v.userId.toString() === userId
      );

      if (existingVoteIndex >= 0) {
        // Update existing vote
        news.votes[existingVoteIndex].vote = vote;
      } else {
        // Add new vote
        news.votes.push({ userId, vote });
      }

      await news.save();

      // Recalculate crowd score and full trust score from stored analysis scores + updated votes
      const realVotes = news.votes.filter((v) => v.vote === 'Real').length;
      const fakeVotes = news.votes.filter((v) => v.vote === 'Fake').length;
      const misleadingVotes = 0; // Schema only supports Real/Fake currently

      const recalculated = calculateTrustScore({
        ai_score: news.aiScore,
        image_score: news.imageScore,
        news_api_score: news.newsApiScore,
        votes: { real: realVotes, fake: fakeVotes, misleading: misleadingVotes },
      });

      // Persist updated trust metrics back to DB
      news.trustScore = recalculated.trustScore;
      news.label = recalculated.label;
      await news.save();

      res.status(200).json({
        success: true,
        message: 'Vote recorded successfully',
        trustScore: recalculated.trustScore,
        label: recalculated.label,
        confidence: recalculated.confidence,
        breakdown: recalculated.breakdown,
        totalVotes: news.votes.length,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new NewsController();

