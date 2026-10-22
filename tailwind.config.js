/** Semantic color token → CSS custom property. Channels are stored as
 *  space-separated RGB in index.css so Tailwind's <alpha-value> keeps working
 *  (e.g. `bg-surface/80`). Light and dark values live under :root and .dark. */
const token = (name) => `rgb(var(${name}) / <alpha-value>)`

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  // Two-theme switcher: the `.dark` class on <html> flips every semantic token.
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Surfaces
        page: token('--c-page'),
        surface: {
          DEFAULT: token('--c-surface'),
          2: token('--c-surface-2'),
          3: token('--c-elevated'),
        },
        // Text
        content: token('--c-content'),
        muted: token('--c-muted'),
        faint: token('--c-faint'),
        // Lines
        edge: token('--c-edge'),
        // Accent
        brand: {
          DEFAULT: token('--c-brand'),
          hover: token('--c-brand-hover'),
          fg: token('--c-brand-fg'),
          soft: token('--c-brand-soft'),
          'soft-fg': token('--c-brand-soft-fg'),
        },
        // Form + focus
        focus: token('--c-focus'),
        field: token('--c-field'),
        placeholder: token('--c-placeholder'),
        // Status
        success: token('--c-success'),
        warning: token('--c-warning'),
        danger: token('--c-danger'),
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        hebrew: ['Heebo', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '0.875rem',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(15 23 42 / 0.04)',
        'card-hover': '0 6px 20px -6px rgb(15 23 42 / 0.12)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
      },
    },
  },
  plugins: [],
}
