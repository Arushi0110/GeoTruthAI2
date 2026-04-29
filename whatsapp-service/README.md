# GeoTruth AI WhatsApp Service (Twilio)

Production-ready webhook for WhatsApp news verification.

## Setup

1. **Twilio**: [Console](https://console.twilio.com) → Get ACCOUNT_SID, AUTH_TOKEN
2. **WhatsApp Sandbox**: Messaging → Try it out → Send join code to your # to test
3. **Env**:
```
cp .env.example .env
# TWILIO_ACCOUNT_SID
# TWILIO_AUTH_TOKEN
# TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886 (sandbox)
# BACKEND_API_URL=http://localhost:5000
```

4. **Run**:
```
npm install
npm run dev  # Port 3002
```

## Configure Twilio

1. WhatsApp Sandbox → "A message comes in" → Webhook: `http://localhost:3002/webhook`
2. Test: Message sandbox # your WhatsApp (join first)

## Production (ngrok/Render)

**ngrok**:
```
ngrok http 3002
```
Webhook: `https://xxx.ngrok.io/webhook`

**Deploy Render/Railway**: Same as Telegram, start `npm run dev`

## Features
- Text + Image verification (downloads Twilio MediaUrl → FormData)
- Twilio signature validation
- Winston logging (logs/error.log)
- Rate limiting ready
- Health `/health`
- Backend /api/news/analyze compatible

**Test Flow**: WhatsApp → Twilio → Webhook → Backend → Twilio XML → WhatsApp

Ready for production! 📱✅
