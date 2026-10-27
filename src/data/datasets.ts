import {
  Car,
  Plane,
  Landmark,
  Radio,
  Bus,
  Pill,
  Building2,
  HeartPulse,
  RadioTower,
  type LucideIcon,
} from 'lucide-react'
import type { Language } from '../i18n/translations'

export type CategoryId = 'transport' | 'locations' | 'infrastructure'

/** Active dataset filter: a specific category, or all datasets. */
export type Filter = CategoryId | 'all'

export interface Category {
  id: CategoryId
  label: string
  /** Hebrew label */
  labelHe: string
}

export const categories: Category[] = [
  { id: 'transport', label: 'Transport', labelHe: 'תחבורה' },
  { id: 'locations', label: 'Locations', labelHe: 'מיקומים' },
  { id: 'infrastructure', label: 'Infrastructure', labelHe: 'תשתיות' },
]

/** Localized label for a category id. */
export function categoryLabel(id: CategoryId, language: Language): string {
  const category = categories.find((c) => c.id === id)
  if (!category) return id
  return language === 'he' ? category.labelHe : category.label
}

/**
 * A government organization that publishes one or more datasets.
 *
 * These are illustrative mock records — names and relationships are defined
 * here, not derived from verified source metadata. When a real data.gov.il
 * integration lands, organization records (and the `organizationId` on each
 * dataset) should come from that metadata instead. The accent classes mirror
 * the dataset cards' convention (full Tailwind classes, purge-safe).
 */
export interface GovernmentOrganization {
  id: string
  /** URL slug, e.g. "ministry-of-transport". */
  slug: string
  name: string
  /** Hebrew name */
  nameHe: string
  /** Short, optional description */
  description: string
  /** Hebrew description */
  descriptionHe: string
  /** Simple, consistent icon — not an official logo. */
  icon: LucideIcon
  accentBg: string
  accentText: string
}

export const organizations: GovernmentOrganization[] = [
  {
    id: 'ministry-of-transport',
    slug: 'ministry-of-transport',
    name: 'Ministry of Transport and Road Safety',
    nameHe: 'משרד התחבורה והבטיחות בדרכים',
    description:
      'Vehicle registration and public transport data for roads and rail across Israel.',
    descriptionHe:
      'נתוני רישוי רכב ותחבורה ציבורית לכבישים ולמסילות ברחבי ישראל.',
    icon: Building2,
    accentBg: 'bg-blue-50 dark:bg-blue-500/15',
    accentText: 'text-blue-600 dark:text-blue-400',
  },
  {
    id: 'ministry-of-health',
    slug: 'ministry-of-health',
    name: 'Ministry of Health',
    nameHe: 'משרד הבריאות',
    description: 'Public health services, including pharmacies and dispensaries.',
    descriptionHe: 'שירותי בריאות הציבור, לרבות בתי מרקחת ובתי מרקחת תורנים.',
    icon: HeartPulse,
    accentBg: 'bg-rose-50 dark:bg-rose-500/15',
    accentText: 'text-rose-600 dark:text-rose-400',
  },
  {
    id: 'bank-of-israel',
    slug: 'bank-of-israel',
    name: 'Bank of Israel',
    nameHe: 'בנק ישראל',
    description: "Israel's central bank — banking infrastructure such as ATMs.",
    descriptionHe: 'הבנק המרכזי של ישראל — תשתיות בנקאות כגון כספומטים.',
    icon: Landmark,
    accentBg: 'bg-emerald-50 dark:bg-emerald-500/15',
    accentText: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    id: 'ministry-of-communications',
    slug: 'ministry-of-communications',
    name: 'Ministry of Communications',
    nameHe: 'משרד התקשורת',
    description: 'Telecommunications infrastructure, including cellular networks.',
    descriptionHe: 'תשתיות תקשורת, לרבות רשתות סלולריות.',
    icon: RadioTower,
    accentBg: 'bg-amber-50 dark:bg-amber-500/15',
    accentText: 'text-amber-600 dark:text-amber-400',
  },
  {
    id: 'israel-airports-authority',
    slug: 'israel-airports-authority',
    name: 'Israel Airports Authority',
    nameHe: 'רשות שדות התעופה',
    description: 'Civil aviation and airport operations, including flight data.',
    descriptionHe: 'תעופה אזרחית ותפעול שדות תעופה, לרבות נתוני טיסות.',
    icon: Plane,
    accentBg: 'bg-indigo-50 dark:bg-indigo-500/15',
    accentText: 'text-indigo-600 dark:text-indigo-400',
  },
]

/** Localized organization name for an id. */
export function organizationName(id: string, language: Language): string {
  const org = organizations.find((o) => o.id === id)
  if (!org) return id
  return language === 'he' ? org.nameHe : org.name
}

/** Look up an organization by its URL slug. */
export function getOrganizationBySlug(
  slug: string,
): GovernmentOrganization | undefined {
  return organizations.find((o) => o.slug === slug)
}

