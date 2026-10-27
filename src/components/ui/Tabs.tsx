import type { LucideIcon } from 'lucide-react'

export interface TabItem<T extends string = string> {
  id: T
  label: string
  icon?: LucideIcon
  /** Optional trailing count badge. */
  count?: number
}

interface TabsProps<T extends string> {
  items: TabItem<T>[]
  value: T
  onChange: (id: T) => void
  ariaLabel: string
  /** Fill the available width, splitting evenly (good for 2-up mobile tabs). */
  fill?: boolean
  className?: string
}

/**
 * Accessible segmented tab control (role=tablist). Keyboard: arrow keys move
 * between tabs. The active tab is reflected with aria-selected and a filled
 * surface — not by color alone.
 */
export default function Tabs<T extends string>({
  items,
  value,
  onChange,
  ariaLabel,
  fill = false,
  className = '',
}: TabsProps<T>) {
  function onKeyDown(e: React.KeyboardEvent, index: number) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    const dir = e.key === 'ArrowRight' ? 1 : -1
    const next = (index + dir + items.length) % items.length
    onChange(items[next].id)
  }

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`inline-flex gap-1 rounded-lg border border-edge bg-surface-2 p-1 ${fill ? 'w-full' : ''} ${className}`}
    >
      {items.map((item, i) => {
        const active = item.id === value
        const Icon = item.icon
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(item.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={`flex items-center justify-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium transition-colors motion-reduce:transition-none ${fill ? 'flex-1' : ''} ${
              active
                ? 'bg-surface text-content shadow-sm'
                : 'text-muted hover:text-content'
            }`}
          >
            {Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />}
            {item.label}
            {typeof item.count === 'number' && (
              <span
                className={`rounded-full px-1.5 text-xs font-semibold ${active ? 'bg-brand-soft text-brand-soft-fg' : 'bg-surface-3 text-muted'}`}
              >
                <bdi>{item.count}</bdi>
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
