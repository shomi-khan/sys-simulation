/**
 * src/lib/progress.ts
 *
 * Player progress tracking - stores which challenges have been solved.
 *
 * WHY THIS EXISTS:
 * Progress must persist across page refreshes without a backend.
 * localStorage is the right tool for a client-side hobby project.
 * All localStorage access is isolated here so the rest of the app
 * never touches localStorage directly - making it easy to swap
 * this out for a real backend later if needed.
 *
 * IMPORTANT:
 * - All functions are safe to call during SSR - they check for `window` before
 *   accessing localStorage. This prevents Next.js build errors.
 * - No React imports. Pure TypeScript utility functions only.
 */

/** localStorage key where solved problem ids are stored */
const STORAGE_KEY = 'sys-simulation:solved'

/**
 * Read the set of solved problem ids from localStorage.
 * Returns an empty Set if localStorage is unavailable, such as during SSR.
 *
 * @returns Set of solved problem id strings
 */
export function getSolvedIds(): Set<string> {
  if (typeof window === 'undefined') return new Set()

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return new Set()

    return new Set(parsed.filter((x): x is string => typeof x === 'string'))
  } catch {
    return new Set()
  }
}

/**
 * Mark a problem as solved and persist to localStorage.
 * Safe to call multiple times - marking an already-solved problem is a no-op.
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
    // Failing to save progress should not break the simulation UI.
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
 * @param problem - The problem object to check
 * @returns true if the problem can be played
 */
export function isUnlocked(problem: {
  id: string
  unlocksAfter: string | null
}): boolean {
  if (!problem.unlocksAfter) return true
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
    // Failing to clear progress is non-fatal.
  }
}