export interface Dataset {
  id: string
  /** Dedicated landing-page route, e.g. "/car-licenses". */
  path: string
  title: string
  /** Hebrew name as published by the source dataset */
  titleHe: string
  description: string
  /** Hebrew description */
  descriptionHe: string
  /** Illustrative record count — representative figures, not live data */
  stat: string
  statLabel: string
  /** Hebrew stat label */
  statLabelHe: string
  icon: LucideIcon
  /** Primary publishing topic. The header navigation and topic filter use this. */
  category: CategoryId
  /** Primary publishing organization. */
  organizationId: string
  /**
   * Additional topic memberships beyond the primary `category`. A dataset may
   * belong to several topics without being duplicated. Empty/absent means the
   * dataset belongs only to its primary category.
   */
  extraTopics?: CategoryId[]
  /** Free-text search keywords (English), beyond the title/description. */
  keywords?: string[]
  /** Free-text search keywords (Hebrew). */
  keywordsHe?: string[]
  /** Full Tailwind classes so they survive content purging */
  accentBg: string
  accentText: string
  /** Geographic datasets surface a map-view affordance */
  geo?: boolean
}

export const datasets: Dataset[] = [
  {
    id: 'car-licenses',
    path: '/car-licenses',
    title: 'Car Licenses',
    titleHe: 'רישוי רכב',
    description:
      'Look up any registered vehicle by plate number — make, model, year, owner type, and current registration status.',
    descriptionHe:
      'איתור כל רכב רשום לפי מספר רישוי — יצרן, דגם, שנה, סוג בעלות וסטטוס רישוי נוכחי.',
    stat: '3.2M',
    statLabel: 'vehicles',
    statLabelHe: 'רכבים',
    icon: Car,
    category: 'transport',
    organizationId: 'ministry-of-transport',
    keywords: ['vehicle', 'plate', 'registration', 'license', 'car'],
    keywordsHe: ['רכב', 'רישוי', 'מספר רישוי', 'לוחית'],
    accentBg: 'bg-blue-50 dark:bg-blue-500/15',
    accentText: 'text-blue-600 dark:text-blue-400',
  },
  {
    id: 'flights',
    path: '/flights',
    title: 'Flights',
    titleHe: 'טיסות',
    description:
      'Browse departures and arrivals at Israeli airports. Filter by date, airline, and destination.',
    descriptionHe:
      'עיון בהמראות ובנחיתות בנמלי התעופה בישראל. סינון לפי תאריך, חברת תעופה ויעד.',
    stat: '142',
    statLabel: 'today',
    statLabelHe: 'היום',
    icon: Plane,
    category: 'transport',
    organizationId: 'israel-airports-authority',
    keywords: ['flight', 'airport', 'departure', 'arrival', 'airline', 'aviation'],
    keywordsHe: ['טיסה', 'שדה תעופה', 'המראה', 'נחיתה', 'חברת תעופה'],
    accentBg: 'bg-indigo-50 dark:bg-indigo-500/15',
    accentText: 'text-indigo-600 dark:text-indigo-400',
  },
  {
    id: 'atms',
    path: '/atm-locations',
    title: 'ATM Locations',
    titleHe: 'כספומטים',
    description:
      'Find ATM branches from every Israeli bank on an interactive map. Filter by bank, city, or location.',
    descriptionHe:
      'איתור כספומטים מכל הבנקים בישראל על גבי מפה אינטראקטיבית. סינון לפי בנק, עיר או מיקום.',
    stat: '2,847',
    statLabel: 'branches',
    statLabelHe: 'סניפים',
    icon: Landmark,
    category: 'locations',
    organizationId: 'bank-of-israel',
    extraTopics: ['infrastructure'],
    keywords: ['atm', 'cash', 'bank', 'withdrawal', 'money'],
    keywordsHe: ['כספומט', 'מזומן', 'בנק', 'משיכה'],
    accentBg: 'bg-emerald-50 dark:bg-emerald-500/15',
    accentText: 'text-emerald-600 dark:text-emerald-400',
    geo: true,
  },
  {
    id: 'antennas',
    path: '/cell-antennas',
    title: 'Cell Antennas',
    titleHe: 'אנטנות סלולר',
    description:
      'Explore the cellular antenna infrastructure across Israel. Filter by operator, frequency band, and region.',
    descriptionHe:
      'חקירת תשתית האנטנות הסלולריות ברחבי ישראל. סינון לפי מפעיל, תחום תדר ואזור.',
    stat: '47,231',
    statLabel: 'antennas',
    statLabelHe: 'אנטנות',
    icon: Radio,
    category: 'infrastructure',
    organizationId: 'ministry-of-communications',
    keywords: ['antenna', 'cellular', 'cell', 'network', '5g', 'telecom'],
    keywordsHe: ['אנטנה', 'סלולר', 'רשת', 'תקשורת'],
    accentBg: 'bg-amber-50 dark:bg-amber-500/15',
    accentText: 'text-amber-600 dark:text-amber-400',
    geo: true,
  },
  {
    id: 'transit',
    path: '/public-transit',
    title: 'Public Transit',
    titleHe: 'תחבורה ציבורית',
    description:
      'Bus lines, train routes, and stops countrywide. Search by line number or address to find the nearest stop.',
    descriptionHe:
      'קווי אוטובוס, מסלולי רכבת ותחנות בכל הארץ. חיפוש לפי מספר קו או כתובת לאיתור התחנה הקרובה.',
    stat: '12,500',
    statLabel: 'stops',
    statLabelHe: 'תחנות',
    icon: Bus,
    category: 'transport',
    organizationId: 'ministry-of-transport',
    extraTopics: ['locations'],
    keywords: ['bus', 'train', 'transit', 'route', 'stop', 'light rail'],
    keywordsHe: ['אוטובוס', 'רכבת', 'תחבורה', 'קו', 'תחנה', 'רכבת קלה'],
    accentBg: 'bg-cyan-50 dark:bg-cyan-500/15',
    accentText: 'text-cyan-600 dark:text-cyan-400',
    geo: true,
  },
  {
    id: 'pharmacies',
    path: '/pharmacies',
    title: 'Pharmacies',
    titleHe: 'בתי מרקחת',
    description:
      'Locate pharmacies, check opening hours, and find on-call dispensaries open outside regular hours.',
    descriptionHe:
      'איתור בתי מרקחת, בדיקת שעות פתיחה ומציאת בתי מרקחת תורנים הפתוחים מחוץ לשעות הרגילות.',
    stat: '2,100',
    statLabel: 'branches',
    statLabelHe: 'סניפים',
    icon: Pill,
    category: 'locations',
    organizationId: 'ministry-of-health',
    keywords: ['pharmacy', 'medicine', 'drug', 'health', 'dispensary'],
    keywordsHe: ['בית מרקחת', 'תרופה', 'בריאות', 'תורן'],
    accentBg: 'bg-rose-50 dark:bg-rose-500/15',
    accentText: 'text-rose-600 dark:text-rose-400',
    geo: true,
  },
]

