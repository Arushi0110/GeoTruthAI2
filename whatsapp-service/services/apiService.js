import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:5000';

class ApiService {
  async verifyNews(text, imageUrl = null) {
    logger.info(`Verifying news: text=${text?.substring(0,50)}..., image=${imageUrl ? 'yes' : 'no'}`);

    const form = new FormData();
    form.append('text', text || '');

    if (imageUrl) {
      try {
        logger.info(`Downloading image from ${imageUrl}`);
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 10000 });
        const imagePath = path.join(__dirname, '../../temp_image.jpg');
        fs.writeFileSync(imagePath, response.data);
        form.append('image', fs.createReadStream(imagePath), 'news_image.jpg');
        
        // Cleanup after
        setTimeout(() => fs.unlinkSync(imagePath), 5000);
      } catch (err) {
        logger.warn(`Image download failed: ${err.message}`);
      }
    }

    try {
      const backendResponse = await axios.post(`${BACKEND_URL}/api/news/analyze`, form, {
        headers: {
          ...form.getHeaders(),
        },
        timeout: 45000, // AI can be slow
      });

      const data = backendResponse.data;
      logger.info(`Backend response: score=${data.trustScore}, label=${data.label}`);

      return {
        trustScore: Math.round(data.trustScore),
        label: data.label,
        confidence: data.confidence ? Math.round(data.confidence * 100) : null,
        breakdown: {
          ai: backendResponse.data.breakdown?.ai_score || 0,
          image: backendResponse.data.breakdown?.image_score || 0,
          newsApi: backendResponse.data.breakdown?.news_api_score || 0,
          hash: backendResponse.data.breakdown?.hashScore || 0,
          cnn: backendResponse.data.breakdown?.cnnScore || 0,
        }
      };
    } catch (error) {
      logger.error(`Backend API error: ${error.message}`);
      throw new Error('Verification service temporarily unavailable');
    }
  }
}

export default new ApiService();

