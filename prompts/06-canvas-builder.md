````markdown
# Step 6 — Canvas Builder Page (Drag-and-Drop, CSR)

## Context
You are continuing to build **sys-simulation** — a system design simulation game built with Next.js, TypeScript, and Tailwind CSS.

Steps 1–5 are complete. Types, config, shared UI, problem data, engine, and challenge list page all exist.

Now implement the **builder page** at `/sys-simulation/[id]`. This is a fully client-side rendered page where the user drags infrastructure components onto a canvas, connects them, and prepares to run the simulation.

---

## General rules

- TypeScript only. No `any`.
- This page is a **Client Component** — `'use client'` at the top of the page file.
- React Flow handles all drag-and-drop and edge connection logic.
- No simulation logic in this step — just the canvas, palette, and static sidebar.
- Simulation runner is wired in Step 7.
- Every component must have a top-level JSDoc comment.
- Every prop must have an inline comment.
- Mobile: show `MobileBlock`, hide canvas.
- React Flow `nodeTypes` and `edgeTypes` must be declared at module level, outside component functions. Do not use inline objects or `useMemo` for these type maps.

---

## Files to create or update

```
src/app/sys-simulation/[id]/page.tsx              ← CSR builder page
src/components/simulation/Canvas.tsx              ← React Flow canvas
src/components/simulation/ComponentPalette.tsx    ← draggable component sidebar
src/components/simulation/BuilderSidebar.tsx      ← new: right sidebar (stats + terminal placeholder)
src/components/simulation/ProblemHeader.tsx       ← new: top bar with problem info + controls
```

---

## `src/app/sys-simulation/[id]/page.tsx` — implement fully

```tsx
/**
 * src/app/sys-simulation/[id]/page.tsx
 *
 * Builder page — where the user constructs their architecture and runs the simulation.
 *
 * WHY CLIENT COMPONENT:
 * React Flow requires browser APIs (drag events, pointer events, ResizeObserver).
 * Simulation state is managed in React state updated every second via setInterval.
 * Neither of these can run on the server.
 *
 * LAYOUT:
 * ┌─────────────────────────────────────────────────────┐
 * │  ProblemHeader (title, difficulty, budget, controls) │
 * ├──────────┬──────────────────────────┬───────────────┤
 * │ Component│                          │               │
 * │ Palette  │     React Flow Canvas    │ BuilderSidebar│
 * │ (left)   │     (center, flex-1)     │ (right)       │
 * └──────────┴──────────────────────────┴───────────────┘
 */
```

### Requirements
- `'use client'` at top
- Read `params.id` and look up problem via `getProblemById(id)`
- If problem not found: render a simple "Challenge not found" message with a back link
- If problem found but locked (check `isUnlocked`): render "Complete the previous challenge first" with a back link
- Pass `problem` down to child components as a prop
- Canvas state (`nodes`, `edges`) lives here as React state — passed to `Canvas` component
- Simulation state (`SimulationState`) lives here — passed to `BuilderSidebar` and `ProblemHeader`
- Simulation state initial value:
  ```ts
  const initialSimState: SimulationState = {
    status: 'idle',
    elapsed: 0,
    balance: problem.initialBudget,
    logs: [{ second: 0, level: 'system', message: 'Initialization complete. Build your architecture and press Start.' }],
    tickHistory: [],
    result: null,
  }
  ```

---

## `src/components/simulation/ProblemHeader.tsx` — implement fully

```tsx
/**
 * src/components/simulation/ProblemHeader.tsx
 *
 * Top bar of the builder page — shows problem context and simulation controls.
 *
 * WHY THIS EXISTS:
 * The user needs to see the problem title, difficulty, remaining budget,
 * elapsed time, and simulation controls (Start/Pause/Resume/Reset) at all
 * times while building. Keeping this in a dedicated component isolates
 * control logic from canvas logic.
 */
```

### Props
```ts
interface ProblemHeaderProps {
  /** The current challenge being played */
  problem: Problem
  /** Current simulation status — controls which buttons are visible */
  simStatus: SimulationState['status']
  /** Remaining budget to display */
  balance: number
  /** Elapsed simulation seconds */
  elapsed: number
  /** Called when user clicks Start */
  onStart: () => void
  /** Called when user clicks Pause */
  onPause: () => void
  /** Called when user clicks Resume */
  onResume: () => void
  /** Called when user clicks Reset */
  onReset: () => void
}
```

