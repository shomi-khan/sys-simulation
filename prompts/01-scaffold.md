````markdown
# Step 1 — Project Scaffold & Folder Structure

## Context
You are building a system design simulation game called **sys-simulation**.
It is a standalone Next.js application deployed on Vercel.
Users learn distributed systems by dragging infrastructure components onto a canvas, building architectures, and running a mathematical simulation to observe system behavior.

## Task
Scaffold the entire project structure. Create all folders and placeholder files with proper comments. Do not implement any logic yet — only structure, types, and config skeletons.

---

## Tech Stack
- Next.js (App Router)
- TypeScript (strict mode, no `any`)
- Tailwind CSS
- React Flow (for canvas — install it)
- Lucide React (for icons — install it)

---

## Commands to run first
```bash
npx create-next-app@latest sys-simulation --typescript --tailwind --eslint --app --src-dir --no-import-alias
cd sys-simulation
npm install reactflow lucide-react
```

---

## Folder structure to create inside `src/`

```
src/
├── app/
│   ├── sys-simulation/
│   │   ├── page.tsx                        # SSR — Challenge list page
│   │   └── [id]/
│   │       └── page.tsx                    # CSR — Builder + simulation page
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── ui/                                 # Shared, reusable UI primitives
│   │   ├── Badge.tsx
│   │   ├── Button.tsx
│   │   ├── StatCard.tsx
│   │   └── Terminal.tsx
│   └── simulation/                         # Game-specific components
│       ├── Canvas.tsx
│       ├── ComponentPalette.tsx
│       ├── ReportCard.tsx
│       └── MobileBlock.tsx
├── engine/
│   ├── simulator.ts                        # Core game loop — pure TS, no React
│   ├── scorer.ts                           # Score calculation — pure functions
│   └── validator.ts                        # DAG validation logic
├── problems/
│   ├── index.ts                            # Problem registry — ordered export
│   ├── url-shortener.ts                    # Problem 1
│   └── flash-sale.ts                       # Problem 2
├── config/
│   ├── scoring.ts                          # Scoring weight profiles
│   └── components.ts                       # Infrastructure component registry
└── types/
    └── index.ts                            # All shared TypeScript interfaces
```

---

## `src/types/index.ts` — implement this fully

Define all shared types. Every other file imports from here.

