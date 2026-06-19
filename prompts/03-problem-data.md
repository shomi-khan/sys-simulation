# Step 3 — Problem Data Layer

## Context
You are continuing to build **sys-simulation** — a system design simulation game built with Next.js, TypeScript, and Tailwind CSS.

Step 1 and Step 2 are complete. Types, config, and shared UI components exist.

Now implement the **problem data layer** — the engine that loads, validates, and exposes challenge data to the rest of the app. This layer is the single source of truth for all challenges. No other file should hardcode challenge data.

---

## General rules

- TypeScript only. No `any`.
- Every function must have a JSDoc comment explaining parameters, return value, and side effects.
- Every file must have a top-level comment explaining what it does and why it exists.
- No React imports in this layer — pure TypeScript only.
- All problem data is static — no API calls, no async functions needed.

---

## `src/types/index.ts` — verify these fields exist in `Problem` interface

Before proceeding, confirm the `Problem` interface has ALL of these fields. Add any that are missing:

```ts
export interface Problem {
  /** Unique string identifier — used in URLs e.g. /sys-simulation/url-shortener */
  id: string

  /** Display title shown on challenge card and builder page */
  title: string

  /** One-line subtitle shown on challenge card */
  subtitle: string

  /** Difficulty level — controls badge color and unlock order */
  difficulty: Difficulty

  /** Full description shown on builder page — explains the scenario and hints */
  description: string

  /** How long the simulation runs in seconds */
  durationSeconds: number

  /** Starting budget in dollars — components consume this during simulation */
  initialBudget: number

  /**
   * Timeline of traffic values across the simulation duration.
   * Engine interpolates between points to get rps at any given second.
   */
  trafficPattern: TrafficPattern

  /**
   * Which component types the user is allowed to place on the canvas.
   * References ComponentDefinition.type values from src/config/components.ts.
   * Restricting available components is part of the challenge design.
   */
  availableComponents: string[]

  /**
   * Conditions that must ALL be true at simulation end for the challenge to be passed.
   * Evaluated by the engine after the final tick.
   */
  successConditions: SuccessCondition[]

  /**
   * References a named weight profile in src/config/scoring.ts.
   * Controls how the final score is calculated for this challenge.
   */
  scoringProfile: ScoringProfile

  /**
   * ID of the problem that must be solved before this one unlocks.
   * null = always unlocked (first challenge in the sequence).
   */
  unlocksAfter: string | null
}
```

---

## `src/problems/url-shortener.ts` — update with `unlocksAfter`

Add the missing field:

```ts
export const urlShortener: Problem = {
  // ...all existing fields...
  unlocksAfter: null,  // first challenge — always unlocked
}
```

---

## `src/problems/flash-sale.ts` — update with `unlocksAfter`

Add the missing field:

```ts
export const flashSale: Problem = {
  // ...all existing fields...
  unlocksAfter: 'url-shortener',  // locked until url-shortener is solved
}
```

---

## `src/problems/index.ts` — implement fully

```ts
/**
 * src/problems/index.ts
 *
 * Problem registry — the single source of truth for all challenges.
 *
 * WHY THIS EXISTS:
 * All challenge data flows through this file. Pages and engine functions
 * never import individual problem files directly — they always go through
 * this registry. This makes reordering, adding, or removing challenges
 * a one-line change.
 *
 * HOW TO ADD A NEW PROBLEM:
 * 1. Create src/problems/your-problem.ts following the Problem interface
 * 2. Import it here and add it to the `problems` array
 * 3. Set `unlocksAfter` to the id of the previous challenge
 * 4. Nothing else needs to change — the UI and engine pick it up automatically
 */

import type { Problem } from '@/types'
import { urlShortener } from './url-shortener'
import { flashSale } from './flash-sale'

/**
 * Ordered list of all challenges.
 * Position in this array = order shown on the challenge list page.
 * Earlier problems should have lower difficulty and simpler traffic patterns.
 */
export const problems: Problem[] = [
  urlShortener,
  flashSale,
]

/**
 * Find a single problem by its unique id.
 *
 * @param id - The problem's id string e.g. 'url-shortener'
 * @returns The matching Problem object, or undefined if not found
 *
 * Used by: the builder page to load challenge details from the URL param
 */
export function getProblemById(id: string): Problem | undefined {
  return problems.find((p) => p.id === id)
}

/**
 * Get the problem that must be solved before the given problem unlocks.
 *
 * @param problem - The problem to check prerequisites for
 * @returns The prerequisite Problem object, or null if no prerequisite exists
 *
 * Used by: the challenge list page to determine locked/unlocked state
 */
export function getPrerequisite(problem: Problem): Problem | null {
  if (!problem.unlocksAfter) return null
  return getProblemById(problem.unlocksAfter) ?? null
}
```

---

## `src/lib/progress.ts` — create this new file

