import logger from '../utils/logger.js';

/**
 * ============================================================
 * Trust Score Calculation Service
 * ============================================================
 * Production-ready module that combines multiple verification
 * signals (AI, image, crowd votes, news API) into a single
 * trust score and classification label.
 *
 * Exported Functions:
 *   - calculateTrustScore(data)
 *   - calculateCrowdScore(votes)
 *   - getLabel(trustScore)
 *   - getConfidence(trustScore)
 *   - validateScore(score)
 *   - normalizeScore(score)
 * ============================================================
 */

// ------------------------------------------------------------------
// STEP 1: CONFIGURATION — Configurable Weights
// ------------------------------------------------------------------
const WEIGHTS = {
  ai: 0.5,
  image: 0.2,
  crowd: 0.2,
  news: 0.1,
};

// Fallback configuration for partial inputs (future extensibility)
const FALLBACK_WEIGHTS = {
  noImageNoNews: { ai: 0.7, image: 0, crowd: 0.2, news: 0.1 },
  noImage:       { ai: 0.6, image: 0, crowd: 0.25, news: 0.15 },
  noNews:        { ai: 0.55, image: 0.25, crowd: 0.2, news: 0 },
};

// ------------------------------------------------------------------
// STEP 2: VALIDATION — Ensure scores are numbers between 0 and 1
// ------------------------------------------------------------------

/**
 * Validates a raw score.
 * - If the value is a number between 0 and 1 (inclusive), returns it.
 * - Otherwise, returns the provided default (0 by default).
 *
 * @param {any} score
 * @param {number} defaultValue
 * @returns {number}
 */
export function validateScore(score, defaultValue = 0) {
  if (typeof score !== 'number' || Number.isNaN(score)) {
    return defaultValue;
  }
  if (score < 0 || score > 1) {
    return defaultValue;
  }
  return score;
}

// ------------------------------------------------------------------
// STEP 3: NORMALIZATION — Clamp scores safely between 0 and 1
// ------------------------------------------------------------------

/**
 * Normalizes any score to the [0, 1] range.
 * - Handles NaN, undefined, null, and non-number types.
 * - Defaults to 0 if invalid.
 *
 * @param {any} score
 * @returns {number} clamped score in [0, 1]
 */
export function normalizeScore(score) {
  if (typeof score !== 'number' || Number.isNaN(score)) {
    return 0;
  }
  return Math.max(0, Math.min(1, score));
}

// ------------------------------------------------------------------
// STEP 4: CROWD SCORE CALCULATION
// ------------------------------------------------------------------

/**
 * Calculates crowd score from vote counts.
 *
 * Input format:
 *   votes = { real: number, fake: number, misleading: number }
 *
 * If total_votes === 0, returns 0.5 (neutral).
 * Otherwise, crowd_score = real / total_votes.
 *
 * @param {Object} votes
 * @param {number} [votes.real]
 * @param {number} [votes.fake]
 * @param {number} [votes.misleading]
 * @returns {number} crowd score in [0, 1]
 */
export function calculateCrowdScore(votes = {}) {
  const real = validateScore(votes.real, 0);
  const fake = validateScore(votes.fake, 0);
  const misleading = validateScore(votes.misleading, 0);

  const totalVotes = real + fake + misleading;

  if (totalVotes === 0) {
    return 0.5; // Neutral value when no votes exist
  }

  return real / totalVotes;
}

// ------------------------------------------------------------------
// STEP 5: LABEL CLASSIFICATION
// ------------------------------------------------------------------

/**
 * Determines the label based on the final trust score.
 *
 *   > 70   → "Real"
 *   >= 40  → "Misleading"
 *   < 40   → "Fake"
 *
 * @param {number} trustScore — 0–100 scale
 * @returns {"Real" | "Fake" | "Misleading"}
 */
export function getLabel(trustScore) {
  if (trustScore > 70) return 'Real';
  if (trustScore >= 40) return 'Misleading';
  return 'Fake';
}

// ------------------------------------------------------------------
// STEP 6: CONFIDENCE LEVEL
// ------------------------------------------------------------------

/**
 * Determines the confidence level based on the trust score.
 *
 *   High   → score > 75  OR  score < 25
 *   Medium → 40 ≤ score ≤ 75
 *   Low    → 35 < score < 45   (near boundary)
 *
 * Priority: Low (boundary) > High (extremes) > Medium (mid-range)
 *
 * @param {number} trustScore — 0–100 scale
 * @returns {"High" | "Medium" | "Low"}
 */
export function getConfidence(trustScore) {
  // Near boundary → Low confidence (uncertain zone)
  if (trustScore > 35 && trustScore < 45) {
    return 'Low';
  }

  // High confidence at extremes
  if (trustScore > 75 || trustScore < 25) {
    return 'High';
  }

  // Medium confidence for mid-range scores
  if (trustScore >= 40 && trustScore <= 75) {
    return 'Medium';
  }

  // Default fallback for any other range (e.g., 25–35, 45–75 overlap)
  return 'Medium';
}

