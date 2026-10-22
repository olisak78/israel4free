/**
 * Centralized bilingual strings. All language-dependent text lives here so the
 * rest of the app never branches on language inline (`isHebrew ? … : …`).
 *
 * The English dictionary is the source of truth for the shape; the Hebrew
 * dictionary is type-checked against it via `Dict`, so a missing or renamed
 * key is a compile error rather than a runtime surprise.
 */

export type Language = 'en' | 'he'

/** Text direction for each supported language. */
export const direction: Record<Language, 'ltr' | 'rtl'> = {
  en: 'ltr',
  he: 'rtl',
}

/** Native language names, for the language selector. */
export const languageNames: Record<Language, string> = {
  en: 'English',
  he: 'עברית',
}

const en = {
  // Document-level SEO metadata, applied to <title>/description/og:locale when
  // this language is active. Kept natural and specific — no keyword stuffing.
  meta: {
    title:
      'Israel Open Data Portal — Vehicles, Flights, ATMs & More | Israel4Free',
    description:
      "Search Israeli vehicle licenses, flights, ATMs, pharmacies and public transit in one fast, clean interface over Israel's open government data. Free, no sign-up.",
    ogLocale: 'en_US',
  },
  brand: {
    name: 'Israel4Free',
    tagline: 'Open Data Portal',
  },
  nav: {
    label: 'Primary',
    home: 'Home',
    transport: 'Transport',
    locations: 'Locations',
    infrastructure: 'Infrastructure',
    openMenu: 'Open navigation menu',
    closeMenu: 'Close navigation menu',
  },
  search: {
    label: 'Search across all datasets',
    placeholder: 'Search across all datasets…',
  },
  util: {
    settings: 'Settings',
    about: 'About',
    language: 'Language',
    theme: 'Theme',
    toLight: 'Switch to light mode',
    toDark: 'Switch to dark mode',
  },
  hero: {
    eyebrow: 'Israeli public data',
    titleLead: 'Israel Open Data,',
    titleAccent: 'made usable',
    subtitle:
      "A fast, clean interface over Israel's public government datasets — search vehicles, track flights, find ATMs, and more, all in one place.",
  },
  stats: {
    datasets: 'datasets',
    categories: 'categories',
    access: 'Free · no sign-up',
  },
  datasets: {
    heading: 'Browse datasets',
    subheading: 'Pick a category to start exploring',
    filterLabel: 'Filter datasets by category',
    all: 'All',
    shown: (n: number, total: number) => `${n} of ${total} shown`,
    emptyTitle: 'No datasets in this category yet',
    emptyCta: 'Show all datasets',
  },
  card: {
    mapView: 'Map view',
    explore: 'Explore',
    exploreAria: (title: string) => `Explore the ${title} dataset`,
  },
  footer: {
    line1Lead: 'Data sourced from',
    line1Tail: '· Israel Open Government Data',
    line2: '© Blue Acara Project™',
  },
}

/** The dictionary shape every language must satisfy. */
export type Dict = typeof en

const he: Dict = {
  meta: {
    title: 'פורטל מידע ממשלתי פתוח — רכב, טיסות, כספומטים ועוד | Israel4Free',
    description:
      'חיפוש רישוי רכב, טיסות, כספומטים, בתי מרקחת ותחבורה ציבורית בממשק מהיר ונקי מעל מאגרי המידע הממשלתיים הפתוחים של ישראל. חינם, ללא הרשמה.',
    ogLocale: 'he_IL',
  },
  brand: {
    name: 'Israel4Free',
    tagline: 'פורטל מידע פתוח',
  },
  nav: {
    label: 'ראשי',
    home: 'בית',
    transport: 'תחבורה',
    locations: 'מיקומים',
    infrastructure: 'תשתיות',
    openMenu: 'פתח תפריט ניווט',
    closeMenu: 'סגור תפריט ניווט',
  },
  search: {
    label: 'חיפוש בכל מאגרי המידע',
    placeholder: 'חיפוש בכל מאגרי המידע…',
  },
  util: {
    settings: 'הגדרות',
    about: 'אודות',
    language: 'שפה',
    theme: 'ערכת נושא',
    toLight: 'מעבר למצב בהיר',
    toDark: 'מעבר למצב כהה',
  },
  hero: {
    eyebrow: 'מידע ציבורי ישראלי',
    titleLead: 'מידע ממשלתי פתוח,',
    titleAccent: 'נגיש וברור',
    subtitle:
      'ממשק מהיר ונקי למאגרי המידע הממשלתיים של ישראל — חיפוש רכבים, מעקב טיסות, איתור כספומטים ועוד, הכול במקום אחד.',
  },
  stats: {
    datasets: 'מאגרים',
    categories: 'קטגוריות',
    access: 'חינם · ללא הרשמה',
  },
  datasets: {
    heading: 'עיון במאגרים',
    subheading: 'בחרו קטגוריה כדי להתחיל',
    filterLabel: 'סינון מאגרים לפי קטגוריה',
    all: 'הכול',
    shown: (n: number, total: number) => `${n} מתוך ${total} מוצגים`,
    emptyTitle: 'אין עדיין מאגרים בקטגוריה הזו',
    emptyCta: 'הצג את כל המאגרים',
  },
  card: {
    mapView: 'תצוגת מפה',
    explore: 'לחקירה',
    exploreAria: (title: string) => `חקירת מאגר ${title}`,
  },
  footer: {
    line1Lead: 'המידע נלקח מתוך',
    line1Tail: '· מידע ממשלתי פתוח של ישראל',
    line2: 'פרויקט קוד פתוח עצמאי',
  },
}

export const dictionaries: Record<Language, Dict> = { en, he }
