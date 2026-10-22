import { ChevronRight, MapPin } from 'lucide-react'
import { type Dataset } from '../data/datasets'
import { useLanguage, useT } from '../i18n/useLanguage'

type DomainCardProps = Pick<
  Dataset,
  | 'title'
  | 'titleHe'
  | 'stat'
  | 'statLabel'
  | 'statLabelHe'
  | 'icon'
  | 'accentBg'
  | 'accentText'
  | 'geo'
>

export default function DomainCard({
  title,
  titleHe,
  stat,
  statLabel,
  statLabelHe,
  icon: Icon,
  accentBg,
  accentText,
  geo,
}: DomainCardProps) {
  const { language, dir } = useLanguage()
  const t = useT()

  const isHe = language === 'he'
  // Only the active language's title is shown — the interface language already
  // tells the user which name applies, so showing both just adds height.
  const titleText = isHe ? titleHe : title
  const statLabelText = isHe ? statLabelHe : statLabel

  return (
    // lang drives the Hebrew typeface (:lang(he)); dir makes the internal layout
    // follow reading order (icon leads, chevron trails) while the grid keeps the
    // cards in a fixed physical order. The whole tile is a single control.
    <button
      type="button"
      lang={language}
      dir={dir}
      aria-label={`${t.card.exploreAria(titleText)}${geo ? ` · ${t.card.mapView}` : ''}`}
      className="group flex items-center gap-3 rounded-card border border-gray-200 bg-white p-3 text-start shadow-card transition duration-200 hover:border-gray-300 hover:shadow-card-hover motion-reduce:transition-none"
    >
      {/* Compact icon accent */}
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${accentBg}`}
      >
        <Icon className={`h-5 w-5 ${accentText}`} strokeWidth={2} aria-hidden="true" />
      </span>

      {/* Title + one concise metadata line */}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-gray-900">
          {titleText}
        </span>
        <span className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500">
          <span className="truncate">
            {/* Illustrative count from the data model — isolated so it never
                reorders in RTL. */}
            <bdi className="font-medium text-gray-600">{stat}</bdi> {statLabelText}
          </span>
          {geo && (
            <MapPin className="h-3 w-3 shrink-0 text-gray-400" aria-hidden="true" />
          )}
        </span>
      </span>

      {/* Subtle directional affordance — mirrors in RTL to always point forward */}
      <ChevronRight
        className="h-4 w-4 shrink-0 text-gray-300 transition-colors group-hover:text-gray-500 motion-reduce:transition-none rtl:-scale-x-100"
        aria-hidden="true"
      />
    </button>
  )
}
