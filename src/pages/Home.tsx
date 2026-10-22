import { useMemo } from 'react'
import { SearchX } from 'lucide-react'
import DomainCard from '../components/DomainCard'
import {
  categories,
  categoryLabel,
  datasets,
  type Filter,
} from '../data/datasets'
import { useLanguage, useT } from '../i18n/useLanguage'

interface HomeProps {
  filter: Filter
  onFilterChange: (filter: Filter) => void
}

export default function Home({ filter, onFilterChange }: HomeProps) {
  const t = useT()
  const { language } = useLanguage()

  const visible = useMemo(
    () =>
      filter === 'all'
        ? datasets
        : datasets.filter((d) => d.category === filter),
    [filter],
  )

  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: t.datasets.all },
    ...categories.map((c) => ({
      id: c.id,
      label: categoryLabel(c.id, language),
    })),
  ]

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 sm:px-8 sm:py-10">
      {/* Hero — compact, centered (direction-neutral) */}
      <section className="mb-8 text-center">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-blue-600">
          {t.hero.eyebrow}
        </p>
        <h1 className="text-balance text-3xl font-bold tracking-tight text-gray-900 sm:text-[2.5rem] sm:leading-[1.1]">
          {t.hero.titleLead}{' '}
          <span className="text-blue-600">{t.hero.titleAccent}</span>
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-gray-500">
          {t.hero.subtitle}
        </p>

        {/* Honest, derived metrics strip (no live/operational claims).
            Numbers are isolated with <bdi> so they never reorder in RTL. */}
        <dl className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
          <div className="flex items-baseline gap-1.5">
            <dt className="sr-only">{t.stats.datasets}</dt>
            <dd className="font-semibold text-gray-900">
              <bdi>{datasets.length}</bdi>
            </dd>
            <span className="text-gray-500">{t.stats.datasets}</span>
          </div>
          <span className="hidden h-4 w-px bg-gray-200 sm:block" aria-hidden="true" />
          <div className="flex items-baseline gap-1.5">
            <dt className="sr-only">{t.stats.categories}</dt>
            <dd className="font-semibold text-gray-900">
              <bdi>{categories.length}</bdi>
            </dd>
            <span className="text-gray-500">{t.stats.categories}</span>
          </div>
          <span className="hidden h-4 w-px bg-gray-200 sm:block" aria-hidden="true" />
          <div className="flex items-baseline gap-1.5">
            <dt className="sr-only">data.gov.il</dt>
            <dd className="font-medium text-gray-700">
              <bdi>data.gov.il</bdi>
            </dd>
          </div>
          <span className="hidden h-4 w-px bg-gray-200 sm:block" aria-hidden="true" />
          <div className="flex items-baseline gap-1.5">
            <dd className="font-medium text-gray-700">{t.stats.access}</dd>
          </div>
        </dl>
      </section>

      {/* Datasets — the primary focus */}
      <section aria-labelledby="datasets-heading">
        <div className="mb-5 text-center">
          <h2
            id="datasets-heading"
            className="text-lg font-semibold text-gray-900"
          >
            {t.datasets.heading}
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">{t.datasets.subheading}</p>
        </div>

        {/* Category filter — centered, kept in sync with the header navigation */}
        <div
          role="group"
          aria-label={t.datasets.filterLabel}
          className="mb-3 flex flex-wrap justify-center gap-2"
        >
          {filters.map((f) => {
            const active = filter === f.id
            return (
              <button
                key={f.id}
                type="button"
                aria-pressed={active}
                onClick={() => onFilterChange(f.id)}
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

        <p
          className="mb-6 text-center text-sm text-gray-400"
          aria-live="polite"
        >
          {t.datasets.shown(visible.length, datasets.length)}
        </p>

        {visible.length > 0 ? (
          // dir="ltr" keeps the card grid in a fixed physical order across
          // languages; each card renders its own text in the correct direction.
          <div
            dir="ltr"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
          >
            {visible.map((d) => (
              <DomainCard key={d.id} {...d} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center rounded-card border border-dashed border-gray-300 bg-white py-16 text-center">
            <SearchX className="h-8 w-8 text-gray-300" aria-hidden="true" />
            <p className="mt-3 text-sm font-medium text-gray-900">
              {t.datasets.emptyTitle}
            </p>
            <button
              type="button"
              onClick={() => onFilterChange('all')}
              className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              {t.datasets.emptyCta}
            </button>
          </div>
        )}
      </section>

      {/* Footer — centered */}
      <footer className="mt-12 flex flex-col items-center gap-1.5 border-t border-gray-200 pt-6 text-center text-xs text-gray-400">
        <span>
          {t.footer.line1Lead}{' '}
          <bdi className="text-gray-600">data.gov.il</bdi> {t.footer.line1Tail}
        </span>
        <span>{t.footer.line2}</span>
      </footer>
    </div>
  )
}
