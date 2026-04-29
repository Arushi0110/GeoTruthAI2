"""
NewsAPI Service for verifying news against real news sources.
"""

import logging

logger = logging.getLogger(__name__)


def verify_with_newsapi(text: str):
    """Stub: verify text via NewsAPI. Returns empty dict."""
    return {}


def is_api_key_configured() -> bool:
    """Stub: check if NewsAPI key is available."""
    return False


def calculate_combined_label(ai_label: str, ai_confidence: float, news_result: dict) -> tuple:
    """Stub: combine AI and NewsAPI results."""
    return ai_label, ai_confidence
