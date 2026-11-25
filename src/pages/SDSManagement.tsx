import { Fragment, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, ChevronDown, Clock, Eye, FileText, FileX, MailCheck, Search, Send, Upload, X } from 'lucide-react'
import { useStore } from '../store/AppStore'
import { useFilters } from '../components/useFilters'
import { useToast } from '../components/ToastContext'
import { Badge, EmptyState, PageHeader, SdsStatusBadge, Select, StatCard } from '../components/ui'
import { SdsPreviewModal, SdsUploadModal } from '../components/SdsModals'
import { ageInYears, formatAge, formatDate, reviewDueDate, sdsStatus, SDS_MAX_AGE_YEARS, SDS_PRIORITY } from '../utils/sds'
import type { SdsDocument, SdsStatusKey, SdsVersion } from '../types'

const TABS: [key: SdsStatusKey | 'all', label: string][] = [
  ['all', 'All'], ['outdated', 'Older than 5 yrs'], ['missing', 'Missing'], ['expiring', 'Review soon'], ['current', 'Current'],
]

export default function SDSManagement() {
  const { products, sdsByProduct, sdsRequests = {}, inventory, facilities, facilityById, dispatch } = useStore()
  const toast = useToast()
  const location = useLocation()
  const navigate = useNavigate()
  const [f, setFilter, reset] = useFilters({ status: 'all', facility: 'all', q: '' })
  const [expanded, setExpanded] = useState<string | null>(null)
  const [upload, setUpload] = useState<{ open: boolean; productId: string | null }>({ open: false, productId: null })
  const [preview, setPreview] = useState<{ productId: string; version: SdsVersion } | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // Deep link from dashboard / command palette: open upload dialog
  useEffect(() => {
    if (location.state?.upload) {
      setUpload({ open: true, productId: null })
      navigate(location.pathname + location.search, { replace: true, state: null })
    }
  }, [location, navigate])

  const rows = useMemo(() => products
    .map((p) => ({
      product: p,
      doc: sdsByProduct[p.id],
      status: sdsStatus(sdsByProduct[p.id]),
      facs: [...new Set(inventory.filter((i) => i.productId === p.id).map((i) => i.facilityId))],
      requested: sdsRequests[p.id],
    }))
    .sort((a, b) => SDS_PRIORITY[a.status.key] - SDS_PRIORITY[b.status.key] || (b.status.age ?? 0) - (a.status.age ?? 0)), [products, sdsByProduct, inventory, sdsRequests])

  const counts = rows.reduce<Record<string, number>>((c, r) => ({ ...c, [r.status.key]: (c[r.status.key] || 0) + 1 }), { all: rows.length })
  const totalVersions = rows.reduce((s, r) => s + (r.doc?.versions.length || 0), 0)
  const requestedCount = Object.keys(sdsRequests).length

  const filtered = rows.filter((r) => {
    if (f.status !== 'all' && r.status.key !== f.status) return false
    if (f.facility !== 'all' && !r.facs.includes(f.facility)) return false
    const q = f.q.trim().toLowerCase()
    return !q || [r.product.name, r.product.sku, r.product.manufacturer, r.status.version?.fileName || ''].join(' ').toLowerCase().includes(q)
  })

  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const allSelected = filtered.length > 0 && filtered.every((r) => selected.has(r.product.id))
  const toggleAll = () => setSelected(allSelected ? new Set<string>() : new Set(filtered.map((r) => r.product.id)))

  const requestUpdates = (ids: string[]) => {
    dispatch({ type: 'REQUEST_SDS_UPDATE', productIds: ids })
    const makers = [...new Set(ids.map((id) => rows.find((r) => r.product.id === id)?.product.manufacturer))]
    toast({ title: `SDS update requested for ${ids.length} product${ids.length > 1 ? 's' : ''}`, description: `Mock email sent to ${makers.join(', ')}` })
    setSelected(new Set())
  }

  const openUpload = (productId: string | null = null) => setUpload({ open: true, productId })
  const preview_ = (productId: string, version: SdsVersion) => setPreview({ productId, version })

  return (
    <>
      <PageHeader
        eyebrow="Compliance"
        title="SDS Management"
        subtitle={`Safety Data Sheets with full version history. Documents older than ${SDS_MAX_AGE_YEARS} years are flagged for review.`}
        actions={<button className="btn-primary" onClick={() => openUpload()}><Upload className="h-4 w-4" /> Upload SDS</button>}
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <button onClick={() => setFilter('status', f.status === 'current' ? 'all' : 'current')} className="text-left">
          <StatCard icon={CheckCircle2} label="Current" value={counts.current || 0} hint={`${totalVersions} versions archived`} tone="green" active={f.status === 'current'} />
        </button>
        <button onClick={() => setFilter('status', f.status === 'expiring' ? 'all' : 'expiring')} className="text-left">
          <StatCard icon={Clock} label="Review soon" value={counts.expiring || 0} hint="Turns 5 years old within 6 months" tone="amber" active={f.status === 'expiring'} />
        </button>
        <button onClick={() => setFilter('status', f.status === 'outdated' ? 'all' : 'outdated')} className="text-left">
          <StatCard icon={AlertTriangle} label="Older than 5 yrs" value={counts.outdated || 0} hint={`${requestedCount} update request${requestedCount === 1 ? '' : 's'} pending`} tone="red" active={f.status === 'outdated'} />
        </button>
        <button onClick={() => setFilter('status', f.status === 'missing' ? 'all' : 'missing')} className="text-left">
          <StatCard icon={FileX} label="Missing SDS" value={counts.missing || 0} hint="No document on file" tone="slate" active={f.status === 'missing'} />
        </button>
      </div>

      <div className="card mt-5 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center">
          <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 lg:pb-0">
            {TABS.map(([k, l]) => (
              <button key={k} onClick={() => setFilter('status', k)}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${f.status === k ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                {l}
                <span className={`rounded-full px-1.5 text-[11px] ${f.status === k ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>{counts[k] || 0}</span>
              </button>
            ))}
          </div>
          <div className="flex flex-1 flex-col gap-2 sm:flex-row lg:justify-end">
            <label className="relative sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input className="input pl-9" placeholder="Search SDS…" value={f.q} onChange={(e) => setFilter('q', e.target.value)} />
            </label>
            <Select className="sm:w-52" value={f.facility} onChange={(v) => setFilter('facility', v)}
              options={[{ value: 'all', label: 'Used at any facility' }, ...facilities.map((x) => ({ value: x.id, label: x.name }))]} />
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={FileText} title="No SDS match your filters" action={<button className="btn-secondary" onClick={reset}>Clear filters</button>} />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200">
                    <th className="w-10 pl-4"><input type="checkbox" className="h-4 w-4 rounded accent-brand-600" checked={allSelected} onChange={toggleAll} aria-label="Select all" /></th>
                    <th className="th">Product</th>
                    <th className="th">Version</th>
                    <th className="th">Issued</th>
                    <th className="th">Age</th>
                    <th className="th">Review due</th>
                    <th className="th">Status</th>
                    <th className="th w-28" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((r) => {
                    const open = expanded === r.product.id
                    const v = r.status.version
                    const tone = r.status.key === 'outdated' ? 'bg-red-50/50' : ''
                    return (
                      <Fragment key={r.product.id}>
                        <tr className={`group cursor-pointer transition ${selected.has(r.product.id) ? 'bg-brand-50/60' : tone} hover:bg-slate-50`} onClick={() => r.doc && setExpanded(open ? null : r.product.id)}>
                          <td className="pl-4" onClick={(e) => e.stopPropagation()}>
                            <input type="checkbox" className="h-4 w-4 rounded accent-brand-600" checked={selected.has(r.product.id)} onChange={() => toggle(r.product.id)} />
                          </td>
                          <td className="td">
                            <div className="flex items-center gap-2">
                              {r.doc ? <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition ${open ? '' : '-rotate-90'}`} /> : <span className="w-4" />}
                              <div className="min-w-0">
                                <Link to={`/products/${r.product.id}`} onClick={(e) => e.stopPropagation()} className="font-medium text-slate-900 hover:text-brand-600">{r.product.name}</Link>
                                <p className="truncate text-xs text-slate-500">{r.product.manufacturer} · {r.facs.map((id) => facilityById[id]?.code).join(', ') || 'Not stocked'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="td whitespace-nowrap">{v ? <><span className="font-semibold">v{v.version}</span> <span className="text-xs text-slate-400">/ {r.doc?.versions.length}</span></> : '—'}</td>
                          <td className="td whitespace-nowrap">{v ? formatDate(v.issueDate) : '—'}</td>
                          <td className="td whitespace-nowrap"><AgeBar age={r.status.age} /></td>
                          <td className={`td whitespace-nowrap ${r.status.key === 'outdated' ? 'font-medium text-red-600' : ''}`}>{v ? formatDate(reviewDueDate(v.issueDate)) : '—'}</td>
                          <td className="td">
                            <div className="flex flex-col items-start gap-1">
                              <SdsStatusBadge status={r.status} />
                              {r.requested && <Badge className="bg-sky-50 text-sky-700 ring-sky-600/20"><MailCheck className="h-3 w-3" />Requested {formatDate(r.requested)}</Badge>}
                            </div>
                          </td>
                          <td className="td whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-end opacity-60 transition group-hover:opacity-100">
                              {v && <button className="btn-ghost p-1.5" title="Preview current SDS" onClick={() => preview_(r.product.id, v)}><Eye className="h-4 w-4" /></button>}
                              {r.status.key !== 'current' && !r.requested && <button className="btn-ghost p-1.5" title="Request update from supplier" onClick={() => requestUpdates([r.product.id])}><Send className="h-4 w-4" /></button>}
                              <button className="btn-ghost p-1.5" title="Upload new version" onClick={() => openUpload(r.product.id)}><Upload className="h-4 w-4" /></button>
                            </div>
                          </td>
                        </tr>
                        {open && (
                          <tr className="bg-slate-50/70">
                            <td />
                            <td colSpan={7} className="px-4 pb-5 pt-2"><div className="animate-fade-up">{r.doc && <VersionTimeline doc={r.doc} onPreview={(ver) => preview_(r.product.id, ver)} />}</div></td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-slate-100 md:hidden">
              {filtered.map((r) => {
                const v = r.status.version
                const open = expanded === r.product.id
                return (
                  <li key={r.product.id} className={`p-4 ${selected.has(r.product.id) ? 'bg-brand-50/60' : r.status.key === 'outdated' ? 'bg-red-50/50' : ''}`}>
                    <div className="flex items-start gap-3">
                      <input type="checkbox" className="mt-1 h-4 w-4 rounded accent-brand-600" checked={selected.has(r.product.id)} onChange={() => toggle(r.product.id)} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <Link to={`/products/${r.product.id}`} className="font-medium text-slate-900">{r.product.name}</Link>
                          <SdsStatusBadge status={r.status} />
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500">{v ? `v${v.version} · issued ${formatDate(v.issueDate)}` : 'No SDS on file'}</p>
                        {v && <div className="mt-2"><AgeBar age={r.status.age} /></div>}
                        {r.requested && <div className="mt-2"><Badge className="bg-sky-50 text-sky-700 ring-sky-600/20"><MailCheck className="h-3 w-3" />Requested {formatDate(r.requested)}</Badge></div>}
                        <div className="mt-3 flex gap-2">
                          {r.doc && <button className="btn-secondary flex-1 py-1.5" onClick={() => setExpanded(open ? null : r.product.id)}>{open ? 'Hide' : 'History'} ({r.doc.versions.length})</button>}
                          <button className="btn-secondary flex-1 py-1.5" onClick={() => openUpload(r.product.id)}><Upload className="h-4 w-4" /> Upload</button>
                        </div>
                        {open && r.doc && <div className="mt-4 animate-fade-up"><VersionTimeline doc={r.doc} onPreview={(ver) => preview_(r.product.id, ver)} /></div>}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>

      {/* Floating bulk-action bar */}
      {selected.size > 0 && (
        <div className="fixed inset-x-0 bottom-20 z-40 flex justify-center px-4 lg:bottom-6">
          <div className="flex animate-toast-in items-center gap-2 rounded-2xl bg-ink-900 py-2 pl-4 pr-2 text-sm text-snow shadow-2xl ring-1 ring-ink-700">
            <span className="font-medium">{selected.size} selected</span>
            <span className="mx-1 h-5 w-px bg-ink-700" />
            <button className="btn bg-snow px-3 py-1.5 text-ink-900 hover:bg-ink-100" onClick={() => requestUpdates([...selected])}>
              <Send className="h-4 w-4" /> Request updates
            </button>
            <button className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-800 hover:text-snow" onClick={() => setSelected(new Set())} aria-label="Clear selection"><X className="h-4 w-4" /></button>
          </div>
        </div>
      )}

      <SdsUploadModal open={upload.open} presetProductId={upload.productId} onClose={() => setUpload({ open: false, productId: null })} onSaved={(m) => toast(m)} />
      <SdsPreviewModal open={!!preview} onClose={() => setPreview(null)} productId={preview?.productId} version={preview?.version} />
    </>
  )
}

/** Visual age indicator: fills toward the 5-year limit, red once exceeded. */
function AgeBar({ age }: { age: number | null }) {
  if (age == null) return <span className="text-slate-400">—</span>
  const pct = Math.min(100, (age / SDS_MAX_AGE_YEARS) * 100)
  const color = age > SDS_MAX_AGE_YEARS ? 'bg-red-500' : age > SDS_MAX_AGE_YEARS - 0.5 ? 'bg-amber-500' : 'bg-emerald-500'
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200"><div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} /></div>
      <span className={`text-xs tabular-nums ${age > SDS_MAX_AGE_YEARS ? 'font-semibold text-red-600' : 'text-slate-600'}`}>{formatAge(age)}</span>
    </div>
  )
}

export function VersionTimeline({ doc, onPreview }: { doc: SdsDocument; onPreview: (version: SdsVersion) => void }) {
  const versions = [...doc.versions].sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())
  return (
    <ol className="relative ml-2 space-y-3 border-l-2 border-slate-200 pl-6">
      {versions.map((v, i) => {
        const age = ageInYears(v.issueDate)
        const old = age > SDS_MAX_AGE_YEARS
        return (
          <li key={v.version} className="relative">
            <span className={`absolute -left-[33px] top-3 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-slate-50 ${i === 0 ? (old ? 'bg-red-500' : 'bg-emerald-500') : 'bg-slate-300'}`} />
            <div className={`rounded-xl border bg-white p-3 ${i === 0 ? 'border-slate-200 shadow-sm' : 'border-dashed border-slate-200'}`}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-slate-900">v{v.version}</span>
                {i === 0
                  ? <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-brand-700">Current</span>
                  : <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-500">Superseded</span>}
                {old && i === 0 && <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-red-700">&gt; 5 years</span>}
                <span className="text-xs text-slate-500">Issued {formatDate(v.issueDate)} · {formatAge(age)} ago</span>
                <button className="btn-ghost ml-auto px-2 py-1 text-xs" onClick={() => onPreview(v)}><Eye className="h-3.5 w-3.5" /> Preview</button>
              </div>
              <p className="mt-1 text-sm text-slate-600">{v.notes}</p>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 text-[11px] text-slate-400">
                <span className="inline-flex items-center gap-1"><FileText className="h-3 w-3" />{v.fileName} ({v.fileSizeKb} KB)</span>
                <span>Uploaded by {v.uploadedBy}</span>
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
