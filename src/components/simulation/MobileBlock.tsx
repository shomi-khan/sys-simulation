/**
 * src/components/simulation/MobileBlock.tsx
 *
 * Full-screen message shown on mobile and tablet viewports (< 1024px).
 * The simulation canvas requires drag-and-drop — impractical on touch screens.
 * Shown via: block lg:hidden on the parent.
 */

export default function MobileBlock() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-8 text-center block lg:hidden font-mono" style={{ backgroundColor: '#0a0f1a' }}>
      <div>
        <p className="text-sm mb-4 tracking-wide" style={{ color: '#475569' }}>
          // mobile not supported
        </p>
        <p className="text-xs leading-loose" style={{ color: '#334155' }}>
          open this on a desktop
          <br />
          browser for the full
          <br />
          experience.
        </p>
      </div>
    </div>
  )
}
