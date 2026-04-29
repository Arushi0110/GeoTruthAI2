import logger from '../utils/logger.js';

/**
 * Chat Controller — Backend API for chatbot responses
 * Handles user messages and generates dynamic responses
 * using keyword matching + future AI integration
 */
class ChatController {
  /**
   * Handle user message and generate bot response
   * POST /api/chat/message
   * @param {Object} req
   * @param {string} req.body.message - User message
   * @param {string} [req.body.context] - Optional context (news text, etc.)
   * @param {string} [req.userId] - Authenticated user ID
   * @returns {Object} bot response
   */
  async sendMessage(req, res, next) {
    try {
      const { message, context } = req.body;
      const userId = req.userId;

      // Validate input
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Message is required',
        });
      }

      logger.info(`Chat message from user ${userId}: "${message}"`);

      const response = generateDynamicResponse(message, context || '');

      res.status(200).json({
        success: true,
        message: response,
        context: 'geo-truth-assistant',
        userId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error(`Chat controller error: ${error.message}`);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * Get chat history (future feature)
   * GET /api/chat/history
   */
  async getHistory(req, res, next) {
    const userId = req.userId;
    
    // Mock response - implement Mongoose model later
    res.status(200).json({
      success: true,
      messages: [],
      total: 0,
    });
  }
}

/**
 * Dynamic response generation engine
 * @param {string} message
 * @param {string} context
 * @returns {string}
 */
function generateDynamicResponse(message, context) {
  const lower = message.toLowerCase().trim();

  // ---- GEO-TRUTH SPECIFIC RESPONSES ----
  if (lower.includes('trust score') || lower.includes('trustscore') || lower.includes('score')) {
    return `📊 **Trust Score Explained**\n\nThe Trust Score combines 4 weighted signals:\n\n` +
      `• **AI Analysis** (50%) — Text credibility\n` +
      `• **Image Verification** (20%) — Visual authenticity\n` +
      `• **Crowd Votes** (20%) — Community consensus\n` +
      `• **News API** (10%) — External validation\n\n` +
      `🟢 **Real** (>70)\n🟡 **Misleading** (40-70)\n🔴 **Fake** (<40)`;
  }

  if (lower.includes('how') || lower.includes('work') || lower.includes('analyze')) {
    return `🤖 **How GeoTruth AI Works**\n\n1. **Text Analysis** — Advanced NLP detects fake patterns\n` +
      `2. **Image Verification** — Reverse search + manipulation detection\n` +
      `3. **News API** — Cross-reference with trusted sources\n` +
      `4. **Community Votes** — Collective wisdom\n\nUpload news or image to try!`;
  }

  if (lower.includes('privacy') || lower.includes('data') || lower.includes('safe')) {
    return `🔒 **Privacy First**\n\n• Real-time analysis only\n• No permanent storage of personal data\n• Encrypted in transit\n• Location optional for geo-verification\n• Works without account for basic use`;
  }

  if (lower.includes('vote') || lower.includes('voting')) {
    return `🗳️ **Community Voting**\n\nVote on analyzed news: Real/Fake/Misleading\n• One vote per user per article\n• Votes update crowd score live\n• Influences 20% of Trust Score\n\nDemocracy vs AI!`;
  }

  // ---- NEWS ANALYSIS HELP ----
  if (lower.includes('analyze') || lower.includes('check') || lower.includes('verify')) {
    return `🔍 **Analyze News**\n\n1. Go to **Verify** page\n2. Paste news text\n3. Upload image (optional)\n4. Add location (optional)\n5. Get instant Trust Score!\n\nTry it now!`;
  }

  // ---- FALLBACKS ----
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return `👋 Hi! I'm GeoTruth Assistant. Ask me about:\n• Trust Score\n• How we detect fake news\n• Privacy & security\n• Voting system`;
  }

  // Context-aware responses
  if (context && context.length > 0) {
    return `Regarding "${context.substring(0, 50)}...":\n\nPaste the full news text in the Verify page for complete analysis!`;
  }

  // Default helpful response
  return `💡 I can help with:\n\n` +
    `• Trust Score explanation\n` +
    `• How news analysis works\n` +
    `• Privacy & data safety\n` +
    `• Voting & community features\n\n` +
    `What would you like to know?`;
}

export default new ChatController();
