````markdown
# Step 2 — Shared UI Components

## Context
You are continuing to build **sys-simulation** — a system design simulation game built with Next.js, TypeScript, and Tailwind CSS.

Step 1 is complete. The folder structure, types, and config files exist.

Now implement the **shared UI primitives** inside `src/components/ui/`. These components are used across all pages — challenge list, builder, and report. They must be fully reusable, typed, and have zero game-specific logic inside them.

---

## General rules for every component

- TypeScript only. No `any`.
- Every component must have a top-level JSDoc comment explaining what it does and why it exists.
- Every prop must have an inline comment explaining what it controls.
- Dark/light mode via `prefers-color-scheme` CSS variables defined in `globals.css`. Use Tailwind where possible, fall back to CSS variables for theme-specific colors.
- No game logic, no imports from `src/engine/` or `src/problems/`.
- Mobile-safe — these components render on all screen sizes.

---

## `src/components/ui/Badge.tsx` — implement fully

```tsx
/**
 * src/components/ui/Badge.tsx
 *
 * Displays a small colored label — used for difficulty levels and status indicators.
 * Color is determined by the `variant` prop, not by the caller passing raw color classes.
 * This keeps color logic centralized here instead of scattered across pages.
 */
```

### Props
```ts
interface BadgeProps {
  /** Text content displayed inside the badge */
  label: string
  /** Controls background and text color */
  variant: 'beginner' | 'easy' | 'medium' | 'hard' | 'expert' | 'success' | 'warning' | 'danger'
  /** Optional extra Tailwind classes for layout adjustments */
  className?: string
}
```

### Color mapping
| variant | background | text |
|---|---|---|
| beginner | green-100 / dark:green-900 | green-700 / dark:green-300 |
| easy | teal-100 / dark:teal-900 | teal-700 / dark:teal-300 |
| medium | amber-100 / dark:amber-900 | amber-700 / dark:amber-300 |
| hard | orange-100 / dark:orange-900 | orange-700 / dark:orange-300 |
| expert | red-100 / dark:red-900 | red-700 / dark:red-300 |
| success | green-100 / dark:green-900 | green-700 / dark:green-300 |
| warning | amber-100 / dark:amber-900 | amber-700 / dark:amber-300 |
| danger | red-100 / dark:red-900 | red-700 / dark:red-300 |

---

## `src/components/ui/Button.tsx` — implement fully

```tsx
/**
 * src/components/ui/Button.tsx
 *
 * General-purpose button component with multiple visual variants.
 * Used for simulation controls (Start, Pause, Resume, Reset) and navigation.
 * Wraps a native <button> element — passes through all standard button props.
 */
```

### Props
```ts
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style of the button */
  variant: 'primary' | 'secondary' | 'danger' | 'ghost'
  /** Optional icon rendered to the left of the label (lucide-react component) */
  icon?: React.ReactNode
  /** Makes the button fill its container width */
  fullWidth?: boolean
}
```

### Variant styles
| variant | style |
|---|---|
| primary | blue-600 bg, white text, blue-700 hover |
| secondary | slate-100/dark:slate-800 bg, slate text, slightly darker hover |
| danger | red-600 bg, white text, red-700 hover |
| ghost | transparent bg, slate text, slate-100/dark:slate-800 hover |

### Behavior
- Disabled state: `opacity-50 cursor-not-allowed` — applies to all variants
- Icon + label: `flex items-center gap-2`
- Size: `px-4 py-2 text-sm font-medium rounded-lg`
- Transition: `transition-colors duration-150`

---

## `src/components/ui/StatCard.tsx` — implement fully

```tsx
/**
 * src/components/ui/StatCard.tsx
 *
 * Displays a single metric as a labeled card — used in the builder sidebar
 * and result report page to show uptime, latency, req/s, balance, etc.
 *
 * The value color changes based on the `status` prop so the user gets
 * an immediate visual signal without reading the number carefully.
 */
```

### Props
```ts
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
  /** Optional small subscript shown below the value e.g. "target: ≤ 100ms" */
  hint?: string
}
```

### Layout
```
┌─────────────────┐
│ Avg Latency     │  ← label: text-xs text-secondary uppercase tracking-wide
│ 42ms            │  ← value: text-2xl font-semibold (color by status)
│ target: ≤100ms  │  ← hint: text-xs text-secondary (optional)
└─────────────────┘
```

- Card background: `bg-white dark:bg-slate-800`
- Border: `border border-slate-200 dark:border-slate-700`
- Padding: `p-4 rounded-xl`

---

## `src/components/ui/Terminal.tsx` — implement fully

```tsx
/**
 * src/components/ui/Terminal.tsx
 *
 * Scrolling log terminal that displays real-time simulation events.
 * Each log entry has a timestamp, severity level, and message.
 *
 * WHY THIS EXISTS:
 * The terminal gives the user a detailed narrative of what is happening
 * inside their architecture during simulation — cache hits, overloads,
 * budget warnings, scaling events. It makes the simulation feel alive.
 *
 * Auto-scrolls to the latest entry when new logs are added.
 * Fixed height with overflow-y scroll.
 */
```

### Props
```ts
interface TerminalProps {
  /** Array of log entries to display — new entries appended at bottom */
  logs: LogEntry[]  // import from src/types
  /** Height of the terminal container — default 'h-48' */
  heightClass?: string
}
```

### Log entry rendering

Each `LogEntry` renders as one line:

```
[00:12] ⚠️ [WARN] Database Connection Pool utilization reached 90%
```

Format: `[{second padded to 2 digits}] {emoji} [{LEVEL}] {message}`

| level | emoji | text color |
|---|---|---|
| system | ⚙️ | slate-400 |
| info | ℹ️ | blue-400 |
| warn | ⚠️ | amber-400 |
| critical | ❌ | red-400 |
| success | ✅ | green-400 |

### Styling
- Background: always `bg-slate-900` (terminal is always dark regardless of theme)
- Font: `font-mono text-xs`
- Padding: `p-3`
- Border radius: `rounded-xl`
- Auto-scroll: use `useEffect` + `useRef` to scroll to bottom when `logs` changes

---

## Verification checklist

- [ ] `npm run dev` has no TypeScript errors
- [ ] `npm run build` passes cleanly
- [ ] `Badge` renders correctly for all 8 variants
- [ ] `Button` renders all 4 variants, disabled state works
- [ ] `StatCard` shows correct color for each status value
- [ ] `Terminal` auto-scrolls to latest log on update
- [ ] No `any` types
- [ ] Every prop has an inline comment
- [ ] Every file has a top-level JSDoc comment
````