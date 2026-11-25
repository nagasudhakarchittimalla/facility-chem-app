import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FlaskConical, LayoutGrid, List, Plus, Search, X } from 'lucide-react'
import { useStore } from '../store/AppStore'
import { useFilters } from '../components/useFilters'
import { EmptyState, HazardBadges, PageHeader, SdsStatusBadge, Select } from '../components/ui'
import { sdsStatus } from '../utils/sds'
import { HAZARD_CLASSES } from '../data/mockData'
import type { HazardClass, Product } from '../types'

type ProductView = 'grid' | 'list'

export default function Products() {
  const { products, inventory, sdsByProduct, facilityById } = useStore()
  const navigate = useNavigate()
  const [f, setFilter, reset] = useFilters({ q: '', category: 'all', hazard: 'all' })
  const [view, setView] = useState<ProductView>(() => { try { return (localStorage.getItem('chemtrack-products-view') as ProductView | null) || 'grid' } catch { return 'grid' } })
  const setViewP = (v: ProductView) => { setView(v); try { localStorage.setItem('chemtrack-products-view', v) } catch { /* ignore */ } }
  const categories = [...new Set(products.map((p) => p.category))].sort()

  const list = useMemo(() => {
    const q = f.q.trim().toLowerCase()
    return products.filter((p) => {
      if (f.category !== 'all' && p.category !== f.category) return false
      if (f.hazard !== 'all' && !p.hazards.includes(f.hazard as HazardClass)) return false
      return !q || [p.name, p.sku, p.manufacturer, ...p.ingredients.flatMap((i) => [i.name, i.cas])].join(' ').toLowerCase().includes(q)
    })
  }, [products, f])

  const facilitiesFor = (pid: string) => [...new Set(inventory.filter((i) => i.productId === pid).map((i) => i.facilityId))]
  const matchedIngredient = (p: Product) => {
    const q = f.q.trim().toLowerCase()
    if (!q) return null
    return p.ingredients.find((i) => i.name.toLowerCase().includes(q) || i.cas.includes(q))
  }

  return (
    <>
      <PageHeader
        eyebrow="Catalog"
        title="Products"
        subtitle={`${products.length} chemical products with composition, hazard classification and SDS`}
        actions={<Link to="/products/new" className="btn-primary"><Plus className="h-4 w-4" /> Add product</Link>}
      />

      <div className="card mb-4 p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className="input pl-9 pr-9" placeholder="Search by name, SKU, manufacturer, ingredient or CAS…" value={f.q} onChange={(e) => setFilter('q', e.target.value)} />
            {f.q && <button onClick={() => setFilter('q', '')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700"><X className="h-4 w-4" /></button>}
          </label>
          <div className="flex gap-2">
            <Select className="flex-1 sm:w-48" value={f.hazard} onChange={(v) => setFilter('hazard', v)}
              options={[{ value: 'all', label: 'All hazards' }, ...HAZARD_CLASSES.map((h) => ({ value: h, label: h }))]} />
            <div className="flex rounded-lg border border-slate-300 bg-white p-0.5">
              {([['grid', LayoutGrid], ['list', List]] as const).map(([v, Icon]) => (
                <button key={v} onClick={() => setViewP(v)} aria-label={`${v} view`}
                  className={`rounded-md p-1.5 transition ${view === v ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-700'}`}>
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="-mx-1 mt-3 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {['all', ...categories].map((c) => (
            <button key={c} onClick={() => setFilter('category', c)} className={`chip shrink-0 ${f.category === c ? 'chip-on' : 'chip-off'}`}>
              {c === 'all' ? 'All categories' : c}
              <span className="ml-1 opacity-60">{c === 'all' ? products.length : products.filter((p) => p.category === c).length}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="mb-3 text-sm text-slate-500">Showing <strong className="text-slate-900">{list.length}</strong> of {products.length}</p>

      {list.length === 0 ? (
        <div className="card"><EmptyState icon={FlaskConical} title="No products found" text="Try a different search term or category." action={<button className="btn-secondary" onClick={reset}>Clear filters</button>} /></div>
      ) : view === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((p) => {
            const facs = facilitiesFor(p.id)
            const hit = matchedIngredient(p)
            return (
              <Link key={p.id} to={`/products/${p.id}`} className="card card-hover flex flex-col p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{p.name}</p>
                    <p className="truncate text-xs text-slate-500">{p.sku} · {p.manufacturer}</p>
                  </div>
                  <SdsStatusBadge status={sdsStatus(sdsByProduct[p.id])} />
                </div>
                <div className="mt-3"><HazardBadges hazards={p.hazards} max={3} /></div>
                <div className="mt-4 flex-1">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Ingredients</p>
                  <ul className="mt-1 space-y-0.5">
                    {p.ingredients.slice(0, 3).map((i) => (
                      <li key={i.cas} className={`flex justify-between gap-2 text-xs ${hit === i ? 'rounded bg-yellow-100 px-1 text-yellow-900' : 'text-slate-600'}`}>
                        <span className="truncate">{i.name}</span><span className="shrink-0 font-mono text-slate-400">{i.cas}</span>
                      </li>
                    ))}
                    {p.ingredients.length > 3 && <li className="text-xs text-slate-400">+{p.ingredients.length - 3} more</li>}
                  </ul>
                </div>
                <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600">{p.category}</span>
                  <span className="flex gap-1">
                    {facs.length ? facs.map((id) => <span key={id} className="rounded bg-brand-50 px-1.5 py-0.5 text-[11px] font-semibold text-brand-700">{facilityById[id]?.code}</span>)
                      : <span className="text-xs text-slate-400">Not stocked</span>}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="min-w-full">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr><th className="th">Product</th><th className="th">Category</th><th className="th">Hazards</th><th className="th">Ingredients</th><th className="th">Facilities</th><th className="th">SDS</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.map((p) => (
                <tr key={p.id} className="cursor-pointer hover:bg-slate-50" onClick={() => navigate(`/products/${p.id}`)}>
                  <td className="td"><p className="font-medium text-slate-900">{p.name}</p><p className="text-xs text-slate-500">{p.sku} · {p.manufacturer}</p></td>
                  <td className="td">{p.category}</td>
                  <td className="td"><HazardBadges hazards={p.hazards} compact /></td>
                  <td className="td max-w-xs truncate text-xs text-slate-500">{p.ingredients.map((i) => i.name).join(', ')}</td>
                  <td className="td whitespace-nowrap text-xs">{facilitiesFor(p.id).map((id) => facilityById[id]?.code).join(', ') || '—'}</td>
                  <td className="td"><SdsStatusBadge status={sdsStatus(sdsByProduct[p.id])} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
