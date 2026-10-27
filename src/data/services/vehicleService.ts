import type { Vehicle } from '../types'
import { MOCK_VEHICLES } from '../mock/mockVehicles'

/**
 * Vehicle lookup service.
 *
 * This module is the ONLY place that knows where vehicle data comes from. Today
 * it reads from an in-memory mock array; swapping to the real data.gov.il
 * vehicle-registry resource later means changing this file alone — the page
 * keeps calling `lookupVehicle` / `getExampleVehicles` unchanged. Functions are
 * synchronous now; a real integration would return Promises and the page's
 * existing empty/not-found handling would extend to loading/error states.
 */

/** Reduce any user input to its digits — plates are compared digit-only. */
export function normalizePlate(input: string): string {
  return input.replace(/\D/g, '')
}

/** A plausible Israeli plate has 7 or 8 digits. */
export function isValidPlateInput(input: string): boolean {
  const digits = normalizePlate(input)
  return digits.length === 7 || digits.length === 8
}

/** Look up a vehicle by plate, ignoring separators and spacing. */
export function lookupVehicle(input: string): Vehicle | null {
  const digits = normalizePlate(input)
  if (!digits) return null
  return (
    MOCK_VEHICLES.find((v) => normalizePlate(v.plate) === digits) ?? null
  )
}

/** A short set of example vehicles to offer as one-tap lookups. */
export function getExampleVehicles(count = 4): Vehicle[] {
  return MOCK_VEHICLES.slice(0, count)
}
