import { ChevronDown } from 'lucide-react'

export interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  hideLabel?: boolean
  className?: string
}

/**
 * Themed wrapper around a native <select> — keyboard accessible for free, with
 * a custom chevron pinned to the reading-end edge. Native options inherit the
 * elevated surface so the dropdown is readable in both themes.
 */
export default function Select({
  id,
  label,
  value,
  onChange,
  options,
  hideLabel,
  className = '',
}: SelectProps) {
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className={
          hideLabel ? 'sr-only' : 'mb-1.5 block text-sm font-medium text-content'
        }
      >
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-lg border border-edge bg-field py-2.5 ps-3 pe-9 text-sm text-content focus:border-brand focus:outline-none"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-surface-3 text-content">
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute inset-y-0 end-3 my-auto h-4 w-4 text-faint"
          aria-hidden="true"
        />
      </div>
    </div>
  )
}
