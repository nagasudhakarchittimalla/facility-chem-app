import { useEffect, type ComponentType, type CSSProperties, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  X, AlertTriangle, CheckCircle2, Clock, FileX, Flame, Skull, Zap, CircleAlert, HeartPulse, Leaf, Cylinder, TestTubeDiagonal, ArrowUpRight,
} from 'lucide-react'
import { formatAge } from '../utils/sds'
import type { HazardClass, Ingredient, SdsStatus, SdsStatusKey, SelectOption } from '../types'

export type IconType = ComponentType<{ className?: string; style?: CSSProperties }>

interface PageHeaderProps {
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  eyebrow?: ReactNode
}

export function PageHeader({ title, subtitle, actions, eyebrow }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-brand-600">{eyebrow}</p>}
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-end gap-2">{actions}</div>}
    </div>
  )
}

export type Tone = 'brand' | 'red' | 'amber' | 'green' | 'slate'

const TONES: Record<Tone, string> = {
  brand: 'bg-brand-50 text-brand-600 ring-brand-100',
  red: 'bg-red-50 text-red-600 ring-red-100',
  amber: 'bg-amber-50 text-amber-600 ring-amber-100',
  green: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
  slate: 'bg-slate-100 text-slate-600 ring-slate-200',
}

interface StatCardProps {
  label: ReactNode
  value: ReactNode
  hint?: ReactNode
  icon?: IconType
  tone?: Tone
  to?: string
  active?: boolean
}

export function StatCard({ label, value, hint, icon: Icon, tone = 'brand', to, active }: StatCardProps) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        {Icon && <div className={`rounded-xl p-2 ring-1 ring-inset ${TONES[tone]}`}><Icon className="h-[18px] w-[18px]" /></div>}
      </div>
      <p className="-mt-1 text-[26px] font-bold tracking-tight text-slate-900 tabular-nums">{value}</p>
      {hint && (
        <p className="mt-1 flex items-center gap-1 truncate text-xs text-slate-500">
          {hint}
          {to && <ArrowUpRight className="ml-auto h-3.5 w-3.5 shrink-0 opacity-0 transition group-hover:opacity-100" />}
        </p>
      )}
    </>
  )
  const cls = `card group block p-4 sm:p-5 ${active ? 'ring-2 ring-brand-500 ring-offset-2 ring-offset-slate-50' : ''}`
  return to ? <Link to={to} className={`${cls} card-hover`}>{body}</Link> : <div className={cls}>{body}</div>
}