### Layout
```
← Back   |   Flash Sale  [Medium]   |   $740 balance   00:12   |   [Pause] [Reset]
```

- Left: back arrow link to `/sys-simulation`
- Center: `problem.title` + `<Badge variant={problem.difficulty} />`
- Right: balance display + elapsed timer + control buttons
- Timer format: `MM:SS` — pad with leading zero
- Balance color: green if > 50% of initial, amber if 20–50%, red if < 20%
- Button visibility rules:
  - `idle` → show **Start** (primary)
  - `running` → show **Pause** (secondary) + **Reset** (ghost)
  - `paused` → show **Resume** (primary) + **Reset** (ghost)
  - `completed` → show **Reset** (secondary) only
- Sticky at top, same style as layout nav bar

---

## `src/components/simulation/ComponentPalette.tsx` — implement fully

```tsx
/**
 * src/components/simulation/ComponentPalette.tsx
 *
 * Left sidebar — displays draggable infrastructure components.
 *
 * WHY THIS EXISTS:
 * The palette is the user's toolbox. It shows only the components available
 * for the current challenge (defined in problem.availableComponents).
 * Restricting available components is part of challenge design — a beginner
 * challenge should not overwhelm the user with 11 options.
 *
 * HOW DRAG-AND-DROP WORKS WITH REACT FLOW:
 * Each palette item sets drag data via `event.dataTransfer.setData('componentType', type)`.
 * The Canvas component reads this data in its `onDrop` handler and creates a new node
 * at the drop position. This is the standard React Flow drag-from-outside pattern.
 */
```

### Props
```ts
interface ComponentPaletteProps {
  /** Component type strings available for this challenge */
  availableComponents: string[]
  /** Whether simulation is running — palette is disabled during simulation */
  disabled: boolean
}
```

### Behavior
- Filter `componentRegistry` to only show `availableComponents`
- Each item is draggable: `draggable={true}` + `onDragStart` sets `event.dataTransfer.setData('componentType', component.type)`
- When `disabled`: show `opacity-50 pointer-events-none` — user cannot drag during simulation
- Scroll if components overflow: `overflow-y-auto`

### Item layout
```
┌──────────────────────┐
│ [icon]  Load Balancer│  ← colored left border by category
│         $300 · 2/s   │  ← purchaseCost · runtimeCostPerSecond/s
└──────────────────────┘
```

- Border color by category:
  - `network` → `border-l-blue-400`
  - `compute` → `border-l-green-400`
  - `cache` → `border-l-red-400`
  - `database` → `border-l-purple-400`
  - `cdn` → `border-l-amber-400`
  - `queue` → `border-l-orange-400`
  - `security` → `border-l-pink-400`

- Item base: `border-l-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 cursor-grab select-none`
- Hover: `hover:shadow-sm hover:border-slate-300 dark:hover:border-slate-600`
- Icon: render lucide-react icon by name — use a dynamic map:

```ts
// Map component type → lucide-react icon component
import { Network, Server, Zap, Database, DatabaseZap, Globe, MessageSquare, Shield } from 'lucide-react'

const iconMap: Record<string, React.ComponentType<{ size?: number }>> = {
  'load-balancer': Network,
  'api-server': Server,
  'redis-cache': Zap,
  'sql-database': Database,
  'nosql-database': DatabaseZap,
  'cdn': Globe,
  'message-queue': MessageSquare,
  'rate-limiter': Shield,
}
```

---

## `src/components/simulation/Canvas.tsx` — implement fully

```tsx
/**
 * src/components/simulation/Canvas.tsx
 *
 * React Flow canvas — the drag-and-drop architecture builder.
 *
 * WHY THIS EXISTS:
 * This is where the user physically constructs their architecture.
 * It renders nodes (infrastructure components) and edges (connections)
 * using React Flow, and handles all drag-and-drop interactions.
 *
 * HOW NODES ARE ADDED:
 * 1. User drags a component from ComponentPalette onto this canvas
 * 2. onDrop fires, reads componentType from dataTransfer
 * 3. A new CanvasNode is created and added to parent state
 * 4. React Flow renders it immediately
 *
 * HOW EDGES ARE ADDED:
 * React Flow handles this natively — user drags from a node's output
 * handle to another node's input handle. onConnect fires with the new edge.
 *
 * NODE VISUAL DESIGN:
 * Each node shows: colored border (by category) + icon + label + load bar.
 * Load bar is hidden when simulation is idle, visible during/after simulation.
 */
```

