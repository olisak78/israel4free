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

/**
 * Canonical flight-status category, derived once during normalization from the
 * source status text (`CHRMINE`). The UI maps each key to a badge tone and a
 * localized label. `unknown` is the safe bucket for any source value we do not
 * recognise — it stays readable rather than breaking rendering.
 */
export type FlightStatusKey =
  | 'onTime'
  | 'notFinal'
  | 'final'
  | 'departed'
  | 'landed'
  | 'landing'
  | 'delayed'
  | 'cancelled'
  | 'unknown'

/**
 * Normalized flight record, mapped from the data.gov.il CKAN resource by
 * `data/services/flightApi`. This is the Israel Airports Authority board for
 * Ben Gurion Airport — a single feed, not a multi-airport dataset.
 *
 * Government field names are translated into meaningful properties. Times are
 * kept as the source's raw local-airport strings (`YYYY-MM-DDTHH:mm:ss`, no
 * timezone) so they are never shifted by an inappropriate UTC conversion;
 * formatting to `HH:mm` happens at the presentation layer. Empty strings denote
 * "not provided" — the source leaves many optional fields blank.
 */
export interface Flight {
  /** Stable id derived from the datastore row id. */
  id: string
  /** Airline IATA code (CHOPER), e.g. "LY". */
  airlineCode: string
  /** Flight number (CHFLTN), e.g. "315". */
  flightNumber: string
  /** Airline name (CHOPERD). */
  airlineName: string
  direction: FlightDirection
  /** Scheduled local time (CHSTOL) as a raw 'YYYY-MM-DDTHH:mm:ss' string, or ''. */
  scheduledTime: string
  /** Estimated/anticipated local time (CHPTOL) as a raw string, or ''. */
  estimatedTime: string
  /** Location IATA code (CHLOC1) — destination for departures, origin for arrivals. */
  locationCode: string
  /** Full location description (CHLOC1D), e.g. "ROME - FIUMICINO". */
  locationDesc: string
  cityEn: string // CHLOC1T
  cityHe: string // CHLOC1TH
  countryEn: string // CHLOCCT
  countryHe: string // CHLOC1CH
  /** Terminal number (CHTERM) as a string, or '' when not provided. */
  terminal: string
  /** Check-in counter range (CHCINT), e.g. "7-11". Usually only for departures. */
  checkInCounters: string
  /** Check-in zone (CHCKZN), e.g. "A". */
  checkInZone: string
  /** Raw source status text (CHRMINE / CHRMINH) — kept so unknown values stay readable. */
  statusEn: string
  statusHe: string
  /** Canonical category for badge tone + filtering. */
  statusKey: FlightStatusKey
}

// ─── ATM Locations ─────────────────────────────────────────────────────────

/**
 * Normalized ATM record, mapped from the data.gov.il CKAN resource by
 * `data/services/atmService`. Government field names are translated into
 * meaningful properties; Hebrew bank/address/city values are preserved as-is.
 *
 * Booleans are tri-state: `true`/`false` when the source explicitly says so
 * ("כן"/"לא"), and `null` when the value is missing or unrecognised — unknown
 * is never conflated with an explicit "No". Coordinates are WGS84 after
 * conversion, or `null` when the source location could not be resolved.
 */
export interface Atm {
  /** Stable id derived from the datastore row id. */
  id: string
  bankCode: number | null
  bankName: string
  branchCode: number | null
  subBranchCode: number | null
  atmNumber: number | null
  address: string
  additionalAddress: string
  city: string
  commissionAvailable: boolean | null
  cashWithdrawalAvailable: boolean | null
  cashDepositAvailable: boolean | null
  chequeDepositAvailable: boolean | null
  envelopeDepositAvailable: boolean | null
  foreignExchangeAvailable: boolean | null
  additionalTransactionsAvailable: boolean | null
  locationDescription: string
  wheelchairAccessible: boolean | null
  /** WGS84 latitude, or null when unresolved (excluded from the map). */
  lat: number | null
  /** WGS84 longitude, or null when unresolved. */
  lng: number | null
}

// ─── Cell Antennas ─────────────────────────────────────────────────────────

/**
 * Normalized cellular-antenna record, mapped from the data.gov.il CKAN resource
 * by `data/services/antennaApi`. This is the Ministry of Environmental
 * Protection's registry of reported cellular transmission sites — each record
 * is a reported site with its permits, inspection, and radiation measurements,
 * NOT necessarily a unique operational antenna.
 *
 * The source fields are Hebrew and the dataset is single-language, so values are
 * preserved as-is (no …He pairs) and displayed verbatim — the app never
 * translates, transliterates, or reinterprets the source values. Missing fields
 * are the empty string (text) or `null` (numbers/coordinates); the UI shows a
 * placeholder rather than a fabricated value. Date fields keep the source's raw
 * `DD/MM/YYYY` string and are formatted safely at the presentation layer.
 */
