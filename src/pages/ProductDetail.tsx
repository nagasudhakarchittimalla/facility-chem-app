import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Building2, FlaskConical, MailCheck, MapPin, Pencil, Plus, Send, Upload, Warehouse } from 'lucide-react'
import { useStore } from '../store/AppStore'
import { useToast } from '../components/ToastContext'
import { EmptyState, HAZARD_META, IngredientsTable, SdsStatusBadge, Segmented } from '../components/ui'
import InventoryFormModal from '../components/InventoryFormModal'
import { SdsPreviewModal, SdsUploadModal } from '../components/SdsModals'
import { VersionTimeline } from './SDSManagement'
import type { InventoryRecord, SdsVersion } from '../types'
import { formatAge, formatDate, formatNumber, reviewDueDate, sdsStatus, SDS_MAX_AGE_YEARS } from '../utils/sds'

export default function ProductDetail() {
  const { id } = useParams()
  const { productById, inventory, sdsByProduct, sdsRequests = {}, facilityById, locationById, years, dispatch } = useStore()
  const toast = useToast()
  const [year, setYear] = useState(String(years[years.length - 1]))
  const [invOpen, setInvOpen] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [preview, setPreview] = useState<SdsVersion | null>(null)
  const p = id ? productById[id] : undefined

  if (!p) return <div className="card"><EmptyState icon={FlaskConical} title="Product not found" action={<Link to="/products" className="btn-primary">All products</Link>} /></div>

  const doc = sdsByProduct[p.id]
  const status = sdsStatus(doc)
  const requested = sdsRequests[p.id]
  const allStock = inventory.filter((i) => i.productId === p.id)
  const stock = allStock.filter((i) => year === 'all' || i.year === Number(year))
  const total = stock.reduce((s, i) => s + i.quantity, 0)
  const facilityCount = new Set(stock.map((s) => s.facilityId)).size
  const unitLabel = p.unit === 'cyl' ? 'cylinders' : p.unit

  // group stock by facility for a clearer location view
  const byFacility = Object.entries(stock.reduce<Record<string, InventoryRecord[]>>((g, s) => ((g[s.facilityId] ||= []).push(s), g), {}))
  const maxQty = Math.max(1, ...stock.map((s) => s.quantity))

  return (
    <>
      <Link to="/products" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Product catalog
      </Link>

      <section className="card mb-6 overflow-hidden">
        <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 gap-4">
            <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-snow shadow-lg shadow-brand-600/20 sm:flex">
              <FlaskConical className="h-7 w-7" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600">{p.sku}</span>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{p.category}</span>
                {p.signalWord !== 'None' && (
                  <span className={`rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${p.signalWord === 'Danger' ? 'bg-red-600 text-snow' : 'bg-amber-400 text-ink-900'}`}>{p.signalWord}</span>
                )}
              </div>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">{p.name}</h1>
              <p className="mt-0.5 text-sm text-slate-500">{p.manufacturer} · {p.physicalState}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to={`/products/${p.id}/edit`} className="btn-secondary"><Pencil className="h-4 w-4" /> Edit</Link>
            <button className="btn-primary" onClick={() => setInvOpen(true)}><Plus className="h-4 w-4" /> Add stock</button>
          </div>
        </div>
        {/* Hazard pictogram strip */}
        <div className="flex flex-wrap gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3 sm:px-6">
          {p.hazards.length === 0 && <span className="text-sm text-slate-500">No GHS hazard classification</span>}
          {p.hazards.map((h) => {
            const { icon: Icon, cls } = HAZARD_META[h]
            return (
              <span key={h} className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium ring-1 ring-inset ${cls}`}>
                <Icon className="h-4 w-4" /> {h}
              </span>
            )
          })}
        </div>
        <div className="grid grid-cols-2 divide-slate-100 border-t border-slate-100 sm:grid-cols-4 sm:divide-x">
          {[
            ['On hand', `${formatNumber(total)} ${unitLabel}`, year === 'all' ? 'all years' : year],
            ['Locations', stock.length, `${facilityCount} facilit${facilityCount === 1 ? 'y' : 'ies'}`],
            ['Ingredients', p.ingredients.length, 'SDS Section 3'],
            ['SDS', doc ? `v${status.version?.version}` : '—', doc ? `${formatAge(status.age)} old` : 'not on file'],
          ].map(([k, v, h]) => (
            <div key={k} className="px-5 py-3 sm:px-6">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{k}</p>
              <p className="text-lg font-bold tabular-nums text-slate-900">{v}</p>
              <p className="text-xs text-slate-500">{h}</p>
            </div>
          ))}
        </div>
      </section>

      {(status.key === 'outdated' || status.key === 'missing') && (
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-start gap-3">
            <div className="rounded-lg bg-red-100 p-1.5"><AlertTriangle className="h-5 w-5" /></div>
            <div>
              <p className="font-semibold">{status.key === 'missing' ? 'Safety Data Sheet missing' : `SDS is older than ${SDS_MAX_AGE_YEARS} years`}</p>
              <p className="text-red-700">
                {status.key === 'missing'
                  ? 'No SDS is on file. Obtain one from the manufacturer before use.'
                  : `v${status.version!.version} was issued ${formatDate(status.version!.issueDate)} (${formatAge(status.age)} ago). Review was due ${formatDate(reviewDueDate(status.version!.issueDate))}.`}
                {requested && <> An update was requested on {formatDate(requested)}.</>}
              </p>
            </div>
          </div>
          <div className="flex gap-2 sm:shrink-0">
            {requested ? (
              <span className="btn border border-red-200 bg-white text-red-700"><MailCheck className="h-4 w-4" /> Requested</span>
            ) : (
              <button className="btn border border-red-200 bg-white text-red-700 hover:bg-red-100"
                onClick={() => { dispatch({ type: 'REQUEST_SDS_UPDATE', productIds: [p.id] }); toast({ title: 'Update requested', description: `Mock email sent to ${p.manufacturer}` }) }}>
                <Send className="h-4 w-4" /> Request update
              </button>
            )}
            <button className="btn-danger" onClick={() => setUploadOpen(true)}><Upload className="h-4 w-4" /> Upload</button>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="card p-5">
            <h2 className="font-semibold text-slate-900">Chemical ingredients</h2>
            <p className="mb-3 text-xs text-slate-500">Composition by weight · bar shows concentration range</p>
            <IngredientsTable ingredients={p.ingredients} />
          </section>

          <section className="card p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-slate-900">Quantities & locations</h2>
                <p className="text-xs text-slate-500">{stock.length} storage records · {formatNumber(total)} {unitLabel}</p>
              </div>
              <Segmented value={year} onChange={setYear} options={[{ value: 'all', label: 'All' }, ...years.slice(-3).map((y) => ({ value: String(y), label: String(y) }))]} />
            </div>
            {stock.length === 0 ? (
              <EmptyState icon={Warehouse} title="No stock recorded" text="Add stock to track where this product is stored."
                action={<button className="btn-primary" onClick={() => setInvOpen(true)}><Plus className="h-4 w-4" /> Add stock</button>} />
            ) : (
              <div className="space-y-4">
                {byFacility.map(([fid, items]) => (
                  <div key={fid} className="rounded-xl border border-slate-200">
                    <Link to={`/facilities/${fid}`} className="flex items-center gap-2 border-b border-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-800 hover:text-brand-600">
                      <Building2 className="h-4 w-4 text-slate-400" /> {facilityById[fid]?.name}
                      <span className="ml-auto text-xs font-normal text-slate-500">{formatNumber(items.reduce((s, i) => s + i.quantity, 0))} {unitLabel}</span>
                    </Link>
                    <ul className="divide-y divide-slate-100">
                      {items.map((s) => (
                        <li key={s.id} className="flex items-center gap-3 px-4 py-2.5">
                          <MapPin className="h-4 w-4 shrink-0 text-slate-300" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm text-slate-700">{locationById[s.locationId]?.name}</p>
                            <p className="text-xs text-slate-500">{s.year} · {s.containerCount} × {s.container}</p>
                          </div>
                          <div className="hidden w-28 sm:block">
                            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-500" style={{ width: `${(s.quantity / maxQty) * 100}%` }} /></div>
                          </div>
                          <span className="w-24 text-right text-sm font-semibold tabular-nums text-slate-900">{formatNumber(s.quantity)} {s.unit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">SDS versions</h2>
              <SdsStatusBadge status={status} />
            </div>
            {doc ? <VersionTimeline doc={doc} onPreview={setPreview} /> : <p className="text-sm text-slate-500">No SDS documents uploaded yet.</p>}
            <button className="btn-secondary mt-4 w-full" onClick={() => setUploadOpen(true)}><Upload className="h-4 w-4" /> Upload new version</button>
          </section>

          <section className="card p-5">
            <h2 className="mb-3 font-semibold text-slate-900">Handling & storage</h2>
            <p className="text-sm leading-relaxed text-slate-600">{p.storage || 'No storage requirements recorded.'}</p>
            <dl className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
              {[['Product ID', p.id], ['Unit of measure', unitLabel], ['Records (all years)', allStock.length]].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3"><dt className="text-slate-500">{k}</dt><dd className="font-medium text-slate-800">{v}</dd></div>
              ))}
            </dl>
          </section>
        </div>
      </div>

      <InventoryFormModal open={invOpen} onClose={() => setInvOpen(false)} presetProductId={p.id} onSaved={(m) => toast(m)} />
      <SdsUploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} presetProductId={p.id} onSaved={(m) => toast(m)} />
      <SdsPreviewModal open={!!preview} onClose={() => setPreview(null)} productId={p.id} version={preview} />
    </>
  )
}
