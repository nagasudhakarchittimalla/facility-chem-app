import type { Config } from 'tailwindcss'
import defaultColors from 'tailwindcss/colors'
import plugin from 'tailwindcss/plugin'

/*
 * Theme-aware palettes. Each scale is exposed as CSS variables; in dark mode
 * the scale is mirrored (50<->950, 100<->900 ...), so every `bg-slate-50`,
 * `text-red-700`, `bg-white` etc. adapts automatically. `ink` is a fixed,
 * non-mirrored slate used for surfaces that stay dark in both themes.
 */
type Shade = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950
type Scale = Record<Shade, string>

const brand: Scale = {
  50: '#eef6ff', 100: '#d9eaff', 200: '#bcdaff', 300: '#8ec2ff', 400: '#599fff', 500: '#337bfc',
  600: '#1d5cf1', 700: '#1647de', 800: '#183bb4', 900: '#1a368e', 950: '#152256',
}
const THEMED: Record<string, Scale> = {
  slate: defaultColors.slate, red: defaultColors.red, amber: defaultColors.amber, emerald: defaultColors.emerald,
  orange: defaultColors.orange, purple: defaultColors.purple, yellow: defaultColors.yellow, sky: defaultColors.sky,
  rose: defaultColors.rose, brand,
}
const SHADES: Shade[] = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
const rgb = (hex: string): string => {
  const n = parseInt(hex.slice(1), 16)
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`
}

const lightVars: Record<string, string> = {}
const darkVars: Record<string, string> = {}
const colors: Record<string, Record<number, string>> = {}
for (const [name, scale] of Object.entries(THEMED)) {
  colors[name] = {}
  SHADES.forEach((s, i) => {
    lightVars[`--c-${name}-${s}`] = rgb(scale[s])
    // dark: mirror the scale, but keep mid tones slightly brighter for legibility
    const mirrored = SHADES[SHADES.length - 1 - i]
    darkVars[`--c-${name}-${s}`] = rgb(scale[mirrored])
    colors[name][s] = `rgb(var(--c-${name}-${s}) / <alpha-value>)`
  })
}
lightVars['--c-white'] = '255 255 255'
darkVars['--c-white'] = rgb('#0b1222')
// Dark page background a touch deeper than cards
darkVars['--c-slate-50'] = rgb('#060b16')
darkVars['--c-slate-100'] = rgb('#131c2e')
// Primary buttons: keep a saturated blue in dark mode
darkVars['--c-brand-600'] = rgb('#3b74f6')
darkVars['--c-brand-700'] = rgb('#5b8cff')

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ...colors,
        white: 'rgb(var(--c-white) / <alpha-value>)',
        ink: defaultColors.slate,
        snow: '#ffffff',
      },
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      keyframes: {
        'fade-up': { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'none' } },
        'scale-in': { from: { opacity: '0', transform: 'scale(.97)' }, to: { opacity: '1', transform: 'none' } },
        'slide-in': { from: { opacity: '0', transform: 'translateX(-12px)' }, to: { opacity: '1', transform: 'none' } },
        'toast-in': { from: { opacity: '0', transform: 'translateY(12px) scale(.98)' }, to: { opacity: '1', transform: 'none' } },
      },
      animation: {
        'fade-up': 'fade-up .35s ease-out both',
        'scale-in': 'scale-in .18s ease-out both',
        'slide-in': 'slide-in .22s ease-out both',
        'toast-in': 'toast-in .25s ease-out both',
      },
    },
  },
  plugins: [
    plugin(({ addBase }) => {
      addBase({ ':root': { ...lightVars, colorScheme: 'light' }, '.dark': { ...darkVars, colorScheme: 'dark' } })
    }),
  ],
} satisfies Config
