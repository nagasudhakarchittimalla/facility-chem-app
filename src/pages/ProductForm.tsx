import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { useStore } from '../store/AppStore'
import { PageHeader } from '../components/ui'
import { useToast } from '../components/ToastContext'
import { HAZARD_CLASSES } from '../data/mockData'
import type { HazardClass, Ingredient, NewProduct, PhysicalState, Product, SignalWord, Unit } from '../types'

/** Ingredient row while editing: percentages may be empty strings. */
type IngredientDraft = Omit<Ingredient, 'min' | 'max'> & { min: number | string; max: number | string }
type ProductFormState = Omit<NewProduct, 'ingredients'> & { id?: string; ingredients: IngredientDraft[] }

const CATEGORIES = ['Acid', 'Base', 'Solvent', 'Oxidizer', 'Disinfectant', 'Cleaner', 'Coolant', 'Lubricant', 'Coating', 'Gas', 'Water Treatment', 'Neutralizer', 'Other']
const CAS_RE = /^\d{2,7}-\d{2}-\d$/

export default function ProductForm() {
  const { id } = useParams()
  const { productById, products, dispatch } = useStore()
  const navigate = useNavigate()
  const toast = useToast()
  const existing = id ? productById[id] : null
  const [form, setForm] = useState<ProductFormState>(
    existing || {
      name: '', sku: '', manufacturer: '', category: 'Solvent', physicalState: 'Liquid', unit: 'L',
      signalWord: 'Warning', hazards: [], storage: '', ingredients: [{ name: '', cas: '', min: '', max: '' }],
    },
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = <K extends keyof ProductFormState>(k: K, v: ProductFormState[K]) => setForm((f) => ({ ...f, [k]: v }))
  const setIng = (i: number, k: keyof IngredientDraft, v: string) => setForm((f) => ({ ...f, ingredients: f.ingredients.map((x, j) => (j === i ? { ...x, [k]: v } : x)) }))
  const toggleHazard = (h: HazardClass) => set('hazards', form.hazards.includes(h) ? form.hazards.filter((x) => x !== h) : [...form.hazards, h])
  const maxTotal = form.ingredients.reduce((s, i) => s + (Number(i.min) || 0), 0)

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Product name is required'
    if (!form.sku.trim()) e.sku = 'SKU is required'
    else if (products.some((p) => p.sku.toLowerCase() === form.sku.trim().toLowerCase() && p.id !== existing?.id)) e.sku = 'SKU already exists'
    if (!form.manufacturer.trim()) e.manufacturer = 'Manufacturer is required'
    form.ingredients.forEach((ing, i) => {
      if (!ing.name.trim()) e[`ing${i}`] = 'Name required'
      else if (!CAS_RE.test(ing.cas.trim())) e[`ing${i}`] = 'CAS must look like 67-64-1'
      else if (ing.min === '' || ing.max === '' || Number(ing.min) > Number(ing.max) || Number(ing.max) > 100) e[`ing${i}`] = 'Check % range (0–100, min ≤ max)'
    })
    if (!form.ingredients.length) e.ingredients = 'Add at least one ingredient'
    if (maxTotal > 100) e.ingredients = 'Sum of minimum concentrations exceeds 100%'
    setErrors(e)
    if (Object.keys(e).length) toast({ title: 'Please fix the highlighted fields', tone: 'warning' })
    return !Object.keys(e).length
  }

  const submit = (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault()
    if (!validate()) return
    const product: NewProduct & { id?: string } = {
      ...form,
      name: form.name.trim(),
      sku: form.sku.trim(),
      ingredients: form.ingredients.map((i) => ({ ...i, cas: i.cas.trim(), min: Number(i.min), max: Number(i.max) })),
    }
    if (existing) {
      dispatch({ type: 'UPDATE_PRODUCT', product: { ...product, id: existing.id } satisfies Product })
      toast({ title: 'Product updated', description: product.name })
      navigate(`/products/${existing.id}`)
    } else {
      const nextNum = products.reduce((m, p) => Math.max(m, parseInt(p.id.split('-')[1], 10)), 0) + 1
      dispatch({ type: 'ADD_PRODUCT', product })
      toast({ title: 'Product created', description: 'Next: add stock and upload its SDS' })
      navigate(`/products/P-${String(nextNum).padStart(3, '0')}`)
    }
  }

  const Err = ({ k }: { k: string }) => (errors[k] ? <p className="mt-1 text-xs text-red-600">{errors[k]}</p> : null)

  return (
    <>
      <Link to={existing ? `/products/${existing.id}` : '/products'} className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <PageHeader eyebrow={existing ? 'Edit product' : 'New product'} title={existing ? existing.name : 'Add a chemical product'} subtitle="Product identification, hazards and chemical composition" />

      <form onSubmit={submit} className="space-y-6">
        <section className="card p-5">
          <h2 className="mb-4 font-semibold text-slate-900">Product details</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="sm:col-span-2 lg:col-span-1">
              <span className="label">Product name *</span>
              <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Acetone, Technical Grade" />
              <Err k="name" />
            </label>
            <label>
              <span className="label">SKU / Product code *</span>
              <input className="input" value={form.sku} onChange={(e) => set('sku', e.target.value)} placeholder="e.g. NV-ACT-55" />
              <Err k="sku" />
            </label>
            <label>
              <span className="label">Manufacturer *</span>
              <input className="input" value={form.manufacturer} onChange={(e) => set('manufacturer', e.target.value)} />
              <Err k="manufacturer" />
            </label>
            <label>
              <span className="label">Category</span>
              <select className="input" value={form.category} onChange={(e) => set('category', e.target.value)}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label>
              <span className="label">Physical state</span>
              <select
                className="input"
                value={form.physicalState}
                onChange={(e) => {
                  const s = e.target.value as PhysicalState
                  setForm((f) => ({ ...f, physicalState: s, unit: s === 'Solid' ? 'kg' : s === 'Gas' ? 'cyl' : 'L' }))
                }}
              >
                {['Liquid', 'Solid', 'Gas'].map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
            <label>
              <span className="label">Unit of measure</span>
              <select className="input" value={form.unit} onChange={(e) => set('unit', e.target.value as Unit)}>
                <option value="L">Litres (L)</option><option value="kg">Kilograms (kg)</option><option value="cyl">Cylinders</option>
              </select>
            </label>
            <label>
              <span className="label">GHS signal word</span>
              <select className="input" value={form.signalWord} onChange={(e) => set('signalWord', e.target.value as SignalWord)}>
                {['Danger', 'Warning', 'None'].map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
            <label className="sm:col-span-2">
              <span className="label">Storage requirements</span>
              <input className="input" value={form.storage} onChange={(e) => set('storage', e.target.value)} placeholder="e.g. Store in flammables cabinet" />
            </label>
          </div>
          <div className="mt-5">
            <span className="label">Hazard classes</span>
            <div className="flex flex-wrap gap-2">
              {HAZARD_CLASSES.map((h) => (
                <button type="button" key={h} onClick={() => toggleHazard(h)}
                  className={`chip py-1.5 ${form.hazards.includes(h) ? 'chip-on' : 'chip-off'}`}>
                  {h}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">Chemical ingredients</h2>
              <p className="text-xs text-slate-500">SDS Section 3 – composition. Min. total: {maxTotal}%</p>
            </div>
            <button type="button" className="btn-secondary" onClick={() => set('ingredients', [...form.ingredients, { name: '', cas: '', min: '', max: '' }])}>
              <Plus className="h-4 w-4" /> Add ingredient
            </button>
          </div>
          <div className="space-y-3">
            {form.ingredients.map((ing, i) => (
              <div key={i} className="rounded-lg border border-slate-200 p-3">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-12 sm:items-end">
                  <label className="col-span-2 sm:col-span-5">
                    <span className="label">Ingredient name</span>
                    <input className="input" value={ing.name} onChange={(e) => setIng(i, 'name', e.target.value)} placeholder="e.g. Sodium hydroxide" />
                  </label>
                  <label className="col-span-2 sm:col-span-3">
                    <span className="label">CAS number</span>
                    <input className="input font-mono" value={ing.cas} onChange={(e) => setIng(i, 'cas', e.target.value)} placeholder="1310-73-2" />
                  </label>
                  <label className="sm:col-span-2">
                    <span className="label">Min %</span>
                    <input type="number" step="any" min="0" max="100" className="input" value={ing.min} onChange={(e) => setIng(i, 'min', e.target.value)} />
                  </label>
                  <div className="flex items-end gap-2 sm:col-span-2">
                    <label className="flex-1">
                      <span className="label">Max %</span>
                      <input type="number" step="any" min="0" max="100" className="input" value={ing.max} onChange={(e) => setIng(i, 'max', e.target.value)} />
                    </label>
                    <button type="button" className="btn-ghost p-2 text-red-600 hover:bg-red-50" disabled={form.ingredients.length === 1}
                      onClick={() => set('ingredients', form.ingredients.filter((_, j) => j !== i))} aria-label="Remove ingredient">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <Err k={`ing${i}`} />
              </div>
            ))}
          </div>
          <Err k="ingredients" />
        </section>

        <div className="sticky bottom-16 z-10 -mx-4 flex flex-col-reverse gap-2 border-t border-slate-200 bg-white/90 px-4 py-3 backdrop-blur-xl sm:mx-0 sm:flex-row sm:justify-end sm:rounded-2xl sm:border lg:bottom-4">
          <Link to={existing ? `/products/${existing.id}` : '/products'} className="btn-secondary">Cancel</Link>
          <button type="submit" className="btn-primary">{existing ? 'Save changes' : 'Create product'}</button>
        </div>
      </form>
    </>
  )
}