```ts
/**
 * src/types/index.ts
 *
 * Central type definitions for the sys-simulation game.
 * All interfaces, enums, and type aliases live here.
 * No logic. No imports from other src files.
 */

/** Difficulty levels for challenges, ordered from easiest to hardest */
export type Difficulty = 'beginner' | 'easy' | 'medium' | 'hard' | 'expert'

/**
 * A single point in a traffic pattern timeline.
 * The engine interpolates between points to get rps at any given second.
 */
export interface TrafficPoint {
  atSecond: number  // time in seconds from simulation start
  rps: number       // requests per second at this point
}

/** Traffic pattern is a timeline of rps values across the simulation duration */
export type TrafficPattern = TrafficPoint[]

/**
 * A success condition that must be met for the challenge to be passed.
 * The engine evaluates all conditions at the end of the simulation.
 */
export interface SuccessCondition {
  metric: 'availability' | 'avgLatency' | 'errorRate' | 'droppedRequests' | 'balance'
  operator: 'gte' | 'lte'   // gte = greater than or equal, lte = less than or equal
  value: number
  label: string              // Human-readable description shown in UI
}

/**
 * Named scoring weight profile.
 * Weights must sum to 1.0.
 * Different challenges can reference different profiles.
 */
export interface ScoringWeights {
  availability: number
  latency: number
  costEfficiency: number
  errorRate: number
}

/** Reference to a named scoring profile defined in src/config/scoring.ts */
export type ScoringProfile = 'default' | 'costFocused' | 'latencyFocused'

/**
 * Category of an infrastructure component.
 * Used for color-coding borders in the canvas UI.
 */
export type ComponentCategory =
  | 'network'     // Load Balancer, DNS — blue
  | 'compute'     // API Server, Worker — green
  | 'cache'       // Redis — red
  | 'database'    // SQL, NoSQL — purple
  | 'cdn'         // CDN — amber
  | 'queue'       // Message Queue — orange
  | 'security'    // Rate Limiter — pink

/**
 * Definition of a draggable infrastructure component.
 * Lives in src/config/components.ts registry.
 */
export interface ComponentDefinition {
  type: string                    // unique string id e.g. 'load-balancer'
  label: string                   // display name e.g. 'Load Balancer'
  icon: string                    // lucide-react icon name
  category: ComponentCategory
  purchaseCost: number            // one-time cost when placed on canvas
  runtimeCostPerSecond: number    // deducted from balance every tick
  capacityRps: number             // max requests per second this component handles
  basLatencyMs: number            // latency added to request path in ms
  description: string             // tooltip / info text shown in UI
}

/**
 * A node placed on the canvas by the user.
 * Extends ComponentDefinition with position and runtime state.
 */
export interface CanvasNode {
  instanceId: string              // unique id for this placed instance
  type: string                    // references ComponentDefinition.type
  position: { x: number; y: number }
  // Runtime state — updated every tick by the engine
  currentLoadRps: number
  loadPercent: number             // 0-100
  status: 'idle' | 'healthy' | 'warning' | 'overloaded'
}

/**
 * A directed edge connecting two canvas nodes.
 * Represents traffic flow direction.
 */
export interface CanvasEdge {
  id: string
  fromInstanceId: string
  toInstanceId: string
}

/** Full state of the user's canvas at any point in time */
export interface CanvasState {
  nodes: CanvasNode[]
  edges: CanvasEdge[]
}

/**
 * A single log entry written by the engine during simulation.
 * Displayed in the terminal UI component.
 */
export interface LogEntry {
  second: number
  level: 'system' | 'info' | 'warn' | 'critical' | 'success'
  message: string
}

/**
 * Snapshot of system metrics at a single tick.
 * The engine produces one of these per second.
 */
export interface TickMetrics {
  second: number
  trafficRps: number
  droppedRequests: number
  avgLatencyMs: number
  errorRate: number               // 0.0 to 1.0
  cacheHitRatio: number           // 0.0 to 1.0
  balance: number
  nodeStates: Record<string, { loadPercent: number; status: CanvasNode['status'] }>
}

/**
 * Aggregated result after the simulation completes.
 * Used to render the result report page.
 */
export interface SimulationResult {
  challengeId: string
  durationSeconds: number
  peakRps: number
  avgLatencyMs: number
  p95LatencyMs: number
  availability: number            // 0-100
  errorRate: number               // 0.0 to 1.0
  cacheHitRatio: number
  droppedRequests: number
  totalInfraCost: number
  finalBalance: number
  finalScore: number              // 0-100 weighted score
  passed: boolean
  researchXp: number              // earned XP based on score
}

/**
 * A single challenge / problem definition.
 * Stored in src/problems/*.ts and registered in src/problems/index.ts
 */
export interface Problem {
  id: string
  title: string
  subtitle: string
  difficulty: Difficulty
  description: string
  durationSeconds: number
  initialBudget: number
  trafficPattern: TrafficPattern
  availableComponents: string[]   // list of ComponentDefinition.type values
  successConditions: SuccessCondition[]
  scoringProfile: ScoringProfile
  unlocksAfter: string | null
}

/**
 * Simulation runtime state managed by React (zustand or useState).
 * Passed down to engine functions each tick.
 */
export interface SimulationState {
  status: 'idle' | 'running' | 'paused' | 'completed'
  elapsed: number                 // seconds since start
  balance: number
  logs: LogEntry[]
  tickHistory: TickMetrics[]
  result: SimulationResult | null
}
```

---

## `src/config/scoring.ts` — implement this fully

```ts
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
```

---

## `src/config/components.ts` — implement this fully

