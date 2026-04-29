const formatVerificationResult = (result) => {
  const { trustScore, label, confidence, breakdown } = result;

  const labelEmoji = {
    Real: '✅',
    Fake: '❌',
    Misleading: '⚠️'
  }[label] || '❓';

  const scoreColor = trustScore > 70 ? '🟢' : trustScore > 40 ? '🟡' : '🔴';

  let message = `🔍 *Verification Result*\n\n`;

  message += `🧠 *Trust Score:* ${scoreColor} ${trustScore}%\n`;
  message += `📊 *Label:* ${labelEmoji} *${label}*\n\n`;

  if (confidence) {
    message += `📈 *Confidence:* ${confidence}%\n\n`;
  }

  message += `*Detailed Breakdown:*\n`;
  message += `🤖 AI Score: ${Math.round(breakdown.ai * 100)}%\n`;
  message += `🖼️ Image Score: ${Math.round(breakdown.image * 100)}%\n`;
  message += `📰 News API: ${Math.round(breakdown.newsApi * 100)}%\n`;
  message += `🔒 Hash Match: ${Math.round(breakdown.hash * 100)}%\n` || '';
  message += `🧬 CNN: ${Math.round(breakdown.cnn * 100)}%\n` || '';

  message += `\n\nPowered by GeoTruth AI 🤖`;

  return message;
};

const formatError = (error) => {
  return `⚠️ *Error*\n\n${error}\n\nPlease try again or contact support.`;
};

const formatWelcome = () => {
  return `🤖 *Welcome to GeoTruth AI!*\n\n` +
    `Send me any news text, article, or headline and I'll instantly verify if it's *real or fake*.\n\n` +
    `🔥 *Features:*\n` +
    `• Instant trust score\n` +
    `• Real/Fake/Misleading label\n` +
    `• AI + image + news analysis\n\n` +
    `Just paste your news and watch the magic! ✨`;
};

export { formatVerificationResult, formatError, formatWelcome };

