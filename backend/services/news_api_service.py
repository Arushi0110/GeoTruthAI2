import os
import logging
import requests

logger = logging.getLogger(__name__)

NEWS_API_KEY = os.getenv("NEWS_API_KEY")


class NewsApiService:
    def __init__(self):
        self.api_key = NEWS_API_KEY
        self.base_url = "https://newsapi.org/v2/everything"

    async def validateNews(self, text: str):
        if not self.api_key:
            logger.warning("NewsAPI key not configured")
            return {"newsApiScore": None}

        try:
            params = {
                "q": text[:100],
                "apiKey": self.api_key,
                "language": "en",
                "pageSize": 5,
            }

            response = requests.get(self.base_url, params=params, timeout=10)
            data = response.json()

            articles = data.get("articles", [])
            score = 0.7 if len(articles) > 0 else 0.3

            return {"newsApiScore": score}

        except Exception as e:
            logger.error(f"NewsAPI error: {e}")
            return {"newsApiScore": None}


def is_api_key_configured() -> bool:
    return NEWS_API_KEY is not None


def verify_with_newsapi(text: str):
    return {}

def calculate_combined_label(ai_label: str, ai_confidence: float, news_result: dict):
    """
    Combine AI + NewsAPI signals into final trust output.
    """
    news_score = news_result.get("newsApiScore")

    # simple fusion logic
    if news_score is None:
        return ai_label, ai_confidence

    combined_confidence = (ai_confidence + news_score) / 2

    if combined_confidence > 0.6:
        final_label = "REAL"
    else:
        final_label = "FAKE"

    return final_label, combined_confidence    