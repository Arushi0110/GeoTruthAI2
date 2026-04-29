import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const API_URL = process.env.BACKEND_API_URL || 'http://localhost:5000';

const apiService = {
  async sendNewsForVerification(text) {
    if (!text || text.trim().length < 10) {
      throw new Error('Text too short. Please send valid news text.');
    }

    try {
      const response = await axios.post(
        `${API_URL}/api/news/analyze`,
        { text: text.trim() },
        {
          timeout: 30000,
          headers: { 'Content-Type': 'application/json' }
        }
      );

      const data = response.data;

      return {
        trustScore: Math.round(data.trust_score),
        label: data.label,
        confidence: Math.round((data.confidence || 0) * 100),

        // AI model info
        aiScore: data.ai_score,
        aiLabel: data.ai_label,
        aiConfidence: Math.round((data.ai_confidence || 0) * 100),

        // Image info (if exists)
        imageScore: data.image_score ?? null,
        imageDecision: data.image_decision ?? null,

        // Optional
        message: data.message
      };

    } catch (error) {
      console.error('API Error:', error.response?.data || error.message);

      throw new Error(
        error.response?.data?.detail || 
        'Verification service unavailable. Try again later.'
      );
    }
  }
};

export default apiService;