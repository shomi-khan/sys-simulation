# Step 4 — Simulation Engine

## Context
You are continuing to build **sys-simulation** — a system design simulation game built with Next.js, TypeScript, and Tailwind CSS.

Steps 1, 2, and 3 are complete. Types, config, shared UI components, problem data layer, and progress tracking all exist.

Now implement the **simulation engine** — the mathematical core of the game. This is the most critical part of the project. Everything else is UI around this.

---

## General rules

- Pure TypeScript only. Zero React imports. Zero DOM access.
- Every function must be pure — same input always produces same output.
- No randomness. Simulation must be fully deterministic.
- Every function must have a JSDoc comment explaining parameters, return value, and intent.
- Every complex calculation must have inline comments explaining the **why**, not just the what.
- No `any` types.

---

## How the engine works — read this before implementing

The user builds an architecture as a directed graph (DAG) on the canvas:

```
Internet → Load Balancer → API Server → Redis Cache → SQL Database
```

Every second, the engine:
1. Gets current traffic (rps) from the traffic pattern via interpolation
2. Traverses the DAG node by node, passing traffic through each component
3. At each node, calculates: load%, latency added, dropped requests, cache behavior
4. Deducts runtime costs from budget
5. Writes log entries for significant events
6. Returns a `TickMetrics` snapshot for that second

After all ticks complete, the scorer aggregates all `TickMetrics` into a `SimulationResult`.

---

## `src/engine/validator.ts` — implement fully

```ts
/**
 * src/engine/validator.ts
 *
 * Architecture validation — runs before simulation starts.
 *
 * WHY THIS EXISTS:
 * The user can build any arbitrary graph on the canvas. Before we run
 * the simulation, we must verify the graph is valid — otherwise the
 * engine would produce meaningless results or crash.
 *
 * Validation checks:
 * 1. At least one node exists on the canvas
 * 2. At least one edge exists (nodes must be connected)
 * 3. No cycles exist in the graph (must be a DAG)
 * 4. There is exactly one "entry node" — a node with no incoming edges
 *    (this is where Internet traffic enters)
 * 5. Every node is reachable from the entry node
 *
 * Returns structured errors — never throws exceptions.
 */

import type { CanvasState } from '@/types'

/** A single validation error with a human-readable message */
export interface ValidationError {
  /** Short error code for programmatic handling */
  code: string
  /** Human-readable message shown to the user in the UI */
  message: string
}

/** Result of validating a canvas architecture */
export interface ValidationResult {
  /** true if the architecture is valid and simulation can start */
  valid: boolean
  /** List of errors — empty if valid */
  errors: ValidationError[]
}

/**
 * Validate a canvas architecture before running the simulation.
 * All checks run regardless — we collect all errors at once, not just the first.
 *
 * @param canvas - The current canvas state (nodes + edges)
 * @returns ValidationResult with valid flag and any error messages
 */
export function validateArchitecture(canvas: CanvasState): ValidationResult {
  const errors: ValidationError[] = []

  // Check 1: canvas must have at least one node
  if (canvas.nodes.length === 0) {
    errors.push({
      code: 'NO_NODES',
      message: 'Place at least one component on the canvas before starting.',
    })
    // Cannot continue further checks without nodes
    return { valid: false, errors }
  }

  // Check 2: canvas must have at least one edge
  if (canvas.edges.length === 0) {
    errors.push({
      code: 'NO_EDGES',
      message: 'Connect your components with arrows to define the request flow.',
    })
  }

  // Build adjacency structures for graph analysis
  // inDegree: how many incoming edges each node has
  const inDegree = new Map<string, number>()
  // adjacency: outgoing neighbors for each node
  const adjacency = new Map<string, string[]>()

  for (const node of canvas.nodes) {
    inDegree.set(node.instanceId, 0)
    adjacency.set(node.instanceId, [])
  }

  for (const edge of canvas.edges) {
    inDegree.set(edge.toInstanceId, (inDegree.get(edge.toInstanceId) ?? 0) + 1)
    adjacency.get(edge.fromInstanceId)?.push(edge.toInstanceId)
  }

  // Check 3: find entry node (exactly one node with zero incoming edges)
  const entryNodes = canvas.nodes.filter((n) => inDegree.get(n.instanceId) === 0)

  if (entryNodes.length === 0) {
    errors.push({
      code: 'NO_ENTRY',
      message: 'Your architecture has a cycle — every node has an incoming edge. Remove a connection to create a clear entry point.',
    })
    return { valid: false, errors }
  }

  if (entryNodes.length > 1) {
    errors.push({
      code: 'MULTIPLE_ENTRIES',
      message: `Your architecture has ${entryNodes.length} disconnected entry points. Connect all components into a single request flow pipeline.`,
    })
  }

  // Check 4: detect cycles using Kahn's topological sort algorithm
  // If we cannot process all nodes, a cycle exists
  const queue = entryNodes.map((n) => n.instanceId)
  const processed = new Set<string>()
  const tempInDegree = new Map(inDegree)

  while (queue.length > 0) {
    const current = queue.shift()!
    processed.add(current)

    for (const neighbor of adjacency.get(current) ?? []) {
      const newDegree = (tempInDegree.get(neighbor) ?? 0) - 1
      tempInDegree.set(neighbor, newDegree)
      if (newDegree === 0) queue.push(neighbor)
    }
  }

  if (processed.size !== canvas.nodes.length) {
    errors.push({
      code: 'CYCLE_DETECTED',
      message: 'Your architecture contains a cycle. Request flow must be directional — no loops allowed.',
    })
  }

  // Check 5: every node must be reachable from the entry node
  if (entryNodes.length === 1) {
    const reachable = new Set<string>()
    const bfsQueue = [entryNodes[0].instanceId]

    while (bfsQueue.length > 0) {
      const current = bfsQueue.shift()!
      reachable.add(current)
      for (const neighbor of adjacency.get(current) ?? []) {
        if (!reachable.has(neighbor)) bfsQueue.push(neighbor)
      }
    }

    const unreachable = canvas.nodes.filter((n) => !reachable.has(n.instanceId))
    if (unreachable.length > 0) {
      errors.push({
        code: 'UNREACHABLE_NODES',
        message: `${unreachable.length} component(s) are not connected to the main request flow. Connect or remove them.`,
      })
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
```

