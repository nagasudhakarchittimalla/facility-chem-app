import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowUpRight, Boxes, Building2, CornerDownLeft, FileText, FlaskConical, LayoutDashboard, MapPin, Moon, Plus, Search, Sun, Upload,
} from 'lucide-react'
import { useStore } from '../store/AppStore'
import { useTheme } from './ThemeContext'
import { sdsStatus } from '../utils/sds'
import { SdsStatusBadge, type IconType } from './ui'
import type { SdsStatus } from '../types'

interface PaletteItem {
  id: string
  label: string
  hint?: string
  icon: IconType
  /** Route to navigate to … */
  to?: string
  state?: Record<string, unknown>
  /** … or an action to run instead */
  run?: () => void
  status?: SdsStatus
}

type PaletteGroup = [title: string, items: PaletteItem[]]

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

export default function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const { products, facilities, sdsByProduct } = useStore()
  const { dark, toggle } = useTheme()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) { setQ(''); setActive(0); setTimeout(() => inputRef.current?.focus(), 10) }
  }, [open])

  const groups = useMemo<PaletteGroup[]>(() => {
    const term = q.trim().toLowerCase()
    const match = (...fields: string[]) => !term || fields.join(' ').toLowerCase().includes(term)
    const pages: PaletteItem[] = [
      { id: 'pg-dash', label: 'Dashboard', icon: LayoutDashboard, to: '/' },
      { id: 'pg-fac', label: 'Facilities', icon: Building2, to: '/facilities' },
      { id: 'pg-inv', label: 'Inventory', icon: Boxes, to: '/inventory' },
      { id: 'pg-prod', label: 'Products', icon: FlaskConical, to: '/products' },
      { id: 'pg-sds', label: 'SDS Management', icon: FileText, to: '/sds' },
    ].filter((x) => match(x.label))
    const actions: PaletteItem[] = [
      { id: 'ac-new', label: 'Add new product', icon: Plus, to: '/products/new' },
      { id: 'ac-upl', label: 'Upload SDS version', icon: Upload, to: '/sds', state: { upload: true } },
      { id: 'ac-old', label: 'Show SDS older than 5 years', icon: FileText, to: '/sds?status=outdated' },
      { id: 'ac-theme', label: dark ? 'Switch to light mode' : 'Switch to dark mode', icon: dark ? Sun : Moon, run: toggle },
    ].filter((x) => match(x.label))
    const prods: PaletteItem[] = products
      .filter((p) => match(p.name, p.sku, p.manufacturer, ...p.ingredients.flatMap((i) => [i.name, i.cas])))
      .slice(0, term ? 8 : 4)
      .map((p) => ({ id: p.id, label: p.name, hint: `${p.sku} · ${p.manufacturer}`, icon: FlaskConical, to: `/products/${p.id}`, status: sdsStatus(sdsByProduct[p.id]) }))
    const facs: PaletteItem[] = facilities.filter((f) => match(f.name, f.code, f.address)).map((f) => ({
      id: f.id, label: f.name, hint: f.address, icon: Building2, to: `/facilities/${f.id}`,
    }))
    const locs: PaletteItem[] = term
      ? facilities.flatMap((f) => f.locations.filter((l) => match(l.name, l.type)).map((l) => ({
          id: l.id, label: l.name, hint: f.name, icon: MapPin, to: `/inventory?facility=${f.id}&location=${l.id}`,
        }))).slice(0, 5)
      : []
    const all: PaletteGroup[] = [
      ['Products', prods], ['Actions', actions], ['Pages', pages], ['Facilities', facs], ['Storage locations', locs],
    ]
    return all.filter(([, items]) => items.length)
  }, [q, products, facilities, sdsByProduct, dark, toggle])

  const flat = groups.flatMap(([, items]) => items)
  const run = (item: PaletteItem) => {
    onClose()
    if (item.run) item.run()
    else if (item.to) navigate(item.to, item.state ? { state: item.state } : undefined)
  }

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(flat.length - 1, a + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)) }
    else if (e.key === 'Enter' && flat[active]) { e.preventDefault(); run(flat[active]) }
    else if (e.key === 'Escape') onClose()
  }

  useEffect(() => {
    listRef.current?.querySelector(`[data-idx="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [active])

  if (!open) return null
  let idx = -1
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[10vh]">
      <div className="absolute inset-0 animate-[fade-up_.15s_ease-out] bg-ink-950/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl animate-scale-in overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center gap-3 border-b border-slate-200 px-4">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => { setQ(e.target.value); setActive(0) }}
            onKeyDown={onKey}
            placeholder="Search products, CAS numbers, facilities, actions…"
            className="h-14 flex-1 bg-transparent text-base text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          <kbd className="kbd">ESC</kbd>
        </div>
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto p-2">
          {flat.length === 0 && <p className="px-3 py-10 text-center text-sm text-slate-500">No results for “{q}”</p>}
          {groups.map(([title, items]) => (
            <div key={title} className="mb-1">
              <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{title}</p>
              {items.map((item) => {
                idx += 1
                const i = idx
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    data-idx={i}
                    onMouseMove={() => setActive(i)}
                    onClick={() => run(item)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${active === i ? 'bg-brand-50 text-brand-900' : 'text-slate-700'}`}
                  >
                    <span className={`rounded-md p-1.5 ${active === i ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-500'}`}><Icon className="h-4 w-4" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{item.label}</span>
                      {item.hint && <span className="block truncate text-xs text-slate-500">{item.hint}</span>}
                    </span>
                    {item.status && item.status.key !== 'current' && <SdsStatusBadge status={item.status} />}
                    {active === i && (item.run ? <CornerDownLeft className="h-4 w-4 text-brand-500" /> : <ArrowUpRight className="h-4 w-4 text-brand-500" />)}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 border-t border-slate-200 bg-slate-50 px-4 py-2 text-[11px] text-slate-500">
          <span className="flex items-center gap-1"><kbd className="kbd">↑</kbd><kbd className="kbd">↓</kbd> navigate</span>
          <span className="flex items-center gap-1"><kbd className="kbd">↵</kbd> open</span>
          <span className="ml-auto hidden sm:inline">Tip: press <kbd className="kbd">/</kbd> anywhere to search</span>
        </div>
      </div>
    </div>
  )
}
