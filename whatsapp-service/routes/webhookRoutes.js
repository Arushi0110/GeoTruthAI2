import express from 'express';
import { webhook } from '../controllers/webhookController.js';
import { validateTwilioRequest } from '../middleware/twilioValidation.js'; // Optional signature validation

const router = express.Router();

router.post('/webhook', validateTwilioRequest, webhook);

router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'whatsapp-webhook' });
});

export default router;

