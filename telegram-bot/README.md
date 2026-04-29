# GeoTruth AI Telegram Bot

Production-ready Telegram bot for news verification.

## Quick Start (Local)

1. **Bot Token**: Message [@BotFather](https://t.me/BotFather), `/newbot`
2. **Backend**: `cd server && npm start` (localhost:5000)
3. **Env**:
```
cp .env.example .env
# Edit TELEGRAM_BOT_TOKEN, BACKEND_API_URL=http://localhost:5000
```
4. **Run**:
```
npm install
npm run dev  # Polling
```

Send `/start` or news text to bot!

## Production Deploy (Render/Railway)

### Render.com (Free Tier)

1. **GitHub**: Push `telegram-bot/` to repo
2. **Render Dashboard**: New → Web Service → Connect GitHub repo
3. **Settings**:
   - Name: `geotruth-bot`
   - Root Directory: `telegram-bot`
   - Runtime: Node
   - Build Command: `npm install`
   - Start Command: `npm run dev:webhook`
4. **Environment Variables** (Dashboard → Env):
   ```
   TELEGRAM_BOT_TOKEN=your_token
   BACKEND_API_URL=https://your-backend.com
   PORT=10000
   WEBHOOK_URL=https://geotruth-bot-xxx.onrender.com/webhook
   ```
5. **Deploy** → Live URL e.g. `https://geotruth-bot-xxx.onrender.com`

6. **Set Telegram Webhook**:
```
curl -F "url=https://geotruth-bot-xxx.onrender.com/webhook" https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook
```

### Railway.app

1. **Railway**: New Project → Deploy from GitHub (`telegram-bot/`)
2. **Variables**:
   ```
   TELEGRAM_BOT_TOKEN=your_token
   BACKEND_API_URL=https://your-backend.com
   ```
3. **Procfile** (add to repo):
   ```
   web: npm run dev:webhook
   ```
4. **Deploy** → URL `https://geotruth-bot.up.railway.app`
5. **Webhook**:
```
curl -F "url=https://geotruth-bot.up.railway.app/webhook" https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook
```

## Health Check
`GET /health` → `{"status":"ok"}`

## Features
- /start welcome
- News text → AI analysis (trust score, label, breakdown)
- Typing indicator, rate-limit 10s/user
- Error handling, Markdown
- Polling (dev) / Webhook (prod)

**Deploy live in 5 mins!** 🚀
