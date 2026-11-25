import { Fragment, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, Download, MapPin, MoreHorizontal, Pencil, Plus, Search, SlidersHorizontal, Trash2, Boxes, X } from 'lucide-react'
import { useStore } from '../store/AppStore'
import { useFilters } from '../components/useFilters'
import { useToast } from '../components/ToastContext'
import { EmptyState, FilterChips, type FilterChip, HazardBadges, IngredientsTable, Modal, PageHeader, SdsStatusBadge, Select } from '../components/ui'
import InventoryFormModal from '../components/InventoryFormModal'
import { formatDate, formatNumber, sdsStatus } from '../utils/sds'
import { HAZARD_CLASSES } from '../data/mockData'
import type { HazardClass, InventoryRecord, Product, SdsStatusKey, Unit } from '../types'

type SortKey = 'product' | 'location' | 'quantity' | 'year'

const SDS_LABELS: Record<SdsStatusKey, string> = { current: 'Current', expiring: 'Review soon', outdated: 'Older than 5 yrs', missing: 'Missing' }

export default function Inventory() {
  const { facilities, inventory, productById, facilityById, locationById, sdsByProduct, years, dispatch } = useStore()
  const toast = useToast()
  const latest = String(years[years.length - 1])
  const [f, setFilter, reset] = useFilters({ facility: 'all', year: latest, location: 'all', hazard: 'all', sds: 'all', q: '' })
  type FilterKey = keyof typeof f
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editing, setEditing] = useState<InventoryRecord | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [deleting, setDeleting] = useState<InventoryRecord | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'product', dir: 1 })

  const facility = facilityById[f.facility]
  const locationOptions = [
    { value: 'all', label: 'All locations' },
    ...(facility ? facility.locations : facilities.flatMap((x) => x.locations)).map((l) => ({ value: l.id, label: l.name })),
  ]

  const rows = useMemo(() => {
    const q = f.q.trim().toLowerCase()
    const list = inventory.filter((i) => {
      const p = productById[i.productId]
      if (!p) return false
      if (f.facility !== 'all' && i.facilityId !== f.facility) return false
      if (f.year !== 'all' && i.year !== Number(f.year)) return false
      if (f.location !== 'all' && i.locationId !== f.location) return false
      if (f.hazard !== 'all' && !p.hazards.includes(f.hazard as HazardClass)) return false
      if (f.sds !== 'all' && sdsStatus(sdsByProduct[p.id]).key !== f.sds) return false
      if (q && ![p.name, p.sku, p.manufacturer, locationById[i.locationId]?.name, ...p.ingredients.flatMap((x) => [x.name, x.cas])].join(' ').toLowerCase().includes(q)) return false
      return true
    })
    // `list` only contains records whose product exists (filtered above)
    const sorters: Record<SortKey, (i: InventoryRecord) => string | number> = {
      product: (i) => productById[i.productId]!.name,
      location: (i) => `${facilityById[i.facilityId]?.code} ${locationById[i.locationId]?.name}`,
      quantity: (i) => i.quantity,
      year: (i) => i.year,
    }
    const val = sorters[sort.key]
    return list.sort((a, b) => (val(a) > val(b) ? 1 : val(a) < val(b) ? -1 : 0) * sort.dir)
  }, [inventory, productById, locationById, facilityById, sdsByProduct, f, sort])

  const pages = Math.max(1, Math.ceil(rows.length / pageSize))
  const current = Math.min(page, pages)
  const pageRows = rows.slice((current - 1) * pageSize, current * pageSize)
  const totals = (['L', 'kg', 'cyl'] as Unit[]).map((u) => [u, rows.filter((r) => r.unit === u).reduce((s, r) => s + r.quantity, 0)] as const).filter(([, v]) => v)

  const setF = (k: FilterKey, v: string) => { setFilter(k, v); setPage(1) }
  const toggleSort = (key: SortKey) => setSort((s) => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : 1 }))

  type ChipDraft = Omit<FilterChip, 'onRemove'> & { key: FilterKey }
  const drafts: (ChipDraft | false | '')[] = [
    f.q && { key: 'q', name: 'Search', label: `“${f.q}”` },
    f.facility !== 'all' && { key: 'facility', name: 'Facility', label: facilityById[f.facility]?.code },
    f.year !== latest && { key: 'year', name: 'Year', label: f.year === 'all' ? 'All years' : f.year },
    f.location !== 'all' && { key: 'location', name: 'Location', label: locationById[f.location]?.name },
    f.hazard !== 'all' && { key: 'hazard', name: 'Hazard', label: f.hazard },
    f.sds !== 'all' && { key: 'sds', name: 'SDS', label: SDS_LABELS[f.sds as SdsStatusKey] },
  ]
  const chips: FilterChip[] = drafts.filter((c): c is ChipDraft => Boolean(c)).map((c) => ({ ...c, onRemove: () => setF(c.key, c.key === 'year' ? latest : c.key === 'q' ? '' : 'all') }))

  const exportCsv = () => {
    const header = ['Record ID', 'Product', 'SKU', 'Manufacturer', 'Facility', 'Location', 'Year', 'Containers', 'Container type', 'Quantity', 'Unit', 'Hazards', 'Ingredients (CAS)', 'SDS status']
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const lines = rows.map((r) => {
      const p = productById[r.productId]!
      return [r.id, p.name, p.sku, p.manufacturer, facilityById[r.facilityId]?.name, locationById[r.locationId]?.name, r.year, r.containerCount, r.container,
        r.quantity, r.unit, p.hazards.join('; '), p.ingredients.map((i) => `${i.name} (${i.cas})`).join('; '), sdsStatus(sdsByProduct[p.id]).label].map(esc).join(',')
    })
    const blob = new Blob([[header.map(esc).join(','), ...lines].join('\n')], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `chemtrack-inventory-${f.facility}-${f.year}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
    toast({ title: 'CSV exported', description: `${rows.length} records downloaded` })
  }

  const confirmDelete = () => {
    const item = deleting
    if (!item) return
    dispatch({ type: 'DELETE_INVENTORY', id: item.id })
    setDeleting(null)
    toast({
      title: 'Record deleted',
      description: `${productById[item.productId]?.name} · ${locationById[item.locationId]?.name}`,
      tone: 'info',
      action: { label: 'Undo', onClick: () => { dispatch({ type: 'RESTORE_INVENTORY', item }); toast('Record restored') } },
    })
  }

  const SortTh = ({ k, children, className = '' }: { k: SortKey; children: ReactNode; className?: string }) => (
    <th className={`th cursor-pointer select-none transition hover:text-slate-900 ${className}`} onClick={() => toggleSort(k)}>
      <span className="inline-flex items-center gap-1">
        {children}
        <ChevronDown className={`h-3 w-3 transition ${sort.key === k ? 'opacity-100' : 'opacity-0'} ${sort.key === k && sort.dir === -1 ? 'rotate-180' : ''}`} />
      </span>
    </th>
  )

  const activeFilterCount = chips.filter((c) => c.key !== 'q').length

  return (
    <>
      <PageHeader
        eyebrow="Inventory"
        title="Chemical Inventory"
        subtitle="Product quantities, storage locations and composition by facility and reporting year"
        actions={
          <>
            <button className="btn-secondary" onClick={exportCsv} disabled={!rows.length}><Download className="h-4 w-4" /> <span className="hidden sm:inline">Export</span> CSV</button>
            <button className="btn-primary" onClick={() => { setEditing(null); setFormOpen(true) }}><Plus className="h-4 w-4" /> Add record</button>
          </>
        }
      />

      <div className="card mb-4 p-4">
        <div className="flex gap-2">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className="input pl-9 pr-9" placeholder="Search product, SKU, ingredient, CAS or location…" value={f.q} onChange={(e) => setF('q', e.target.value)} />
            {f.q && <button onClick={() => setF('q', '')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700"><X className="h-4 w-4" /></button>}
          </label>
          <button className="btn-secondary relative lg:hidden" onClick={() => setShowFilters((s) => !s)}>
            <SlidersHorizontal className="h-4 w-4" /> Filters
            {activeFilterCount > 0 && <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-snow">{activeFilterCount}</span>}
          </button>
        </div>
        <div className={`${showFilters ? 'grid' : 'hidden'} mt-3 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid lg:grid-cols-5`}>
          <Select label="Facility" value={f.facility} onChange={(v) => setF('facility', v)}
            options={[{ value: 'all', label: 'All facilities' }, ...facilities.map((x) => ({ value: x.id, label: x.name }))]} />
          <Select label="Year" value={f.year} onChange={(v) => setF('year', v)}
            options={[{ value: 'all', label: 'All years' }, ...years.map((y) => ({ value: String(y), label: String(y) }))]} />
          <Select label="Location" value={f.location} onChange={(v) => setF('location', v)} options={locationOptions} />
          <Select label="Hazard class" value={f.hazard} onChange={(v) => setF('hazard', v)}
            options={[{ value: 'all', label: 'All hazards' }, ...HAZARD_CLASSES.map((h) => ({ value: h, label: h }))]} />
          <Select label="SDS status" value={f.sds} onChange={(v) => setF('sds', v)}
            options={[{ value: 'all', label: 'Any status' }, ...Object.entries(SDS_LABELS).map(([value, label]) => ({ value, label }))]} />
        </div>
      </div>

      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterChips chips={chips} onClear={() => { reset(); setPage(1) }} />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600 sm:ml-auto">
          <span><strong className="text-slate-900">{rows.length}</strong> records</span>
          <span><strong className="text-slate-900">{new Set(rows.map((r) => r.productId)).size}</strong> products</span>
          {totals.map(([u, v]) => <span key={u}><strong className="text-slate-900">{formatNumber(v)}</strong> {u === 'cyl' ? 'cyl.' : u}</span>)}
        </div>
      </div>

      <div className="card overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState icon={Boxes} title="No inventory matches your filters" text="Try removing a filter or choosing another reporting year."
            action={<button className="btn-secondary" onClick={() => { reset(); setPage(1) }}>Clear all filters</button>} />
        ) : (
          <>
            <div className="hidden max-h-[70vh] overflow-auto md:block">
              <table className="min-w-full">
                <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
                  <tr className="border-b border-slate-200">
                    <SortTh k="product">Product</SortTh>
                    <SortTh k="location">Facility / Location</SortTh>
                    <SortTh k="year">Year</SortTh>
                    <SortTh k="quantity" className="text-right">Quantity</SortTh>
                    <th className="th">Hazards</th>
                    <th className="th">SDS</th>
                    <th className="th w-24" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pageRows.map((r) => {
                    const p = productById[r.productId]!
                    const open = expanded === r.id
                    return (
                      <Fragment key={r.id}>
                        <tr className={`group cursor-pointer transition ${open ? 'bg-brand-50/40' : 'hover:bg-slate-50'}`} onClick={() => setExpanded(open ? null : r.id)}>
                          <td className="td">
                            <div className="flex items-center gap-3">
                              <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition ${open ? '' : '-rotate-90'}`} />
                              <div className="min-w-0">
                                <Link to={`/products/${p.id}`} onClick={(e) => e.stopPropagation()} className="font-medium text-slate-900 hover:text-brand-600">{p.name}</Link>
                                <p className="truncate text-xs text-slate-500">{p.sku} · {p.ingredients.length} ingredient{p.ingredients.length > 1 ? 's' : ''}</p>
                              </div>
                            </div>
                          </td>
                          <td className="td">
                            <span className="mr-1.5 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600">{facilityById[r.facilityId]?.code}</span>
                            <span className="text-slate-700">{locationById[r.locationId]?.name}</span>
                          </td>
                          <td className="td tabular-nums text-slate-500">{r.year}</td>
                          <td className="td whitespace-nowrap text-right">
                            <p className="font-semibold tabular-nums text-slate-900">{formatNumber(r.quantity)} <span className="font-normal text-slate-500">{r.unit}</span></p>
                            <p className="text-xs text-slate-500">{r.containerCount} × {r.container}</p>
                          </td>
                          <td className="td"><HazardBadges hazards={p.hazards} compact /></td>
                          <td className="td"><SdsStatusBadge status={sdsStatus(sdsByProduct[p.id])} /></td>
                          <td className="td whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-end opacity-60 transition group-hover:opacity-100">
                              <button className="btn-ghost p-1.5" title="Edit" onClick={() => { setEditing(r); setFormOpen(true) }}><Pencil className="h-4 w-4" /></button>
                              <button className="btn-ghost p-1.5 hover:bg-red-50 hover:text-red-600" title="Delete" onClick={() => setDeleting(r)}><Trash2 className="h-4 w-4" /></button>
                            </div>
                          </td>
                        </tr>
                        {open && (
                          <tr className="bg-brand-50/40">
                            <td colSpan={7} className="px-4 pb-5 pl-11 pt-1"><div className="animate-fade-up"><ExpandedDetails row={r} product={p} /></div></td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-slate-100 md:hidden">
              {pageRows.map((r) => {
                const p = productById[r.productId]!
                const open = expanded === r.id
                return (
                  <li key={r.id} className={`p-4 transition ${open ? 'bg-brand-50/40' : ''}`}>
                    <button className="flex w-full items-start justify-between gap-3 text-left" onClick={() => setExpanded(open ? null : r.id)}>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900">{p.name}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                          <MapPin className="h-3 w-3 shrink-0" /> <span className="truncate">{facilityById[r.facilityId]?.code} · {locationById[r.locationId]?.name}</span>
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="whitespace-nowrap font-semibold tabular-nums text-slate-900">{formatNumber(r.quantity)} {r.unit}</p>
                        <p className="text-xs text-slate-500">{r.year} · {r.containerCount} cont.</p>
                      </div>
                    </button>
                    <div className="mt-2.5 flex items-center justify-between gap-2">
                      <HazardBadges hazards={p.hazards} compact />
                      <div className="flex items-center gap-2">
                        <SdsStatusBadge status={sdsStatus(sdsByProduct[p.id])} />
                        <button onClick={() => setExpanded(open ? null : r.id)} className="btn-ghost p-1"><MoreHorizontal className="h-4 w-4" /></button>
                      </div>
                    </div>
                    {open && (
                      <div className="mt-4 animate-fade-up space-y-3">
                        <ExpandedDetails row={r} product={p} />
                        <div className="grid grid-cols-3 gap-2">
                          <Link to={`/products/${p.id}`} className="btn-secondary">Product</Link>
                          <button className="btn-secondary" onClick={() => { setEditing(r); setFormOpen(true) }}><Pencil className="h-4 w-4" /> Edit</button>
                          <button className="btn-secondary text-red-600" onClick={() => setDeleting(r)}><Trash2 className="h-4 w-4" /> Delete</button>
                        </div>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>

            <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-slate-500">
                Rows
                <select className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}>
                  {[10, 15, 25, 50].map((n) => <option key={n}>{n}</option>)}
                </select>
                <span>· {(current - 1) * pageSize + 1}–{Math.min(current * pageSize, rows.length)} of {rows.length}</span>
              </div>
              <div className="flex items-center gap-1">
                <button className="btn-secondary px-3 py-1.5" disabled={current === 1} onClick={() => setPage(current - 1)}>Previous</button>
                {Array.from({ length: pages }, (_, i) => i + 1).filter((n) => n === 1 || n === pages || Math.abs(n - current) <= 1).map((n, i, arr) => (
                  <Fragment key={n}>
                    {i > 0 && n - arr[i - 1] > 1 && <span className="px-1 text-slate-400">…</span>}
                    <button onClick={() => setPage(n)} className={`hidden h-8 min-w-[2rem] rounded-lg text-sm font-medium sm:block ${n === current ? 'bg-brand-600 text-snow' : 'text-slate-600 hover:bg-slate-100'}`}>{n}</button>
                  </Fragment>
                ))}
                <button className="btn-secondary px-3 py-1.5" disabled={current === pages} onClick={() => setPage(current + 1)}>Next</button>
              </div>
            </div>
          </>
        )}
      </div>

      <InventoryFormModal open={formOpen} onClose={() => setFormOpen(false)} item={editing} onSaved={(m) => toast(m)} />
      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete inventory record?" size="md"
        footer={<><button className="btn-secondary" onClick={() => setDeleting(null)}>Cancel</button><button className="btn-danger" onClick={confirmDelete}><Trash2 className="h-4 w-4" /> Delete</button></>}>
        {deleting && (
          <div className="flex gap-3 rounded-xl bg-red-50 p-3 text-sm text-red-800">
            <Trash2 className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              <strong>{productById[deleting.productId]?.name}</strong> — {formatNumber(deleting.quantity)} {deleting.unit} at {locationById[deleting.locationId]?.name} ({deleting.year}).
              You can undo this right after.
            </p>
          </div>
        )}
      </Modal>
    </>
  )
}

function ExpandedDetails({ row, product }: { row: InventoryRecord; product: Product }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <p className="label">Chemical ingredients</p>
        <IngredientsTable ingredients={product.ingredients} />
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div><dt className="text-xs text-slate-500">Physical state</dt><dd className="font-medium text-slate-800">{product.physicalState}</dd></div>
          <div><dt className="text-xs text-slate-500">Signal word</dt><dd className={`font-medium ${product.signalWord === 'Danger' ? 'text-red-600' : 'text-slate-800'}`}>{product.signalWord}</dd></div>
          <div><dt className="text-xs text-slate-500">Max daily amount</dt><dd className="font-medium tabular-nums text-slate-800">{formatNumber(row.maxDailyAmount)} {row.unit}</dd></div>
          <div><dt className="text-xs text-slate-500">Last updated</dt><dd className="font-medium text-slate-800">{formatDate(row.lastUpdated)}</dd></div>
          <div className="col-span-2"><dt className="text-xs text-slate-500">Hazards</dt><dd className="mt-1"><HazardBadges hazards={product.hazards} /></dd></div>
          <div className="col-span-2"><dt className="text-xs text-slate-500">Storage</dt><dd className="text-slate-700">{product.storage}</dd></div>
        </dl>
      </div>
    </div>
  )
}
