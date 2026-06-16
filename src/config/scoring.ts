/**
 * src/config/scoring.ts
 *
 * Scoring weight profiles for the simulation engine.
 *
 * WHY THIS EXISTS:
 * Different challenges emphasize different tradeoffs.
 * A cost-optimization challenge should reward budget efficiency more than latency.
 * A high-availability challenge should penalize dropped requests heavily.
 *
 * HOW TO ADD A NEW PROFILE:
 * 1. Add a new key to `scoringProfiles`
 * 2. Add the key to the `ScoringProfile` type in src/types/index.ts
 * 3. Reference it in a Problem's `scoringProfile` field
 *
 * CONSTRAINT: weights in each profile must sum to 1.0
 */

import type { ScoringWeights } from '@/types'

export const scoringProfiles: Record<string, ScoringWeights> = {
  /**
   * Default profile — balanced across all metrics.
   * Used for general-purpose challenges.
   */
  default: {
    availability: 0.35,
    latency: 0.25,
    costEfficiency: 0.20,
    errorRate: 0.20,
  },

  /**
   * Cost-focused profile — rewards architectures that stay within budget.
   * Used for challenges where over-engineering is penalized.
   */
  costFocused: {
    availability: 0.25,
    latency: 0.20,
    costEfficiency: 0.40,
    errorRate: 0.15,
  },

  /**
   * Latency-focused profile — rewards low-latency architectures.
   * Used for real-time system challenges (e.g. chat, gaming).
   */
  latencyFocused: {
    availability: 0.30,
    latency: 0.40,
    costEfficiency: 0.10,
    errorRate: 0.20,
  },
}

/** Pass threshold — score must be at or above this to mark a challenge as solved */
export const PASS_THRESHOLD = 70

/** XP reward formula multiplier — finalScore * XP_MULTIPLIER = researchXp earned */
export const XP_MULTIPLIER = 5