/**
 * Curated list of popular datasets, by id — configurable independently of the
 * full catalog. Later this could be driven by real usage statistics. Order is
 * meaningful (most prominent first); unknown ids are ignored.
 */
export const POPULAR_DATASET_IDS: string[] = [
  'car-licenses',
  'flights',
  'atms',
  'transit',
]

/** Resolve the popular dataset ids to records, preserving configured order. */
export function popularDatasets(): Dataset[] {
  return POPULAR_DATASET_IDS.map((id) => datasets.find((d) => d.id === id)).filter(
    (d): d is Dataset => Boolean(d),
  )
}

/** The organization that publishes a dataset, if known. */
export function organizationForDataset(
  dataset: Dataset,
): GovernmentOrganization | undefined {
  return organizations.find((o) => o.id === dataset.organizationId)
}

/** Datasets published by an organization (derived — no hardcoded counts). */
export function datasetsForOrganization(organizationId: string): Dataset[] {
  return datasets.filter((d) => d.organizationId === organizationId)
}

/** Number of datasets an organization publishes (derived from the catalog). */
export function datasetCountForOrganization(organizationId: string): number {
  return datasetsForOrganization(organizationId).length
}

/** Every topic a dataset belongs to (primary category + any extra topics). */
export function topicsForDataset(dataset: Dataset): CategoryId[] {
  return [...new Set<CategoryId>([dataset.category, ...(dataset.extraTopics ?? [])])]
}

/** Datasets that belong to a topic, derived from each dataset's membership. */
export function datasetsForTopic(topic: CategoryId): Dataset[] {
  return datasets.filter((d) => topicsForDataset(d).includes(topic))
}

/**
 * A single global-search hit: the matched dataset plus its organization (when
 * known), so a result can identify both.
 */
export interface SearchResult {
  dataset: Dataset
  organization?: GovernmentOrganization
}

/**
 * Client-side search across the catalog — matches a dataset by its name,
 * description, publishing organization, topic, or keywords, in either language.
 * No backend; this is a simple substring match over the mock catalog.
 */
export function searchCatalog(query: string): SearchResult[] {
  const q = query.trim().toLowerCase()
  if (!q) return []

  return datasets
    .filter((d) => {
      const org = organizationForDataset(d)
      const topics = topicsForDataset(d)
      const haystack = [
        d.title,
        d.titleHe,
        d.description,
        d.descriptionHe,
        org?.name ?? '',
        org?.nameHe ?? '',
        ...topics.flatMap((t) => {
          const c = categories.find((cat) => cat.id === t)
          return c ? [c.label, c.labelHe] : []
        }),
        ...(d.keywords ?? []),
        ...(d.keywordsHe ?? []),
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
    .map((dataset) => ({
      dataset,
      organization: organizationForDataset(dataset),
    }))
}
