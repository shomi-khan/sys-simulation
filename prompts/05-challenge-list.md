````markdown
# Step 5 — Challenge List Page (SSR)

## Context
You are continuing to build **sys-simulation** — a system design simulation game built with Next.js, TypeScript, and Tailwind CSS.

Steps 1–4 are complete. Types, config, shared UI components, problem data layer, progress tracking, and simulation engine all exist.

Now implement the **challenge list page** at `/sys-simulation`. This is the only SSR page in the project — it must be a React Server Component so search engines can index challenge titles and descriptions.

---

## General rules

- TypeScript only. No `any`.
- This page is a **React Server Component** — no `'use client'` directive.
- Progress state (solved/unlocked) is client-side only — use a Client Component island for that.
- Every component must have a top-level JSDoc comment.
- Every prop must have an inline comment.
- Dark/light via `prefers-color-scheme` — no toggle, no next-themes.
- Mobile: show `MobileBlock` component, hide everything else.

---

## Files to create or update

```
src/app/sys-simulation/page.tsx          ← SSR page (Server Component)
src/app/sys-simulation/layout.tsx        ← layout for /sys-simulation routes
src/components/simulation/MobileBlock.tsx       ← implement fully
src/components/simulation/ChallengeGrid.tsx     ← new Client Component
src/components/simulation/ChallengeCard.tsx     ← new Client Component
```

---

## `src/app/sys-simulation/layout.tsx` — implement fully

```tsx
/**
 * src/app/sys-simulation/layout.tsx
 *
 * Layout wrapper for all /sys-simulation routes.
 *
 * WHY THIS EXISTS:
 * Provides consistent page padding, max-width, and the top navigation bar
 * shared between the challenge list page and the builder page.
 * Keeping layout here avoids duplicating it in every page.
 */
```

### Requirements
- Top nav bar with:
  - Left: game title "sys-simulation" in monospace font + a small subtitle "system design playground"
  - Right: nothing for MVP (future: XP counter)
- Below nav: `{children}` with `max-w-6xl mx-auto px-6 py-8`
- Nav background: `bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200 dark:border-slate-700`
- Sticky nav: `sticky top-0 z-10`
- Full page background: `bg-slate-50 dark:bg-slate-900 min-h-screen`

---

## `src/components/simulation/MobileBlock.tsx` — implement fully

```tsx
/**
 * src/components/simulation/MobileBlock.tsx
 *
 * Full-screen message shown on mobile and tablet viewports.
 *
 * WHY THIS EXISTS:
 * The simulation canvas requires drag-and-drop interactions that are
 * impractical on touch screens and small viewports. Rather than showing
 * a broken experience, we show a clear message directing users to desktop.
 *
 * Visibility is controlled by Tailwind breakpoints:
 * - Visible on:  block lg:hidden
 * - Hidden on:   hidden lg:block (applied to the main content by the parent)
 */
```

### Layout
```
┌─────────────────────────────────────────┐
│                                         │
│              🖥️                         │
│                                         │
│     Best on a desktop browser           │  ← text-xl font-semibold
│                                         │
│   This simulation uses drag-and-drop    │  ← text-sm text-secondary
│   interactions that require a larger    │
│   screen. Open this page on a laptop    │
│   or desktop for the full experience.   │
│                                         │
└─────────────────────────────────────────┘
```

- Centered vertically and horizontally: `flex flex-col items-center justify-center min-h-[60vh] text-center px-8`
- Icon size: `text-6xl mb-6`
- Card style: subtle border, rounded-2xl, max-w-sm, padding p-10

---

## `src/app/sys-simulation/page.tsx` — implement fully

```tsx
/**
 * src/app/sys-simulation/page.tsx
 *
 * Challenge list page — entry point of the game.
 *
 * WHY SSR:
 * Challenge titles, subtitles, and descriptions are static data.
 * Rendering them server-side makes them indexable by search engines,
 * which helps with discoverability as a portfolio piece.
 *
 * Progress state (which challenges are solved/unlocked) is stored in
 * localStorage — which only exists in the browser. So we render the
 * challenge grid structure on the server, and hydrate unlock state
 * on the client via the ChallengeGrid Client Component.
 */
```

### Requirements
- Import `problems` from `src/problems/index.ts`
- Pass problems array to `<ChallengeGrid problems={problems} />`
- Show `<MobileBlock />` on small screens, `<ChallengeGrid />` on large screens
- Page title section above the grid:
  ```
  System Design Challenges          ← text-2xl font-bold
  Build. Simulate. Learn.           ← text-sm text-secondary mt-1
  ```
- Next.js metadata export:
  ```ts
  export const metadata = {
    title: 'System Design Challenges — sys-simulation',
    description: 'Learn distributed systems by building and simulating real architectures.',
  }
  ```

---

## `src/components/simulation/ChallengeGrid.tsx` — implement fully

