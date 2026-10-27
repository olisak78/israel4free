import { useId, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Search, SearchX, X } from 'lucide-react'
import { searchCatalog } from '../data/datasets'
import { useLanguage, useT } from '../i18n/useLanguage'

/**
 * Prominent global search over the whole catalog. It is the primary action on
 * the homepage: a labelled combobox whose results panel lists matching
 * datasets with their publishing organization, and navigates to each dataset's
 * dedicated page on selection.
 *
 * Interaction is fully keyboard-accessible — ArrowUp/Down move the active
 * option, Enter opens it, Escape closes the panel. The results are derived
 * client-side from the mock catalog; there is no backend.
 */
export default function GlobalSearch() {
  const t = useT()
  const { language, dir } = useLanguage()
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listboxId = useId()

  const results = useMemo(() => searchCatalog(query), [query])
  const hasQuery = query.trim().length > 0
  const showPanel = open && hasQuery

  function go(path: string) {
    setOpen(false)
    navigate(path)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setOpen(false)
      return
    }
    if (!showPanel || results.length === 0) {
      if (e.key === 'ArrowDown' && hasQuery) setOpen(true)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => (i + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => (i - 1 + results.length) % results.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const hit = results[active]
      if (hit) go(hit.dataset.path)
    }
  }

  const activeOptionId =
    showPanel && results[active] ? `${listboxId}-opt-${active}` : undefined

  return (
    <div dir={dir} className="relative mx-auto mt-6 max-w-xl text-start">
      <label htmlFor={`${listboxId}-input`} className="sr-only">
        {t.search.label}
      </label>

      <div className="relative">
        <Search
          className="pointer-events-none absolute inset-y-0 start-4 my-auto h-5 w-5 text-faint"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          id={`${listboxId}-input`}
          type="search"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={activeOptionId}
          autoComplete="off"
          value={query}
          placeholder={t.search.placeholder}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            setActive(0)
          }}
          onFocus={() => hasQuery && setOpen(true)}
          onKeyDown={onKeyDown}
          className="w-full rounded-full border border-edge bg-field py-3.5 ps-12 pe-11 text-base text-content shadow-card placeholder:text-placeholder focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 [&::-webkit-search-cancel-button]:hidden"
        />
        {hasQuery && (
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setOpen(false)
              inputRef.current?.focus()
            }}
            aria-label={t.common.clearSearch}
            className="absolute inset-y-0 end-3 my-auto flex h-7 w-7 items-center justify-center rounded-full text-faint hover:bg-surface-2 hover:text-content"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {showPanel && (
        <div className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-card border border-edge bg-surface shadow-card-hover animate-fade-in">
          {results.length > 0 ? (
            <>
              <p
                className="border-b border-edge px-4 py-2 text-xs font-medium text-muted"
                aria-live="polite"
              >
                {t.search.resultsCount(results.length)}
              </p>
              <ul id={listboxId} role="listbox" aria-label={t.search.resultsLabel}>
                {results.map((hit, i) => {
                  const { dataset, organization } = hit
                  const Icon = dataset.icon
                  const title =
                    language === 'he' ? dataset.titleHe : dataset.title
                  const orgName =
                    organization &&
                    (language === 'he' ? organization.nameHe : organization.name)
                  const isActive = i === active
                  return (
                    <li key={dataset.id} role="none">
                      <button
                        type="button"
                        id={`${listboxId}-opt-${i}`}
                        role="option"
                        aria-selected={isActive}
                        onMouseEnter={() => setActive(i)}
                        onClick={() => go(dataset.path)}
                        className={`flex w-full items-center gap-3 px-4 py-2.5 text-start transition-colors motion-reduce:transition-none ${
                          isActive ? 'bg-surface-2' : 'hover:bg-surface-2'
                        }`}
                      >
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${dataset.accentBg}`}
                        >
                          <Icon
                            className={`h-4 w-4 ${dataset.accentText}`}
                            strokeWidth={2}
                            aria-hidden="true"
                          />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-content">
                            {title}
                          </span>
                          {orgName && (
                            <span className="block truncate text-xs text-muted">
                              {t.search.inOrganization} {orgName}
                            </span>
                          )}
                        </span>
                        <ChevronRight
                          className="h-4 w-4 shrink-0 text-faint rtl:-scale-x-100"
                          aria-hidden="true"
                        />
                      </button>
                    </li>
                  )
                })}
              </ul>
            </>
          ) : (
            <div className="flex flex-col items-center px-6 py-10 text-center">
              <SearchX className="h-7 w-7 text-faint" aria-hidden="true" />
              <p className="mt-2 text-sm font-semibold text-content">
                {t.search.noResultsTitle}
              </p>
              <p className="mt-1 text-sm text-muted">
                {t.search.noResultsBody(query.trim())}
              </p>
            </div>
          )}
        </div>
      )}

      {!showPanel && (
        <p className="mt-2 text-center text-xs text-muted">{t.search.hint}</p>
      )}
    </div>
  )
}
