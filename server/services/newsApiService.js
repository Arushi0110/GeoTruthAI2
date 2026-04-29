import axios from 'axios';
import logger from '../utils/logger.js';

const NEWS_API_KEY = process.env.NEWS_API_KEY;
const NEWS_API_BASE_URL = 'https://newsapi.org/v2';

/**
 * NewsAPI Service
 * Validates news against real news sources
 */
class NewsApiService {
  /**
   * Extract keywords from text
   * @param {string} text
   * @returns {string[]} keywords
   */
  extractKeywords(text) {
    // Remove common stop words and extract meaningful words
    const stopWords = new Set([
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
      'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
      'would', 'could', 'should', 'may', 'might', 'must', 'shall',
      'can', 'need', 'dare', 'ought', 'used', 'to', 'of', 'in',
      'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into',
      'through', 'during', 'before', 'after', 'above', 'below',
      'between', 'under', 'and', 'but', 'or', 'yet', 'so',
      'if', 'because', 'although', 'though', 'while', 'where',
      'when', 'that', 'which', 'who', 'whom', 'whose', 'what',
      'this', 'these', 'those', 'i', 'me', 'my', 'myself', 'we',
      'our', 'ours', 'ourselves', 'you', 'your', 'yours',
      'yourself', 'yourselves', 'he', 'him', 'his', 'himself',
      'she', 'her', 'hers', 'herself', 'it', 'its', 'itself',
      'they', 'them', 'their', 'theirs', 'themselves', 'am',
    ]);

    return text
      .toLowerCase()
      .replace(/[^a-zA-Z\s]/g, '')
      .split(/\s+/)
      .filter((word) => word.length > 3 && !stopWords.has(word))
      .slice(0, 5);
  }

  /**
   * Validate news using NewsAPI
   * @param {string} text - News text
   * @returns {Promise<Object>} - Validation result
   */
  async validateNews(text) {
    try {
      if (!NEWS_API_KEY) {
        logger.warn('NewsAPI key not configured');
        return {
          newsApiScore: null,
          articlesFound: 0,
          trustedSources: 0,
          message: 'NewsAPI key not configured',
        };
      }

      const keywords = this.extractKeywords(text);
      const query = keywords.join(' OR ');

      logger.info(`Searching NewsAPI with query: ${query}`);

      const response = await axios.get(`${NEWS_API_BASE_URL}/everything`, {
        params: {
          q: query,
          language: 'en',
          sortBy: 'relevance',
          pageSize: 10,
          apiKey: NEWS_API_KEY,
        },
        timeout: 10000,
      });

      const articles = response.data.articles || [];
      const trustedSources = [
        'bbc', 'cnn', 'reuters', 'associated press', 'ap news',
        'npr', 'the guardian', 'washington post', 'new york times',
        'wall street journal', 'bloomberg', 'forbes', 'time',
        'the economist', 'al jazeera', 'politico', 'axios',
        'the hill', 'usa today', 'la times', 'boston globe',
      ];

      let trustedCount = 0;
      for (const article of articles) {
        const sourceName = (article.source?.name || '').toLowerCase();
        if (trustedSources.some((ts) => sourceName.includes(ts))) {
          trustedCount++;
        }
      }

      // Calculate score based on article count and trusted sources
      let newsApiScore = 0;
      if (articles.length > 0) {
        const trustRatio = trustedCount / articles.length;
        const coverageScore = Math.min(articles.length / 5, 1);
        newsApiScore = trustRatio * coverageScore;
      }

      logger.info(
        `NewsAPI: ${articles.length} articles, ${trustedCount} trusted sources, score=${newsApiScore.toFixed(4)}`
      );

      return {
        newsApiScore: Number(newsApiScore.toFixed(4)),
        articlesFound: articles.length,
        trustedSources: trustedCount,
        message: 'NewsAPI validation completed',
      };
    } catch (error) {
      logger.error(`NewsAPI error: ${error.message}`);

      return {
        newsApiScore: null,
        articlesFound: 0,
        trustedSources: 0,
        message: `NewsAPI error: ${error.message}`,
      };
    }
  }
}

export default new NewsApiService();