// ------------------------------------------------------------------
// STEP 7: MAIN CALCULATION — calculateTrustScore
// ------------------------------------------------------------------

/**
 * Calculates the final trust score by combining multiple verification signals.
 *
 * Input object:
 *   {
 *     ai_score:       number (0–1),
 *     image_score:    number (0–1),
 *     news_api_score: number (0–1),
 *     votes:          { real: number, fake: number, misleading: number }
 *   }
 *
 * Output object:
 *   {
 *     trustScore: number (0–100, rounded to 2 decimals),
 *     label:      "Real" | "Fake" | "Misleading",
 *     confidence: "High" | "Medium" | "Low",
 *     breakdown: {
 *       ai_score,
 *       image_score,
 *       crowd_score,
 *       news_api_score
 *     }
 *   }
 *
 * @param {Object} data
 * @param {number} [data.ai_score]
 * @param {number} [data.image_score]
 * @param {number} [data.news_api_score]
 * @param {Object} [data.votes]
 * @param {number} [data.votes.real]
 * @param {number} [data.votes.fake]
 * @param {number} [data.votes.misleading]
 * @returns {Object} structured trust score response
 */
export function calculateTrustScore(data = {}) {
  try {
    // ---- Handle completely missing/invalid input ----
    if (!data || typeof data !== 'object') {
      logger.warn('TrustScoreService: Invalid or missing input data, returning neutral fallback');
      return buildNeutralFallback();
    }

    // ---- STEP 1: Extract and validate individual scores ----
    // If a score is missing or invalid, default to 0 (API failure / missing input)
    const rawAiScore = validateScore(data.ai_score, 0);
    const rawImageScore = validateScore(data.image_score, 0);
    const rawNewsApiScore = validateScore(data.news_api_score, 0);

    // ---- STEP 2: Calculate crowd score from votes ----
    const crowdScore = calculateCrowdScore(data.votes);

    // ---- STEP 3: Normalize all scores to [0, 1] ----
    const aiScore = normalizeScore(rawAiScore);
    const imageScore = normalizeScore(rawImageScore);
    const newsApiScore = normalizeScore(rawNewsApiScore);
    const normalizedCrowdScore = normalizeScore(crowdScore);

    // ---- STEP 4: Calculate weighted raw score ----
    const rawScore =
      (WEIGHTS.ai * aiScore) +
      (WEIGHTS.image * imageScore) +
      (WEIGHTS.crowd * normalizedCrowdScore) +
      (WEIGHTS.news * newsApiScore);

    // ---- STEP 5: Scale to 0–100 and round ----
    const trustScore = Number((rawScore * 100).toFixed(2));

    // ---- STEP 6: Determine label and confidence ----
    const label = getLabel(trustScore);
    const confidence = getConfidence(trustScore);

    // ---- STEP 7: Build breakdown for transparency ----
    const breakdown = {
      ai_score: Number(aiScore.toFixed(4)),
      image_score: Number(imageScore.toFixed(4)),
      crowd_score: Number(normalizedCrowdScore.toFixed(4)),
      news_api_score: Number(newsApiScore.toFixed(4)),
    };

    logger.info(
      `TrustScoreService: Calculated trustScore=${trustScore}% ` +
      `label=${label} confidence=${confidence} | ` +
      `breakdown=${JSON.stringify(breakdown)}`
    );

    return {
      trustScore,
      label,
      confidence,
      breakdown,
    };
  } catch (error) {
    logger.error(`TrustScoreService: Calculation error — ${error.message}`);
    return buildNeutralFallback();
  }
}

// ------------------------------------------------------------------
// STEP 8: FALLBACK / EDGE CASE HANDLER
// ------------------------------------------------------------------

/**
 * Builds a neutral fallback response when inputs are invalid
 * or an error occurs during calculation.
 *
 * @returns {Object} neutral trust score response
 */
function buildNeutralFallback() {
  return {
    trustScore: 50,
    label: 'Misleading',
    confidence: 'Low',
    breakdown: {
      ai_score: 0,
      image_score: 0,
      crowd_score: 0.5,
      news_api_score: 0,
    },
  };
}

// ------------------------------------------------------------------
// STEP 9: DEFAULT EXPORT (backward-compatible class-based wrapper)
// ------------------------------------------------------------------

/**
 * Backward-compatible class wrapper for legacy default imports.
 * Delegates to the exported functions above.
 */
class TrustScoreService {
  calculateTrustScore(data) {
    return calculateTrustScore(data);
  }

  calculateCrowdScore(votes) {
    return calculateCrowdScore(votes);
  }

  normalizeScore(score) {
    return normalizeScore(score);
  }

  getLabel(trustScore) {
    return getLabel(trustScore);
  }

  getConfidence(trustScore) {
    return getConfidence(trustScore);
  }
}

export default new TrustScoreService();

