import twilio from 'twilio';
const { MessagingResponse } = twilio.twiml;
import apiService from '../services/apiService.js';
import { formatVerificationResult, formatError, formatWelcome } from '../services/messageFormatter.js';
import logger from '../utils/logger.js';

export const webhook = async (req, res) => {
  try {
    const from = req.body.From;
    const body = req.body.Body?.trim();
    const mediaUrl0 = req.body.MediaUrl0;
    const messageSid = req.body.MessageSid;

    logger.info(`Webhook received from ${from}, sid=${messageSid}, text='${body?.substring(0,50)}...', media=${mediaUrl0 ? 'yes' : 'no'}`);

    const response = new MessagingResponse();

    if (!body && !mediaUrl0) {
      response.message(formatError('Please send news *text* or *image* to verify.'));
      res.type('text/xml');
      return res.send(response.toString());
    }

    if (body === 'start' || body === 'help') {
      response.message(formatWelcome());
      res.type('text/xml');
      return res.send(response.toString());
    }

    // Typing not supported on WhatsApp, but process
    response.message('🤖 Analyzing...');

    const result = await apiService.verifyNews(body, mediaUrl0);
    const formatted = formatVerificationResult(result);
    response.message(formatted);

    logger.info(`Reply sent to ${from}: ${result.label} (${result.trustScore}%)`);

    res.type('text/xml');
    res.send(response.toString());

  } catch (error) {
    logger.error(`Webhook error: ${error.message}`, { stack: error.stack });
    const response = new MessagingResponse();
    response.message(formatError('Unable to verify news right now. Try again later.'));
    res.type('text/xml');
    res.send(response.toString());
  }
};

