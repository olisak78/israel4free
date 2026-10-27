import type { City, TransitRoute, TransitStop } from '../types'
import { CITIES } from './cities'

/**
 * Sample transit network: stops and the routes that serve them. Stop `routes`
 * arrays and route `stops` lists are authored to cross-reference consistently
 * (a route lists stops that name it). Illustrative only — not a live schedule.
 */

const OPERATORS = {
  egged: { en: 'Egged', he: 'אגד' },
  dan: { en: 'Dan', he: 'דן' },
  metropoline: { en: 'Metropoline', he: 'מטרופולין' },
  kavim: { en: 'Kavim', he: 'קווים' },
  rail: { en: 'Israel Railways', he: 'רכבת ישראל' },
  citypass: { en: 'CityPass', he: 'סיטיפס' },
} as const

// ── Routes ──────────────────────────────────────────────────────────────────
export const MOCK_ROUTES: TransitRoute[] = [
  {
    id: 'R-480',
    number: '480',
    mode: 'bus',
    operator: OPERATORS.egged.en,
    operatorHe: OPERATORS.egged.he,
    origin: 'Tel Aviv Central',
    originHe: 'תל אביב מרכז',
    destination: 'Jerusalem Central',
    destinationHe: 'ירושלים מרכז',
    stops: ['Tel Aviv Central', 'Arlozorov Terminal', 'Latrun Junction', 'Sha’ar HaGai', 'Jerusalem Central'],
    stopsHe: ['תל אביב מרכז', 'מסוף ארלוזורוב', 'צומת לטרון', 'שער הגיא', 'ירושלים מרכז'],
    frequencyMin: 15,
  },
  {
    id: 'R-18',
    number: '18',
    mode: 'bus',
    operator: OPERATORS.dan.en,
    operatorHe: OPERATORS.dan.he,
    origin: 'Ramat Aviv',
    originHe: 'רמת אביב',
    destination: 'Jaffa Clock Tower',
    destinationHe: 'מגדל השעון יפו',
    stops: ['Ramat Aviv', 'Dizengoff Center', 'Allenby / Rothschild', 'Carmel Market', 'Jaffa Clock Tower'],
    stopsHe: ['רמת אביב', 'דיזנגוף סנטר', 'אלנבי / רוטשילד', 'שוק הכרמל', 'מגדל השעון יפו'],
    frequencyMin: 10,
  },
  {
    id: 'R-RED-TA',
    number: 'Red Line',
    mode: 'lightrail',
    operator: OPERATORS.dan.en,
    operatorHe: OPERATORS.dan.he,
    origin: 'Petah Tikva Terminal',
    originHe: 'מסוף פתח תקווה',
    destination: 'Bat Yam',
    destinationHe: 'בת ים',
    stops: ['Petah Tikva Terminal', 'Kiryat Arye', 'Allenby', 'Carmelit', 'Bat Yam'],
    stopsHe: ['מסוף פתח תקווה', 'קרית אריה', 'אלנבי', 'כרמלית', 'בת ים'],
    frequencyMin: 6,
  },
  {
    id: 'R-RAIL1',
    number: 'Line 1',
    mode: 'train',
    operator: OPERATORS.rail.en,
    operatorHe: OPERATORS.rail.he,
    origin: 'Tel Aviv HaShalom',
    originHe: 'תל אביב השלום',
    destination: 'Haifa Center',
    destinationHe: 'חיפה מרכז',
    stops: ['Tel Aviv HaShalom', 'Tel Aviv University', 'Herzliya', 'Netanya', 'Haifa Center'],
    stopsHe: ['תל אביב השלום', 'אוניברסיטת תל אביב', 'הרצליה', 'נתניה', 'חיפה מרכז'],
    frequencyMin: 30,
  },
  {
    id: 'R-394',
    number: '394',
    mode: 'bus',
    operator: OPERATORS.metropoline.en,
    operatorHe: OPERATORS.metropoline.he,
    origin: 'Tel Aviv Central',
    originHe: 'תל אביב מרכז',
    destination: 'Eilat Central',
    destinationHe: 'אילת מרכז',
    stops: ['Tel Aviv Central', 'Beer Sheva Central', 'Mitzpe Ramon', 'Eilat Central'],
    stopsHe: ['תל אביב מרכז', 'באר שבע מרכז', 'מצפה רמון', 'אילת מרכז'],
    frequencyMin: 120,
  },
  {
    id: 'R-RED-JLM',
    number: 'Red Line',
    mode: 'lightrail',
    operator: OPERATORS.citypass.en,
    operatorHe: OPERATORS.citypass.he,
    origin: 'Mount Herzl',
    originHe: 'הר הרצל',
    destination: 'Heil HaAvir',
    destinationHe: 'חיל האוויר',
    stops: ['Mount Herzl', 'Central Station', 'Jaffa Center', 'Damascus Gate', 'Heil HaAvir'],
    stopsHe: ['הר הרצל', 'התחנה המרכזית', 'מרכז העיר יפו', 'שער שכם', 'חיל האוויר'],
    frequencyMin: 8,
  },
]

