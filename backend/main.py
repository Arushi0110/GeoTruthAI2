"""
GeoTruth AI - FastAPI Backend (Production Ready)

Provides endpoints for:
    - Authentication (signup/login)
    - Text-based fake news detection (BERT)
    - Image verification (pHash + ResNet50 CNN)
    - Unified news analysis (text + image + location)
    - Health checks
"""

import logging
import os
import sys
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from typing import Optional
from backend.services.news_api_service import verify_with_newsapi
from dotenv import load_dotenv
from fastapi import Query

load_dotenv()

# Ensure project root is in path for absolute imports
_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _PROJECT_ROOT not in sys.path:
    sys.path.insert(0, _PROJECT_ROOT)

from fastapi import FastAPI, HTTPException, status, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Use absolute imports with fallback to relative
# noinspection PyUnresolvedReferences
try:
    from backend.models import (
        HealthResponse,
        TextAnalysisRequest,
        AnalysisResponse,
        ImageVerificationResponse,
    )
    from backend.services import (
        analyze_text,
        is_model_loaded,
        is_api_key_configured,
        is_cnn_loaded,
        analyze_image_hash,
        analyze_image_cnn,
    )
    from backend.routes import image_routes
except ImportError:
    from backend.models import (
        HealthResponse,
        TextAnalysisRequest,
        AnalysisResponse,
        ImageVerificationResponse,
    )
    from backend.services import (
        analyze_text,
        is_model_loaded,
        is_api_key_configured,
        is_cnn_loaded,
        analyze_image_hash,
        analyze_image_cnn,
    )
    from backend.routes import image_routes

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
PORT = int(os.environ.get("PORT", 5001))
HOST = os.environ.get("HOST", "0.0.0.0")
DEBUG = os.environ.get("DEBUG", "true").lower() == "true"
CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*").split(",")

# ---------------------------------------------------------------------------
# In-memory user store (replace with database in production)
# ---------------------------------------------------------------------------
_users_db = {}
_tokens_db = {}


# ---------------------------------------------------------------------------
# Auth Models
# ---------------------------------------------------------------------------
class SignupRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., pattern=r"^\S+@\S+\.\S+$")
    password: str = Field(..., min_length=6, max_length=128)


class LoginRequest(BaseModel):
    email: str = Field(..., pattern=r"^\S+@\S+\.\S+$")
    password: str = Field(..., min_length=6, max_length=128)


class AuthResponse(BaseModel):
    token: str
    user: dict
    message: str


# ---------------------------------------------------------------------------
# News Analysis Models
# ---------------------------------------------------------------------------
class NewsAnalysisRequest(BaseModel):
    text: str = Field(..., min_length=10, max_length=10000)
    location: Optional[dict] = Field(None, description="{lat: float, lng: float}")


class NewsAnalysisResponse(BaseModel):
    label: str = Field(..., description="REAL, FAKE, or MISLEADING")
    trust_score: float = Field(..., ge=0.0, le=100.0)
    confidence: float = Field(..., ge=0.0, le=1.0)
    ai_score: float = Field(..., ge=0.0, le=1.0)
    ai_label: str = Field(...)
    ai_confidence: float = Field(..., ge=0.0, le=1.0)
    image_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    image_decision: Optional[str] = Field(None)
    location: Optional[dict] = Field(None)
    message: str = Field(...)


# ---------------------------------------------------------------------------
# Lifespan: startup and shutdown
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    logger.info("=" * 60)
    logger.info("Starting GeoTruth AI backend...")
    logger.info(f"Port: {PORT}, Host: {HOST}, Debug: {DEBUG}")
    logger.info("=" * 60)

    # Models are loaded lazily on first request to avoid blocking startup
    logger.info("✅ Server ready — models will load on first request")

    yield

    logger.info("Shutting down GeoTruth AI backend...")


# ---------------------------------------------------------------------------
# FastAPI App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="GeoTruth AI API",
    description="AI-powered news and image verification service",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if DEBUG else None,
    redoc_url="/redoc" if DEBUG else None,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(image_routes.router)


# ---------------------------------------------------------------------------
# Auth Endpoints
# ---------------------------------------------------------------------------
@app.post("/auth/signup", response_model=AuthResponse, tags=["Authentication"])
async def signup(request: SignupRequest):
    """Create a new user account."""
    if request.email in _users_db:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "name": request.name,
        "email": request.email,
        "password": request.password,  # In production: hash with bcrypt
        "created_at": datetime.utcnow().isoformat(),
    }
    _users_db[request.email] = user

    token = str(uuid.uuid4())
    _tokens_db[token] = {"user_id": user_id, "email": request.email}

    logger.info("New user registered: %s", request.email)
    return AuthResponse(
        token=token,
        user={"id": user_id, "name": request.name, "email": request.email},
        message="Account created successfully",
    )


@app.post("/auth/login", response_model=AuthResponse, tags=["Authentication"])
async def login(request: LoginRequest):
    """Authenticate user and return token."""
    user = _users_db.get(request.email)
    if not user or user["password"] != request.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = str(uuid.uuid4())
    _tokens_db[token] = {"user_id": user["id"], "email": request.email}

    logger.info("User logged in: %s", request.email)
    return AuthResponse(
        token=token,
        user={"id": user["id"], "name": user["name"], "email": user["email"]},
        message="Login successful",
    )


# ---------------------------------------------------------------------------
# Root & Health
# ---------------------------------------------------------------------------


