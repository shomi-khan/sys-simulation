'use client'

/**
 * src/components/simulation/ResultOverlay.tsx
 *
 * Full-screen overlay shown when simulation completes.
 *
 * WHY AN OVERLAY (not a separate page):
 * The user's architecture is still visible behind the overlay - they can
 * see what they built while reading their results. This reinforces the
 * connection between their decisions and the outcome. Navigating to a
 * separate page would break that connection.
 *
 * LAYOUT:
 * - Dark blurred backdrop covers the canvas
 * - Centered modal card with scrollable content
 * - Score + verdict at top (immediate emotional response)
 * - Metric grid below (detailed breakdown)
 * - Success conditions checklist (pass/fail per requirement)
 * - Action buttons at bottom (Try Again / Back to Challenges)
 */

import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import { evaluateSuccessConditions } from '@/engine/scorer'
import type { Problem, SimulationResult } from '@/types'
import ReportCard from './ReportCard'
import SuccessConditions from './SuccessConditions'

interface ResultOverlayProps {
  /** The completed simulation result containing all metrics and final score */
  result: SimulationResult
  /** The challenge that was just played - needed for success condition evaluation */
  problem: Problem
  /** Called when user clicks Try Again - resets simulation, closes overlay */
  onReset: () => void
}

/**
 * ResultOverlay - renders the completed simulation report modal.
 */
export function ResultOverlay({
  result,
  problem,
  onReset,
}: ResultOverlayProps) {
  const router = useRouter()
  const conditions = evaluateSuccessConditions(result, problem)
  const scoreClass =
    result.finalScore >= 70
      ? 'text-green-500 dark:text-green-400'
      : result.finalScore >= 50
        ? 'text-amber-500 dark:text-amber-400'
        : 'text-red-500 dark:text-red-400'

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-8 shadow-2xl dark:border-slate-700 dark:bg-slate-800">
        <div className="text-center">
          <div className="text-4xl" aria-hidden="true">
            {result.passed ? '✅' : '❌'}
          </div>
          <div className="mt-3 text-2xl font-bold text-[var(--text-primary)]">
            {result.passed ? 'Challenge Passed!' : 'Not Quite'}
          </div>
          <div className="mt-1 text-sm text-[var(--text-secondary)]">
            {problem.title}
          </div>
          <div className={`my-4 text-5xl font-semibold ${scoreClass}`}>
            {result.finalScore}
            <span className="text-xl text-slate-400"> / 100</span>
          </div>
          {result.passed ? (
            <div className="text-sm font-medium text-green-600 dark:text-green-400">
              +{result.researchXp} XP earned
            </div>
          ) : (
            <div className="text-sm text-[var(--text-secondary)]">
              Review the bottlenecks and try again.
            </div>
          )}
        </div>

        <div className="mt-8 space-y-6 text-left">
          <ReportCard result={result} initialBudget={problem.initialBudget} />
          <SuccessConditions conditions={conditions} />
        </div>

        <div className="mt-6 flex gap-3">
          <Button variant="secondary" onClick={onReset} className="flex-1">
            Try Again
          </Button>
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="flex-1"
          >
            Back to Challenges
          </Button>
        </div>
      </div>
    </div>
  )
}
