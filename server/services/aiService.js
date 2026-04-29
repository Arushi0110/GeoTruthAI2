import axios from 'axios';
import logger from '../utils/logger.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * AI Text Analysis Service
 * Calls the FastAPI text analysis endpoint
 */
class AIService {
  /**
   * Analyze text for fake news detection
   * @param {string} text - News text content
   * @returns {Promise<Object>} - AI analysis result
   */
  async analyzeText(text) {
    try {
      logger.info(`Sending text to AI service for analysis`);

      const response = await axios.post(
        `${AI_SERVICE_URL}/analyze-text`,
        { text },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000,
        }
      );

      const data = response.data;

      logger.info(`AI text analysis completed: label=${data.label}`);

      return {
        label: data.label || 'UNKNOWN',
        aiScore: data.ai_score || 0.5,
        aiLabel: data.ai_label || data.label,
        aiConfidence: data.ai_confidence || 0,
        message: data.message || 'Analysis completed',
      };
    } catch (error) {
      logger.error(`AI text service error: ${error.message}`);

      // Return fallback values if AI service is unavailable
      return {
        label: 'UNKNOWN',
        aiScore: 0.5,
        aiLabel: 'UNKNOWN',
        aiConfidence: 0,
        message: 'AI service unavailable, using fallback',
      };
    }
  }

  /**
   * Check if AI service is healthy
   * @returns {Promise<boolean>}
   */
  async isHealthy() {
    try {
      const response = await axios.get(`${AI_SERVICE_URL}/health`, {
        timeout: 5000,
      });
      return response.data?.status === 'healthy';
    } catch (error) {
      return false;
    }
  }
}

export default new AIService();