### Props
```ts
interface CanvasProps {
  /** Nodes currently on the canvas — managed by parent state */
  nodes: CanvasNode[]
  /** Edges connecting nodes — managed by parent state */
  edges: CanvasEdge[]
  /** Called with the full updated node array on any real architecture edit (drop, move-settle, delete) — not on every internal React Flow event */
  onNodesChange: (nodes: CanvasNode[]) => void
  /** Called when user connects two nodes */
  onEdgesChange: (edges: CanvasEdge[]) => void
  /** Whether simulation is running — prevents structural changes during sim */
  disabled: boolean
}
```

### React Flow setup

```tsx
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  applyNodeChanges,
  useEdgesState,
  type Node,
  type Edge,
  type NodeChange,
  type OnConnect,
  type Connection,
} from 'reactflow'
import 'reactflow/dist/style.css'
```

### Custom node component

Create a `SimulationNode` component inside `Canvas.tsx` (not exported):

```tsx
/**
 * SimulationNode — custom React Flow node renderer.
 * Renders an infrastructure component with icon, label, category border,
 * and a load percentage bar (visible only during/after simulation).
 */
```

After defining `SimulationNode`, declare React Flow type maps at module level:

```tsx
const nodeTypes = {
  simulation: SimulationNode,
}

// If custom edge types are added later, keep this module-level too.
// const edgeTypes = {
//   custom: CustomEdge,
// }
```

Do not write `nodeTypes={{ simulation: SimulationNode }}` inside `<ReactFlow />`.
React Flow treats inline objects as new references on every render and will warn/re-initialize.

### Local node state & sync with parent (required — fixes node-disappearing bug)

React Flow must own a **local** copy of nodes (`flowNodes`) that drives rendering. This local state is the single source of truth for the canvas. It is synced *out* to parent state (`onNodesChange` prop) only for real architecture edits, and synced *in* from parent state only on external resets (e.g. the Reset button clearing the canvas).

```ts
// Local React Flow state — source of truth for what's rendered.
// Initialized from parent `nodes` prop, then updated locally on every
// drag/drop/delete via handleNodesChange (defined further below). Pushed
// back to parent only for real architecture changes — never on every
// event in React Flow's internal change stream.
const [flowNodes, setFlowNodes] = useState<Node[]>(toFlowNodes(nodes))

// Re-sync local state from parent ONLY when the parent array was cleared
// externally (Reset button). Internal-origin updates already match parent
// state by the time this effect would run, so it's a no-op in that case.
useEffect(() => {
  if (nodes.length === 0 && flowNodes.length > 0) {
    setFlowNodes([])
  }
}, [nodes.length])
```