```ts
/**
 * src/config/components.ts
 *
 * Registry of all draggable infrastructure components available in the game.
 *
 * WHY THIS EXISTS:
 * Components are data, not code. Adding a new component type (e.g. Kafka, Shard Router)
 * should never require touching engine logic. Just add an entry here.
 *
 * HOW TO ADD A NEW COMPONENT:
 * 1. Add a new entry to the `componentRegistry` array below
 * 2. The engine, canvas, and palette will automatically pick it up
 *
 * Icon names reference lucide-react icon identifiers.
 * Border colors are mapped by category in the Canvas component.
 */

import type { ComponentDefinition } from '@/types'

export const componentRegistry: ComponentDefinition[] = [
  {
    type: 'load-balancer',
    label: 'Load Balancer',
    icon: 'Network',
    category: 'network',
    purchaseCost: 300,
    runtimeCostPerSecond: 2,
    capacityRps: 5000,
    basLatencyMs: 2,
    description: 'Distributes incoming traffic evenly across backend servers.',
  },
  {
    type: 'api-server',
    label: 'API Server',
    icon: 'Server',
    category: 'compute',
    purchaseCost: 200,
    runtimeCostPerSecond: 3,
    capacityRps: 800,
    basLatencyMs: 10,
    description: 'Handles business logic. Multiple instances increase throughput.',
  },
  {
    type: 'redis-cache',
    label: 'Redis Cache',
    icon: 'Zap',
    category: 'cache',
    purchaseCost: 400,
    runtimeCostPerSecond: 2,
    capacityRps: 10000,
    basLatencyMs: 1,
    description: 'In-memory cache. Reduces database load via high cache hit ratio.',
  },
  {
    type: 'sql-database',
    label: 'SQL Database',
    icon: 'Database',
    category: 'database',
    purchaseCost: 500,
    runtimeCostPerSecond: 4,
    capacityRps: 400,
    basLatencyMs: 20,
    description: 'Relational database. High consistency, limited write throughput.',
  },
  {
    type: 'nosql-database',
    label: 'NoSQL Database',
    icon: 'DatabaseZap',
    category: 'database',
    purchaseCost: 500,
    runtimeCostPerSecond: 4,
    capacityRps: 800,
    basLatencyMs: 15,
    description: 'Document store. Higher throughput than SQL, eventual consistency.',
  },
  {
    type: 'cdn',
    label: 'CDN',
    icon: 'Globe',
    category: 'cdn',
    purchaseCost: 500,
    runtimeCostPerSecond: 3,
    capacityRps: 50000,
    basLatencyMs: 5,
    description: 'Serves static assets from edge nodes. Dramatically reduces origin load.',
  },
  {
    type: 'message-queue',
    label: 'Message Queue',
    icon: 'MessageSquare',
    category: 'queue',
    purchaseCost: 350,
    runtimeCostPerSecond: 2,
    capacityRps: 3000,
    basLatencyMs: 5,
    description: 'Decouples producers from consumers. Absorbs traffic spikes gracefully.',
  },
  {
    type: 'rate-limiter',
    label: 'Rate Limiter',
    icon: 'Shield',
    category: 'security',
    purchaseCost: 150,
    runtimeCostPerSecond: 1,
    capacityRps: 10000,
    basLatencyMs: 1,
    description: 'Throttles abusive clients. Protects downstream services from overload.',
  },
]

/**
 * Helper: look up a component definition by its type string.
 * Returns undefined if not found — caller must handle this case.
 */
export function getComponentByType(type: string): ComponentDefinition | undefined {
  return componentRegistry.find((c) => c.type === type)
}
```

---

## Placeholder files — create these with top-level comments only, no logic

### `src/engine/simulator.ts`
```ts
/**
 * src/engine/simulator.ts
 *
 * Core simulation game loop.
 *
 * WHY THIS EXISTS:
 * This is the heart of the game. It processes one tick (1 second) at a time,
 * traverses the user's architecture DAG, calculates load on each node,
 * tracks dropped requests, latency, and budget consumption.
 *
 * IMPORTANT:
 * - Pure TypeScript only. No React imports. No DOM access.
 * - All functions must be pure (same input → same output, no side effects).
 * - React components call these functions and store results in state.
 */

// TODO: implement in Step 4
export {}
```

### `src/engine/scorer.ts`
```ts
/**
 * src/engine/scorer.ts
 *
 * Score calculation functions.
 *
 * WHY THIS EXISTS:
 * After simulation completes, we aggregate all tick metrics into a final score.
 * Score is calculated using configurable weight profiles from src/config/scoring.ts.
 *
 * IMPORTANT:
 * - All functions are pure. No side effects.
 * - Weights are injected — never hardcoded here.
 */

// TODO: implement in Step 4
export {}
```

### `src/engine/validator.ts`
```ts
/**
 * src/engine/validator.ts
 *
 * Architecture validation logic.
 *
 * WHY THIS EXISTS:
 * Before simulation starts, we validate that the user's canvas forms a valid
 * Directed Acyclic Graph (DAG) with a proper request flow path.
 * Example: traffic cannot reach a Database without passing through an API Server.
 *
 * IMPORTANT:
 * - Pure TypeScript only.
 * - Returns structured validation errors, not thrown exceptions.
 */

// TODO: implement in Step 4
export {}
```

### `src/problems/index.ts`
```ts
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
```

