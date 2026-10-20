import {
  Car,
  Plane,
  Landmark,
  Radio,
  Bus,
  Pill,
  type LucideIcon,
} from 'lucide-react'

export type CategoryId = 'transport' | 'locations' | 'infrastructure'

export interface Category {
  id: CategoryId
  label: string
}

export const categories: Category[] = [
  { id: 'transport', label: 'Transport' },
  { id: 'locations', label: 'Locations' },
  { id: 'infrastructure', label: 'Infrastructure' },
]

export const categoryLabels: Record<CategoryId, string> = Object.fromEntries(
  categories.map((c) => [c.id, c.label]),
) as Record<CategoryId, string>

export interface Dataset {
  id: string
  title: string
  /** Hebrew name as published by the source dataset */
  titleHe: string
  description: string
  /** Illustrative record count — representative figures, not live data */
  stat: string
  statLabel: string
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
    stat: '3.2M',
    statLabel: 'vehicles',
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
    stat: '142',
    statLabel: 'today',
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
    stat: '2,847',
    statLabel: 'branches',
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
    stat: '47,231',
    statLabel: 'antennas',
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
    stat: '12,500',
    statLabel: 'stops',
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
    stat: '2,100',
    statLabel: 'branches',
    icon: Pill,
    category: 'locations',
    accentBg: 'bg-rose-50',
    accentText: 'text-rose-600',
    geo: true,
  },
]
