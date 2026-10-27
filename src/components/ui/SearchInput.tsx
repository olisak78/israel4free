import { forwardRef } from 'react'
import { Search, X } from 'lucide-react'
import { useT } from '../../i18n/useLanguage'

interface SearchInputProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  onClear?: () => void
  placeholder?: string
  /** Optional submit handler — fires on Enter and on the search affordance. */
  onSubmit?: () => void
  /** Hide the visible label (still announced to screen readers). */
  hideLabel?: boolean
  inputMode?: 'text' | 'numeric' | 'search'
  className?: string
}

/**
 * Themed search field with a leading icon and a clear button. Logical padding
 * (ps/pe) keeps the icon on the reading-start edge and the clear button on the
 * reading-end edge in both LTR and RTL.
 */
const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  function SearchInput(
    {
      id,
      label,
      value,
      onChange,
      onClear,
      placeholder,
      onSubmit,
      hideLabel,
      inputMode = 'search',
      className = '',
    },
    ref,
  ) {
    const t = useT()

    return (
      <div className={className}>
        <label
          htmlFor={id}
          className={
            hideLabel
              ? 'sr-only'
              : 'mb-1.5 block text-sm font-medium text-content'
          }
        >
          {label}
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-faint"
            aria-hidden="true"
          />
          <input
            ref={ref}
            id={id}
            type="search"
            inputMode={inputMode}
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && onSubmit) {
                e.preventDefault()
                onSubmit()
              }
            }}
            className="w-full rounded-lg border border-edge bg-field py-2.5 ps-9 pe-9 text-sm text-content placeholder:text-placeholder focus:border-brand focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange('')
                onClear?.()
              }}
              aria-label={t.common.clearSearch}
              className="absolute inset-y-0 end-2 my-auto flex h-6 w-6 items-center justify-center rounded text-faint hover:text-content"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    )
  },
)

export default SearchInput