```ts
/**
 * src/lib/progress.ts
 *
 * Player progress tracking — stores which challenges have been solved.
 *
 * WHY THIS EXISTS:
 * Progress must persist across page refreshes without a backend.
 * localStorage is the right tool for a client-side hobby project.
 * All localStorage access is isolated here so the rest of the app
 * never touches localStorage directly — making it easy to swap
 * this out for a real backend later if needed.
 *
 * IMPORTANT:
 * - All functions are safe to call during SSR — they check for `window` before
 *   accessing localStorage. This prevents Next.js build errors.
 * - No React imports. Pure TypeScript utility functions only.
 */

/** localStorage key where solved problem ids are stored */
const STORAGE_KEY = 'sys-simulation:solved'

/**
 * Read the set of solved problem ids from localStorage.
 * Returns an empty Set if localStorage is unavailable (e.g. during SSR).
 *
 * @returns Set of solved problem id strings
 */
export function getSolvedIds(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    // Validate that parsed value is an array of strings before trusting it
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((x): x is string => typeof x === 'string'))
  } catch {
    // localStorage may throw in private browsing or corrupted state
    return new Set()
  }
}

/**
 * Mark a problem as solved and persist to localStorage.
 * Safe to call multiple times — marking an already-solved problem is a no-op.
 *
 * @param problemId - The id of the problem to mark as solved
 */
export function markSolved(problemId: string): void {
  if (typeof window === 'undefined') return
  try {
    const solved = getSolvedIds()
    solved.add(problemId)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(solved)))
  } catch {
    // Fail silently — progress not saving is not a fatal error
  }
}

/**
 * Check whether a specific problem has been solved.
 *
 * @param problemId - The id of the problem to check
 * @returns true if the problem has been solved, false otherwise
 */
export function isSolved(problemId: string): boolean {
  return getSolvedIds().has(problemId)
}

/**
 * Check whether a problem is unlocked and available to play.
 * A problem is unlocked if it has no prerequisite, or its prerequisite is solved.
 *
 * @param problem - The Problem object to check
 * @returns true if the problem can be played
 */
export function isUnlocked(problem: { id: string; unlocksAfter: string | null }): boolean {
  // No prerequisite — always unlocked
  if (!problem.unlocksAfter) return true
  // Has prerequisite — check if it's been solved
  return isSolved(problem.unlocksAfter)
}

/**
 * Clear all progress. Used for development/testing only.
 * Not exposed in the UI.
 */
export function clearProgress(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Fail silently
  }
}
```

---

## `src/lib/traffic.ts` — create this new file

```ts
/**
 * src/lib/traffic.ts
 *
 * Traffic interpolation utilities.
 *
 * WHY THIS EXISTS:
 * A traffic pattern is defined as a sparse list of { atSecond, rps } points.
 * The engine needs to know the exact rps at every single second.
 * This file provides the interpolation logic that fills in the gaps.
 *
 * Example:
 *   pattern = [{ atSecond: 0, rps: 100 }, { atSecond: 10, rps: 1000 }]
 *   getRpsAtSecond(pattern, 5) → 550  (linear interpolation midpoint)
 *
 * Pure TypeScript. No React. No side effects.
 */

import type { TrafficPattern } from '@/types'

/**
 * Get the interpolated requests-per-second value at a given simulation second.
 * Uses linear interpolation between the two nearest traffic pattern points.
 *
 * If the second is before the first point, returns the first point's rps.
 * If the second is after the last point, returns the last point's rps.
 *
 * @param pattern - The traffic pattern array (must be sorted by atSecond ascending)
 * @param second  - The current simulation second to query
 * @returns Interpolated rps value as a number
 */
export function getRpsAtSecond(pattern: TrafficPattern, second: number): number {
  if (pattern.length === 0) return 0

  // Before first point — clamp to first value
  if (second <= pattern[0].atSecond) return pattern[0].rps

  // After last point — clamp to last value
  const last = pattern[pattern.length - 1]
  if (second >= last.atSecond) return last.rps

  // Find the two surrounding points and interpolate between them
  for (let i = 0; i < pattern.length - 1; i++) {
    const from = pattern[i]
    const to = pattern[i + 1]

    if (second >= from.atSecond && second <= to.atSecond) {
      // How far between the two points are we? (0.0 to 1.0)
      const progress = (second - from.atSecond) / (to.atSecond - from.atSecond)
      // Linear interpolation: from + (to - from) * progress
      return Math.round(from.rps + (to.rps - from.rps) * progress)
    }
  }

  return last.rps
}

/**
 * Get the peak rps value across the entire traffic pattern.
 * Used in the result report to show peak traffic during the simulation.
 *
 * @param pattern - The traffic pattern array
 * @returns The highest rps value in the pattern
 */
export function getPeakRps(pattern: TrafficPattern): number {
  if (pattern.length === 0) return 0
  return Math.max(...pattern.map((p) => p.rps))
}
```

---

## Verification checklist

- [ ] `npm run dev` has no TypeScript errors
- [ ] `npm run build` passes cleanly
- [ ] `Problem` interface has all fields including `unlocksAfter`
- [ ] Both problems have `unlocksAfter` set correctly
- [ ] `getProblemById('url-shortener')` returns the correct object
- [ ] `isUnlocked(urlShortener)` returns `true`
- [ ] `isUnlocked(flashSale)` returns `false` (url-shortener not yet solved)
- [ ] `getRpsAtSecond(pattern, 5)` returns interpolated value correctly
- [ ] No `any` types anywhere
- [ ] Every function has a JSDoc comment