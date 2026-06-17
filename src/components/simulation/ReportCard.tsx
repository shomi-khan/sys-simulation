'use client'

/**
 * src/components/simulation/ReportCard.tsx
 *
 * Displays the post-simulation metric grid inside ResultOverlay.
 *
 * WHY THIS EXISTS:
 * The result report has 8 metrics to display. Extracting them into a
 * dedicated component keeps ResultOverlay focused on layout and flow,
 * not on metric formatting logic.
 *
 * Each metric is displayed as a labeled card with a value and
 * an optional status color (healthy/warning/critical/neutral).
 */

import StatCard from '@/components/ui/StatCard'
import type { SimulationResult } from '@/types'

type MetricStatus = 'healthy' | 'warning' | 'critical' | 'neutral'

interface ReportCardProps {
  /** The completed simulation result to display metrics from */
  result: SimulationResult
  /** Initial budget - used to calculate cost efficiency display */
  initialBudget: number
}

/**
 * ReportCard - renders all post-simulation metrics in a compact grid.
 */
export default function ReportCard({
  result,
  initialBudget,
}: ReportCardProps) {
  const metrics: Array<{
    /** Short label shown above the metric value */
    label: string
    /** Formatted metric value */
    value: string
    /** Visual health state for the metric */
    status: MetricStatus
  }> = [
    {
      label: 'Peak RPS',
      value: `${result.peakRps.toLocaleString()} req/s`,
      status: 'neutral',
    },
    {
      label: 'Avg Latency',
      value: `${result.avgLatencyMs}ms`,
      status: latencyStatus(result.avgLatencyMs, 100, 300),
    },
    {
      label: 'P95 Latency',
      value: `${result.p95LatencyMs}ms`,
      status: latencyStatus(result.p95LatencyMs, 200, 500),
    },
    {
      label: 'Availability',
      value: `${result.availability}%`,
      status:
        result.availability >= 99
          ? 'healthy'
          : result.availability >= 95
            ? 'warning'
            : 'critical',
    },
    {
      label: 'Cache Hit Ratio',
      value: `${(result.cacheHitRatio * 100).toFixed(0)}%`,
      status:
        result.cacheHitRatio >= 0.7
          ? 'healthy'
          : result.cacheHitRatio >= 0.4
            ? 'warning'
            : 'critical',
    },
    {
      label: 'Dropped Requests',
      value: result.droppedRequests.toLocaleString(),
      status:
        result.droppedRequests === 0
          ? 'healthy'
          : result.droppedRequests <= 50
            ? 'warning'
            : 'critical',
    },
    {
      label: 'Infra Cost',
      value: `$${result.totalInfraCost.toLocaleString()}`,
      status: 'neutral',
    },
    {
      label: 'Final Balance',
      value: `$${result.finalBalance.toLocaleString()}`,
      status: result.finalBalance > 0 ? 'healthy' : 'critical',
    },
  ]

  return (
    <section>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
        Metrics
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((metric) => (
          <StatCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            status={metric.status}
            hint={
              metric.label === 'Final Balance'
                ? `Started with $${initialBudget.toLocaleString()}`
                : undefined
            }
          />
        ))}
      </div>
    </section>
  )
}

/**
 * latencyStatus - maps latency thresholds to a StatCard status.
 */
function latencyStatus(
  value: number,
  healthyMax: number,
  warningMax: number,
): MetricStatus {
  if (value <= healthyMax) return 'healthy'
  if (value <= warningMax) return 'warning'
  return 'critical'
}