// ── Stops ─────────────────────────────────────────────────────────────────
// [name, nameHe, cityKey, routes[], accessible, shelter]
const STOP_RECIPE: [string, string, keyof typeof CITIES, string[], boolean, boolean][] = [
  ['Tel Aviv Central', 'תל אביב מרכז', 'telAviv', ['480', '394'], true, true],
  ['Arlozorov Terminal', 'מסוף ארלוזורוב', 'telAviv', ['480', 'Line 1'], true, true],
  ['Dizengoff Center', 'דיזנגוף סנטר', 'telAviv', ['18'], true, true],
  ['Allenby / Rothschild', 'אלנבי / רוטשילד', 'telAviv', ['18', 'Red Line'], true, false],
  ['Carmel Market', 'שוק הכרמל', 'telAviv', ['18'], false, false],
  ['Ramat Aviv', 'רמת אביב', 'telAviv', ['18'], true, true],
  ['Jerusalem Central', 'ירושלים מרכז', 'jerusalem', ['480'], true, true],
  ['Central Station', 'התחנה המרכזית', 'jerusalem', ['Red Line'], true, true],
  ['Jaffa Center', 'מרכז העיר יפו', 'jerusalem', ['Red Line'], true, true],
  ['Mount Herzl', 'הר הרצל', 'jerusalem', ['Red Line'], true, true],
  ['Haifa Center', 'חיפה מרכז', 'haifa', ['Line 1'], true, true],
  ['Herzliya', 'הרצליה', 'herzliya', ['Line 1'], true, true],
  ['Netanya', 'נתניה', 'netanya', ['Line 1'], true, true],
  ['Beer Sheva Central', 'באר שבע מרכז', 'beerSheva', ['394'], true, true],
  ['Eilat Central', 'אילת מרכז', 'eilat', ['394'], true, false],
  ['Petah Tikva Terminal', 'מסוף פתח תקווה', 'petahTikva', ['Red Line'], true, true],
]

export const MOCK_STOPS: TransitStop[] = STOP_RECIPE.map((r, i) => {
  const [name, nameHe, cityKey, routes, accessible, shelter] = r
  const city = CITIES[cityKey] as City
  const dlat = (((i * 31) % 12) - 6) * 0.0016
  const dlng = (((i * 47) % 12) - 6) * 0.0019
  return {
    id: `${20000 + i * 7}`,
    name,
    nameHe,
    city: city.en,
    cityHe: city.he,
    lat: +(city.lat + dlat).toFixed(5),
    lng: +(city.lng + dlng).toFixed(5),
    routes,
    accessible,
    shelter,
  }
})

export const TRANSIT_ROUTE_NUMBERS = [...new Set(MOCK_ROUTES.map((r) => r.number))]
