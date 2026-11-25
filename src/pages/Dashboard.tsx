import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { ArrowRight, Boxes, Droplets, FileWarning, FlaskConical, Plus, ShieldCheck, Upload, Sparkles } from 'lucide-react'
import { useStore } from '../store/AppStore'
import { useFilters } from '../components/useFilters'
import { useChartTheme } from '../components/ThemeContext'
import { HAZARD_META, ProgressRing, SdsStatusBadge, StatCard } from '../components/ui'
import { formatAge, formatNumber, SDS_PRIORITY, sdsStatus } from '../utils/sds'
import type { HazardClass, InventoryRecord, Product, Unit } from '../types'

interface ProductAggregate {
  qty: number
  locations: Set<string>
  unit: Unit
}

const FACILITY_COLORS = ['#3b74f6', '#06b6d4', '#10b981', '#f59e0b']
const kfmt = (v: number): string => (v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : String(v))

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

export default function Dashboard() {
  const { facilities, inventory, productById, sdsByProduct, years, facilityById } = useStore()
  const chart = useChartTheme()
  const latest = String(years[years.length - 1])
  const [f, setFilter] = useFilters({ facility: 'all', year: latest })
  const year = Number(f.year)
  const scopeQs = new URLSearchParams({ ...(f.facility !== 'all' && { facility: f.facility }), year: f.year }).toString()

  const scoped = useMemo(
    () => inventory.filter((i) => (f.facility === 'all' || i.facilityId === f.facility) && i.year === year),
    [inventory, f.facility, year],
  )
  const prevScoped = useMemo(
    () => inventory.filter((i) => (f.facility === 'all' || i.facilityId === f.facility) && i.year === year - 1),
    [inventory, f.facility, year],
  )

  const stats = useMemo(() => {
    const productIds = [...new Set(scoped.map((i) => i.productId))]
    const sum = (rows: InventoryRecord[], u: Unit) => rows.filter((i) => i.unit === u).reduce((s, i) => s + i.quantity, 0)
    const statuses = productIds.map((id) => sdsStatus(sdsByProduct[id]))
    const ok = statuses.filter((s) => s.key === 'current' || s.key === 'expiring').length
    const liters = sum(scoped, 'L')
    const prevLiters = sum(prevScoped, 'L')
    return {
      productIds,
      records: scoped.length,
      containers: scoped.reduce((s, i) => s + i.containerCount, 0),
      liters, kg: sum(scoped, 'kg'), cylinders: sum(scoped, 'cyl'),
      litersDelta: prevLiters ? ((liters - prevLiters) / prevLiters) * 100 : null,
      flagged: statuses.filter((s) => s.key === 'outdated' || s.key === 'missing').length,
      compliance: productIds.length ? Math.round((ok / productIds.length) * 100) : 100,
      hazardous: productIds.filter((id) => productById[id]?.hazards.length).length,
    }
  }, [scoped, prevScoped, sdsByProduct, productById])

  const visibleFacilities = facilities.filter((fac) => f.facility === 'all' || fac.id === f.facility)

  const byFacility = visibleFacilities.map((fac) => {
    const rows = scoped.filter((i) => i.facilityId === fac.id)
    return {
      name: fac.code, fullName: fac.name,
      Liquids: Math.round(rows.filter((r) => r.unit === 'L').reduce((s, r) => s + r.quantity, 0)),
      Solids: Math.round(rows.filter((r) => r.unit === 'kg').reduce((s, r) => s + r.quantity, 0)),
    }
  })

  const trend = years.map((y) => {
    const row: Record<string, string | number> = { year: String(y) }
    visibleFacilities.forEach((fac) => {
      row[fac.code] = inventory.filter((i) => i.year === y && i.facilityId === fac.id && i.unit === 'L').reduce((s, i) => s + i.quantity, 0)
    })
    return row
  })

  const hazardData = useMemo(() => {
    const counts: Partial<Record<HazardClass, number>> = {}
    stats.productIds.forEach((id) => productById[id]?.hazards.forEach((h) => (counts[h] = (counts[h] || 0) + 1)))
    return (Object.entries(counts) as [HazardClass, number][]).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  }, [stats.productIds, productById])

  const topProducts = useMemo(() => {
    const agg: Record<string, ProductAggregate> = {}
    scoped.forEach((i) => {
      agg[i.productId] = agg[i.productId] || { qty: 0, locations: new Set<string>(), unit: i.unit }
      agg[i.productId].qty += i.quantity
      agg[i.productId].locations.add(i.locationId)
    })
    return Object.entries(agg).filter(([, a]) => a.unit === 'L').sort((a, b) => b[1].qty - a[1].qty).slice(0, 6)
  }, [scoped])
  const topMax = topProducts[0]?.[1].qty || 1

  const sdsAlerts = stats.productIds
    .map((id) => ({ product: productById[id], status: sdsStatus(sdsByProduct[id]) }))
    .filter((x): x is { product: Product; status: typeof x.status } => !!x.product && x.status.key !== 'current')
    .sort((a, b) => SDS_PRIORITY[a.status.key] - SDS_PRIORITY[b.status.key] || (b.status.age ?? 0) - (a.status.age ?? 0))

  const ringColor = stats.compliance >= 90 ? '#10b981' : stats.compliance >= 70 ? '#f59e0b' : '#ef4444'
  const scopeName = f.facility === 'all' ? 'all facilities' : facilityById[f.facility]?.name

  return (
    <>
      {/* Hero */}
      <section className="relative mb-6 overflow-hidden rounded-3xl bg-ink-950 p-5 text-snow shadow-xl shadow-ink-900/10 sm:p-7">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#3b82f6]/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-[#8b5cf6]/20 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-[#93c5fd]">
              <Sparkles className="h-3.5 w-3.5" /> {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{greeting()}, EHS Admin</h1>
            <p className="mt-1 max-w-xl text-sm text-ink-300">
              {stats.flagged > 0
                ? <>You have <strong className="text-snow">{stats.flagged} SDS</strong> that are older than 5 years or missing in {scopeName}.</>
                : <>All Safety Data Sheets for {scopeName} are up to date. Nice work!</>}
            </p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <select value={f.facility} onChange={(e) => setFilter('facility', e.target.value)}
                className="cursor-pointer rounded-xl border border-snow/15 bg-snow/10 px-3 py-2 text-sm text-snow backdrop-blur focus:outline-none focus:ring-4 focus:ring-snow/20 sm:w-64 [&>option]:text-ink-900">
                <option value="all">All facilities</option>
                {facilities.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
              </select>
              <div className="inline-flex self-start rounded-xl bg-snow/10 p-1 backdrop-blur">
                {years.map((y) => (
                  <button key={y} onClick={() => setFilter('year', String(y))}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${f.year === String(y) ? 'bg-snow text-ink-900 shadow' : 'text-ink-300 hover:text-snow'}`}>
                    {y}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Link to="/products/new" className="btn bg-snow text-ink-900 hover:bg-ink-100"><Plus className="h-4 w-4" /> Add product</Link>
              <Link to="/sds" state={{ upload: true }} className="btn border border-snow/20 text-snow hover:bg-snow/10"><Upload className="h-4 w-4" /> Upload SDS</Link>
              <Link to={`/inventory?${scopeQs}`} className="btn border border-snow/20 text-snow hover:bg-snow/10"><Boxes className="h-4 w-4" /> Open inventory</Link>
            </div>
          </div>

          <Link to="/sds" className="flex items-center gap-5 self-start rounded-2xl bg-snow/5 p-4 ring-1 ring-snow/10 transition hover:bg-snow/10 lg:self-auto">
            <ProgressRing value={stats.compliance} color={ringColor} track="rgba(255,255,255,.12)" size={112}>
              <span className="text-2xl font-bold">{stats.compliance}%</span>
              <span className="text-[10px] uppercase tracking-wider text-ink-400">compliant</span>
            </ProgressRing>
            <div className="text-sm">
              <p className="font-semibold">SDS compliance</p>
              <p className="mt-0.5 text-xs text-ink-400">{stats.productIds.length} products in scope</p>
              <p className="mt-2 flex items-center gap-1.5 text-xs"><span className="h-2 w-2 rounded-full bg-[#ef4444]" />{stats.flagged} need action</p>
              <p className="mt-1 flex items-center gap-1 text-xs font-medium text-[#93c5fd]">Review <ArrowRight className="h-3 w-3" /></p>
            </div>
          </Link>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard icon={FlaskConical} label="Products on site" value={stats.productIds.length} hint={`${stats.hazardous} classified hazardous`} to={`/inventory?${scopeQs}`} />
        <StatCard icon={Boxes} label="Inventory records" value={stats.records} hint={`${formatNumber(stats.containers)} containers`} tone="slate" to={`/inventory?${scopeQs}`} />
        <StatCard icon={Droplets} label="Liquids on hand" value={`${kfmt(Math.round(stats.liters))} L`}
          hint={stats.litersDelta == null ? `${formatNumber(stats.kg)} kg solids` : `${stats.litersDelta >= 0 ? '▲' : '▼'} ${Math.abs(stats.litersDelta).toFixed(1)}% vs ${year - 1}`} tone="green" />
        <StatCard icon={stats.flagged ? FileWarning : ShieldCheck} label="SDS action items" value={stats.flagged}
          hint="Older than 5 yrs or missing" tone={stats.flagged ? 'red' : 'green'} to="/sds?status=outdated" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold text-slate-900">Quantity by facility</h2>
              <p className="text-xs text-slate-500">{year} · liquids in L, solids in kg</p>
            </div>
          </div>
          <div className="mt-4 h-72">
            <ResponsiveContainer>
              <BarChart data={byFacility} margin={{ left: -12, right: 4 }} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chart.grid} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: chart.axis }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: chart.axis }} tickFormatter={kfmt} axisLine={false} tickLine={false} />
                <Tooltip {...chart.tooltip} cursor={{ fill: chart.cursor }} formatter={(v) => formatNumber(Number(v))} labelFormatter={(l, p) => p?.[0]?.payload.fullName || l} />
                <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
                <Bar dataKey="Liquids" fill="#3b74f6" radius={[6, 6, 0, 0]} maxBarSize={48} />
                <Bar dataKey="Solids" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-slate-900">Hazard profile</h2>
          <p className="text-xs text-slate-500">Products per GHS hazard class</p>
          <div className="relative mt-2 h-52">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={hazardData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={85} paddingAngle={3} cornerRadius={4} stroke="none">
                  {hazardData.map((d) => <Cell key={d.name} fill={HAZARD_META[d.name].color} />)}
                </Pie>
                <Tooltip {...chart.tooltip} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-slate-900">{stats.hazardous}</span>
              <span className="text-[10px] uppercase tracking-wider text-slate-500">hazardous</span>
            </div>
          </div>
          <div className="mt-2 space-y-1.5">
            {hazardData.map((d) => {
              const { icon: Icon, color } = HAZARD_META[d.name]
              return (
                <Link key={d.name} to={`/inventory?${scopeQs}&hazard=${encodeURIComponent(d.name)}`} className="group flex items-center gap-2 rounded-lg px-1.5 py-1 text-xs hover:bg-slate-50">
                  <Icon className="h-3.5 w-3.5" style={{ color }} />
                  <span className="flex-1 truncate text-slate-600 group-hover:text-slate-900">{d.name}</span>
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full" style={{ width: `${(d.value / hazardData[0].value) * 100}%`, background: color }} />
                  </div>
                  <span className="w-5 text-right font-semibold tabular-nums text-slate-700">{d.value}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <h2 className="font-semibold text-slate-900">Liquid inventory trend</h2>
          <p className="text-xs text-slate-500">Total litres on hand per reporting year</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer>
              <AreaChart data={trend} margin={{ left: -12, right: 8 }}>
                <defs>
                  {visibleFacilities.map((fac) => (
                    <linearGradient key={fac.id} id={`g-${fac.code}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={FACILITY_COLORS[facilities.indexOf(fac) % 4]} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={FACILITY_COLORS[facilities.indexOf(fac) % 4]} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chart.grid} />
                <XAxis dataKey="year" tick={{ fontSize: 12, fill: chart.axis }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: chart.axis }} tickFormatter={kfmt} axisLine={false} tickLine={false} />
                <Tooltip {...chart.tooltip} formatter={(v) => `${formatNumber(Number(v))} L`} />
                <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
                {visibleFacilities.map((fac) => {
                  const c = FACILITY_COLORS[facilities.indexOf(fac) % 4]
                  return <Area key={fac.id} type="monotone" dataKey={fac.code} stroke={c} strokeWidth={2.5} fill={`url(#g-${fac.code})`} dot={{ r: 3, strokeWidth: 0, fill: c }} activeDot={{ r: 5 }} />
                })}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card flex flex-col p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">SDS alerts</h2>
            <Link to="/sds" className="text-xs font-medium text-brand-600 hover:underline">View all</Link>
          </div>
          <p className="text-xs text-slate-500">Stocked products needing attention</p>
          <ul className="-mx-2 mt-3 flex-1 space-y-0.5 overflow-y-auto" style={{ maxHeight: 268 }}>
            {sdsAlerts.length === 0 && (
              <li className="flex flex-col items-center py-10 text-center text-sm text-slate-500">
                <ShieldCheck className="mb-2 h-8 w-8 text-emerald-500" /> Everything is current
              </li>
            )}
            {sdsAlerts.map(({ product, status }) => (
              <li key={product.id}>
                <Link to={`/products/${product.id}`} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-slate-50">
                  <span className={`h-8 w-1 shrink-0 rounded-full ${status.key === 'expiring' ? 'bg-amber-400' : status.key === 'missing' ? 'bg-slate-300' : 'bg-red-500'}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-800">{product.name}</span>
                    <span className="block text-xs text-slate-500">{status.version ? `v${status.version.version} · ${formatAge(status.age)} old` : 'No SDS on file'}</span>
                  </span>
                  <SdsStatusBadge status={status} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Top liquids by volume</h2>
            <Link to={`/inventory?${scopeQs}`} className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline">Inventory <ArrowRight className="h-3 w-3" /></Link>
          </div>
          <ul className="mt-4 space-y-3.5">
            {topProducts.map(([id, a], i) => (
              <li key={id}>
                <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                  <Link to={`/products/${id}`} className="truncate font-medium text-slate-700 hover:text-brand-600">
                    <span className="mr-2 text-xs text-slate-400">{i + 1}</span>{productById[id]?.name}
                  </Link>
                  <span className="shrink-0 font-semibold tabular-nums text-slate-900">{formatNumber(a.qty)} L</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all duration-700" style={{ width: `${(a.qty / topMax) * 100}%` }} />
                </div>
                <p className="mt-0.5 text-[11px] text-slate-500">{a.locations.size} location{a.locations.size > 1 ? 's' : ''}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Facility statistics · {year}</h2>
            <Link to="/facilities" className="text-xs font-medium text-brand-600 hover:underline">All facilities</Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {facilities.map((fac, i) => {
              const rows = inventory.filter((r) => r.facilityId === fac.id && r.year === year)
              const pids = [...new Set(rows.map((r) => r.productId))]
              const flags = pids.filter((id) => ['outdated', 'missing'].includes(sdsStatus(sdsByProduct[id]).key)).length
              const pct = pids.length ? Math.round(((pids.length - flags) / pids.length) * 100) : 100
              const litres = rows.filter((r) => r.unit === 'L').reduce((s, r) => s + r.quantity, 0)
              return (
                <Link key={fac.id} to={`/facilities/${fac.id}?year=${year}`}
                  className={`card card-hover p-4 ${f.facility === fac.id ? 'ring-2 ring-brand-500' : ''}`}>
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold text-snow" style={{ background: FACILITY_COLORS[i % 4] }}>{fac.code}</span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{fac.name}</p>
                      <p className="text-xs text-slate-500">{fac.type}</p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div><p className="text-base font-bold tabular-nums text-slate-900">{pids.length}</p><p className="text-[10px] uppercase text-slate-500">Products</p></div>
                    <div><p className="text-base font-bold tabular-nums text-slate-900">{kfmt(Math.round(litres))}</p><p className="text-[10px] uppercase text-slate-500">Litres</p></div>
                    <div><p className={`text-base font-bold tabular-nums ${flags ? 'text-red-600' : 'text-emerald-600'}`}>{flags}</p><p className="text-[10px] uppercase text-slate-500">SDS flags</p></div>
                  </div>
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-[11px] text-slate-500"><span>SDS compliance</span><span className="font-medium">{pct}%</span></div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct >= 90 ? '#10b981' : pct >= 70 ? '#f59e0b' : '#ef4444' }} />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
