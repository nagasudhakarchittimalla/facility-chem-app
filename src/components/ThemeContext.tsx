import { createContext, useContext, useEffect, useState, type CSSProperties, type ReactNode } from 'react'

interface ThemeValue {
  dark: boolean
  toggle: () => void
}

const ThemeContext = createContext<ThemeValue | null>(null)
const KEY = 'chemtrack-theme'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState<boolean>(() => document.documentElement.classList.contains('dark'))
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    try { localStorage.setItem(KEY, dark ? 'dark' : 'light') } catch { /* ignore */ }
  }, [dark])
  return <ThemeContext.Provider value={{ dark, toggle: () => setDark((d) => !d) }}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}

export interface ChartTheme {
  dark: boolean
  grid: string
  axis: string
  cursor: string
  tooltip: { contentStyle: CSSProperties; labelStyle: CSSProperties; itemStyle: CSSProperties }
}

/** Colours for Recharts, which needs concrete values rather than Tailwind classes. */
export function useChartTheme(): ChartTheme {
  const { dark } = useTheme()
  return {
    dark,
    grid: dark ? '#1e293b' : '#e2e8f0',
    axis: dark ? '#94a3b8' : '#64748b',
    cursor: dark ? 'rgba(148,163,184,.08)' : 'rgba(15,23,42,.04)',
    tooltip: {
      contentStyle: {
        background: dark ? '#0f172a' : '#ffffff',
        border: `1px solid ${dark ? '#1e293b' : '#e2e8f0'}`,
        borderRadius: 12,
        boxShadow: '0 10px 30px -10px rgba(15,23,42,.25)',
        fontSize: 12,
        color: dark ? '#e2e8f0' : '#0f172a',
      },
      labelStyle: { fontWeight: 600, marginBottom: 4, color: dark ? '#f1f5f9' : '#0f172a' },
      itemStyle: { padding: 0 },
    },
  }
}
