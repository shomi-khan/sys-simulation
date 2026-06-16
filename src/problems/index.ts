/**
 * src/problems/index.ts
 *
 * Problem registry — the single source of truth for all challenges.
 *
 * HOW TO ADD A NEW PROBLEM:
 * 1. Create a new file in src/problems/ (e.g. src/problems/chat-app.ts)
 * 2. Import it here and add it to the `problems` array
 * 3. Order in this array = order shown on the challenge list page
 *
 * No other files need to change.
 */

import type { Problem } from '@/types'
import { urlShortener } from './url-shortener'
import { flashSale } from './flash-sale'

/** Ordered list of all challenges. First = shown first on list page. */
export const problems: Problem[] = [
  urlShortener,
  flashSale,
]

/** Helper: find a problem by its id. Returns undefined if not found. */
export function getProblemById(id: string): Problem | undefined {
  return problems.find((p) => p.id === id)
}
