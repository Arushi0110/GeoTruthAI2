"""
CNN-based deep learning service for image verification.

Loads a pretrained ResNet50 once at startup, removes the final
classification layer, and uses it as a feature extractor.
Input images are compared against mock reference embeddings
using cosine similarity.
"""

import logging
from typing import Dict, List, Tuple

import numpy as np
import torch
import torch.nn as nn
import torchvision.models as models
from PIL import Image

from backend.utils.image_preprocessing import preprocess_for_cnn

logger = logging.getLogger(__name__)

# Global singletons (loaded once at first use)
_FEATURE_EXTRACTOR: nn.Module = None
_DEVICE: torch.device = None
_MOCK_EMBEDDING_DB: List[Tuple[str, np.ndarray]] = []


def _build_feature_extractor() -> nn.Module:
    """Load pretrained ResNet50 and strip the final FC layer."""
    logger.info("Loading pretrained ResNet50 for feature extraction...")
    try:
        from torchvision.models import ResNet50_Weights
        model = models.resnet50(weights=ResNet50_Weights.DEFAULT)
    except ImportError:
        model = models.resnet50(pretrained=True)

    # Remove final FC layer — keep up to avgpool
    model = nn.Sequential(*list(model.children())[:-1])
    model.eval()

    for param in model.parameters():
        param.requires_grad = False

    logger.info("ResNet50 feature extractor ready")
    return model


def _get_device() -> torch.device:
    """Force CPU for portability."""
    return torch.device("cpu")


def _init_globals() -> None:
    """Lazy-initialize model, device, and mock embeddings."""
    global _FEATURE_EXTRACTOR, _DEVICE
    if _FEATURE_EXTRACTOR is None:
        _DEVICE = _get_device()
        _FEATURE_EXTRACTOR = _build_feature_extractor().to(_DEVICE)
        _FEATURE_EXTRACTOR.eval()
        _init_mock_embeddings()


def _init_mock_embeddings() -> None:
    """Generate mock reference embeddings."""
    global _MOCK_EMBEDDING_DB
    if _MOCK_EMBEDDING_DB:
        return

    logger.info("Generating mock embedding database...")
    rng = np.random.RandomState(42)
    for i in range(8):
        vec = rng.randn(2048).astype(np.float32)
        vec = vec / np.linalg.norm(vec)
        _MOCK_EMBEDDING_DB.append((f"ref_{i+1:03d}", vec))

    logger.info("Mock embedding database ready (%d entries)", len(_MOCK_EMBEDDING_DB))


def extract_embedding(pil_image: Image.Image) -> np.ndarray:
    """
    Extract a 2048-dim feature vector from a PIL image.
    Returns L2-normalized numpy array.
    """
    _init_globals()

    img_array = preprocess_for_cnn(pil_image, target_size=(224, 224))
    tensor = torch.from_numpy(img_array).unsqueeze(0).to(_DEVICE)

    with torch.no_grad():
        features = _FEATURE_EXTRACTOR(tensor)

    embedding = features.squeeze().cpu().numpy()
    norm = np.linalg.norm(embedding)
    if norm > 0:
        embedding = embedding / norm

    return embedding.astype(np.float32)


def cosine_similarity(vec_a: np.ndarray, vec_b: np.ndarray) -> float:
    """Cosine similarity between two L2-normalized vectors."""
    similarity = float(np.dot(vec_a, vec_b))
    return max(0.0, min(1.0, similarity))


def compare_embedding_with_database(embedding: np.ndarray) -> Tuple[float, str]:
    """Compare embedding against mock database. Returns (best_sim, best_id)."""
    _init_globals()

    best_similarity = 0.0
    best_match_id = None

    for ref_id, ref_vec in _MOCK_EMBEDDING_DB:
        sim = cosine_similarity(embedding, ref_vec)
        if sim > best_similarity:
            best_similarity = sim
            best_match_id = ref_id

    logger.info("CNN best match: id=%s sim=%.4f", best_match_id, best_similarity)
    return best_similarity, best_match_id


def analyze_image_cnn(pil_image: Image.Image) -> Dict[str, float]:
    """Main entry: extract embedding and compare with database."""
    embedding = extract_embedding(pil_image)
    similarity, match_id = compare_embedding_with_database(embedding)

    return {
        "cnn_score": round(float(similarity), 4),
        "best_match_id": match_id or "none",
    }


def is_model_loaded() -> bool:
    """Check if CNN model is loaded."""
    return _FEATURE_EXTRACTOR is not None
