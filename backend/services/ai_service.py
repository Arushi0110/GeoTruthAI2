"""
AI Service for fake news detection using HuggingFace Transformers.
"""

import logging
import random
import os
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

# Global pipeline instance (loaded once)
_classifier: Optional[Any] = None
_model_loading: bool = False
_model_error: Optional[str] = None

# Model configuration
MODEL_NAME = "jy46604790/Fake-News-Bert-Detect"
FALLBACK_MODEL = "mrm8488/bert-mini-finetuned-fake-news-detection"

# Mock mode for development/testing
MOCK_MODE = os.environ.get("MOCK_AI", "false").lower() == "true"


def _load_model_sync() -> None:
    """Synchronous model loading (run in thread)."""
    global _classifier, _model_loading, _model_error
    _model_loading = True
    _model_error = None

    try:
        from transformers import pipeline
        logger.info(f"Loading AI model: {MODEL_NAME}")
        _classifier = pipeline(
            "text-classification",
            model=MODEL_NAME,
            tokenizer=MODEL_NAME,
            truncation=True,
            max_length=512,
            device=-1  # Use CPU
        )
        logger.info("AI model loaded successfully")
    except Exception as e:
        logger.warning(f"Failed to load {MODEL_NAME}: {e}")
        logger.info(f"Trying fallback model: {FALLBACK_MODEL}")
        try:
            from transformers import pipeline
            _classifier = pipeline(
                "text-classification",
                model=FALLBACK_MODEL,
                tokenizer=FALLBACK_MODEL,
                truncation=True,
                max_length=512,
                device=-1
            )
            logger.info("Fallback AI model loaded successfully")
        except Exception as e2:
            logger.error(f"Failed to load fallback model: {e2}")
            _model_error = str(e2)
    finally:
        _model_loading = False


def get_classifier() -> Any:
    """
    Get or initialize the HuggingFace text classification pipeline.
    Uses lazy loading with a global singleton.
    """
    global _classifier
    if _classifier is None and not _model_loading and _model_error is None:
        _load_model_sync()
    return _classifier


def analyze_text(text: str) -> Dict[str, Any]:
    """
    Analyze text using the AI model.

    Args:
        text: News content to analyze

    Returns:
        Dictionary with:
            - label: "REAL" or "FAKE" (normalized)
            - confidence: float (0-1)
            - raw_label: Original model label
    """
    if not text or len(text.strip()) < 10:
        raise ValueError("Text must be at least 10 characters long")

    # Mock mode for development
    if MOCK_MODE:
        return _mock_analyze(text)

    classifier = get_classifier()
    if classifier is None:
        logger.warning("AI model not loaded, using mock analysis")
        return _mock_analyze(text)

    # Truncate text to model max length to avoid errors
    truncated_text = text[:3000]

    try:
        result = classifier(truncated_text)[0]
        raw_label = result["label"]
        confidence = float(result["score"])

        # Normalize labels (models may use different label names)
        normalized_label = _normalize_label(raw_label, confidence)

        return {
            "label": normalized_label,
            "confidence": confidence,
            "raw_label": raw_label,
        }

    except Exception as e:
        logger.error(f"AI analysis error: {e}")
        logger.warning("Falling back to mock analysis")
        return _mock_analyze(text)


def _mock_analyze(text: str) -> Dict[str, Any]:
    """
    Mock analysis for development/testing when model is not available.
    Uses simple heuristics to simulate AI analysis.
    """
    text_lower = text.lower()

    # Simple heuristic-based scoring
    fake_indicators = [
        "shocking", "unbelievable", "you won't believe", "miracle",
        "doctors hate", "secret", "conspiracy", "hoax", "scam",
        "fake", "false", "lie", "lying", "debunked"
    ]
    real_indicators = [
        "reported by", "according to", "sources say", "official",
        "confirmed", "verified", "study shows", "research"
    ]

    fake_score = sum(1 for indicator in fake_indicators if indicator in text_lower)
    real_score = sum(1 for indicator in real_indicators if indicator in text_lower)

    # Add some randomness
    noise = random.uniform(-0.1, 0.1)
    confidence = min(0.95, max(0.55, 0.5 + (real_score - fake_score) * 0.1 + noise))

    if fake_score > real_score:
        label = "FAKE"
        confidence = 1.0 - confidence
    else:
        label = "REAL"

    return {
        "label": label,
        "confidence": round(confidence, 4),
        "raw_label": f"{label}_MOCK",
    }


def _normalize_label(raw_label: str, confidence: float) -> str:
    """
    Normalize model output labels to REAL/FAKE.

    Different models use different label conventions:
    - Some use: LABEL_0/LABEL_1
    - Some use: FAKE/REAL
    - Some use: False/True
    """
    label_upper = raw_label.upper()

    if "FAKE" in label_upper or "FALSE" in label_upper or "LABEL_0" in label_upper:
        return "FAKE"
    elif "REAL" in label_upper or "TRUE" in label_upper or "LABEL_1" in label_upper:
        return "REAL"
    else:
        # If we can't determine, use confidence threshold
        return "FAKE" if confidence < 0.5 else "REAL"


def is_model_loaded() -> bool:
    """Check if the AI model is loaded."""
    return _classifier is not None

