import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import newsRoutes from './routes/newsRoutes.js';
import authRoutes from './routes/authRoutes.js';
import voteRoutes from './routes/voteRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import logger from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP request logging
app.use(
  morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
);

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'GeoTruth AI Node.js Server',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/auth', authRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/votes', voteRoutes);
app.use('/api/chat', chatRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'GeoTruth AI API Server',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: {
        login: 'POST /auth/login',
        signup: 'POST /auth/signup',
        me: 'GET /auth/me',
      },
      news: {
        analyze: 'POST /api/news/analyze',
        history: 'GET /api/news/history',
        getById: 'GET /api/news/:id',
        voteLegacy: 'POST /api/news/:id/vote',
      },
      votes: {
        submit: 'POST /api/votes',
        getVotes: 'GET /api/votes/:newsId',
        getUserVote: 'GET /api/votes/:newsId/user',
      },
    },
  });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

export default app;

