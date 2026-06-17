'use client'

/**
 * src/components/ui/Terminal.tsx
 *
 * Scrolling log terminal that displays real-time simulation events.
 * Each log entry has a timestamp, severity level, and message.
 *
 * WHY THIS EXISTS:
 * The terminal gives the user a detailed narrative of what is happening
 * inside their architecture during simulation - cache hits, overloads,
 * budget warnings, scaling events. It makes the simulation feel alive.
 *
 * Auto-scrolls to the latest entry when new logs are added.
 * Fixed height with overflow-y scroll.
 */

import { useEffect, useRef } from 'react'
import type { LogEntry } from '@/types'

interface TerminalProps {
  /** Array of log entries to display - new entries appended at bottom */
  logs: LogEntry[]
  /** Height of the terminal container - default 'h-48' */
  heightClass?: string
}

const levelConfig: Record<LogEntry['level'], { emoji: string; color: string }> = {
  system: { emoji: '⚙️', color: 'text-slate-400' },
  info: { emoji: 'ℹ️', color: 'text-blue-400' },
  warn: { emoji: '⚠️', color: 'text-amber-400' },
  critical: { emoji: '❌', color: 'text-red-400' },
  success: { emoji: '✅', color: 'text-green-400' },
}

function formatSecond(second: number): string {
  return String(second).padStart(2, '0')
}

export default function Terminal({ logs, heightClass = 'h-48' }: TerminalProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = scrollRef.current

    if (container) {
      container.scrollTop = container.scrollHeight
    }
  }, [logs])

  return (
    <div
      ref={scrollRef}
      className={`overflow-y-auto rounded-xl bg-slate-900 p-3 font-mono text-xs ${heightClass}`}
    >
      {logs.map((log, index) => {
        const { emoji, color } = levelConfig[log.level]

        return (
          <div key={`${log.second}-${index}`} className={`${color} leading-relaxed`}>
            [{formatSecond(log.second)}] {emoji} [{log.level.toUpperCase()}]{' '}
            {log.message}
          </div>
        )
      })}
    </div>
  )
}
