import { useMemo, useState } from 'react'
import { SearchX } from 'lucide-react'
import DomainCard from '../components/DomainCard'
import {
  categories,
  datasets,
  type CategoryId,
} from '../data/datasets'

type Filter = CategoryId | 'all'

export default function Home() {
  const [filter, setFilter] = useState<Filter>('all')

  const visible = useMemo(
    () =>
      filter === 'all'
        ? datasets
        : datasets.filter((d) => d.category === filter),
    [filter],
  )

  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: 'All' },
    ...categories.map((c) => ({ id: c.id, label: c.label })),
  ]

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 sm:px-8 sm:py-10">
      {/* Hero — compact, single purpose */}
      <section className="mb-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-blue-600">
          Israeli public data
        </p>
        <h1 className="text-balance text-3xl font-bold tracking-tight text-gray-900 sm:text-[2.5rem] sm:leading-[1.1]">
          Israel Open Data, <span className="text-blue-600">made usable</span>
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-gray-500">
          A fast, clean interface over Israel's public government datasets —
          search vehicles, track flights, find ATMs, and more, all in one place.
        </p>

        {/* Honest, derived metrics strip (no live/operational claims) */}
        <dl className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <div className="flex items-baseline gap-1.5">
            <dt className="sr-only">Datasets</dt>
            <dd className="font-semibold text-gray-900">{datasets.length}</dd>
            <span className="text-gray-500">datasets</span>
          </div>
          <span className="hidden h-4 w-px bg-gray-200 sm:block" aria-hidden="true" />
          <div className="flex items-baseline gap-1.5">
            <dt className="sr-only">Categories</dt>
            <dd className="font-semibold text-gray-900">{categories.length}</dd>
            <span className="text-gray-500">categories</span>
          </div>
          <span className="hidden h-4 w-px bg-gray-200 sm:block" aria-hidden="true" />
          <div className="flex items-baseline gap-1.5">
            <dt className="sr-only">Source</dt>
            <dd className="font-medium text-gray-700">data.gov.il</dd>
          </div>
          <span className="hidden h-4 w-px bg-gray-200 sm:block" aria-hidden="true" />
          <div className="flex items-baseline gap-1.5">
            <dt className="sr-only">Access</dt>
            <dd className="font-medium text-gray-700">Free · no sign-up</dd>
          </div>
        </dl>
      </section>

      {/* Datasets — the primary focus */}
      <section aria-labelledby="datasets-heading">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="datasets-heading"
              className="text-lg font-semibold text-gray-900"
            >
              Browse datasets
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">
              Pick a category to start exploring
            </p>
          </div>
          <p className="text-sm text-gray-400" aria-live="polite">
            {visible.length} of {datasets.length} shown
          </p>
        </div>

        {/* Category filter */}
        <div
          role="group"
          aria-label="Filter datasets by category"
          className="mb-6 flex flex-wrap gap-2"
        >
          {filters.map((f) => {
            const active = filter === f.id
            return (
              <button
                key={f.id}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(f.id)}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition duration-150 motion-reduce:transition-none ${
                  active
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-900'
                }`}
              >
                {f.label}
              </button>
            )
          })}
        </div>

        {visible.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((d) => (
              <DomainCard key={d.id} {...d} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center rounded-card border border-dashed border-gray-300 bg-white py-16 text-center">
            <SearchX className="h-8 w-8 text-gray-300" aria-hidden="true" />
            <p className="mt-3 text-sm font-medium text-gray-900">
              No datasets in this category yet
            </p>
            <button
              type="button"
              onClick={() => setFilter('all')}
              className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Show all datasets
            </button>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="mt-12 flex flex-col items-start justify-between gap-2 border-t border-gray-200 pt-6 text-xs text-gray-400 sm:flex-row sm:items-center">
        <span>
          Data sourced from <span className="text-gray-600">data.gov.il</span> ·
          Israel Open Government Data
        </span>
        <span>An independent open-source project</span>
      </footer>
    </div>
  )
}
