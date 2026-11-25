import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  Beaker, Bell, Boxes, Building2, ChevronRight, FileText, FlaskConical, LayoutDashboard, Moon, PanelLeftClose,
  PanelLeftOpen, RotateCcw, Search, Sun,
} from 'lucide-react'
import { useStore } from '../store/AppStore'
import { useTheme } from './ThemeContext'
import { useToast } from './ToastContext'
import CommandPalette from './CommandPalette'
import { SdsStatusBadge } from './ui'
import { formatAge, SDS_PRIORITY, sdsStatus } from '../utils/sds'

const NAV = [
  { to: '/', label: 'Dashboard', short: 'Home', icon: LayoutDashboard, end: true },
  { to: '/facilities', label: 'Facilities', short: 'Sites', icon: Building2 },
  { to: '/inventory', label: 'Inventory', short: 'Inventory', icon: Boxes },
  { to: '/products', label: 'Products', short: 'Products', icon: FlaskConical },
  { to: '/sds', label: 'SDS Management', short: 'SDS', icon: FileText },
]

function useSdsFlags() {
  const { products, sdsByProduct } = useStore()
  return products
    .map((p) => ({ product: p, status: sdsStatus(sdsByProduct[p.id]) }))
    .filter((x) => x.status.key !== 'current')
    .sort((a, b) => SDS_PRIORITY[a.status.key] - SDS_PRIORITY[b.status.key] || (b.status.age ?? 0) - (a.status.age ?? 0))
}

