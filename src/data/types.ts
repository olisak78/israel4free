/**
 * Shared record types for all six datasets.
 *
 * These describe the shape of the data each page consumes. The mock modules in
 * `data/mock/` provide stable sample records that satisfy these types, and the
 * services in `data/services/` are the single seam where a real data.gov.il
 * integration would later replace the mock source — pages and UI never touch
 * the mock arrays directly.
 *
 * Bilingual fields (…He) exist only where a value genuinely differs by language
 * (names, cities, colors). Language-neutral values — plates, codes, numbers,
 * coordinates, times — are stored once.
 */

/** A city with its Hebrew name and approximate coordinates (Israel). */
export interface City {
  en: string
  he: string
  lat: number
  lng: number
}

// ─── Car Licenses ──────────────────────────────────────────────────────────

export type FuelType = 'gasoline' | 'diesel' | 'hybrid' | 'electric' | 'lpg'
export type VehicleType = 'private' | 'commercial' | 'motorcycle' | 'truck'
export type RegistrationStatus = 'active' | 'expired' | 'suspended'
export type OwnershipType = 'private' | 'company' | 'lease' | 'rental'

export interface Vehicle {
  /** Israeli plate, formatted (e.g. "12-345-67" or "123-45-678"). */
  plate: string
  manufacturer: string
  model: string
  trim?: string
  year: number
  vehicleType: VehicleType
  color: string
  colorHe: string
  fuel: FuelType
  engineCc?: number
  ownership: OwnershipType
  status: RegistrationStatus
  firstRegistered: string // ISO date
  lastTest: string // ISO date
  nextTest: string // ISO date
}

// ─── Flights ───────────────────────────────────────────────────────────────

export type FlightDirection = 'departure' | 'arrival'
export type FlightStatus =
  | 'scheduled'
  | 'boarding'
  | 'departed'
  | 'landed'
  | 'delayed'
  | 'cancelled'

export interface Airport {
  code: string // IATA, e.g. "TLV"
  name: string
  nameHe: string
  city: string
  cityHe: string
}

export interface Flight {
  id: string
  flightNumber: string // e.g. "LY 384"
  airline: string
  airlineHe: string
  direction: FlightDirection
  /** IATA of the Israeli airport this flight belongs to. */
  airport: string
  /** Destination (departures) or origin (arrivals). */
  counterpartCity: string
  counterpartCityHe: string
  counterpartCode: string // IATA
  scheduled: string // "HH:MM" (24h)
  estimated: string // "HH:MM"
  terminal: string
  gate?: string
  status: FlightStatus
}

// ─── ATM Locations ─────────────────────────────────────────────────────────

export type AtmService = 'withdrawal' | 'deposit' | 'coins' | 'foreign'

export interface AtmLocation {
  id: string
  bank: string
  bankHe: string
  name: string // branch / ATM label
  nameHe: string
  address: string
  addressHe: string
  city: string
  cityHe: string
  lat: number
  lng: number
  accessible: boolean
  open24h: boolean
  services: AtmService[]
}

// ─── Cell Antennas ─────────────────────────────────────────────────────────

export type CellTechnology = '3G' | '4G' | '5G'
export type AntennaStatus = 'active' | 'planned' | 'maintenance'

export interface CellAntenna {
  id: string // site identifier
  operator: string
  operatorHe: string
  city: string
  cityHe: string
  address: string
  addressHe: string
  lat: number
  lng: number
  technology: CellTechnology
  band: string // e.g. "700 MHz" — illustrative
  heightM: number // mast height, illustrative
  status: AntennaStatus
}

// ─── Public Transit ────────────────────────────────────────────────────────

export type TransitMode = 'bus' | 'train' | 'lightrail'

export interface TransitStop {
  id: string // stop code
  name: string
  nameHe: string
  city: string
  cityHe: string
  lat: number
  lng: number
  routes: string[] // route numbers served
  accessible: boolean
  shelter: boolean
}

export interface TransitRoute {
  id: string
  number: string
  mode: TransitMode
  operator: string
  operatorHe: string
  origin: string
  originHe: string
  destination: string
  destinationHe: string
  /** Ordered intermediate stop names (illustrative). */
  stops: string[]
  stopsHe: string[]
  /** Illustrative headway in minutes — not a live schedule. */
  frequencyMin: number
}

// ─── Pharmacies ────────────────────────────────────────────────────────────

/** Opening hours for one day as "HH:MM-HH:MM", or null when closed. */
export interface DayHours {
  open: string
  close: string
}

export interface Pharmacy {
  id: string
  name: string
  nameHe: string
  chain: string
  chainHe: string
  address: string
  addressHe: string
  city: string
  cityHe: string
  phone: string
  lat: number
  lng: number
  accessible: boolean
  /** Open outside standard hours (on-call / night dispensary). */
  onCall: boolean
  /** Index 0 = Sunday … 6 = Saturday. null = closed that day. */
  hours: (DayHours | null)[]
}
