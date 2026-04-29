import twilio from 'twilio';
import logger from '../utils/logger.js';

export const validateTwilioRequest = (req, res, next) => {
  const twilioSig = req.headers['x-twilio-signature'];
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!twilioSig) {
    logger.warn('Missing Twilio signature');
    return res.status(401).send('Unauthorized');
  }

  try {
    const url = new URL(req.protocol + '://' + req.get('host') + req.originalUrl);
    const isValid = twilio.validateRequest(authToken, twilioSig, url.href, req.body);
    if (isValid) {
      next();
    } else {
      logger.warn('Twilio signature invalid');
      res.status(401).send('Unauthorized');
    }
  } catch (err) {
    logger.error('Signature validation error:', err);
    res.status(401).send('Unauthorized');
  }
};