# ---------------- NEWS HISTORY ----------------
@app.get("/api/news/history")
async def get_news_history(limit: int = Query(200, ge=1, le=500)):
    """
    Temporary news history endpoint (replace with DB later)
    """
    return {
        "data": [
            {
                "id": "1",
                "text": "Government announces new AI policy for digital media",
                "label": "REAL",
                "trustScore": 85,
                "createdAt": "2026-04-30T10:00:00"
            },
            {
                "id": "2",
                "text": "Viral claim about election results goes viral on WhatsApp",
                "label": "FAKE",
                "trustScore": 25,
                "createdAt": "2026-04-29T18:30:00"
            },
            {
                "id": "3",
                "text": "Mixed reports about economic growth trends",
                "label": "MISLEADING",
                "trustScore": 55,
                "createdAt": "2026-04-28T14:15:00"
            }
        ][:limit]
    }


# ---------------------------------------------------------------------------
# Text Analysis
# ---------------------------------------------------------------------------
@app.post("/analyze-text", response_model=AnalysisResponse, tags=["Text Analysis"])
async def analyze_text_endpoint(request: TextAnalysisRequest):
    """
    Analyze news text for authenticity using BERT.

    Returns:
        AnalysisResponse with label, scores, and metadata.
    """
    try:
        news_service = NewsApiService()
        news_result = news_service.validateNews(request.text)
        news_api_score = news_result.get("newsApiScore")
        ai_result = analyze_text(request.text)
        label = ai_result["label"]
        confidence = ai_result["confidence"]

        # Normalize score: FAKE confidence → lower score, REAL → higher
        ai_score = confidence if label == "REAL" else 1.0 - confidence
        if news_api_score is not None:
           ai_score = (ai_score * 0.6) + (news_api_score * 0.4)
        ai_score = max(0.05, min(ai_score, 0.95))
        return AnalysisResponse(
            label=label,
            ai_score=round(ai_score, 4),
            ai_label=ai_result.get("raw_label", label),
            ai_confidence=round(confidence, 4),
            message="Analysis completed successfully",
        )

    except ValueError as exc:
        logger.warning("Validation error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        logger.error("Analysis failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(exc)}",
        ) from exc


# ---------------------------------------------------------------------------
# Unified News Analysis (text + image + location)
# ---------------------------------------------------------------------------
@app.post("/api/news/analyze", response_model=NewsAnalysisResponse, tags=["News Analysis"])
async def analyze_news(
    text: str = Form(..., min_length=10, max_length=10000),
    location: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
):
    """
    Unified news analysis endpoint.
    Accepts text, optional image, and optional location JSON.
    Returns combined trust score and verdict.
    """
    logger.info("News analysis request received")

    # Parse location if provided
    parsed_location = None
    if location:
        import json
        try:
            parsed_location = json.loads(location)
        except json.JSONDecodeError:
            logger.warning("Invalid location JSON: %s", location)

    # Step 1: Text analysis
    try:
        ai_result = analyze_text(text)
        text_label = ai_result["label"]
        text_confidence = ai_result["confidence"]
        text_ai_score = text_confidence if text_label == "REAL" else 1.0 - text_confidence
    except Exception as exc:
        logger.error("Text analysis failed: %s", exc)
        text_label = "UNKNOWN"
        text_confidence = 0.0
        text_ai_score = 0.5

    # Step 2: Image analysis (if provided)
    image_score = None
    image_decision = None
    if image:
        try:
            from backend.utils.image_preprocessing import bytes_to_pil, validate_image_file
            from PIL import Image as PILImage

            if validate_image_file(image.content_type or ""):
                file_bytes = await image.read()
                if len(file_bytes) > 0:
                    pil_image = bytes_to_pil(file_bytes)
                    hash_result = analyze_image_hash(pil_image)
                    cnn_result = analyze_image_cnn(pil_image)

                    # Combine scores: 0.4 * hash + 0.6 * cnn
                    image_score = (0.4 * hash_result["hash_score"]) + (0.6 * cnn_result["cnn_score"])
                    image_decision = "REAL" if image_score > 0.7 else "FAKE"
            else:
                logger.warning("Invalid image content type: %s", image.content_type)
        except Exception as exc:
            logger.error("Image analysis failed: %s", exc)

    # Step 3: Combine scores
    # If we have both text and image scores, average them
    # If only text, use text score
    # If only image, use image score
    if image_score is not None:
        combined_score = (text_ai_score + image_score) / 2.0
    else:
        combined_score = text_ai_score

    # Convert to percentage
    trust_score = round(combined_score * 100, 2)

    # Determine final label
    if trust_score >= 70:
        final_label = "REAL"
    elif trust_score >= 40:
        final_label = "MISLEADING"
    else:
        final_label = "FAKE"

    logger.info(
        "Analysis complete: label=%s trust_score=%.2f text_score=%.4f image_score=%s",
        final_label,
        trust_score,
        text_ai_score,
        image_score,
    )

    return NewsAnalysisResponse(
    label=final_label,
    trust_score=trust_score,
    confidence=round(combined_score, 4),
    ai_score=round(text_ai_score, 4),
    ai_label=ai_result.get("raw_label", "UNKNOWN"),
    ai_confidence=round(text_confidence, 4),
    image_score=round(image_score, 4) if image_score is not None else None,
    image_decision=image_decision,
    location=parsed_location,
    message="Analysis completed successfully",
)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=HOST, port=PORT, reload=DEBUG)