```tsx
/**
 * src/components/simulation/ChallengeGrid.tsx
 *
 * Client Component — renders the challenge card grid with unlock state.
 *
 * WHY CLIENT COMPONENT:
 * Unlock state is derived from localStorage (via src/lib/progress.ts).
 * localStorage is only available in the browser, so this component must
 * be a Client Component. The Server Component page passes problem data
 * down as props — no data fetching happens here.
 *
 * On first render, all challenges appear locked (SSR-safe default).
 * After hydration, useEffect reads localStorage and updates unlock state.
 * This prevents hydration mismatch errors.
 */
```

### Props
```ts
interface ChallengeGridProps {
  /** All problems passed down from the SSR page — never fetched client-side */
  problems: Problem[]
}
```

### Behavior
- `'use client'` at top
- On mount (`useEffect`), read solved ids from `getSolvedIds()` and compute which problems are unlocked via `isUnlocked()`
- Before hydration (initial render), treat all problems as locked — avoids SSR mismatch
- Grid layout: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`
- Render one `<ChallengeCard />` per problem

### Unlock logic
```ts
// A problem is unlocked if:
// 1. It has no prerequisite (unlocksAfter === null), OR
// 2. Its prerequisite id exists in the solved set
const unlocked = problem.unlocksAfter === null || solvedIds.has(problem.unlocksAfter)
```

---

## `src/components/simulation/ChallengeCard.tsx` — implement fully

```tsx
/**
 * src/components/simulation/ChallengeCard.tsx
 *
 * Displays a single challenge as a clickable card.
 *
 * States:
 * - Unlocked: clickable, navigates to /sys-simulation/[id]
 * - Locked: not clickable, shows lock icon + "Complete previous challenge" tooltip
 * - Solved: shows a checkmark badge in addition to normal state
 *
 * WHY SEPARATE COMPONENT:
 * Isolates the card's visual logic from the grid layout.
 * Makes it easy to change card design without touching grid logic.
 */
```

### Props
```ts
interface ChallengeCardProps {
  /** The problem data to display */
  problem: Problem
  /** Whether this challenge is available to play */
  unlocked: boolean
  /** Whether this challenge has already been completed */
  solved: boolean
}
```

### Card layout
```
┌──────────────────────────────────────┐
│ [Beginner]              [✓ Solved]   │  ← Badge row (difficulty + solved badge)
│                                      │
│ URL Shortener                        │  ← title: text-base font-semibold
│ Handle 100M users with read-heavy    │  ← subtitle: text-sm text-secondary mt-1
│ traffic spike.                       │
│                                      │
│ 45s  ·  $1,200 budget                │  ← meta: text-xs text-secondary mt-3
│                         →            │  ← arrow icon (only when unlocked)
└──────────────────────────────────────┘
```

### Locked state
```
┌──────────────────────────────────────┐
│ [Medium]                      🔒     │
│                                      │
│ Flash Sale                           │
│ Survive a 10x traffic spike...       │
│                                      │
│ Complete "URL Shortener" to unlock   │  ← text-xs text-secondary italic
└──────────────────────────────────────┘
```

### Styling rules
- Card base: `rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5`
- Unlocked + hover: `cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all duration-150`
- Locked: `opacity-60 cursor-not-allowed`
- Solved: add a subtle `ring-1 ring-green-400 dark:ring-green-500` to the card border
- On click (unlocked only): `router.push('/sys-simulation/' + problem.id)`
- Use `useRouter` from `next/navigation`

### Meta row content
- Duration: `{problem.durationSeconds}s`
- Budget: `$${problem.initialBudget.toLocaleString()} budget`
- Separator: ` · `

---

## Color category border mapping

Component category → left border accent on card (optional visual touch):

| difficulty | left border color |
|---|---|
| beginner | border-l-4 border-l-green-400 |
| easy | border-l-4 border-l-teal-400 |
| medium | border-l-4 border-l-amber-400 |
| hard | border-l-4 border-l-orange-400 |
| expert | border-l-4 border-l-red-400 |

---

## Verification checklist

- [ ] `npm run dev` — `/sys-simulation` loads without errors
- [ ] `npm run build` passes cleanly with no TypeScript errors
- [ ] Page title and subtitle render correctly
- [ ] Both challenge cards render with correct title, subtitle, difficulty badge
- [ ] URL Shortener card is unlocked and clickable
- [ ] Flash Sale card is locked with lock icon and prerequisite message
- [ ] Clicking URL Shortener navigates to `/sys-simulation/url-shortener`
- [ ] MobileBlock renders on small viewports, grid hidden
- [ ] Grid renders on large viewports, MobileBlock hidden
- [ ] No hydration mismatch errors in browser console
- [ ] No `any` types anywhere
- [ ] Every component has top-level JSDoc comment
- [ ] Every prop has inline comment
````