export interface CellAntenna {
  /** Stable id derived from the datastore row id. */
  id: string
  /** Site identifier (מס' אתר), e.g. "216464" or "WI6378A"; '' when absent. */
  siteId: string
  /** Cellular company (חברה), e.g. "פלאפון". */
  company: string
  city: string // עיר
  address: string // כתובת האתר
  localAuthority: string // רשות מקומית
  jurisdiction: string // תחום שיפוט
  siteType: string // סוג אתר
  /** Construction permit date (תאריך היתר הקמה), raw 'DD/MM/YYYY' or ''. */
  constructionPermitDate: string
  /** Operating permit date (תאריך היתר הפעלה), raw 'DD/MM/YYYY' or ''. */
  operatingPermitDate: string
  /** Most recent periodic inspection (בדיקה תקופתית אחרונה), raw or ''. */
  lastInspectionDate: string
  /** Radiation-permit status (היתר קרינה), verbatim, e.g. "יש היתר"/"אין היתר". */
  radiationPermit: string
  /** Theoretical max power density in µW/cm² (עוצמה מרבית תיאורטית), or null. */
  maxTheoreticalPower: number | null
  /** Max measured result as % of the health threshold (תוצאה מירבית ב%), or null. */
  maxResultPercent: number | null
  /** Where the max result was recorded (תאור נקודה…); '' when absent. */
  maxResultLocation: string
  /** Construction-permit document URL (קובץ הקמה), validated, or null. */
  constructionPermitUrl: string | null
  /** Operating-permit document URL (קובץ הפעלה), validated, or null. */
  operatingPermitUrl: string | null
  /** Transmission technology (טכנולוגיית שידור), whitespace-normalized, e.g. "דור 3 4 5". */
  transmissionTech: string
  /** WGS84 latitude after ITM conversion, or null when unresolved. */
  lat: number | null
  /** WGS84 longitude after ITM conversion, or null when unresolved. */
  lng: number | null
}

// ─── Bank Branches ───────────────────────────────────────────────────────────

/**
 * Normalized bank-branch record, mapped from the data.gov.il CKAN resource by
 * `data/services/bankBranchApi`. There are two language-specific source
 * resources (Hebrew and English); the active UI language selects which one is
 * fetched, and each is normalized to this same shape.
 *
 * The two resources differ in primitive types — e.g. `Bank_Code`/`Zip_Code`/
 * `POB` are numbers in Hebrew but strings in English — so identifiers are always
 * normalized to strings here and never relied on to be numeric. Text fields use
 * `''` for "not provided" (matching the other datasets); `wheelchairAccessible`
 * is tri-state (`true`/`false`/`null`) so unknown is never shown as "No"; and
 * coordinates are WGS84 (`X_Coordinate`=lat, `Y_Coordinate`=lng, verified
 * against Afula) or `null` when the source location could not be resolved.
 *
 * Even in the English resource some values remain Hebrew (e.g. street address,
 * accessibility) — source values are preserved as-is, never machine-translated.
 */
export interface BankBranch {
  /** Stable id: `${bankCode}-${branchCode}-${rowId}`. */
  id: string
  bankCode: string
  bankName: string
  branchCode: string
  branchName: string
  address: string
  city: string
  zipCode: string
  postOfficeBox: string
  /** Telephone kept as a readable string (never coerced to a number), or ''. */
  telephone: string
  /** Accessible: true/false when stated ("כן"/"לא"), null when unknown. */
  wheelchairAccessible: boolean | null
  /** Weekly closing day, localized by the source resource (e.g. "יום א"/"Sunday"). */
  weeklyClosedDay: string
  /** Branch classification, localized by the source (e.g. "רגיל"/"Normal"). */
  branchType: string
  /** Opening date, raw 'DD/MM/YYYY' or ''. */
  openDate: string
  /** Closure date, raw 'DD/MM/YYYY' or '' when none recorded. */
  closeDate: string
  /** Merged-bank code (historical), or ''. */
  mergedBankCode: string
  /** Merged-branch code (historical), or ''. */
  mergedBranchCode: string
  /** WGS84 latitude (source X_Coordinate), or null when unresolved. */
  lat: number | null
  /** WGS84 longitude (source Y_Coordinate), or null when unresolved. */
  lng: number | null
}

// ─── Pharmacies (medical cannabis) ───────────────────────────────────────────

/**
 * Normalized pharmacy record, mapped from the data.gov.il CKAN resource by
 * `data/services/pharmacyApi`. This dataset lists pharmacies authorized to sell
 * medical cannabis — NOT all pharmacies in Israel.
 *
 * Only fields the API actually provides are modelled. There is no phone number,
 * opening hours, open/closed status, or accessibility data in this source, so
 * none are represented here. `delivery` is tri-state: `true`/`false` when the
 * source explicitly says so ("כן"/"לא"), and `null` when missing or unrecognised
 * — unknown is never conflated with an explicit "No".
 */
export interface Pharmacy {
  /** Stable id derived from the datastore row id. */
  id: string
  name: string
  street: string
  city: string
  /** Free-text notes from the source; empty string when none. */
  notes: string
  /** Delivery offered: true/false when stated, null when unknown. */
  delivery: boolean | null
  /**
   * A validated Google Maps directions URL — extracted from the source `map`
   * field when safe, otherwise built from the address. `null` when neither a
   * valid link nor any address component is available (the action is omitted).
   */
  directionsUrl: string | null
}
