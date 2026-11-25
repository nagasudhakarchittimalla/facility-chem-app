import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowLeft, Boxes, Building2, Droplets, FileWarning, MapPin, Warehouse } from 'lucide-react'
import { useStore } from '../store/AppStore'
import { useFilters } from '../components/useFilters'
import { useChartTheme } from '../components/ThemeContext'
import { EmptyState, HazardBadges, PageHeader, SdsStatusBadge, Select, StatCard } from '../components/ui'
import { formatNumber, sdsStatus } from '../utils/sds'

export default function FacilityDetail() {
  const { id } = useParams()
  const { facilityById, inventory, productById, sdsByProduct, years } = useStore()
  const chart = useChartTheme()
  const [f, setFilter] = useFilters({ year: String(years[years.length - 1]) })
  const year = Number(f.year)
  const fac = id ? facilityById[id] : undefined

  const rows = useMemo(() => inventory.filter((i) => i.facilityId === id && i.year === year), [inventory, id, year])

  if (!fac) {
    return <div className="card"><EmptyState icon={Building2} title="Facility not found" action={<Link to="/facilities" className="btn-primary">All facilities</Link>} /></div>
  }

  const pids = [...new Set(rows.map((r) => r.productId))]
  const liters = rows.filter((r) => r.unit === 'L').reduce((s, r) => s + r.quantity, 0)
  const flagged = pids.filter((p) => ['outdated', 'missing'].includes(sdsStatus(sdsByProduct[p]).key))
  const byLocation = fac.locations.map((l) => {
    const lr = rows.filter((r) => r.locationId === l.id)
    return { ...l, rows: lr, litres: lr.filter((r) => r.unit === 'L').reduce((s, r) => s + r.quantity, 0) }
  })

  return (
    <>
      <Link to="/facilities" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Facilities
      </Link>
      <PageHeader
        eyebrow={`${fac.type} · ${fac.code}`}
        title={fac.name}
        subtitle={<span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{fac.address} · Manager: {fac.manager}</span>}
        actions={
          <>
            <Select className="w-28" value={f.year} onChange={(v) => setFilter('year', v)} options={years.map((y) => ({ value: String(y), label: String(y) }))} />
            <Link to={`/inventory?facility=${fac.id}&year=${year}`} className="btn-primary">Open inventory</Link>
          </>
        }
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Boxes} label="Products" value={pids.length} hint={`${rows.length} inventory records`} />
        <StatCard icon={Warehouse} label="Storage locations" value={fac.locations.length} hint={`${formatNumber(fac.areaSqFt)} sq ft site`} tone="slate" />
        <StatCard icon={Droplets} label="Liquids on hand" value={`${formatNumber(liters)} L`} tone="green" />
        <StatCard icon={FileWarning} label="SDS flags" value={flagged.length} hint="Outdated (>5 yrs) or missing" tone={flagged.length ? 'red' : 'green'} />
      </div>

      <div className="card mt-6 p-5">
        <h2 className="font-semibold text-slate-900">Liquid volume by storage location · {year}</h2>
        <div className="mt-4 h-64">
          <ResponsiveContainer>
            <BarChart data={byLocation} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={chart.grid} />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: chart.axis }} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} />
              <YAxis type="category" dataKey="name" width={140} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: chart.axis }} />
              <Tooltip {...chart.tooltip} cursor={{ fill: chart.cursor }} formatter={(v) => `${formatNumber(Number(v))} L`} />
              <Bar dataKey="litres" name="Litres" fill="#3b74f6" radius={[0, 6, 6, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <h2 className="mb-3 mt-8 text-lg font-semibold text-slate-900">Storage locations</h2>
      <div className="grid gap-5 lg:grid-cols-2">
        {byLocation.map((loc) => (
          <div key={loc.id} className="card overflow-hidden transition hover:shadow-md">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <p className="font-medium text-slate-900">{loc.name}</p>
                <p className="text-xs text-slate-500">{loc.type} · {loc.id}</p>
              </div>
              <Link to={`/inventory?facility=${fac.id}&location=${loc.id}&year=${year}`} className="text-xs font-medium text-brand-600 hover:underline">
                {loc.rows.length} items
              </Link>
            </div>
            <ul className="divide-y divide-slate-100">
              {loc.rows.length === 0 && <li className="px-4 py-6 text-center text-sm text-slate-500">No stock recorded for {year}</li>}
              {loc.rows.map((r) => {
                const p = productById[r.productId]
                if (!p) return null
                return (
                  <li key={r.id} className="flex flex-col gap-1 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <Link to={`/products/${p.id}`} className="text-sm font-medium text-slate-800 hover:text-brand-600">{p.name}</Link>
                      <div className="mt-1"><HazardBadges hazards={p.hazards} compact /></div>
                    </div>
                    <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-1">
                      <span className="whitespace-nowrap text-sm font-semibold tabular-nums">{formatNumber(r.quantity)} {r.unit}</span>
                      <SdsStatusBadge status={sdsStatus(sdsByProduct[p.id])} />
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </>
  )
}
