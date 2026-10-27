import type { AtmLocation, AtmService, City } from '../types'
import { CITIES } from './cities'

/** Banks represented in the sample, with Hebrew names. */
const BANKS = [
  { en: 'Bank Hapoalim', he: 'בנק הפועלים' },
  { en: 'Bank Leumi', he: 'בנק לאומי' },
  { en: 'Israel Discount Bank', he: 'בנק דיסקונט' },
  { en: 'Mizrahi-Tefahot', he: 'מזרחי טפחות' },
  { en: 'First International Bank', he: 'הבינלאומי' },
  { en: 'Bank Yahav', he: 'בנק יהב' },
] as const

// Street names (with Hebrew) used to compose plausible addresses.
const STREETS = [
  { en: 'Dizengoff St', he: 'דיזנגוף' },
  { en: 'Herzl St', he: 'הרצל' },
  { en: 'Ben Yehuda St', he: 'בן יהודה' },
  { en: 'Jaffa St', he: 'יפו' },
  { en: 'HaNassi Blvd', he: 'הנשיא' },
  { en: 'Weizmann St', he: 'ויצמן' },
  { en: 'Rothschild Blvd', he: 'רוטשילד' },
  { en: 'Sokolov St', he: 'סוקולוב' },
]

// Deterministic generator inputs: [cityKey, bankIndex, streetIndex, houseNo,
// accessible, open24h, services]. Hardcoded (not random) so records are stable
// across refreshes and counts match exactly.
type Svc = AtmService
const RECIPE: [keyof typeof CITIES, number, number, number, boolean, boolean, Svc[]][] = [
  ['telAviv', 0, 0, 142, true, true, ['withdrawal', 'deposit', 'foreign']],
  ['telAviv', 1, 6, 45, true, true, ['withdrawal', 'deposit']],
  ['telAviv', 2, 2, 88, false, false, ['withdrawal']],
  ['jerusalem', 0, 3, 23, true, true, ['withdrawal', 'deposit', 'coins']],
  ['jerusalem', 3, 1, 67, true, false, ['withdrawal', 'foreign']],
  ['jerusalem', 4, 3, 109, false, true, ['withdrawal']],
  ['haifa', 1, 4, 12, true, true, ['withdrawal', 'deposit']],
  ['haifa', 2, 5, 34, true, false, ['withdrawal', 'coins']],
  ['haifa', 5, 4, 7, false, false, ['withdrawal']],
  ['beerSheva', 0, 1, 56, true, true, ['withdrawal', 'deposit', 'foreign']],
  ['beerSheva', 3, 7, 19, true, false, ['withdrawal']],
  ['netanya', 1, 2, 78, true, true, ['withdrawal', 'deposit']],
  ['netanya', 4, 0, 90, false, true, ['withdrawal', 'foreign']],
  ['rishon', 2, 6, 31, true, false, ['withdrawal', 'coins']],
  ['rishon', 0, 5, 14, true, true, ['withdrawal', 'deposit']],
  ['petahTikva', 3, 1, 62, false, false, ['withdrawal']],
  ['herzliya', 1, 0, 25, true, true, ['withdrawal', 'deposit', 'foreign']],
  ['ashdod', 5, 7, 48, true, false, ['withdrawal']],
  ['ramatGan', 2, 2, 103, true, true, ['withdrawal', 'deposit']],
  ['eilat', 0, 4, 9, false, true, ['withdrawal', 'foreign']],
]

// Small fixed coordinate offsets (degrees) per index, so markers spread around
// each city center without overlapping — stable, not random.
function offset(i: number): [number, number] {
  const dlat = (((i * 37) % 20) - 10) * 0.0015
  const dlng = (((i * 53) % 20) - 10) * 0.0018
  return [dlat, dlng]
}

export const MOCK_ATMS: AtmLocation[] = RECIPE.map((r, i) => {
  const [cityKey, bankIdx, streetIdx, house, accessible, open24h, services] = r
  const city = CITIES[cityKey] as City
  const bank = BANKS[bankIdx]
  const street = STREETS[streetIdx]
  const [dlat, dlng] = offset(i)
  return {
    id: `ATM-${String(i + 1).padStart(3, '0')}`,
    bank: bank.en,
    bankHe: bank.he,
    name: `${bank.en} · ${city.en} #${(i % 7) + 1}`,
    nameHe: `${bank.he} · ${city.he} #${(i % 7) + 1}`,
    address: `${street.en} ${house}`,
    addressHe: `${street.he} ${house}`,
    city: city.en,
    cityHe: city.he,
    lat: +(city.lat + dlat).toFixed(5),
    lng: +(city.lng + dlng).toFixed(5),
    accessible,
    open24h,
    services,
  }
})

/** Distinct bank names present in the data (for the filter). */
export const ATM_BANKS = BANKS.map((b) => b.en)
