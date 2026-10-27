import type { City, DayHours, Pharmacy } from '../types'
import { CITIES } from './cities'

/** Pharmacy chains with Hebrew names. */
const CHAINS = [
  { en: 'Super-Pharm', he: 'סופר-פארם' },
  { en: 'Be Pharm', he: 'בי פארם' },
  { en: 'Good Pharm', he: 'גוד פארם' },
  { en: 'New Pharm', he: 'ניו-פארם' },
  { en: 'Independent', he: 'עצמאי' },
] as const

const STREETS = [
  { en: 'Allenby St', he: 'אלנבי' },
  { en: 'King George St', he: 'קינג ג׳ורג׳' },
  { en: 'Ben Gurion Blvd', he: 'שדרות בן גוריון' },
  { en: 'Jaffa St', he: 'יפו' },
  { en: 'Herzl St', he: 'הרצל' },
  { en: 'Weizmann St', he: 'ויצמן' },
  { en: 'Bialik St', he: 'ביאליק' },
]

// Hours templates, index 0 = Sunday … 6 = Saturday.
const H = (open: string, close: string): DayHours => ({ open, close })
const STANDARD: (DayHours | null)[] = [
  H('08:00', '22:00'), // Sun
  H('08:00', '22:00'), // Mon
  H('08:00', '22:00'), // Tue
  H('08:00', '22:00'), // Wed
  H('08:00', '22:00'), // Thu
  H('08:00', '15:00'), // Fri
  null, // Sat
]
const ONCALL: (DayHours | null)[] = [
  H('08:00', '24:00'),
  H('08:00', '24:00'),
  H('08:00', '24:00'),
  H('08:00', '24:00'),
  H('08:00', '24:00'),
  H('08:00', '16:00'),
  H('20:00', '24:00'), // open Saturday night
]

// [cityKey, chainIdx, streetIdx, house, phoneTail, accessible, onCall]
const RECIPE: [keyof typeof CITIES, number, number, number, string, boolean, boolean][] = [
  ['telAviv', 0, 0, 56, '03-620-1140', true, true],
  ['telAviv', 1, 2, 12, '03-511-8820', true, false],
  ['telAviv', 4, 6, 31, '03-528-4417', false, false],
  ['jerusalem', 0, 3, 24, '02-623-9900', true, true],
  ['jerusalem', 2, 1, 88, '02-500-7781', true, false],
  ['jerusalem', 3, 4, 17, '02-644-2210', false, false],
  ['haifa', 0, 5, 9, '04-862-3310', true, true],
  ['haifa', 1, 4, 44, '04-810-5560', true, false],
  ['beerSheva', 0, 1, 61, '08-623-8890', true, true],
  ['beerSheva', 3, 3, 28, '08-641-1120', false, false],
  ['netanya', 2, 0, 73, '09-882-4450', true, false],
  ['netanya', 1, 6, 5, '09-861-9930', true, true],
  ['rishon', 0, 2, 40, '03-954-7710', true, false],
  ['petahTikva', 4, 5, 19, '03-931-2240', false, false],
  ['herzliya', 1, 4, 22, '09-957-6680', true, true],
  ['ashdod', 2, 3, 67, '08-856-3300', true, false],
  ['ramatGan', 0, 1, 14, '03-752-8890', true, false],
  ['eilat', 3, 0, 8, '08-637-4420', true, true],
]

export const MOCK_PHARMACIES: Pharmacy[] = RECIPE.map((r, i) => {
  const [cityKey, chainIdx, streetIdx, house, phone, accessible, onCall] = r
  const city = CITIES[cityKey] as City
  const chain = CHAINS[chainIdx]
  const street = STREETS[streetIdx]
  const dlat = (((i * 29) % 16) - 8) * 0.0014
  const dlng = (((i * 41) % 16) - 8) * 0.0017
  const isIndependent = chain.en === 'Independent'
  return {
    id: `PH-${String(i + 1).padStart(3, '0')}`,
    name: isIndependent
      ? `${street.en} Pharmacy`
      : `${chain.en} ${city.en}`,
    nameHe: isIndependent
      ? `בית מרקחת ${street.he}`
      : `${chain.he} ${city.he}`,
    chain: chain.en,
    chainHe: chain.he,
    address: `${street.en} ${house}`,
    addressHe: `${street.he} ${house}`,
    city: city.en,
    cityHe: city.he,
    phone,
    lat: +(city.lat + dlat).toFixed(5),
    lng: +(city.lng + dlng).toFixed(5),
    accessible,
    onCall,
    hours: onCall ? ONCALL : STANDARD,
  }
})

export const PHARMACY_CHAINS = CHAINS.map((c) => c.en)
