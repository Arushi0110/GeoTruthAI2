const formatVerificationResult = (result) => {
  const { trustScore, label, confidence, breakdown } = result;

  const labelEmoji = {
    Real: '✅ Real',
    Fake: '❌ Fake',
    Misleading: '⚠️ Misleading'
  }[label] || '❓ Unknown';

  let message = `🔍 *GeoTruth AI Result*\n\n`;
  message += `🧠 Trust Score: *${trustScore}%*\n`;
  message += `📊 Label: ${labelEmoji}\n\n`;

  if (confidence) message += `🎯 Confidence: *${confidence}%*\n\n`;

  message += `📉 *Breakdown:*\n`;
  message += `🤖 AI: ${(breakdown.ai * 100).toFixed(0)}%\n`;
  message += `🖼️  Image: ${(breakdown.image * 100).toFixed(0)}%\n`;
  message += `📰 News API: ${(breakdown.newsApi * 100).toFixed(0)}%\n`;
  if (breakdown.hash) message += `🔒 Hash: ${(breakdown.hash * 100).toFixed(0)}%\n`;
  if (breakdown.cnn) message += `🧬 CNN: ${(breakdown.cnn * 100).toFixed(0)}%\n`;

  message += `\n*Powered by GeoTruth AI* 🤖`;

  return message;
};

const formatError = (error) => {
  return `⚠️ *Error*\n\n${error}\n\nPlease try again or send help text.`;
};

const formatWelcome = () => {
  return `🤖 *Welcome to GeoTruth AI WhatsApp!*\n\n` +
    `Send news *text* or *image* for instant verification.\n\n` +
    `📱 Features:\n` +
    `• Trust score 0-100%\n` +
    `• Real/Fake/Misleading label\n` +
    `• AI + image analysis\n\n` +
    `Just message your news! ✨`;
};

export { formatVerificationResult, formatError, formatWelcome };

