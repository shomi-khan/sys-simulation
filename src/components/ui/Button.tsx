/**
 * src/components/ui/Button.tsx
 *
 * General-purpose button component with multiple visual variants.
 * Used for simulation controls (Start, Pause, Resume, Reset) and navigation.
 * Wraps a native <button> element — passes through all standard button props.
 */

import type React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style of the button */
  variant: 'primary' | 'secondary' | 'danger' | 'ghost'
  /** Optional icon rendered to the left of the label (lucide-react component) */
  icon?: React.ReactNode
  /** Makes the button fill its container width */
  fullWidth?: boolean
}

const variantStyles: Record<ButtonProps['variant'], string> = {
  primary:
    'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700',
  secondary:
    'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700',
  danger:
    'bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700',
  ghost:
    'bg-transparent text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800',
}

export default function Button({
  variant,
  icon,
  fullWidth = false,
  className = '',
  disabled,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-150',
        variantStyles[variant],
        fullWidth ? 'w-full' : '',
        disabled ? 'cursor-not-allowed opacity-50' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {icon}
      {children}
    </button>
  )
}