function Sidebar({ collapsed, setCollapsed }: { collapsed: boolean; setCollapsed: (collapsed: boolean) => void }) {
  const { dispatch } = useStore()
  const toast = useToast()
  const flagged = useSdsFlags().filter((f) => f.status.key !== 'expiring').length
  return (
    <aside className={`fixed inset-y-0 left-0 z-30 hidden flex-col bg-ink-950 transition-[width] duration-200 lg:flex ${collapsed ? 'w-[72px]' : 'w-64'}`}>
      <div className={`flex h-16 items-center gap-2.5 ${collapsed ? 'justify-center' : 'px-5'}`}>
        <div className="rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#6366f1] p-2 text-snow shadow-lg shadow-[#3b82f6]/30"><Beaker className="h-5 w-5" /></div>
        {!collapsed && (
          <div className="animate-slide-in">
            <p className="font-semibold leading-tight text-snow">ChemTrack</p>
            <p className="text-[11px] text-ink-400">EHS Inventory Suite</p>
          </div>
        )}
      </div>
      <nav className="mt-2 flex-1 space-y-1 px-3">
        {!collapsed && <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-ink-500">Menu</p>}
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition ${collapsed ? 'justify-center px-0' : 'px-3'} ${
                isActive ? 'bg-snow/10 text-snow' : 'text-ink-400 hover:bg-snow/5 hover:text-snow'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute -left-3 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-[#60a5fa]" />}
                <Icon className="h-[18px] w-[18px] shrink-0" />
                {!collapsed && <span className="flex-1">{label}</span>}
                {to === '/sds' && flagged > 0 && (
                  <span className={`rounded-full bg-[#ef4444] text-[10px] font-semibold text-snow ${collapsed ? 'absolute right-2 top-1.5 h-2 w-2' : 'px-1.5 py-0.5'}`}>
                    {!collapsed && flagged}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="space-y-1 border-t border-snow/10 p-3">
        <button
          onClick={() => { dispatch({ type: 'RESET' }); toast({ title: 'Mock data restored', tone: 'info' }) }}
          title="Restore the original mock dataset"
          className={`flex w-full items-center gap-2 rounded-lg py-2 text-xs text-ink-400 hover:bg-snow/5 hover:text-snow ${collapsed ? 'justify-center' : 'px-3'}`}
        >
          <RotateCcw className="h-4 w-4" /> {!collapsed && 'Reset mock data'}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`flex w-full items-center gap-2 rounded-lg py-2 text-xs text-ink-400 hover:bg-snow/5 hover:text-snow ${collapsed ? 'justify-center' : 'px-3'}`}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <><PanelLeftClose className="h-4 w-4" /> Collapse sidebar</>}
        </button>
      </div>
    </aside>
  )
}

function Breadcrumbs() {
  const { pathname } = useLocation()
  const { facilityById, productById } = useStore()
  const parts = pathname.split('/').filter(Boolean)
  const crumbs = [{ to: '/', label: 'Dashboard' }]
  let acc = ''
  parts.forEach((seg) => {
    acc += `/${seg}`
    const nav = NAV.find((n) => n.to === acc)
    const label = nav?.label || facilityById[seg]?.name || productById[seg]?.name || { new: 'New product', edit: 'Edit' }[seg] || seg
    crumbs.push({ to: acc, label })
  })
  if (!parts.length) crumbs.push({ to: '/', label: 'Overview' })
  return (
    <nav className="flex min-w-0 items-center gap-1 text-sm">
      {crumbs.map((c, i) => (
        <span key={c.to + i} className="flex min-w-0 items-center gap-1">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />}
          {i === crumbs.length - 1 ? (
            <span className="truncate font-medium text-slate-900">{c.label}</span>
          ) : (
            <Link to={c.to} className="truncate text-slate-500 hover:text-slate-900">{c.label}</Link>
          )}
        </span>
      ))}
    </nav>
  )
}

function Notifications() {
  const flags = useSdsFlags()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { pathname } = useLocation()
  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    const onDoc = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false)
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])
  const urgent = flags.filter((f) => f.status.key !== 'expiring').length
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="btn-ghost relative p-2" aria-label="Notifications">
        <Bell className="h-5 w-5" />
        {urgent > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-snow ring-2 ring-white">
            {urgent}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] animate-scale-in overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <p className="font-semibold text-slate-900">SDS alerts</p>
            <span className="text-xs text-slate-500">{flags.length} need attention</span>
          </div>
          <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
            {flags.slice(0, 8).map(({ product, status }) => (
              <li key={product.id}>
                <Link to={`/products/${product.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${status.key === 'expiring' ? 'bg-amber-500' : status.key === 'missing' ? 'bg-slate-400' : 'bg-red-500'}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-800">{product.name}</span>
                    <span className="block text-xs text-slate-500">
                      {status.key === 'missing' ? 'No SDS on file' : `v${status.version?.version} issued ${formatAge(status.age)} ago`}
                    </span>
                  </span>
                  <SdsStatusBadge status={status} />
                </Link>
              </li>
            ))}
          </ul>
          <Link to="/sds?status=outdated" className="block border-t border-slate-200 bg-slate-50 px-4 py-2.5 text-center text-sm font-medium text-brand-600 hover:bg-slate-100">
            Review all in SDS Management
          </Link>
        </div>
      )}
    </div>
  )
}

export default function Layout() {
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('chemtrack-sidebar') === '1' } catch { return false }
  })
  const [paletteOpen, setPaletteOpen] = useState(false)
  const { dark, toggle } = useTheme()
  const { pathname } = useLocation()

  useEffect(() => { try { localStorage.setItem('chemtrack-sidebar', collapsed ? '1' : '0') } catch { /* ignore */ } }, [collapsed])
  useEffect(() => { window.scrollTo({ top: 0 }) }, [pathname])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName ?? '')
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPaletteOpen((o) => !o) }
      else if (e.key === '/' && !typing) { e.preventDefault(); setPaletteOpen(true) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

  return (
    <div className="min-h-screen">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      <div className={`transition-[padding] duration-200 ${collapsed ? 'lg:pl-[72px]' : 'lg:pl-64'}`}>
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
            <Link to="/" className="flex items-center gap-2 lg:hidden">
              <span className="rounded-lg bg-gradient-to-br from-[#3b82f6] to-[#6366f1] p-1.5 text-snow"><Beaker className="h-4 w-4" /></span>
              <span className="font-semibold text-slate-900">ChemTrack</span>
            </Link>
            <div className="hidden min-w-0 flex-1 lg:block"><Breadcrumbs /></div>
            <div className="flex-1 lg:hidden" />
            <button
              onClick={() => setPaletteOpen(true)}
              className="group flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 text-sm text-slate-500 transition hover:border-slate-300 hover:bg-white sm:w-64 sm:px-3"
            >
              <Search className="h-4 w-4" />
              <span className="hidden flex-1 text-left sm:inline">Search…</span>
              <span className="hidden gap-0.5 sm:flex"><kbd className="kbd">{isMac ? '⌘' : 'Ctrl'}</kbd><kbd className="kbd">K</kbd></span>
            </button>
            <Notifications />
            <button onClick={toggle} className="btn-ghost p-2" aria-label="Toggle dark mode" title={dark ? 'Light mode' : 'Dark mode'}>
              {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <div className="hidden items-center gap-2.5 border-l border-slate-200 pl-3 sm:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#f59e0b] to-[#ef4444] text-xs font-semibold text-snow">EA</div>
              <div className="hidden text-xs xl:block">
                <p className="font-medium text-slate-900">EHS Admin</p>
                <p className="text-slate-500">Corporate EHS</p>
              </div>
            </div>
          </div>
        </header>

        <main key={pathname} className="mx-auto max-w-7xl animate-fade-up px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-12 lg:pt-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/90 backdrop-blur-xl lg:hidden">
        <div className="grid grid-cols-5">
          {NAV.map(({ to, short, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => `relative flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition ${isActive ? 'text-brand-600' : 'text-slate-500'}`}>
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-brand-600" />}
                  <Icon className="h-5 w-5" />
                  {short}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  )
}
