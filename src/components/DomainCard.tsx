import { ArrowRight, MapPin } from 'lucide-react'
import { categoryLabels, type Dataset } from '../data/datasets'

type DomainCardProps = Pick<
  Dataset,
  | 'title'
  | 'titleHe'
  | 'description'
  | 'stat'
  | 'statLabel'
  | 'icon'
  | 'category'
  | 'accentBg'
  | 'accentText'
  | 'geo'
>

export default function DomainCard({
  title,
  titleHe,
  description,
  stat,
  statLabel,
  icon: Icon,
  category,
  accentBg,
  accentText,
  geo,
}: DomainCardProps) {
  return (
    <button
      type="button"
      aria-label={`Explore the ${title} dataset`}
      className="group flex h-full flex-col rounded-card border border-gray-200 bg-white p-5 text-left shadow-card transition duration-200 hover:border-gray-300 hover:shadow-card-hover motion-reduce:transition-none"
    >
      {/* Coherent header: icon accent · category · stat */}
      <div className="mb-4 flex items-start justify-between">
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${accentBg}`}
        >
          <Icon className={`h-5 w-5 ${accentText}`} strokeWidth={2} />
        </span>
        <div className="text-right">
          <div className="text-lg font-semibold leading-none text-gray-900">
            {stat}
          </div>
          <div className="mt-1 text-xs text-gray-400">{statLabel}</div>
        </div>
      </div>

      {/* Title + Hebrew name */}
      <div className="mb-1.5 flex items-baseline gap-2">
        <h3 className="text-base font-semibold leading-snug text-gray-900">
          {title}
        </h3>
        <span lang="he" dir="rtl" className="font-hebrew text-sm text-gray-400">
          {titleHe}
        </span>
      </div>

      <p className="flex-1 text-sm leading-relaxed text-gray-500">{description}</p>

      {/* Footer: category + geo cue · explore */}
      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
            {categoryLabels[category]}
          </span>
          {geo && (
            <span className="inline-flex items-center gap-1 text-xs text-gray-400">
              <MapPin className="h-3 w-3" aria-hidden="true" />
              Map view
            </span>
          )}
        </div>
        <span
          className={`inline-flex items-center gap-1 text-sm font-medium ${accentText} transition-all group-hover:gap-1.5 motion-reduce:transition-none`}
        >
          Explore
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
      </div>
    </button>
  )
}
