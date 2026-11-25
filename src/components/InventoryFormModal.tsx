import { useEffect, useState } from 'react'
import { Modal } from './ui'
import { useStore } from '../store/AppStore'
import type { InventoryRecord, NewInventoryRecord, Unit } from '../types'

/** Form state: numeric inputs hold strings while being edited. */
type InventoryForm = Omit<NewInventoryRecord, 'year' | 'containerCount' | 'quantity' | 'maxDailyAmount' | 'unit' | 'lastUpdated'> & {
  year: number | string
  containerCount: number | string
  quantity: number | string
  maxDailyAmount: number | string
}

interface InventoryFormModalProps {
  open: boolean
  onClose: () => void
  item?: InventoryRecord | null
  presetProductId?: string
  onSaved?: (message: string) => void
}

const CONTAINER_OPTIONS: Record<Unit, string[]> = {
  L: ['Bottle (4 L)', 'Pail (20 L)', 'Drum (208 L)', 'Tote (1000 L)', 'Bulk Tank'],
  kg: ['Bag (25 kg)', 'Pail (45 kg)', 'Drum (100 kg)', 'Super Sack (1000 kg)'],
  cyl: ['Cylinder'],
}

export default function InventoryFormModal({ open, onClose, item, presetProductId, onSaved }: InventoryFormModalProps) {
  const { products, facilities, years, productById, dispatch } = useStore()
  const blank: InventoryForm = {
    productId: presetProductId || products[0]?.id || '',
    facilityId: facilities[0].id,
    locationId: facilities[0].locations[0].id,
    year: years[years.length - 1],
    container: '',
    containerCount: 1,
    quantity: '',
    maxDailyAmount: '',
  }
  const [form, setForm] = useState<InventoryForm>(blank)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setForm(item ? { ...item } : blank)
      setError('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item, presetProductId])

  const product = productById[form.productId]
  const facility = facilities.find((f) => f.id === form.facilityId) ?? facilities[0]
  const unit: Unit = product?.unit || 'L'
  const set = <K extends keyof InventoryForm>(k: K, v: InventoryForm[K]) => setForm((f) => ({ ...f, [k]: v }))

  const save = () => {
    const qty = Number(form.quantity)
    if (!form.productId || !form.locationId) return setError('Product and location are required.')
    if (!qty || qty <= 0) return setError('Quantity must be greater than zero.')
    const payload: NewInventoryRecord = {
      ...form,
      year: Number(form.year),
      containerCount: Number(form.containerCount) || 1,
      quantity: qty,
      maxDailyAmount: Number(form.maxDailyAmount) || qty,
      unit,
      container: form.container || CONTAINER_OPTIONS[unit][0],
      lastUpdated: new Date().toISOString().slice(0, 10),
    }
    if (item) dispatch({ type: 'UPDATE_INVENTORY', item: { ...item, ...payload } })
    else dispatch({ type: 'ADD_INVENTORY', item: payload })
    onSaved?.(item ? 'Inventory record updated' : 'Inventory record added')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={item ? `Edit inventory ${item.id}` : 'Add inventory record'}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={save}>{item ? 'Save changes' : 'Add record'}</button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className="label">Product</span>
          <select className="input" value={form.productId} onChange={(e) => set('productId', e.target.value)} disabled={!!presetProductId && !item}>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
          </select>
        </label>
        <label>
          <span className="label">Facility</span>
          <select
            className="input"
            value={form.facilityId}
            onChange={(e) => {
              const f = facilities.find((x) => x.id === e.target.value)
              if (!f) return
              setForm((s) => ({ ...s, facilityId: f.id, locationId: f.locations[0].id }))
            }}
          >
            {facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </label>
        <label>
          <span className="label">Storage location</span>
          <select className="input" value={form.locationId} onChange={(e) => set('locationId', e.target.value)}>
            {facility.locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </label>
        <label>
          <span className="label">Reporting year</span>
          <select className="input" value={form.year} onChange={(e) => set('year', e.target.value)}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>
        <label>
          <span className="label">Container type</span>
          <select className="input" value={form.container || CONTAINER_OPTIONS[unit][0]} onChange={(e) => set('container', e.target.value)}>
            {CONTAINER_OPTIONS[unit].map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label>
          <span className="label">No. of containers</span>
          <input type="number" min="1" className="input" value={form.containerCount} onChange={(e) => set('containerCount', e.target.value)} />
        </label>
        <label>
          <span className="label">Total quantity ({unit})</span>
          <input type="number" min="0" step="any" className="input" value={form.quantity} onChange={(e) => set('quantity', e.target.value)} placeholder="e.g. 416" />
        </label>
        <label className="sm:col-span-2">
          <span className="label">Max daily amount on site ({unit})</span>
          <input type="number" min="0" step="any" className="input" value={form.maxDailyAmount} onChange={(e) => set('maxDailyAmount', e.target.value)} placeholder="Defaults to total quantity" />
        </label>
      </div>
      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    </Modal>
  )
}
