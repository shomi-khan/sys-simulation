/**
 * src/app/sys-simulation/page.tsx
 *
 * Challenge list page - entry point of the game. SSR.
 *
 * WHY SSR:
 * Challenge titles, subtitles, and difficulty are static data.
 * Rendering server-side makes them indexable by search engines.
 *
 * Progress state (solved/unlocked) lives in localStorage — browser only.
 * Passed to ChallengeList (Client Component) after hydration.
 */

import ChallengeList from '@/components/simulation/ChallengeList'
import MobileBlock from '@/components/simulation/MobileBlock'
import { problems } from '@/problems'

export const metadata = {
  title: 'arch-puzzle — system design challenges',
  description: 'Learn distributed systems by building and simulating real architectures.',
}

/**
 * SysSimulationPage - renders the desktop challenge list and mobile block.
 */
export default function SysSimulationPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0f1a' }}>
      <nav
        className="sticky top-0 z-10 flex h-12 items-center px-6 font-mono"
        style={{ backgroundColor: '#0f172a', borderBottom: '0.5px solid #1e293b' }}
      >
        <span className="text-sm font-semibold" style={{ color: '#378ADD' }}>
          arch-puzzle
        </span>
        <span className="ml-2 text-xs" style={{ color: '#62738a' }}>
          system design playground
        </span>
      </nav>
      <MobileBlock />
      <div className="hidden max-w-3xl mx-auto px-6 py-10 lg:block" style={{ backgroundColor: '#0a0f1a' }}>
        <ChallengeList problems={problems} />
      </div>
    </div>
  )
}
