import express from 'express';
import chatController from '../controllers/chatController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// Test route
router.post('/chat', authenticate, (req, res) => {
  res.json({ message: "Chat API working" });
});

// Correct usage
router.post('/message', authenticate, chatController.sendMessage);
router.get('/history', authenticate, chatController.getHistory);

export default router;