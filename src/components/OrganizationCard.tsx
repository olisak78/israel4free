import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import {
  datasetCountForOrganization,
  type GovernmentOrganization,
} from '../data/datasets'
import { useLanguage, useT } from '../i18n/useLanguage'

/**
 * Compact organization card for the "Browse by government organization" grid.
 * The whole card is one accessible navigation target leading to the
 * organization's page. The dataset count is derived from the catalog, never
 * hardcoded, so it stays correct as datasets are added or moved.
 */
export default function OrganizationCard({
  organization,
}: {
  organization: GovernmentOrganization
}) {
  const { language, dir } = useLanguage()
  const t = useT()

  const isHe = language === 'he'
  const name = isHe ? organization.nameHe : organization.name
  const description = isHe
    ? organization.descriptionHe
    : organization.description
  const count = datasetCountForOrganization(organization.id)
  const Icon = organization.icon

  return (
    <Link
      to={`/organizations/${organization.slug}`}
      lang={language}
      dir={dir}
      aria-label={`${name} · ${t.home.orgDatasetCount(count)}`}
      className="group flex items-start gap-3 rounded-card border border-edge bg-surface p-4 text-start shadow-card transition duration-200 hover:border-faint hover:shadow-card-hover motion-reduce:transition-none"
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${organization.accentBg}`}
      >
        <Icon
          className={`h-5 w-5 ${organization.accentText}`}
          strokeWidth={2}
          aria-hidden="true"
        />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold leading-snug text-content">
          {name}
        </span>
        <span className="mt-1 block text-xs font-medium text-brand">
          {t.home.orgDatasetCount(count)}
        </span>
        {description && (
          <span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-muted">
            {description}
          </span>
        )}
      </span>

      <ChevronRight
        className="mt-0.5 h-4 w-4 shrink-0 text-faint transition-colors group-hover:text-muted motion-reduce:transition-none rtl:-scale-x-100"
        aria-hidden="true"
      />
    </Link>
  )
}
