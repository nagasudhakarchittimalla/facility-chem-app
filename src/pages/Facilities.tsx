import { Link } from 'react-router-dom'
import { Building2, MapPin, Users, ArrowRight } from 'lucide-react'
import { useStore } from '../store/AppStore'
import { useFilters } from '../components/useFilters'
import { PageHeader, Select } from '../components/ui'
import { formatNumber, sdsStatus } from '../utils/sds'

export default function Facilities() {
  const { facilities, inventory, sdsByProduct, years } = useStore()
  const [f, setFilter] = useFilters({ year: String(years[years.length - 1]) })
  const year = Number(f.year)

  return (
    <>
      <PageHeader
        eyebrow="Sites"
        title="Facilities"
        subtitle={`${facilities.length} sites with chemical inventory`}
        actions={<Select className="w-32" value={f.year} onChange={(v) => setFilter('year', v)} options={years.map((y) => ({ value: String(y), label: String(y) }))} />}
      />
      <div className="grid gap-5 md:grid-cols-2">
        {facilities.map((fac) => {
          const rows = inventory.filter((i) => i.facilityId === fac.id && i.year === year)
          const pids = [...new Set(rows.map((r) => r.productId))]
          const liters = rows.filter((r) => r.unit === 'L').reduce((s, r) => s + r.quantity, 0)
          const flags = pids.filter((id) => ['outdated', 'missing'].includes(sdsStatus(sdsByProduct[id]).key)).length
          return (
            <Link key={fac.id} to={`/facilities/${fac.id}?year=${year}`} className="card card-hover group p-5">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-brand-50 p-3 text-brand-600"><Building2 className="h-6 w-6" /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="truncate font-semibold text-slate-900 group-hover:text-brand-700">{fac.name}</h2>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-600">{fac.code}</span>
                  </div>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500"><MapPin className="h-3 w-3" />{fac.address}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500"><Users className="h-3 w-3" />{fac.manager} · {fac.employees} employees</p>
                </div>
              </div>
              <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ['Products', pids.length],
                  ['Locations', fac.locations.length],
                  ['Liquids', `${formatNumber(liters)} L`],
                  ['SDS flags', flags],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-lg bg-slate-50 px-3 py-2">
                    <dt className="text-[11px] uppercase tracking-wide text-slate-500">{k}</dt>
                    <dd className={`text-lg font-semibold ${k === 'SDS flags' && v ? 'text-red-600' : 'text-slate-900'}`}>{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-600">
                View facility <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </p>
            </Link>
          )
        })}
      </div>
    </>
  )
}
