import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import apiService from './services/apiService.js';
import { formatVerificationResult, formatError, formatWelcome } from './utils/messageFormatter.js';

dotenv.config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

const userCooldowns = new Map(); // Simple rate limiting

bot.start((ctx) => ctx.replyWithMarkdown(formatWelcome(), { parse_mode: 'Markdown' }));

bot.on('text', async (ctx) => {
  const chatId = ctx.chat.id;
  const userId = ctx.from.id;
  const text = ctx.message.text.trim();

  // Rate limiting (1 request per 10s per user)
  const now = Date.now();
  const lastRequest = userCooldowns.get(userId) || 0;
  if (now - lastRequest < 10000) {
    return ctx.reply('⏳ Please wait 10 seconds between requests.');
  }
  userCooldowns.set(userId, now);

  try {
    // Typing indicator
    await ctx.replyChatAction('typing');

    if (text.length < 10) {
      return ctx.replyWithMarkdown(formatError('Message too short. Send at least 10 characters of news text.'), { parse_mode: 'Markdown' });
    }

    const result = await apiService.sendNewsForVerification(text);

    await ctx.replyWithMarkdown(formatVerificationResult(result), { parse_mode: 'Markdown' });
  } catch (err) {
    console.error('Bot Error:', err);
    await ctx.replyWithMarkdown(formatError(err.message), { parse_mode: 'Markdown' });
  }
});

bot.on('message', async (ctx) => {
  if (ctx.message.text) return; // Handled above

  ctx.reply('Please send text message for news verification. Images coming soon!');
});

bot.catch((err, ctx) => {
  console.error('Bot error:', err);
  ctx.reply('Sorry, something went wrong. Try again.');
});

// Polling mode
if (process.env.NODE_ENV !== 'production') {
  bot.launch();
  console.log('🤖 Telegram Bot started in polling mode');
  console.log('Press Ctrl+C to stop');

  // Graceful stop
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

export default bot;
export { bot };
