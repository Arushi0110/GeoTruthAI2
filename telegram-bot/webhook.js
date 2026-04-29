import express from 'express';
import dotenv from 'dotenv';
import { Telegraf } from 'telegraf';
import apiService from './services/apiService.js';
import { formatVerificationResult, formatError, formatWelcome } from './utils/messageFormatter.js';

dotenv.config();

const PORT = process.env.PORT || 3001;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL || `https://your-domain.com/webhook`; // Set your domain

const app = express();
app.use(express.json());
app.disable('x-powered-by');

const bot = new Telegraf(BOT_TOKEN);

const userCooldowns = new Map();

// Reuse handlers from bot.js
bot.start((ctx) => ctx.replyWithMarkdown(formatWelcome(), { parse_mode: 'Markdown' }));

bot.on('text', async (ctx) => {
  const chatId = ctx.chat.id;
  const userId = ctx.from.id;
  const text = ctx.message.text.trim();

  const now = Date.now();
  const lastRequest = userCooldowns.get(userId) || 0;
  if (now - lastRequest < 10000) {
    return ctx.reply('⏳ Please wait 10 seconds.');
  }
  userCooldowns.set(userId, now);

  try {
    await ctx.replyChatAction('typing');

    if (text.length < 10) {
      return ctx.replyWithMarkdown(formatError('Message too short.'), { parse_mode: 'Markdown' });
    }

    const result = await apiService.sendNewsForVerification(text);
    await ctx.replyWithMarkdown(formatVerificationResult(result), { parse_mode: 'Markdown' });
  } catch (err) {
    console.error('Webhook Error:', err);
    await ctx.replyWithMarkdown(formatError(err.message), { parse_mode: 'Markdown' });
  }
});

bot.catch((err, ctx) => {
  console.error('Webhook bot error:', err);
  ctx.reply('Something went wrong.');
});

// Webhook endpoint
app.use(bot.webhookCallback('/webhook'));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Set Telegram webhook (run once)
/* 
curl -F "url=https://your-domain.com/webhook" https://api.telegram.org/bot${BOT_TOKEN}/setWebhook
*/

app.listen(PORT, () => {
  console.log(`🚀 Telegram Webhook server running on port ${PORT}`);
  console.log(`Webhook path: /webhook`);
  console.log('Set webhook: https://api.telegram.org/bot{token}/setWebhook?url=https://your-domain.com/webhook');
});