**Why this matters — the bug this prevents:**
Previously, `onDrop` added a node directly to parent state, but React Flow immediately fires its own internal `onNodesChange` events afterward (dimension measurement, selection). If those internal events were applied via `applyNodeChanges(changes, nodes)` against a **stale** `nodes` closure (captured before the drop's state update had propagated), the result overwrote parent state and silently deleted the just-dropped node. The fix is twofold: (1) keep a local `flowNodes` state that always reflects the latest React Flow changes immediately, and (2) only forward to parent state the change types that represent real architecture edits — never blindly mirror every internal change event.

Node visual:
```
┌─────────────────────────┐  ← colored border (by category)
│  [icon]  Load Balancer  │  ← icon (16px) + label (text-sm font-medium)
│  ████░░░░  45%          │  ← load bar + percentage (hidden when idle)
└─────────────────────────┘
```

- Node size: `min-w-[140px]`
- Border: `border-2 rounded-xl` — color by category (same mapping as palette)
- Background: `bg-white dark:bg-slate-800`
- Load bar colors:
  - 0–60%: `bg-green-400`
  - 61–89%: `bg-amber-400`
  - 90%+: `bg-red-500`
- Load bar: `h-1.5 rounded-full` inside a `bg-slate-200 dark:bg-slate-700` track

### handleNodesChange — bridges React Flow events to parent state

```ts
/**
 * handleNodesChange — wired to <ReactFlow onNodesChange={handleNodesChange}>.
 *
 * Applies every change to local `flowNodes` immediately (so dragging,
 * selection, and resizing stay visually smooth), but only forwards
 * REAL architecture edits to parent state:
 *   - 'position' changes where change.dragging === false (drag has settled)
 *   - 'remove' changes (node deleted)
 * All other change types ('dimensions', 'select', in-progress 'position'
 * with dragging === true) update the local canvas only and are never
 * pushed to parent state. This is what prevents internal React Flow
 * events from overwriting a node that was just added via drop.
 */
const handleNodesChange = useCallback((changes: NodeChange[]) => {
  // Always read the freshest state via functional update — never the
  // `flowNodes` value captured in this callback's closure — so a change
  // event can never be applied against stale data.
  setFlowNodes((current) => {
    const updated = applyNodeChanges(changes, current)

    const isArchitectureChange = changes.some(
      (c) =>
        (c.type === 'position' && c.dragging === false) ||
        c.type === 'remove'
    )
    if (isArchitectureChange) {
      onNodesChange(toCanvasNodes(updated))
    }

    return updated
  })
}, [onNodesChange])
```

### onDrop handler

```ts
const onDrop = useCallback((event: React.DragEvent) => {
  event.preventDefault()
  const componentType = event.dataTransfer.getData('componentType')
  if (!componentType) return

  // Convert drop position from screen coordinates to React Flow canvas coordinates
  const bounds = reactFlowWrapper.current?.getBoundingClientRect()
  if (!bounds) return

  const position = reactFlowInstance.screenToFlowPosition({
    x: event.clientX - bounds.left,
    y: event.clientY - bounds.top,
  })

  // Create a new CanvasNode, converted to React Flow's Node shape
  const newCanvasNode: CanvasNode = {
    instanceId: `${componentType}-${Date.now()}`,
    type: componentType,
    position,
    currentLoadRps: 0,
    loadPercent: 0,
    status: 'idle',
  }
  const newFlowNode = toFlowNode(newCanvasNode)

  // Add to LOCAL flowNodes via functional update — reads the freshest
  // state rather than a possibly-stale `flowNodes`/`nodes` closure — then
  // push the resulting array to parent state. This, combined with
  // handleNodesChange ignoring non-architecture changes above, is what
  // makes the dropped node survive React Flow's follow-up internal events.
  setFlowNodes((current) => {
    const updated = [...current, newFlowNode]
    onNodesChange(toCanvasNodes(updated))
    return updated
  })
}, [onNodesChange, reactFlowInstance])
```

The drag payload set by `ComponentPalette` must be plain text (`event.dataTransfer.setData('componentType', component.type)`) and read back with `event.dataTransfer.getData('componentType')` — do not use `'application/reactflow'` or JSON-encode the payload; the plain string round-trip is what keeps the drop reliable across browsers.

### Canvas container
- `ref={reactFlowWrapper}` on the outer div (used only for `getBoundingClientRect()` in `onDrop`'s coordinate conversion)
- `<ReactFlow>` itself receives `nodes={flowNodes}`, `onNodesChange={handleNodesChange}`, `onDrop={onDrop}`, `onDragOver={(e) => e.preventDefault()}` — **do not** attach `onDrop`/`onDragOver` to the outer wrapper `div`; attaching them to `<ReactFlow>` directly is required for reliable drops (React Flow's own pointer-capture layer can swallow drop events that land on a sibling/parent element instead).
- Background: `bg-slate-100 dark:bg-slate-900`
- Show `<Background />`, `<Controls />`, `<MiniMap />` from React Flow
- MiniMap node color by status:
  - idle/healthy → `#4ade80`
  - warning → `#fbbf24`
  - overloaded → `#f87171`

### Node ↔ CanvasNode conversion
React Flow uses its own `Node` type. Convert to/from `CanvasNode` at the boundary — these are used by `handleNodesChange` and `onDrop` above:
```ts
// CanvasNode → React Flow Node
const toFlowNode = (n: CanvasNode): Node => ({
  id: n.instanceId,
  type: 'simulation',
  position: n.position,
  data: n, // SimulationNode reads display fields (label, status, loadPercent) from here
})

const toFlowNodes = (nodes: CanvasNode[]): Node[] => nodes.map(toFlowNode)

// React Flow Node[] → CanvasNode[]
const toCanvasNodes = (nodes: Node[]): CanvasNode[] =>
  nodes.map((n) => ({ ...(n.data as CanvasNode), position: n.position }))
```

### Edge to CanvasEdge conversion
React Flow uses its own `Edge` type. Convert to/from `CanvasEdge` when calling parent callbacks:
```ts
// React Flow Edge → CanvasEdge
const toCanvasEdge = (e: Edge): CanvasEdge => ({
  id: e.id,
  fromInstanceId: e.source,
  toInstanceId: e.target,
})
```

---

## `src/components/simulation/BuilderSidebar.tsx` — implement fully

```tsx
/**
 * src/components/simulation/BuilderSidebar.tsx
 *
 * Right sidebar — shows live simulation metrics and the terminal log.
 *
 * WHY THIS EXISTS:
 * During simulation, the user needs real-time feedback: uptime, latency,
 * req/s, and budget. The terminal log provides a narrative of events.
 * Keeping this separate from the canvas avoids cluttering Canvas.tsx
 * with display logic unrelated to drag-and-drop.
 *
 * In Step 6 (this step), the sidebar renders placeholder/zero values.
 * In Step 7, real simulation data flows in via props.
 */
```

### Props
```ts
interface BuilderSidebarProps {
  /** Current simulation state — drives all displayed values */
  simState: SimulationState
  /** Initial budget — used to determine balance color thresholds */
  initialBudget: number
}
```

### Layout
```
┌─────────────────┐
│ Uptime          │  ← StatCard
│ 99.8%           │
├─────────────────┤
│ Avg Latency     │  ← StatCard
│ 42ms            │
├─────────────────┤
│ Req/s           │  ← StatCard
│ 1,840           │
├─────────────────┤
│ Balance         │  ← StatCard
│ $740            │
├─────────────────┤
│ TERMINAL        │  ← Terminal component (flex-1, fills remaining height)
│ [00:00] ⚙️ ...  │
│ [00:03] ℹ️ ...  │
└─────────────────┘
```

### Idle state values (before simulation starts)
- Uptime: `—`
- Avg Latency: `—`
- Req/s: `0`
- Balance: `$${problem.initialBudget.toLocaleString()}`
- All StatCard status: `neutral`

### Live state values (derive from `simState.tickHistory`)
```ts
// Get latest tick metrics
const latest = simState.tickHistory[simState.tickHistory.length - 1]

// Uptime (availability so far)
const totalReqs = simState.tickHistory.reduce((s, t) => s + t.trafficRps, 0)
const totalDropped = simState.tickHistory.reduce((s, t) => s + t.droppedRequests, 0)
const uptime = totalReqs > 0 ? ((totalReqs - totalDropped) / totalReqs * 100).toFixed(1) + '%' : '—'

// StatCard status thresholds
// Uptime: >= 99 → healthy, >= 95 → warning, < 95 → critical
// Latency: <= 100ms → healthy, <= 300ms → warning, > 300ms → critical
// Balance: > 50% → healthy, > 20% → warning, <= 20% → critical
```

---

## Validation error display

Before simulation starts, if the user clicks Start and `validateArchitecture` returns errors, show them inline above the canvas:

```
┌──────────────────────────────────────────────────────┐
│ ⚠️  Cannot start simulation                          │
│                                                      │
│ • Connect your components with arrows to define      │
│   the request flow.                                  │
│ • Place at least one component on the canvas.        │
└──────────────────────────────────────────────────────┘
```

- Style: `bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4 text-sm`
- Dismisses automatically when user makes a change to the canvas

---

## Verification checklist

- [ ] `npm run dev` — `/sys-simulation/url-shortener` loads without errors
- [ ] `npm run build` passes cleanly
- [ ] ComponentPalette shows only the components listed in `problem.availableComponents`
- [ ] Dragging a component from palette onto canvas creates a new node
- [ ] Dropped node does NOT disappear after a follow-up click, selection, drag-end, or window resize (regression check for the stale-closure node-removal bug)
- [ ] Dropping a second/third component while earlier nodes remain selected does not remove the earlier nodes
- [ ] Moving a node and releasing the mouse persists the new position in parent state; dragging in-progress does not spam parent state on every pixel
- [ ] Connecting two nodes creates a directed edge with an arrow
- [ ] Deleting a node (select + backspace) removes it from state
- [ ] ProblemHeader shows correct title, difficulty badge, budget, and timer
- [ ] Start button visible when idle
- [ ] Pause/Reset visible when running (wired in Step 7)
- [ ] BuilderSidebar shows `—` values in idle state
- [ ] Terminal shows the initialization log message
- [ ] MobileBlock renders on small screens, builder layout hidden
- [ ] No `any` types anywhere
- [ ] Every component has top-level JSDoc comment
````