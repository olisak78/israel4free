import {
  Car,
  Plane,
  Landmark,
  Radio,
  Bus,
  Pill,
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

export interface Dataset {
  id: string
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
  category: CategoryId
  /** Full Tailwind classes so they survive content purging */
  accentBg: string
  accentText: string
  /** Geographic datasets surface a map-view affordance */
  geo?: boolean
}

export const datasets: Dataset[] = [
  {
    id: 'car-licenses',
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
    accentBg: 'bg-blue-50',
    accentText: 'text-blue-600',
  },
  {
    id: 'flights',
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
    accentBg: 'bg-indigo-50',
    accentText: 'text-indigo-600',
  },
  {
    id: 'atms',
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
    accentBg: 'bg-emerald-50',
    accentText: 'text-emerald-600',
    geo: true,
  },
  {
    id: 'antennas',
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
    accentBg: 'bg-amber-50',
    accentText: 'text-amber-600',
    geo: true,
  },
  {
    id: 'transit',
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
    accentBg: 'bg-cyan-50',
    accentText: 'text-cyan-600',
    geo: true,
  },
  {
    id: 'pharmacies',
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
    accentBg: 'bg-rose-50',
    accentText: 'text-rose-600',
    geo: true,
  },
]
