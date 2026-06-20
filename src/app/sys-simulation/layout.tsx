/**
 * src/app/sys-simulation/layout.tsx
 *
 * Shared layout for all /sys-simulation routes.
 *
 * IMPORTANT CONSTRAINT:
 * The builder page ([id]) needs full viewport height (h-screen) with no
 * extra padding or max-width wrappers - the canvas must fill available space.
 * The list page needs centered content with max-width and padding.
 *
 * Solution: apply max-width/padding only to the list page via its own
 * wrapper div inside page.tsx. The layout renders children directly
 * with only the nav bar above.
 */

import type { ReactNode } from 'react'

interface SysSimulationLayoutProps {
  /** Route content rendered under the shared sys-simulation nav */
  children: ReactNode
}

/**
 * SysSimulationLayout - renders shared navigation without constraining pages.
 */
export default function SysSimulationLayout({
  children,
}: SysSimulationLayoutProps) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0f1a' }}>
      <nav
        className="sticky top-0 z-10 flex h-12 items-center px-6 font-mono"
        style={{ backgroundColor: '#0f172a', borderBottom: '0.5px solid #1e293b' }}
      >
        <span className="text-sm font-semibold" style={{ color: '#378ADD' }}>
          arch-lab
        </span>
        <span className="ml-2 text-xs" style={{ color: '#475569' }}>
          system design playground
        </span>
      </nav>
      {children}
    </div>
  )
}
