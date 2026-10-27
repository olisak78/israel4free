import type { Airport, Flight, FlightStatus } from '../types'

/** Israeli airports represented in the sample. */
export const AIRPORTS: Airport[] = [
  { code: 'TLV', name: 'Ben Gurion', nameHe: 'נתב״ג', city: 'Tel Aviv', cityHe: 'תל אביב' },
  { code: 'ETM', name: 'Ramon', nameHe: 'רמון', city: 'Eilat', cityHe: 'אילת' },
  { code: 'HFA', name: 'Haifa', nameHe: 'חיפה', city: 'Haifa', cityHe: 'חיפה' },
]

// Airlines with Hebrew names and their flight-number prefixes.
const AIRLINES = {
  LY: { en: 'El Al', he: 'אל על' },
  IZ: { en: 'Arkia', he: 'ארקיע' },
  '6H': { en: 'Israir', he: 'ישראייר' },
  W6: { en: 'Wizz Air', he: 'ויז אייר' },
  FR: { en: 'Ryanair', he: 'ריינאייר' },
  LH: { en: 'Lufthansa', he: 'לופטהנזה' },
  TK: { en: 'Turkish Airlines', he: 'טורקיש' },
  A3: { en: 'Aegean', he: 'אגאן' },
  U2: { en: 'easyJet', he: 'איזיג׳ט' },
  EK: { en: 'Emirates', he: 'אמירויות' },
} as const

const CITIES_ABROAD = {
  JFK: { en: 'New York', he: 'ניו יורק' },
  LHR: { en: 'London', he: 'לונדון' },
  CDG: { en: 'Paris', he: 'פריז' },
  FRA: { en: 'Frankfurt', he: 'פרנקפורט' },
  IST: { en: 'Istanbul', he: 'איסטנבול' },
  ATH: { en: 'Athens', he: 'אתונה' },
  DXB: { en: 'Dubai', he: 'דובאי' },
  LCA: { en: 'Larnaca', he: 'לרנקה' },
  AMS: { en: 'Amsterdam', he: 'אמסטרדם' },
  BCN: { en: 'Barcelona', he: 'ברצלונה' },
  VIE: { en: 'Vienna', he: 'וינה' },
  TLV: { en: 'Tel Aviv', he: 'תל אביב' },
} as const

type AirlineCode = keyof typeof AIRLINES
type CityCode = keyof typeof CITIES_ABROAD

// Authoring tuple: [airport, direction, airline, number, cityCode, scheduled,
// estimated, terminal, gate, status]. Times are "HH:MM"; estimated differs from
// scheduled only for delayed flights.
type Row = [
  string,
  'departure' | 'arrival',
  AirlineCode,
  string,
  CityCode,
  string,
  string,
  string,
  string,
  FlightStatus,
]

const ROWS: Row[] = [
  // TLV departures
  ['TLV', 'departure', 'LY', '001', 'JFK', '00:40', '00:40', '3', 'B7', 'scheduled'],
  ['TLV', 'departure', 'LY', '315', 'LHR', '06:15', '06:15', '3', 'C2', 'boarding'],
  ['TLV', 'departure', 'U2', '2074', 'CDG', '07:05', '07:35', '1', 'A4', 'delayed'],
  ['TLV', 'departure', 'LH', '687', 'FRA', '08:20', '08:20', '3', 'B4', 'departed'],
  ['TLV', 'departure', 'TK', '785', 'IST', '09:10', '09:10', '3', 'C9', 'scheduled'],
  ['TLV', 'departure', 'A3', '931', 'ATH', '10:45', '10:45', '1', 'A1', 'scheduled'],
  ['TLV', 'departure', 'EK', '934', 'DXB', '11:30', '11:30', '3', 'D1', 'scheduled'],
  ['TLV', 'departure', 'W6', '4412', 'VIE', '12:55', '13:40', '1', 'A8', 'delayed'],
  ['TLV', 'departure', 'FR', '1822', 'BCN', '14:15', '14:15', '1', 'A6', 'cancelled'],
  ['TLV', 'departure', 'LY', '337', 'AMS', '15:40', '15:40', '3', 'B2', 'scheduled'],
  // TLV arrivals
  ['TLV', 'arrival', 'LY', '002', 'JFK', '17:25', '17:25', '3', 'B7', 'scheduled'],
  ['TLV', 'arrival', 'LH', '686', 'FRA', '13:05', '13:05', '3', 'B4', 'landed'],
  ['TLV', 'arrival', 'TK', '784', 'IST', '14:20', '14:50', '3', 'C9', 'delayed'],
  ['TLV', 'arrival', 'A3', '930', 'ATH', '15:10', '15:10', '1', 'A1', 'scheduled'],
  ['TLV', 'arrival', 'U2', '2073', 'CDG', '16:00', '16:00', '1', 'A4', 'scheduled'],
  ['TLV', 'arrival', 'EK', '933', 'DXB', '16:45', '16:45', '3', 'D1', 'landed'],
  ['TLV', 'arrival', 'FR', '1821', 'BCN', '18:30', '18:30', '1', 'A6', 'scheduled'],
  ['TLV', 'arrival', 'W6', '4411', 'VIE', '19:15', '19:15', '1', 'A8', 'scheduled'],
  // Ramon (Eilat) — mostly domestic + a few European charters
  ['ETM', 'departure', 'IZ', '021', 'TLV', '07:30', '07:30', '1', 'G1', 'boarding'],
  ['ETM', 'departure', '6H', '512', 'TLV', '09:45', '09:45', '1', 'G2', 'scheduled'],
  ['ETM', 'departure', 'W6', '6301', 'VIE', '11:20', '11:20', '1', 'G3', 'scheduled'],
  ['ETM', 'arrival', 'IZ', '020', 'TLV', '06:50', '06:50', '1', 'G1', 'landed'],
  ['ETM', 'arrival', '6H', '511', 'TLV', '08:55', '09:25', '1', 'G2', 'delayed'],
  ['ETM', 'arrival', 'FR', '3140', 'BCN', '12:40', '12:40', '1', 'G4', 'scheduled'],
  // Haifa — domestic + Larnaca
  ['HFA', 'departure', 'IZ', '301', 'TLV', '08:00', '08:00', '1', 'H1', 'scheduled'],
  ['HFA', 'departure', '6H', '740', 'LCA', '10:30', '10:30', '1', 'H2', 'scheduled'],
  ['HFA', 'arrival', 'IZ', '300', 'TLV', '07:20', '07:20', '1', 'H1', 'landed'],
  ['HFA', 'arrival', '6H', '741', 'LCA', '15:50', '16:20', '1', 'H2', 'delayed'],
]

export const MOCK_FLIGHTS: Flight[] = ROWS.map((r, i) => {
  const [airport, direction, airlineCode, number, cityCode, scheduled, estimated, terminal, gate, status] = r
  const airline = AIRLINES[airlineCode]
  const counterpart = CITIES_ABROAD[cityCode]
  return {
    id: `FL-${String(i + 1).padStart(3, '0')}`,
    flightNumber: `${airlineCode} ${number}`,
    airline: airline.en,
    airlineHe: airline.he,
    direction,
    airport,
    counterpartCity: counterpart.en,
    counterpartCityHe: counterpart.he,
    counterpartCode: cityCode,
    scheduled,
    estimated,
    terminal,
    gate,
    status,
  }
})
