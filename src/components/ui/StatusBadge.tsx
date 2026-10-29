import type { ReactNode } from 'react'

export type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

interface StatusBadgeProps {
  tone: BadgeTone
  label: ReactNode
  /** Render a leading status dot (text label is always present, so meaning is
   *  never conveyed by color alone). */
  dot?: boolean
  className?: string
}

// Soft tint + readable foreground, built from semantic status tokens so both
// themes stay legible. A dot reinforces the label without relying on color.
const toneClasses: Record<BadgeTone, string> = {
  success: 'bg-success/10 text-success ring-success/25',
  warning: 'bg-warning/10 text-warning ring-warning/25',
  danger: 'bg-danger/10 text-danger ring-danger/25',
  info: 'bg-brand/10 text-brand ring-brand/25',
  neutral: 'bg-surface-2 text-muted ring-edge',
}

const dotClasses: Record<BadgeTone, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-brand',
  neutral: 'bg-faint',
}

export default function StatusBadge({
  tone,
  label,
  dot = true,
  className = '',
}: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${toneClasses[tone]} ${className}`}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotClasses[tone]}`}
          aria-hidden="true"
        />
      )}
      {label}
    </span>
  )
}