### `src/problems/url-shortener.ts`
```ts
/**
 * src/problems/url-shortener.ts
 *
 * Challenge: URL Shortener
 * Difficulty: Beginner
 *
 * The user must build an architecture that handles read-heavy traffic
 * with a burst spike, while staying within budget.
 */

import type { Problem } from '@/types'

export const urlShortener: Problem = {
  id: 'url-shortener',
  title: 'URL Shortener',
  subtitle: 'Handle 100M users with a read-heavy traffic spike.',
  difficulty: 'beginner',
  description: `
    A viral link is being shared across social media.
    Your URL shortener must handle a sudden spike to 2,000 req/s
    without dropping requests or exceeding your budget.
    Hint: most traffic is reads — caching will help significantly.
  `,
  durationSeconds: 45,
  initialBudget: 1200,
  trafficPattern: [
    { atSecond: 0,  rps: 100  },
    { atSecond: 10, rps: 500  },
    { atSecond: 20, rps: 2000 },
    { atSecond: 35, rps: 800  },
    { atSecond: 45, rps: 200  },
  ],
  availableComponents: [
    'load-balancer',
    'api-server',
    'redis-cache',
    'sql-database',
    'rate-limiter',
  ],
  successConditions: [
    { metric: 'availability',     operator: 'gte', value: 99,   label: 'Availability ≥ 99%' },
    { metric: 'avgLatency',       operator: 'lte', value: 100,  label: 'Avg latency ≤ 100ms' },
    { metric: 'droppedRequests',  operator: 'lte', value: 0,    label: 'Zero dropped requests' },
    { metric: 'balance',          operator: 'gte', value: 0,    label: 'Budget not exceeded' },
  ],
  scoringProfile: 'default',
}
```

### `src/problems/flash-sale.ts`
```ts
/**
 * src/problems/flash-sale.ts
 *
 * Challenge: Flash Sale
 * Difficulty: Medium
 *
 * The user must survive a 10x traffic spike on a tight budget.
 * Over-engineering is penalized — cost efficiency matters here.
 */

import type { Problem } from '@/types'

export const flashSale: Problem = {
  id: 'flash-sale',
  title: 'Flash Sale',
  subtitle: 'Survive a 10x traffic spike on a tight budget.',
  difficulty: 'medium',
  description: `
    A flash sale just went live. Traffic is about to spike 10x in seconds.
    You have a limited budget — every component costs money per second.
    Build an architecture that survives the spike without overspending.
    Hint: a well-placed cache can save your database — and your budget.
  `,
  durationSeconds: 60,
  initialBudget: 1000,
  trafficPattern: [
    { atSecond: 0,  rps: 200  },
    { atSecond: 5,  rps: 1000 },
    { atSecond: 10, rps: 3000 },
    { atSecond: 20, rps: 2500 },
    { atSecond: 40, rps: 1000 },
    { atSecond: 60, rps: 300  },
  ],
  availableComponents: [
    'load-balancer',
    'api-server',
    'redis-cache',
    'sql-database',
    'nosql-database',
    'rate-limiter',
    'message-queue',
  ],
  successConditions: [
    { metric: 'availability',     operator: 'gte', value: 95,  label: 'Availability ≥ 95%' },
    { metric: 'droppedRequests',  operator: 'lte', value: 50,  label: 'Dropped requests ≤ 50' },
    { metric: 'balance',          operator: 'gte', value: 0,   label: 'Budget not exceeded' },
  ],
  scoringProfile: 'costFocused',
}
```

### Remaining placeholder files — create with top-level comment only

`src/components/ui/Badge.tsx` — Shared badge component for difficulty labels
`src/components/ui/Button.tsx` — Shared button component with variants
`src/components/ui/StatCard.tsx` — Displays a single metric (label + value)
`src/components/ui/Terminal.tsx` — Scrolling log terminal UI
`src/components/simulation/Canvas.tsx` — React Flow drag-and-drop canvas
`src/components/simulation/ComponentPalette.tsx` — Sidebar with draggable components
`src/components/simulation/ReportCard.tsx` — Post-simulation result display
`src/components/simulation/MobileBlock.tsx` — Full-screen mobile warning
`src/app/sys-simulation/page.tsx` — SSR challenge list page
`src/app/sys-simulation/[id]/page.tsx` — CSR builder + simulation page

Each placeholder must have:
1. A top-level JSDoc comment explaining what the file does and why it exists
2. `export default function` or `export {}` so TypeScript does not complain
3. No actual implementation

---

## Tailwind dark/light setup

In `src/app/globals.css`, add after existing styles:

```css
/* Dark/light mode via system preference — no toggle needed */
@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary: #0f172a;
    --bg-secondary: #1e293b;
    --border: #334155;
    --text-primary: #f1f5f9;
    --text-secondary: #94a3b8;
  }
}

@media (prefers-color-scheme: light) {
  :root {
    --bg-primary: #ffffff;
    --bg-secondary: #f8fafc;
    --border: #e2e8f0;
    --text-primary: #0f172a;
    --text-secondary: #64748b;
  }
}
```

---

## Verification checklist (run after completing)

- [ ] `npm run dev` starts without errors
- [ ] `npm run build` completes without type errors
- [ ] All files exist at the paths listed above
- [ ] No `any` types anywhere
- [ ] Every file has a top-level comment
- [ ] `src/types/index.ts` exports all interfaces listed above
````