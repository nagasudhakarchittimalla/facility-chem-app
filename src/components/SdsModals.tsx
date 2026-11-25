import { useEffect, useState, type ReactNode } from 'react'
import { FileText, Upload } from 'lucide-react'
import { Modal, SdsStatusBadge, HazardBadges } from './ui'
import { useStore } from '../store/AppStore'
import { formatDate, sdsStatus } from '../utils/sds'
import type { SdsVersion } from '../types'

interface SdsUploadModalProps {
  open: boolean
  onClose: () => void
  presetProductId?: string | null
  onSaved?: (message: string) => void
}

interface SdsPreviewModalProps {
  open: boolean
  onClose: () => void
  productId?: string | null
  version?: SdsVersion | null
}

export function SdsUploadModal({ open, onClose, presetProductId, onSaved }: SdsUploadModalProps) {
  const { products, sdsByProduct, productById, dispatch } = useStore()
  const today = new Date().toISOString().slice(0, 10)
  const [productId, setProductId] = useState<string>(presetProductId || products[0]?.id || '')
  const [issueDate, setIssueDate] = useState(today)
  const [fileName, setFileName] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [drag, setDrag] = useState(false)

  useEffect(() => {
    if (open) {
      setProductId(presetProductId || products[0]?.id || '')
      setIssueDate(today)
      setFileName('')
      setNotes('')
      setError('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, presetProductId])

  const doc = sdsByProduct[productId]
  const nextVersion = `${(doc?.versions.length || 0) + 1}.0`
  const product = productById[productId]

  const save = () => {
    if (!product) return
    if (!issueDate) return setError('Issue date is required.')
    if (new Date(issueDate) > new Date()) return setError('Issue date cannot be in the future.')
    dispatch({
      type: 'ADD_SDS_VERSION',
      productId,
      version: {
        version: nextVersion,
        issueDate,
        uploadedAt: today,
        uploadedBy: 'EHS Admin',
        fileName: fileName || `${product.sku}_SDS_v${nextVersion}.pdf`,
        fileSizeKb: 240 + Math.floor(Math.random() * 400),
        notes: notes || 'Revised SDS uploaded.',
      },
    })
    onSaved?.(`SDS v${nextVersion} uploaded for ${product.name}`)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Upload SDS version"
      description="Older revisions are kept in the version history"
      size="md"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={save}><Upload className="h-4 w-4" /> Upload v{nextVersion}</button>
        </>
      }
    >
      <div className="space-y-4">
        <label className="block">
          <span className="label">Product</span>
          <select className="input" value={productId} onChange={(e) => setProductId(e.target.value)} disabled={!!presetProductId}>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
        <div className="rounded-lg bg-slate-50 p-3 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500">Current status</span>
            <SdsStatusBadge status={sdsStatus(doc)} showAge />
          </div>
          <p className="mt-1 text-slate-500">
            {doc ? `${doc.versions.length} version(s) on file. New version will be ` : 'No SDS on file. This will be '}
            <strong className="text-slate-800">v{nextVersion}</strong>.
          </p>
        </div>
        <label className="block">
          <span className="label">Revision / issue date (from the SDS)</span>
          <input type="date" className="input" value={issueDate} max={today} onChange={(e) => setIssueDate(e.target.value)} />
        </label>
        <div className="block">
          <span className="label">SDS file (PDF)</span>
          <div
            onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); setFileName(e.dataTransfer.files?.[0]?.name || '') }}
            className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition ${drag ? 'border-brand-500 bg-brand-50' : fileName ? 'border-emerald-300 bg-emerald-50' : 'border-slate-300 hover:border-brand-400 hover:bg-slate-50'}`}
          >
            <input type="file" accept=".pdf" className="absolute inset-0 cursor-pointer opacity-0" onChange={(e) => setFileName(e.target.files?.[0]?.name || '')} />
            {fileName ? (
              <><FileText className="mb-2 h-7 w-7 text-emerald-600" /><p className="text-sm font-medium text-emerald-800">{fileName}</p><p className="text-xs text-emerald-700">Click to choose a different file</p></>
            ) : (
              <><Upload className="mb-2 h-7 w-7 text-slate-400" /><p className="text-sm font-medium text-slate-700">Drop the SDS PDF here, or <span className="text-brand-600">browse</span></p><p className="text-xs text-slate-500">PDF up to 10 MB</p></>
            )}
          </div>
          <span className="mt-1 block text-xs text-slate-400">Mock upload — the file is not stored, only its name.</span>
        </div>
        <label className="block">
          <span className="label">Revision notes</span>
          <textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What changed in this revision?" />
        </label>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </div>
    </Modal>
  )
}

/** Mock rendering of an SDS document (16-section summary). */
export function SdsPreviewModal({ open, onClose, productId, version }: SdsPreviewModalProps) {
  const { productById } = useStore()
  const product = productId ? productById[productId] : undefined
  if (!open || !product || !version) return null
  return (
    <Modal open={open} onClose={onClose} title={version.fileName} size="xl">
      <div className="mx-auto max-w-2xl rounded-lg border border-slate-200 bg-white p-6 font-serif text-sm shadow-inner">
        <div className="flex items-start justify-between border-b-2 border-slate-800 pb-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-500">Safety Data Sheet</p>
            <p className="text-xl font-bold text-slate-900">{product.name}</p>
            <p className="text-slate-600">{product.manufacturer}</p>
          </div>
          <div className="text-right text-xs text-slate-600">
            <p>Version {version.version}</p>
            <p>Revision date: {formatDate(version.issueDate)}</p>
          </div>
        </div>
        <Section n="1" title="Identification">Product code: {product.sku} · Recommended use: {product.category}</Section>
        <Section n="2" title="Hazard(s) identification">
          <p>Signal word: <strong>{product.signalWord}</strong></p>
          <div className="mt-1 font-sans"><HazardBadges hazards={product.hazards} /></div>
        </Section>
        <Section n="3" title="Composition / information on ingredients">
          <ul className="list-disc pl-5">
            {product.ingredients.map((i) => <li key={i.cas}>{i.name} (CAS {i.cas}) — {i.min}–{i.max}%</li>)}
          </ul>
        </Section>
        <Section n="7" title="Handling and storage">{product.storage}</Section>
        <Section n="9" title="Physical and chemical properties">Physical state: {product.physicalState}</Section>
        <p className="mt-4 flex items-center gap-2 font-sans text-xs text-slate-400">
          <FileText className="h-3.5 w-3.5" /> Sections 4–6, 8, 10–16 omitted in mock preview.
        </p>
      </div>
    </Modal>
  )
}

function Section({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <div className="mt-4">
      <p className="mb-1 bg-slate-100 px-2 py-1 font-sans text-xs font-semibold uppercase tracking-wide text-slate-700">
        Section {n}: {title}
      </p>
      <div className="px-2 text-slate-700">{children}</div>
    </div>
  )
}
