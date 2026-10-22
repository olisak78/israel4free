import { useMemo } from 'react'
import { SearchX } from 'lucide-react'
import DomainCard from '../components/DomainCard'
import Footer from '../components/Footer'
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
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-brand">
          {t.hero.eyebrow}
        </p>
        <h1 className="text-balance text-3xl font-bold tracking-tight text-content sm:text-[2.5rem] sm:leading-[1.1]">
          {t.hero.titleLead}{' '}
          <span className="text-brand">{t.hero.titleAccent}</span>
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-muted">
          {t.hero.subtitle}
        </p>

        {/* Honest, derived metrics strip (no live/operational claims).
            Numbers are isolated with <bdi> so they never reorder in RTL. */}
        <dl className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
          <div className="flex items-baseline gap-1.5">
            <dt className="sr-only">{t.stats.datasets}</dt>
            <dd className="font-semibold text-content">
              <bdi>{datasets.length}</bdi>
            </dd>
            <span className="text-muted">{t.stats.datasets}</span>
          </div>
          <span className="hidden h-4 w-px bg-edge sm:block" aria-hidden="true" />
          <div className="flex items-baseline gap-1.5">
            <dt className="sr-only">{t.stats.categories}</dt>
            <dd className="font-semibold text-content">
              <bdi>{categories.length}</bdi>
            </dd>
            <span className="text-muted">{t.stats.categories}</span>
          </div>
          <span className="hidden h-4 w-px bg-edge sm:block" aria-hidden="true" />
          <div className="flex items-baseline gap-1.5">
            <dt className="sr-only">data.gov.il</dt>
            <dd className="font-medium text-content">
              <bdi>data.gov.il</bdi>
            </dd>
          </div>
          <span className="hidden h-4 w-px bg-edge sm:block" aria-hidden="true" />
          <div className="flex items-baseline gap-1.5">
            <dd className="font-medium text-content">{t.stats.access}</dd>
          </div>
        </dl>
      </section>

      {/* Datasets — the primary focus */}
      <section aria-labelledby="datasets-heading">
        <div className="mb-5 text-center">
          <h2
            id="datasets-heading"
            className="text-lg font-semibold text-content"
          >
            {t.datasets.heading}
          </h2>
          <p className="mt-0.5 text-sm text-muted">{t.datasets.subheading}</p>
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
                    ? 'border-brand bg-brand text-brand-fg'
                    : 'border-edge bg-surface text-muted hover:border-faint hover:text-content'
                }`}
              >
                {f.label}
              </button>
            )
          })}
        </div>

        <p
          className="mb-6 text-center text-sm text-muted"
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
          <div className="flex flex-col items-center rounded-card border border-dashed border-edge bg-surface py-16 text-center">
            <SearchX className="h-8 w-8 text-faint" aria-hidden="true" />
            <p className="mt-3 text-sm font-medium text-content">
              {t.datasets.emptyTitle}
            </p>
            <button
              type="button"
              onClick={() => onFilterChange('all')}
              className="mt-2 text-sm font-medium text-brand hover:text-brand-hover"
            >
              {t.datasets.emptyCta}
            </button>
          </div>
        )}
      </section>

      {/* Footer — centered */}
      <Footer />
    </div>
  )
}
