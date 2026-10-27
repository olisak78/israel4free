import type { CellAntenna, CellTechnology, City } from '../types'
import { CITIES } from './cities'

/** Cellular operators with Hebrew names. */
const OPERATORS = [
  { en: 'Pelephone', he: 'פלאפון' },
  { en: 'Cellcom', he: 'סלקום' },
  { en: 'Partner', he: 'פרטנר' },
  { en: 'HOT Mobile', he: 'הוט מובייל' },
  { en: 'Golan Telecom', he: 'גולן טלקום' },
] as const

const STREETS = [
  { en: 'HaMelacha St', he: 'המלאכה' },
  { en: 'Industrial Zone', he: 'אזור תעשייה' },
  { en: 'HaBarzel St', he: 'הברזל' },
  { en: 'Rooftop, Main St', he: 'גג, הרחוב הראשי' },
  { en: 'Yigal Alon St', he: 'יגאל אלון' },
  { en: 'HaHaroshet St', he: 'החרושת' },
]

// Bands paired with technology for internal consistency (illustrative values).
const BAND: Record<CellTechnology, string> = {
  '3G': '2100 MHz',
  '4G': '1800 MHz',
  '5G': '3500 MHz',
}

// [cityKey, operatorIdx, streetIdx, tech, heightM, status]
type Tech = CellTechnology
const RECIPE: [keyof typeof CITIES, number, number, Tech, number, CellAntenna['status']][] = [
  ['telAviv', 0, 0, '5G', 32, 'active'],
  ['telAviv', 1, 4, '5G', 28, 'active'],
  ['telAviv', 2, 2, '4G', 24, 'active'],
  ['telAviv', 3, 3, '4G', 18, 'maintenance'],
  ['jerusalem', 0, 1, '5G', 36, 'active'],
  ['jerusalem', 1, 0, '4G', 30, 'active'],
  ['jerusalem', 4, 5, '3G', 22, 'active'],
  ['haifa', 2, 4, '5G', 40, 'active'],
  ['haifa', 0, 3, '4G', 26, 'active'],
  ['haifa', 3, 1, '4G', 20, 'planned'],
  ['beerSheva', 1, 2, '5G', 34, 'active'],
  ['beerSheva', 2, 5, '4G', 28, 'active'],
  ['netanya', 0, 0, '4G', 24, 'active'],
  ['netanya', 4, 4, '5G', 30, 'planned'],
  ['rishon', 1, 3, '4G', 22, 'active'],
  ['rishon', 2, 1, '5G', 33, 'active'],
  ['petahTikva', 0, 2, '4G', 26, 'maintenance'],
  ['herzliya', 3, 0, '5G', 29, 'active'],
  ['ashdod', 1, 5, '4G', 25, 'active'],
  ['ashdod', 2, 4, '3G', 19, 'active'],
  ['ramatGan', 0, 3, '5G', 31, 'active'],
  ['ramatGan', 4, 1, '4G', 23, 'active'],
  ['eilat', 2, 0, '4G', 27, 'active'],
  ['tiberias', 1, 2, '4G', 21, 'planned'],
]

export const MOCK_ANTENNAS: CellAntenna[] = RECIPE.map((r, i) => {
  const [cityKey, opIdx, streetIdx, technology, heightM, status] = r
  const city = CITIES[cityKey] as City
  const op = OPERATORS[opIdx]
  const street = STREETS[streetIdx]
  const dlat = (((i * 43) % 18) - 9) * 0.0013
  const dlng = (((i * 59) % 18) - 9) * 0.0016
  return {
    id: `IL-${city.en.slice(0, 2).toUpperCase()}-${String(1000 + i * 13)}`,
    operator: op.en,
    operatorHe: op.he,
    city: city.en,
    cityHe: city.he,
    address: `${street.en}`,
    addressHe: `${street.he}`,
    lat: +(city.lat + dlat).toFixed(5),
    lng: +(city.lng + dlng).toFixed(5),
    technology,
    band: BAND[technology],
    heightM,
    status,
  }
})

export const ANTENNA_OPERATORS = OPERATORS.map((o) => o.en)
