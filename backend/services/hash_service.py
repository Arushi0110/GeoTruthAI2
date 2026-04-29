"""
Perceptual hashing service for classical image verification.

Uses pHash to compare uploaded images against a mock database
of known image hashes. Generates a similarity score in [0, 1].
"""

import logging
from typing import Dict, List, Tuple

import imagehash
from PIL import Image

logger = logging.getLogger(__name__)

# Mock database of perceptual hashes
# In production this would be a persistent store.
_MOCK_HASH_DB: List[Tuple[str, str]] = [
    ("trusted_001", "a9c4d2e8f0b13756"),
    ("trusted_002", "b1d5e3f9a2c04867"),
    ("trusted_003", "c2e6f4a0b3d15978"),
    ("trusted_004", "d3f7a5b1c4e26089"),
    ("trusted_005", "e4a8b6c2d5f37190"),
    ("trusted_006", "f5b9c7d3e6a48201"),
    ("trusted_007", "a6c0d8e4f7b59312"),
    ("trusted_008", "b7d1e9f5a8c60423"),
]


def compute_phash(pil_image: Image.Image, hash_size: int = 16) -> imagehash.ImageHash:
    """Compute pHash of a PIL image."""
    try:
        phash = imagehash.phash(pil_image, hash_size=hash_size)
        logger.debug("Computed pHash: %s", str(phash))
        return phash
    except Exception as exc:
        logger.error("pHash computation failed: %s", exc)
        raise RuntimeError("Could not compute image hash") from exc


def hamming_distance(hash1: imagehash.ImageHash, hash2: imagehash.ImageHash) -> int:
    """Hamming distance between two perceptual hashes."""
    return hash1 - hash2


def _convert_hash(hex_str: str) -> imagehash.ImageHash:
    """Convert hex string back to ImageHash."""
    return imagehash.hex_to_hash(hex_str)


def compare_with_database(input_hash: imagehash.ImageHash) -> Tuple[float, str, int]:
    """
    Compare input hash against mock database.
    Returns (best_similarity, best_match_id, best_distance).
    """
    max_distance = len(input_hash.hash) ** 2
    best_similarity = 0.0
    best_match_id = None
    best_distance = max_distance

    for img_id, stored_hex in _MOCK_HASH_DB:
        stored_hash = _convert_hash(stored_hex)
        distance = hamming_distance(input_hash, stored_hash)
        similarity = max(0.0, 1.0 - (distance / max_distance))

        if similarity > best_similarity:
            best_similarity = similarity
            best_match_id = img_id
            best_distance = distance

    logger.info("Hash best match: id=%s sim=%.4f dist=%d", best_match_id, best_similarity, best_distance)
    return best_similarity, best_match_id, best_distance


def analyze_image_hash(pil_image: Image.Image) -> Dict[str, float]:
    """Main entry: compute hash and compare with database."""
    input_hash = compute_phash(pil_image)
    similarity, match_id, distance = compare_with_database(input_hash)

    return {
        "hash_score": round(float(similarity), 4),
        "best_match_id": match_id or "none",
        "distance": int(distance),
    }
