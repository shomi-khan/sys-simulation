/**
 * src/components/ui/StatCard.tsx
 *
 * Displays a single metric as a labeled card - used in the builder sidebar
 * and result report page to show uptime, latency, req/s, balance, etc.
 *
 * The value color changes based on the `status` prop so the user gets
 * an immediate visual signal without reading the number carefully.
 */

interface StatCardProps {
  /** Short label shown above the value e.g. "Avg Latency" */
  label: string
  /** The metric value to display e.g. "42ms" or "99.8%" */
  value: string | number
  /**
   * Controls the color of the value text.
   * healthy = green, warning = amber, critical = red, neutral = default text color
   */
  status?: 'healthy' | 'warning' | 'critical' | 'neutral'
  /** Optional small subscript shown below the value e.g. "target: <= 100ms" */
  hint?: string
}

const statusStyles: Record<NonNullable<StatCardProps['status']>, string> = {
  healthy: 'text-green-600 dark:text-green-400',
  warning: 'text-amber-600 dark:text-amber-400',
  critical: 'text-red-600 dark:text-red-400',
  neutral: 'text-[var(--text-primary)]',
}

export default function StatCard({
  label,
  value,
  status = 'neutral',
  hint,
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-semibold ${statusStyles[status]}`}>
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-[var(--text-secondary)]">{hint}</p>
      ) : null}
    </div>
  )
}
