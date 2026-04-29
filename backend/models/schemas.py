"""
Pydantic models for request and response validation.
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any


class TextAnalysisRequest(BaseModel):
    """Request model for text analysis endpoint."""
    text: str = Field(
        ...,
        min_length=10,
        max_length=10000,
        description="News content to analyze"
    )


class AnalysisResponse(BaseModel):
    """Response model for news text analysis."""
    label: str = Field(..., description="Classification: REAL, FAKE, or MISLEADING")
    ai_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="AI confidence score (0-1)"
    )
    news_api_score: Optional[float] = Field(
        None,
        ge=0.0,
        le=1.0,
        description="NewsAPI verification score (0-1)"
    )
    ai_label: str = Field(..., description="Raw AI model label")
    ai_confidence: float = Field(..., description="Raw AI model confidence")
    trusted_sources_count: int = Field(
        default=0,
        description="Number of trusted sources found"
    )
    total_results: int = Field(
        default=0,
        description="Total articles found on NewsAPI"
    )
    message: Optional[str] = Field(
        None,
        description="Additional information or error message"
    )


class ImageVerificationResponse(BaseModel):
    """Response model for image verification endpoint."""
    image_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Combined image trust score (0-1)"
    )
    hash_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Perceptual hash similarity score (0-1)"
    )
    cnn_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="CNN embedding cosine similarity (0-1)"
    )
    final_decision: str = Field(
        ...,
        description="Verdict: REAL or FAKE"
    )
    details: Dict[str, Any] = Field(
        default_factory=dict,
        description="Detailed hash and CNN match info"
    )


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    model_loaded: bool
    image_model_loaded: bool
    news_api_available: bool
