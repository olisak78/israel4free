import type { City } from '../types'

/**
 * Canonical set of Israeli cities with Hebrew names and approximate center
 * coordinates. Geographic mock datasets (ATMs, antennas, transit, pharmacies)
 * draw from this list so city names, Hebrew spellings, and coordinates stay
 * internally consistent across pages.
 */
export const CITIES = {
  telAviv: { en: 'Tel Aviv-Yafo', he: 'תל אביב-יפו', lat: 32.0853, lng: 34.7818 },
  jerusalem: { en: 'Jerusalem', he: 'ירושלים', lat: 31.7683, lng: 35.2137 },
  haifa: { en: 'Haifa', he: 'חיפה', lat: 32.794, lng: 34.9896 },
  beerSheva: { en: 'Beer Sheva', he: 'באר שבע', lat: 31.2518, lng: 34.7913 },
  netanya: { en: 'Netanya', he: 'נתניה', lat: 32.3215, lng: 34.8532 },
  rishon: { en: 'Rishon LeZion', he: 'ראשון לציון', lat: 31.973, lng: 34.7925 },
  petahTikva: { en: 'Petah Tikva', he: 'פתח תקווה', lat: 32.084, lng: 34.8878 },
  herzliya: { en: 'Herzliya', he: 'הרצליה', lat: 32.1663, lng: 34.8436 },
  ashdod: { en: 'Ashdod', he: 'אשדוד', lat: 31.8044, lng: 34.6553 },
  ramatGan: { en: 'Ramat Gan', he: 'רמת גן', lat: 32.0684, lng: 34.8248 },
  eilat: { en: 'Eilat', he: 'אילת', lat: 29.5577, lng: 34.9519 },
  tiberias: { en: 'Tiberias', he: 'טבריה', lat: 32.7922, lng: 35.5312 },
} satisfies Record<string, City>

export type CityKey = keyof typeof CITIES

/** All cities as an array, stable order. */
export const CITY_LIST: City[] = Object.values(CITIES)
