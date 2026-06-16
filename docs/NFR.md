# Non-Functional Requirements (NFR)

## 1. Maintainability

- Codebase must be **modular**. Every concern lives in its own file/folder.
- UI components must be **shared and reusable** across pages. No duplicated components.
- Adding a new UI element should not require touching existing components.

## 2. Usability

- **Desktop-first** experience. The simulation canvas requires a large screen.
- On **mobile and tablet** viewports (< 1024px), display a full-screen message:
  > "This experience is best on a desktop browser."
- No canvas or game controls should render on small screens.

## 3. Type Safety

- The entire codebase must use **TypeScript**.
- No `any` types. All props, state, engine outputs, and config must be fully typed.
- Shared types must live in a central `types/` or `src/types.ts` file.

## 4. Performance

- **Simulation runs client-side only.** No server calls during gameplay.
- The simulation game loop must run on a **1-second interval** using `setInterval`.
- Canvas rendering must not block the UI thread. State updates must be batched where possible.

## 5. SEO

- The **challenge list page** must use **Server-Side Rendering (SSR)** so search engines can index challenge titles, descriptions, and difficulty levels.
- All other pages (builder, report) are **Client-Side Rendered (CSR)** — they do not need SEO.

## 6. Portability

- The game must be **decoupled from the portfolio app**.
- It must be possible to extract this project into a standalone Next.js app with zero changes to game logic or components.
- No imports should reference portfolio-specific paths or globals.

## 7. Scalability (Content)

- Adding new challenges must require **zero code changes**. Only a new data file.
- Updating challenge order, title, or difficulty must be possible by editing a single config file.

## 8. Reliability

- The simulation must produce **deterministic results** for the same architecture input.
- Score calculation must be **pure functions** — no side effects, no randomness.

## 9. Code Readability

- Every file must have a **top-level comment** explaining what it does and why it exists.
- Every function must have a **JSDoc comment** explaining parameters, return value, and side effects.
- Complex logic (simulation math, DAG traversal, score calculation) must have **inline comments** explaining the reasoning, not just the mechanics.
- Comments should explain **why**, not just **what**.

## 10. Progressive Unlock System

- A challenge is **locked** until its prerequisite challenge is solved.
- Solved state persists in **localStorage** — no backend needed.
- The first challenge is always unlocked (`unlocksAfter: null`).