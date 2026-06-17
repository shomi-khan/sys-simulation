/**
 * src/components/ui/Badge.tsx
 *
 * Displays a small colored label - used for difficulty levels and status indicators.
 * Color is determined by the `variant` prop, not by the caller passing raw color classes.
 * This keeps color logic centralized here instead of scattered across pages.
 */

interface BadgeProps {
  /** Text content displayed inside the badge */
  label: string
  /** Controls background and text color */
  variant:
    | 'beginner'
    | 'easy'
    | 'medium'
    | 'hard'
    | 'expert'
    | 'success'
    | 'warning'
    | 'danger'
  /** Optional extra Tailwind classes for layout adjustments */
  className?: string
}

const variantStyles: Record<BadgeProps['variant'], string> = {
  beginner: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  easy: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  hard: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  expert: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  success: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  danger: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
}

export default function Badge({ label, variant, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantStyles[variant]} ${className}`}
    >
      {label}
    </span>
  )
}