export const HAZARD_META: Record<HazardClass, { cls: string; icon: IconType; color: string }> = {
  Flammable: { cls: 'bg-orange-50 text-orange-700 ring-orange-600/20', icon: Flame, color: '#f97316' },
  Corrosive: { cls: 'bg-purple-50 text-purple-700 ring-purple-600/20', icon: TestTubeDiagonal, color: '#a855f7' },
  Toxic: { cls: 'bg-red-50 text-red-700 ring-red-600/20', icon: Skull, color: '#ef4444' },
  Oxidizer: { cls: 'bg-yellow-50 text-yellow-800 ring-yellow-600/30', icon: Zap, color: '#eab308' },
  Irritant: { cls: 'bg-sky-50 text-sky-700 ring-sky-600/20', icon: CircleAlert, color: '#0ea5e9' },
  'Health Hazard': { cls: 'bg-rose-50 text-rose-700 ring-rose-600/20', icon: HeartPulse, color: '#f43f5e' },
  Environmental: { cls: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', icon: Leaf, color: '#10b981' },
  'Compressed Gas': { cls: 'bg-slate-100 text-slate-700 ring-slate-500/20', icon: Cylinder, color: '#64748b' },
}

export function Badge({ children, className = '', title }: { children: ReactNode; className?: string; title?: string }) {
  return (
    <span title={title} className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${className}`}>
      {children}
    </span>
  )
}

export function HazardBadges({ hazards, max, compact }: { hazards: HazardClass[]; max?: number; compact?: boolean }) {
  if (!hazards?.length) return <span className="text-xs text-slate-400">Non-hazardous</span>
  if (compact) {
    return (
      <div className="flex gap-1">
        {hazards.map((h) => {
          const { cls, icon: Icon } = HAZARD_META[h]
          return <span key={h} title={h} className={`rounded-md p-1 ring-1 ring-inset ${cls}`}><Icon className="h-3.5 w-3.5" /></span>
        })}
      </div>
    )
  }
  const shown = max ? hazards.slice(0, max) : hazards
  return (
    <div className="flex flex-wrap gap-1">
      {shown.map((h) => {
        const { cls, icon: Icon } = HAZARD_META[h]
        return <Badge key={h} className={cls}><Icon className="h-3 w-3" />{h}</Badge>
      })}
      {max && hazards.length > max && (
        <Badge className="bg-slate-50 text-slate-500 ring-slate-300" title={hazards.slice(max).join(', ')}>+{hazards.length - max}</Badge>
      )}
    </div>
  )
}

export function SdsStatusBadge({ status, showAge = false }: { status: SdsStatus; showAge?: boolean }) {
  const map: Record<SdsStatusKey, [string, IconType]> = {
    current: ['bg-emerald-50 text-emerald-700 ring-emerald-600/20', CheckCircle2],
    expiring: ['bg-amber-50 text-amber-700 ring-amber-600/30', Clock],
    outdated: ['bg-red-50 text-red-700 ring-red-600/20', AlertTriangle],
    missing: ['bg-slate-100 text-slate-600 ring-slate-400/30', FileX],
  }
  const [cls, Icon] = map[status.key]
  return (
    <Badge className={cls}>
      <Icon className="h-3 w-3" />
      {status.label}
      {showAge && status.age != null && <span className="opacity-70">· {formatAge(status.age)}</span>}
    </Badge>
  )
}

interface SelectProps {
  label?: ReactNode
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  className?: string
}

export function Select({ label, value, onChange, options, className = '' }: SelectProps) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="label">{label}</span>}
      <select className="input cursor-pointer pr-8" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  )
}

/** Segmented control – friendlier than a select for a handful of options. */
export function Segmented({ value, onChange, options, className = '' }: Omit<SelectProps, 'label'>) {
  return (
    <div className={`inline-flex rounded-xl bg-slate-100 p-1 ${className}`}>
      {options.map((o) => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${value === o.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

interface ModalProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  size?: 'md' | 'lg' | 'xl'
}

export function Modal({ open, onClose, title, description, children, footer, size = 'lg' }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])
  if (!open) return null
  const widths = { md: 'sm:max-w-md', lg: 'sm:max-w-2xl', xl: 'sm:max-w-4xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm" onClick={onClose} />
      <div role="dialog" aria-modal="true" className={`relative flex max-h-[92vh] w-full animate-scale-in flex-col rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:rounded-2xl ${widths[size]}`}>
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-slate-300 sm:hidden" />
        <div className="flex items-start justify-between gap-4 px-5 pb-3 pt-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
          </div>
          <button onClick={onClose} className="btn-ghost -mr-2 p-1.5" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <div className="overflow-y-auto px-5 pb-4">{children}</div>
        {footer && <div className="pb-safe flex justify-end gap-2 rounded-b-2xl border-t border-slate-200 bg-slate-50/60 px-5 py-3">{footer}</div>}
      </div>
    </div>
  )
}

export function EmptyState({ icon: Icon, title, text, action }: { icon?: IconType; title: ReactNode; text?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      {Icon && <div className="mb-4 rounded-2xl bg-slate-100 p-4"><Icon className="h-8 w-8 text-slate-400" /></div>}
      <p className="font-semibold text-slate-800">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-slate-500">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function IngredientsTable({ ingredients }: { ingredients: Ingredient[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr><th className="th">Ingredient</th><th className="th">CAS No.</th><th className="th w-1/3">Concentration</th></tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {ingredients.map((ing, i) => (
            <tr key={i}>
              <td className="td font-medium text-slate-800">{ing.name}</td>
              <td className="td"><span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-600">{ing.cas}</span></td>
              <td className="td">
                <div className="flex items-center gap-3">
                  <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div className="absolute inset-y-0 rounded-full bg-brand-500" style={{ left: `${ing.min}%`, width: `${Math.max(1.5, ing.max - ing.min)}%` }} />
                    <div className="absolute inset-y-0 left-0 rounded-full bg-brand-200" style={{ width: `${ing.min}%` }} />
                  </div>
                  <span className="w-20 shrink-0 text-right text-xs tabular-nums text-slate-600">
                    {Number(ing.min) === Number(ing.max) ? `${ing.min}%` : `${ing.min}–${ing.max}%`}
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Circular progress gauge */
interface ProgressRingProps {
  value: number
  size?: number
  stroke?: number
  color?: string
  track?: string
  children?: ReactNode
}

export function ProgressRing({ value, size = 120, stroke = 10, color = '#10b981', track = 'rgb(var(--c-slate-200))', children }: ProgressRingProps) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} style={{ transition: 'stroke-dashoffset .8s ease' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  )
}

export interface FilterChip {
  key: string
  name: string
  label: ReactNode
  onRemove: () => void
}

export function FilterChips({ chips, onClear }: { chips: FilterChip[]; onClear: () => void }) {
  if (!chips.length) return null
  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((c) => (
        <span key={c.key} className="inline-flex items-center gap-1 rounded-full bg-brand-50 py-1 pl-3 pr-1 text-xs font-medium text-brand-700 ring-1 ring-inset ring-brand-200">
          <span className="text-brand-500">{c.name}:</span> {c.label}
          <button onClick={c.onRemove} className="rounded-full p-0.5 hover:bg-brand-100" aria-label={`Remove ${c.name} filter`}><X className="h-3 w-3" /></button>
        </span>
      ))}
      {chips.length > 1 && <button onClick={onClear} className="text-xs font-medium text-slate-500 hover:text-slate-900">Clear all</button>}
    </div>
  )
}
