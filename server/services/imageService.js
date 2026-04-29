import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import logger from '../utils/logger.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * Image Verification Service
 * Calls the FastAPI image verification endpoint
 */
class ImageService {
  /**
   * Verify image authenticity
   * @param {string} imagePath - Path to uploaded image file
   * @returns {Promise<Object>} - Image verification result
   */
  async verifyImage(imagePath) {
    try {
      logger.info(`Sending image to verification service: ${imagePath}`);

      const formData = new FormData();
      formData.append('image', fs.createReadStream(imagePath));

      const response = await axios.post(
        `${AI_SERVICE_URL}/verify-image`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
          timeout: 30000,
        }
      );

      const data = response.data;

      logger.info(`Image verification completed: decision=${data.decision || data.label}`);

      return {
        imageScore: data.image_score || data.score || 0,
        hashScore: data.hash_score || 0,
        cnnScore: data.cnn_score || 0,
        decision: data.decision || data.label || 'UNKNOWN',
        message: data.message || 'Verification completed',
      };
    } catch (error) {
      logger.error(`Image verification service error: ${error.message}`);

      // Return fallback values if service is unavailable
      return {
        imageScore: null,
        hashScore: null,
        cnnScore: null,
        decision: 'UNKNOWN',
        message: 'Image service unavailable',
      };
    }
  }

  /**
   * Clean up temporary uploaded file
   * @param {string} filePath
   */
  cleanupFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info(`Cleaned up temporary file: ${filePath}`);
      }
    } catch (error) {
      logger.error(`Failed to cleanup file: ${error.message}`);
    }
  }
}

export default new ImageService();

