"""
FastAPI router for image verification endpoints.

POST /verify-image
    Accepts an image file upload, runs both classical hashing
    and CNN-based analysis, and returns a combined verdict.
"""

import logging
import os
import sys
from typing import Dict

from fastapi import APIRouter, File, UploadFile, HTTPException, status
from PIL import Image

# Ensure project root is in path for absolute imports
_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if _PROJECT_ROOT not in sys.path:
    sys.path.insert(0, _PROJECT_ROOT)

# Use absolute imports with fallback to relative
try:
    from backend.utils.image_preprocessing import (
        bytes_to_pil,
        validate_image_file,
    )
    from backend.services.hash_service import analyze_image_hash
    from backend.services.cnn_service import analyze_image_cnn
except ImportError:
    from utils.image_preprocessing import (
        bytes_to_pil,
        validate_image_file,
    )
    from services.hash_service import analyze_image_hash
    from services.cnn_service import analyze_image_cnn

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/verify-image", tags=["Image Verification"])


# ---------------------------------------------------------------------------
# Decision thresholds
# ---------------------------------------------------------------------------
HASH_WEIGHT = 0.4
CNN_WEIGHT = 0.6
REAL_THRESHOLD = 0.7


def _compute_final_score(hash_score: float, cnn_score: float) -> float:
    """
    Combine hash and CNN scores into a single image score.

    Formula:
        image_score = (0.4 * hash_score) + (0.6 * cnn_score)
    """
    return (HASH_WEIGHT * hash_score) + (CNN_WEIGHT * cnn_score)


def _decision(image_score: float) -> str:
    """
    Convert numeric score to REAL/FAKE label.

    Threshold: > 0.7 → REAL, else → FAKE
    """
    return "REAL" if image_score > REAL_THRESHOLD else "FAKE"


@router.post(
    "",
    response_model=Dict,
    summary="Verify an uploaded image",
    description=(
        "Upload an image (jpg, jpeg, or png). "
        "The service computes a perceptual hash and a CNN embedding, "
        "compares both against reference databases, and returns a "
        "combined trust score with a REAL/FAKE verdict."
    ),
)
async def verify_image(file: UploadFile = File(..., description="Image file to verify")) -> Dict:
    """
    Async endpoint for image verification.

    Steps:
        1. Validate file type
        2. Convert to PIL Image
        3. Run classical hash analysis
        4. Run CNN embedding analysis
        5. Combine scores and return verdict
    """
    # --- Step 1: Validate file type ---
    if not validate_image_file(file.content_type or ""):
        logger.warning("Rejected upload with invalid content type: %s", file.content_type)
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=(
                f"Invalid file type: '{file.content_type}'. "
                "Only JPEG and PNG images are supported."
            ),
        )

    # --- Step 2: Read and convert image ---
    try:
        file_bytes = await file.read()
        if len(file_bytes) == 0:
            raise ValueError("Empty file uploaded")

        pil_image = bytes_to_pil(file_bytes)
        logger.info(
            "Image received: %s | size=%dx%d | mode=%s",
            file.filename,
            pil_image.width,
            pil_image.height,
            pil_image.mode,
        )
    except ValueError as exc:
        logger.error("Image decoding failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not decode image: {str(exc)}",
        ) from exc
    except Exception as exc:
        logger.error("Unexpected error reading image: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal error while processing the image.",
        ) from exc

    # --- Step 3: Classical hash analysis ---
    try:
        hash_result = analyze_image_hash(pil_image)
        hash_score = hash_result["hash_score"]
    except Exception as exc:
        logger.error("Hash analysis failed: %s", exc)
        hash_score = 0.0
        hash_result = {"hash_score": 0.0, "best_match_id": "error", "distance": -1}

    # --- Step 4: CNN embedding analysis ---
    try:
        cnn_result = analyze_image_cnn(pil_image)
        cnn_score = cnn_result["cnn_score"]
    except Exception as exc:
        logger.error("CNN analysis failed: %s", exc)
        cnn_score = 0.0
        cnn_result = {"cnn_score": 0.0, "best_match_id": "error"}

    # --- Step 5: Combine and decide ---
    image_score = _compute_final_score(hash_score, cnn_score)
    final_decision = _decision(image_score)

    logger.info(
        "Verification complete: score=%.4f decision=%s (hash=%.4f cnn=%.4f)",
        image_score,
        final_decision,
        hash_score,
        cnn_score,
    )

    return {
        "image_score": round(image_score, 4),
        "hash_score": round(hash_score, 4),
        "cnn_score": round(cnn_score, 4),
        "final_decision": final_decision,
        "details": {
            "hash": hash_result,
            "cnn": cnn_result,
        },
    }

