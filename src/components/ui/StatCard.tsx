import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon?: LucideIcon
  /** Optional accent for the icon chip (full Tailwind classes). */
  accentBg?: string
  accentText?: string
  /** Small caption under the value (e.g. a unit or qualifier). */
  hint?: string
}

/**
 * Compact metric tile for summary strips. The numeric value is isolated with
 * <bdi> so it never reorders inside RTL text.
 */
export default function StatCard({
  label,
  value,
  icon: Icon,
  accentBg = 'bg-surface-2',
  accentText = 'text-muted',
  hint,
}: StatCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-card border border-edge bg-surface p-3 shadow-card">
      {Icon && (
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${accentBg}`}
        >
          <Icon className={`h-5 w-5 ${accentText}`} aria-hidden="true" />
        </span>
      )}
      <div className="min-w-0">
        <div className="text-xl font-bold leading-tight text-content">
          <bdi>{value}</bdi>
        </div>
        <div className="truncate text-xs text-muted">{label}</div>
        {hint && <div className="truncate text-[0.7rem] text-faint">{hint}</div>}
      </div>
    </div>
  )
}