---

## `src/engine/simulator.ts` — implement fully

```ts
/**
 * src/engine/simulator.ts
 *
 * Core simulation game loop — processes one tick (1 second) at a time.
 *
 * WHY THIS EXISTS:
 * This is the mathematical heart of the game. It takes the user's architecture
 * (a DAG of infrastructure components) and simulates real traffic flowing
 * through it — calculating load, latency, dropped requests, cache behavior,
 * and budget consumption for each second of the simulation.
 *
 * HOW IT WORKS (per tick):
 * 1. Get current traffic rps from the traffic pattern (interpolated)
 * 2. Traverse the DAG in topological order (entry node → leaf nodes)
 * 3. At each node:
 *    a. Calculate how much traffic arrives (accounting for splits and cache hits)
 *    b. Calculate load percentage vs capacity
 *    c. Calculate effective latency (increases exponentially when overloaded)
 *    d. Calculate dropped requests if overloaded
 *    e. If cache node: calculate how much traffic it absorbs (cache hits)
 * 4. Sum up total latency across the full request path
 * 5. Deduct runtime costs from budget
 * 6. Emit log entries for significant events
 * 7. Return a TickMetrics snapshot
 *
 * IMPORTANT:
 * - Pure TypeScript. No React. No DOM.
 * - All functions are pure — deterministic, no side effects.
 * - React calls processTick() every second via setInterval and stores results in state.
 */

import type { CanvasState, CanvasNode, TickMetrics, LogEntry, Problem } from '@/types'
import { getRpsAtSecond } from '@/lib/traffic'
import { getComponentByType } from '@/config/components'

// ─── Internal types used only by the engine ───────────────────────────────────

/** Topologically sorted node with its computed traffic load for this tick */
interface NodeWithLoad {
  node: CanvasNode
  incomingRps: number     // traffic arriving at this node this tick
  outgoingRps: number     // traffic leaving this node (after cache absorption)
  droppedRps: number      // requests dropped because node is overloaded
  latencyMs: number       // effective latency this node adds to the request path
  loadPercent: number     // 0–100, how loaded this node is
  cacheHitRps: number     // requests absorbed by cache (0 for non-cache nodes)
}

// ─── Topological sort ─────────────────────────────────────────────────────────

/**
 * Sort canvas nodes in topological order (entry node first, leaf nodes last).
 * This determines the order in which traffic flows through the architecture.
 *
 * Uses Kahn's algorithm (BFS-based topological sort).
 * Assumes the canvas has already been validated — no cycles, one entry node.
 *
 * @param canvas - Validated canvas state
 * @returns Nodes sorted from entry to leaf in request flow order
 */
function topologicalSort(canvas: CanvasState): CanvasNode[] {
  const inDegree = new Map<string, number>()
  const adjacency = new Map<string, string[]>()
  const nodeMap = new Map<string, CanvasNode>()

  for (const node of canvas.nodes) {
    inDegree.set(node.instanceId, 0)
    adjacency.set(node.instanceId, [])
    nodeMap.set(node.instanceId, node)
  }

  for (const edge of canvas.edges) {
    inDegree.set(edge.toInstanceId, (inDegree.get(edge.toInstanceId) ?? 0) + 1)
    adjacency.get(edge.fromInstanceId)?.push(edge.toInstanceId)
  }

  const queue = canvas.nodes
    .filter((n) => inDegree.get(n.instanceId) === 0)
    .map((n) => n.instanceId)

  const sorted: CanvasNode[] = []

  while (queue.length > 0) {
    const current = queue.shift()!
    sorted.push(nodeMap.get(current)!)

    for (const neighbor of adjacency.get(current) ?? []) {
      const newDegree = (inDegree.get(neighbor) ?? 0) - 1
      inDegree.set(neighbor, newDegree)
      if (newDegree === 0) queue.push(neighbor)
    }
  }

  return sorted
}

// ─── Load calculation ─────────────────────────────────────────────────────────

/**
 * Calculate the effective latency of a node given its current load.
 *
 * WHY EXPONENTIAL GROWTH:
 * In real systems, latency does not grow linearly with load. Up to ~80% load,
 * a server handles requests normally. Beyond that, queue depth grows rapidly,
 * and each request waits longer for CPU time. At 100%+ load, the system
 * enters a degraded state where latency can be 5–10x the baseline.
 *
 * Formula:
 *   - Below 80% load → base latency (no penalty)
 *   - Above 80% load → base latency × (1 + ((load - 0.8) / 0.2)² × 8)
 *
 * @param baseLatencyMs - The component's normal latency at healthy load
 * @param loadPercent   - Current load as 0–100 value
 * @returns Effective latency in milliseconds
 */
function calculateEffectiveLatency(baseLatencyMs: number, loadPercent: number): number {
  const loadFraction = loadPercent / 100

  if (loadFraction <= 0.8) {
    // Healthy range — no latency penalty
    return baseLatencyMs
  }

  // Overload range — exponential latency growth
  // The exponent of 2 creates a curve: slow growth early, rapid growth near 100%
  const overloadFactor = ((loadFraction - 0.8) / 0.2) ** 2
  return Math.round(baseLatencyMs * (1 + overloadFactor * 8))
}

/**
 * Determine the visual status of a node based on its load percentage.
 *
 * @param loadPercent - Current load as 0–100 value
 * @returns Status string used to color-code the node in the UI
 */
function getNodeStatus(loadPercent: number): CanvasNode['status'] {
  if (loadPercent === 0) return 'idle'
  if (loadPercent <= 60) return 'healthy'
  if (loadPercent <= 89) return 'warning'
  return 'overloaded'
}

// ─── Cache behavior ───────────────────────────────────────────────────────────

/**
 * Default cache hit ratio for Redis/cache nodes.
 *
 * WHY 0.7:
 * A well-configured cache in a read-heavy system typically achieves 70–90% hit ratio.
 * 0.7 is a conservative but realistic default — it rewards users for adding a cache
 * without making the game too easy.
 *
 * In future versions, this could be a configurable parameter per cache node.
 */
const DEFAULT_CACHE_HIT_RATIO = 0.7

/** Component types that act as caches — absorb a portion of incoming traffic */
const CACHE_COMPONENT_TYPES = new Set(['redis-cache'])

// ─── Log helpers ──────────────────────────────────────────────────────────────

/**
 * Create a log entry for the terminal UI.
 *
 * @param second  - Current simulation second
 * @param level   - Severity level
 * @param message - Human-readable event description
 */
function makeLog(
  second: number,
  level: LogEntry['level'],
  message: string,
): LogEntry {
  return { second, level, message }
}

// ─── Main tick function ───────────────────────────────────────────────────────

/** Input required to process a single simulation tick */
export interface TickInput {
  /** Current simulation second (0-indexed) */
  second: number
  /** The user's canvas architecture */
  canvas: CanvasState
  /** The current challenge definition (for traffic pattern and duration) */
  problem: Problem
  /** Remaining budget at the start of this tick */
  currentBalance: number
  /** Previous tick's cache hit ratio (used for smoothing log messages) */
  prevCacheHitRatio: number
}

/** Output produced by processing a single tick */
export interface TickOutput {
  /** Metrics snapshot for this second */
  metrics: TickMetrics
  /** Log entries generated this second */
  logs: LogEntry[]
  /** Updated node states to apply to canvas in React state */
  updatedNodes: Array<{
    instanceId: string
    loadPercent: number
    status: CanvasNode['status']
    currentLoadRps: number
  }>
}

/**
 * Process a single 1-second simulation tick.
 *
 * This is the main engine function. React calls this every second via setInterval,
 * passes the current state, and applies the returned updates to React state.
 *
 * @param input - Current tick context (second, canvas, problem, balance)
 * @returns TickOutput containing metrics, logs, and node state updates
 */
export function processTick(input: TickInput): TickOutput {
  const { second, canvas, problem, currentBalance } = input
  const logs: LogEntry[] = []

  // ── Step 1: Get current traffic from the traffic pattern ──────────────────
  const currentRps = getRpsAtSecond(problem.trafficPattern, second)

  // ── Step 2: Sort nodes in topological order (traffic flows entry → leaf) ──
  const sortedNodes = topologicalSort(canvas)

  // ── Step 3: Build adjacency map for traffic distribution ──────────────────
  // Maps each node id to the ids of its downstream neighbors
  const adjacency = new Map<string, string[]>()
  for (const node of canvas.nodes) {
    adjacency.set(node.instanceId, [])
  }
  for (const edge of canvas.edges) {
    adjacency.get(edge.fromInstanceId)?.push(edge.toInstanceId)
  }

  // ── Step 4: Propagate traffic through each node in topological order ──────
  // incomingTraffic tracks how much rps arrives at each node this tick
  const incomingTraffic = new Map<string, number>()

  // Entry node receives all internet traffic
  if (sortedNodes.length > 0) {
    incomingTraffic.set(sortedNodes[0].instanceId, currentRps)
  }

  const nodeResults: NodeWithLoad[] = []
  let totalDroppedRps = 0
  let totalCacheHitRps = 0
  let totalLatencyMs = 0
  let pathLength = 0  // number of nodes in the critical path (for avg latency)

  for (const node of sortedNodes) {
    const componentDef = getComponentByType(node.type)
    if (!componentDef) continue

    const incomingRps = incomingTraffic.get(node.instanceId) ?? 0
    const capacity = componentDef.capacityRps

    // ── Load percentage: how saturated is this node? ────────────────────────
    // Clamped at 200% max to avoid absurd numbers in display
    const loadPercent = Math.min(200, Math.round((incomingRps / capacity) * 100))

    // ── Dropped requests: traffic that exceeds node capacity ─────────────────
    // Only the overflow above 100% capacity is dropped
    const droppedRps = Math.max(0, incomingRps - capacity)
    totalDroppedRps += droppedRps

    // Traffic that the node successfully processes
    const processedRps = incomingRps - droppedRps

    // ── Cache behavior: cache nodes absorb a portion of traffic ───────────────
    // Cache hits are returned immediately — they never reach downstream nodes
    let cacheHitRps = 0
    let outgoingRps = processedRps

    if (CACHE_COMPONENT_TYPES.has(node.type)) {
      cacheHitRps = Math.round(processedRps * DEFAULT_CACHE_HIT_RATIO)
      // Only cache misses flow downstream to the database
      outgoingRps = processedRps - cacheHitRps
      totalCacheHitRps += cacheHitRps
    }

    // ── Effective latency: increases exponentially when overloaded ────────────
    const latencyMs = calculateEffectiveLatency(componentDef.basLatencyMs, loadPercent)
    totalLatencyMs += latencyMs
    pathLength++

    // ── Distribute outgoing traffic to downstream nodes ───────────────────────
    const neighbors = adjacency.get(node.instanceId) ?? []
    if (neighbors.length > 0 && outgoingRps > 0) {
      // Split traffic evenly across all downstream neighbors
      // (Load Balancer behavior — equal distribution)
      const rpsPerNeighbor = Math.round(outgoingRps / neighbors.length)
      for (const neighborId of neighbors) {
        incomingTraffic.set(
          neighborId,
          (incomingTraffic.get(neighborId) ?? 0) + rpsPerNeighbor,
        )
      }
    }

    nodeResults.push({
      node,
      incomingRps,
      outgoingRps,
      droppedRps,
      latencyMs,
      loadPercent,
      cacheHitRps,
    })

    // ── Log significant events ────────────────────────────────────────────────
    if (loadPercent >= 90) {
      logs.push(makeLog(
        second,
        'critical',
        `${componentDef.label} is critically overloaded at ${loadPercent}% capacity. Dropping ${droppedRps} req/s.`,
      ))
    } else if (loadPercent >= 70 && loadPercent < 90) {
      logs.push(makeLog(
        second,
        'warn',
        `${componentDef.label} under high load: ${loadPercent}% capacity.`,
      ))
    }
  }

  // ── Step 5: Calculate runtime cost for this tick ──────────────────────────
  const runtimeCostThisTick = canvas.nodes.reduce((sum, node) => {
    const def = getComponentByType(node.type)
    return sum + (def?.runtimeCostPerSecond ?? 0)
  }, 0)

  const newBalance = currentBalance - runtimeCostThisTick

  // Log budget warnings
  if (newBalance <= 0) {
    logs.push(makeLog(second, 'critical', 'Budget exhausted. Infrastructure costs are unsustainable.'))
  } else if (newBalance < problem.initialBudget * 0.2) {
    logs.push(makeLog(second, 'warn', `Budget running low: $${Math.round(newBalance)} remaining.`))
  }

  // ── Step 6: Calculate aggregate metrics for this tick ─────────────────────
  const avgLatencyMs = pathLength > 0 ? Math.round(totalLatencyMs / pathLength) : 0
  const cacheHitRatio = currentRps > 0 ? totalCacheHitRps / currentRps : 0
  const errorRate = currentRps > 0 ? totalDroppedRps / currentRps : 0

  // Log cache hit ratio once it stabilizes (first time above 60%)
  if (cacheHitRatio > 0.6 && input.prevCacheHitRatio <= 0.6) {
    logs.push(makeLog(second, 'info', `Cache hit ratio stabilized at ${Math.round(cacheHitRatio * 100)}%. Database load decreasing.`))
  }

  // ── Step 7: Build node state updates for React ────────────────────────────
  const updatedNodes = nodeResults.map((r) => ({
    instanceId: r.node.instanceId,
    loadPercent: r.loadPercent,
    status: getNodeStatus(r.loadPercent),
    currentLoadRps: r.incomingRps,
  }))

  // ── Step 8: Build node state snapshot for TickMetrics ────────────────────
  const nodeStates: TickMetrics['nodeStates'] = {}
  for (const r of nodeResults) {
    nodeStates[r.node.instanceId] = {
      loadPercent: r.loadPercent,
      status: getNodeStatus(r.loadPercent),
    }
  }

  const metrics: TickMetrics = {
    second,
    trafficRps: currentRps,
    droppedRequests: totalDroppedRps,
    avgLatencyMs,
    errorRate,
    cacheHitRatio,
    balance: newBalance,
    nodeStates,
  }

  return { metrics, logs, updatedNodes }
}

/**
 * Calculate total infrastructure cost spent so far in the simulation.
 * Used to display running cost in the sidebar during simulation.
 *
 * @param canvas          - Current canvas state
 * @param elapsedSeconds  - How many seconds the simulation has run
 * @returns Total cost spent (purchase costs + runtime costs)
 */
export function calculateTotalCost(canvas: CanvasState, elapsedSeconds: number): number {
  return canvas.nodes.reduce((sum, node) => {
    const def = getComponentByType(node.type)
    if (!def) return sum
    return sum + def.purchaseCost + def.runtimeCostPerSecond * elapsedSeconds
  }, 0)
}
```

