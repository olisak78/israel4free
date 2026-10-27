import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { SearchX } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  body?: string
  /** Optional action (e.g. a reset button). */
  action?: ReactNode
  className?: string
}

/**
 * Shared empty / no-results panel. Used for "no matches", "nothing yet", and
 * similar non-error states. Error and loading states compose the same shape.
 */
export default function EmptyState({
  icon: Icon = SearchX,
  title,
  body,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center rounded-card border border-dashed border-edge bg-surface px-6 py-14 text-center ${className}`}
    >
      <Icon className="h-8 w-8 text-faint" aria-hidden="true" />
      <p className="mt-3 text-sm font-semibold text-content">{title}</p>
      {body && <p className="mt-1 max-w-sm text-sm text-muted">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
