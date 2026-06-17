'use client'

/**
 * src/components/simulation/SuccessConditions.tsx
 *
 * Displays a checklist of success conditions and whether each was met.
 *
 * WHY THIS EXISTS:
 * The user needs to know exactly why they passed or failed - not just
 * a single score. Showing each condition individually gives actionable
 * feedback: "You met availability but dropped too many requests."
 * This turns failure into a learning moment, not just a number.
 */

interface SuccessConditionsProps {
  /**
   * Evaluated conditions - output of evaluateSuccessConditions()
   * from src/engine/scorer.ts
   */
  conditions: Array<{
    /** Human-readable requirement label e.g. "Availability >= 99%" */
    label: string
    /** Whether this condition was satisfied */
    passed: boolean
    /** The actual measured value */
    actual: number
    /** The required threshold value */
    required: number
  }>
}

/**
 * SuccessConditions - renders pass/fail feedback for each requirement.
 */
export default function SuccessConditions({
  conditions,
}: SuccessConditionsProps) {
  return (
    <section>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
        Requirements
      </h2>
      <div>
        {conditions.map((condition) => (
          <div
            key={condition.label}
            className="flex items-center justify-between gap-3 border-b border-slate-100 py-2 last:border-0 dark:border-slate-700"
          >
            <div
              className={[
                'flex min-w-0 items-center gap-2 text-sm font-medium',
                condition.passed
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400',
              ].join(' ')}
            >
              <span aria-hidden="true">{condition.passed ? '✅' : '❌'}</span>
              <span className="truncate">{condition.label}</span>
            </div>
            <span className="ml-auto shrink-0 text-xs text-slate-500 dark:text-slate-400">
              actual: {formatActual(condition)}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

/**
 * formatActual - formats requirement values based on the condition label.
 */
function formatActual(condition: SuccessConditionsProps['conditions'][number]) {
  const label = condition.label.toLowerCase()

  if (label.includes('availability')) return `${condition.actual}%`
  if (label.includes('latency')) return `${condition.actual}ms`
  if (label.includes('error')) return `${condition.actual}%`
  if (label.includes('budget') || label.includes('balance')) {
    return `$${condition.actual.toLocaleString()} remaining`
  }

  return condition.actual.toLocaleString()
}