---

## `src/engine/scorer.ts` — implement fully

```ts
/**
 * src/engine/scorer.ts
 *
 * Score calculation — aggregates all tick metrics into a final SimulationResult.
 *
 * WHY THIS EXISTS:
 * The simulation produces one TickMetrics per second. At the end, we need
 * to aggregate those into a single performance report and weighted score.
 *
 * All functions are pure — they take data in and return data out.
 * No side effects. No randomness. Same input always produces same output.
 *
 * Scoring weights are injected from src/config/scoring.ts — never hardcoded here.
 */

import type { TickMetrics, SimulationResult, Problem } from '@/types'
import { scoringProfiles, PASS_THRESHOLD, XP_MULTIPLIER } from '@/config/scoring'
import { calculateTotalCost } from './simulator'
import type { CanvasState } from '@/types'

/**
 * Calculate the 95th percentile value from an array of numbers.
 * P95 latency = 95% of requests completed faster than this value.
 *
 * WHY P95 MATTERS:
 * Average latency hides outliers. A system with avg 50ms might still have
 * 5% of requests taking 2 seconds — which users experience as "the site is slow".
 * P95 is the standard SRE metric for latency SLAs.
 *
 * @param values - Array of numeric values (e.g. latency measurements per second)
 * @returns The 95th percentile value, or 0 if array is empty
 */
function percentile95(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  // Index of the 95th percentile value
  const index = Math.ceil(sorted.length * 0.95) - 1
  return sorted[Math.max(0, index)]
}

/**
 * Normalize a raw metric value to a 0–100 score.
 * Used to bring all metrics onto the same scale before applying weights.
 *
 * @param value   - Raw metric value
 * @param best    - The value that maps to score 100 (perfect)
 * @param worst   - The value that maps to score 0 (failure)
 * @returns Normalized score 0–100, clamped
 */
function normalize(value: number, best: number, worst: number): number {
  if (best === worst) return 100
  // Linear interpolation between worst (0) and best (100)
  const score = ((value - worst) / (best - worst)) * 100
  // Clamp to [0, 100] — values outside the range are treated as floor/ceiling
  return Math.max(0, Math.min(100, score))
}

/**
 * Aggregate all tick metrics and produce the final simulation result.
 *
 * @param ticks   - All TickMetrics produced during the simulation (one per second)
 * @param problem - The challenge definition (for scoring profile and budget)
 * @param canvas  - The user's final canvas state (for cost calculation)
 * @returns Complete SimulationResult including score, XP, and pass/fail
 */
export function calculateResult(
  ticks: TickMetrics[],
  problem: Problem,
  canvas: CanvasState,
): SimulationResult {
  if (ticks.length === 0) {
    throw new Error('calculateResult: ticks array is empty — simulation produced no data')
  }

  // ── Aggregate raw metrics from all ticks ──────────────────────────────────

  const totalRequests = ticks.reduce((sum, t) => sum + t.trafficRps, 0)
  const totalDropped = ticks.reduce((sum, t) => sum + t.droppedRequests, 0)
  const latencies = ticks.map((t) => t.avgLatencyMs)
  const avgLatencyMs = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
  const p95LatencyMs = percentile95(latencies)
  const peakRps = Math.max(...ticks.map((t) => t.trafficRps))
  const avgCacheHitRatio = ticks.reduce((sum, t) => sum + t.cacheHitRatio, 0) / ticks.length
  const avgErrorRate = ticks.reduce((sum, t) => sum + t.errorRate, 0) / ticks.length
  const finalBalance = ticks[ticks.length - 1].balance
  const totalInfraCost = calculateTotalCost(canvas, ticks.length)

  // ── Availability: percentage of requests that were NOT dropped ────────────
  const availability = totalRequests > 0
    ? ((totalRequests - totalDropped) / totalRequests) * 100
    : 100

  // ── Normalize each metric to 0–100 before weighting ──────────────────────

  // Availability: 100% = perfect score, 90% = zero score
  const availabilityScore = normalize(availability, 100, 90)

  // Latency: 50ms or less = perfect, 500ms or more = zero
  const latencyScore = normalize(avgLatencyMs, 50, 500)

  // Cost efficiency: spent less than 50% of budget = perfect, spent 100%+ = zero
  const budgetSpent = totalInfraCost / problem.initialBudget
  const costScore = normalize(budgetSpent, 0.5, 1.0)

  // Error rate: 0% errors = perfect, 10%+ errors = zero
  const errorScore = normalize(avgErrorRate, 0, 0.1)

  // ── Apply scoring weights from the challenge's profile ────────────────────
  const weights = scoringProfiles[problem.scoringProfile] ?? scoringProfiles.default
  const finalScore = Math.round(
    availabilityScore  * weights.availability   +
    latencyScore       * weights.latency        +
    costScore          * weights.costEfficiency +
    errorScore         * weights.errorRate
  )

  const passed = finalScore >= PASS_THRESHOLD

  // ── XP reward: proportional to score, only awarded on pass ───────────────
  const researchXp = passed ? Math.round(finalScore * XP_MULTIPLIER) : 0

  return {
    challengeId: problem.id,
    durationSeconds: ticks.length,
    peakRps,
    avgLatencyMs,
    p95LatencyMs,
    availability: Math.round(availability * 10) / 10,  // 1 decimal place
    errorRate: Math.round(avgErrorRate * 1000) / 1000,  // 3 decimal places
    cacheHitRatio: Math.round(avgCacheHitRatio * 100) / 100,
    droppedRequests: totalDropped,
    totalInfraCost,
    finalBalance: Math.round(finalBalance),
    finalScore,
    passed,
    researchXp,
  }
}

/**
 * Evaluate all success conditions against a completed simulation result.
 * Returns which conditions passed and which failed.
 *
 * @param result  - The completed simulation result
 * @param problem - The challenge definition (contains success conditions)
 * @returns Array of condition results with pass/fail and label
 */
export function evaluateSuccessConditions(
  result: SimulationResult,
  problem: Problem,
): Array<{ label: string; passed: boolean; actual: number; required: number }> {
  return problem.successConditions.map((condition) => {
    // Map condition metric name to the actual value in the result
    const actual: Record<string, number> = {
      availability:    result.availability,
      avgLatency:      result.avgLatencyMs,
      errorRate:       result.errorRate * 100,  // convert to percentage
      droppedRequests: result.droppedRequests,
      balance:         result.finalBalance,
    }

    const actualValue = actual[condition.metric] ?? 0
    const passed =
      condition.operator === 'gte'
        ? actualValue >= condition.value
        : actualValue <= condition.value

    return {
      label: condition.label,
      passed,
      actual: actualValue,
      required: condition.value,
    }
  })
}
```

---

## Verification checklist

- [ ] `npm run dev` has no TypeScript errors
- [ ] `npm run build` passes cleanly
- [ ] `validateArchitecture` returns `valid: false` for empty canvas
- [ ] `validateArchitecture` returns `valid: false` for disconnected nodes
- [ ] `validateArchitecture` returns `valid: true` for a valid linear DAG
- [ ] `processTick` returns correct `droppedRequests` when traffic exceeds capacity
- [ ] `processTick` correctly reduces downstream traffic after cache node
- [ ] `calculateResult` produces `passed: true` when score >= 70
- [ ] `evaluateSuccessConditions` correctly evaluates all condition operators
- [ ] No `any` types anywhere
- [ ] Every function has a JSDoc comment
- [ ] Complex math blocks have inline comments explaining the reasoning