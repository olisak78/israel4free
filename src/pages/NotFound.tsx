import { Link } from 'react-router-dom'
import { Compass, Home } from 'lucide-react'
import { datasets } from '../data/datasets'
import { useLanguage, useT } from '../i18n/useLanguage'

export default function NotFound() {
  const t = useT()
  const { language } = useLanguage()
  const isHe = language === 'he'

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-6 py-20 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-card bg-brand-soft">
        <Compass className="h-7 w-7 text-brand-soft-fg" aria-hidden="true" />
      </span>
      <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-brand">
        <bdi>404</bdi>
      </p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-content sm:text-3xl">
        {t.notFound.title}
      </h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
        {t.notFound.body}
      </p>

      <Link
        to="/"
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-brand-fg transition-colors hover:bg-brand-hover"
      >
        <Home className="h-4 w-4" aria-hidden="true" />
        {t.notFound.cta}
      </Link>

      {/* Quick links back into the six tools */}
      <div className="mt-10 w-full border-t border-edge pt-6">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">
          {t.notFound.explore}
        </p>
        <ul className="flex flex-wrap justify-center gap-2">
          {datasets.map((d) => (
            <li key={d.id}>
              <Link
                to={d.path}
                className="rounded-full border border-edge bg-surface px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:border-faint hover:text-content"
              >
                {isHe ? d.titleHe : d.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
