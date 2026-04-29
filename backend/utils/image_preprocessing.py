"""
Image preprocessing utilities.
Converts uploaded images to formats usable by OpenCV and PyTorch.
"""

import io
import logging
from typing import Tuple

import cv2
import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)

# Allowed image MIME types
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/jpg", "image/png"}


def validate_image_file(content_type: str) -> bool:
    """
    Validate that the uploaded file is an allowed image type.

    Args:
        content_type: MIME type from the upload (e.g., 'image/jpeg')

    Returns:
        True if valid, False otherwise
    """
    return content_type.lower() in ALLOWED_CONTENT_TYPES


def pil_to_opencv(pil_image: Image.Image) -> np.ndarray:
    """
    Convert a PIL Image to an OpenCV BGR numpy array.

    Args:
        pil_image: PIL Image in RGB mode

    Returns:
        OpenCV-compatible BGR image (numpy ndarray)
    """
    rgb_array = np.array(pil_image)
    bgr_array = cv2.cvtColor(rgb_array, cv2.COLOR_RGB2BGR)
    return bgr_array


def bytes_to_pil(file_bytes: bytes) -> Image.Image:
    """
    Convert raw file bytes to a PIL Image in RGB mode.

    Args:
        file_bytes: Raw bytes from the uploaded file

    Returns:
        PIL Image in RGB mode

    Raises:
        ValueError: If the image cannot be opened or converted
    """
    try:
        pil_image = Image.open(io.BytesIO(file_bytes))
        if pil_image.mode != "RGB":
            pil_image = pil_image.convert("RGB")
        return pil_image
    except Exception as exc:
        logger.error("Failed to convert bytes to PIL image: %s", exc)
        raise ValueError("Invalid image file. Could not decode.") from exc


def preprocess_for_cnn(pil_image: Image.Image, target_size: Tuple[int, int] = (224, 224)) -> np.ndarray:
    """
    Preprocess a PIL image for CNN feature extraction.

    Steps:
        1. Resize to target_size
        2. Convert to numpy array (HWC, 0-255)
        3. Normalize using ImageNet mean/std

    Args:
        pil_image: PIL Image in RGB mode
        target_size: (height, width) for resizing

    Returns:
        Normalized numpy array of shape (3, H, W) ready for torch tensor conversion
    """
    # Resize using high-quality downsampling
    resized = pil_image.resize(target_size, Image.Resampling.LANCZOS)

    # Convert to numpy array (H, W, C) with float32
    img_array = np.array(resized, dtype=np.float32)

    # Normalize using ImageNet stats
    mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
    std = np.array([0.229, 0.224, 0.225], dtype=np.float32)

    img_array = img_array / 255.0
    img_array = (img_array - mean) / std

    # Convert HWC -> CHW
    img_array = img_array.transpose(2, 0, 1)

    return img_array
