import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react'
import type { ToastOptions, ToastTone } from '../types'

export type ToastFn = (input: string | ToastOptions) => void
interface ActiveToast extends ToastOptions { id: number; tone: ToastTone }

const ToastContext = createContext<ToastFn | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ActiveToast[]>([])
  const seq = useRef(0)

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), [])
  const toast = useCallback<ToastFn>(
    (input) => {
      const t: ToastOptions = typeof input === 'string' ? { title: input } : input
      const id = ++seq.current
      setToasts((list) => [...list.slice(-3), { tone: 'success', ...t, id }])
      setTimeout(() => dismiss(id), t.action ? 6000 : 3500)
    },
    [dismiss],
  )

  const icons: Record<ToastTone, ReactNode> = {
    success: <CheckCircle2 className="h-5 w-5 text-emerald-400" />,
    info: <Info className="h-5 w-5 text-sky-400" />,
    warning: <TriangleAlert className="h-5 w-5 text-amber-400" />,
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[70] flex flex-col items-center gap-2 px-4 lg:bottom-6 lg:items-end lg:pr-6">
        {toasts.map((t) => (
          <div key={t.id} role="status"
            className="pointer-events-auto flex w-full max-w-sm animate-toast-in items-start gap-3 rounded-xl bg-ink-900 px-4 py-3 text-sm text-snow shadow-2xl shadow-ink-900/30 ring-1 ring-ink-700/50">
            {icons[t.tone]}
            <div className="min-w-0 flex-1">
              <p className="font-medium">{t.title}</p>
              {t.description && <p className="mt-0.5 text-xs text-ink-400">{t.description}</p>}
            </div>
            {t.action && (
              <button onClick={() => { t.action?.onClick(); dismiss(t.id) }} className="rounded-md px-2 py-0.5 text-xs font-semibold text-sky-300 hover:bg-ink-800">
                {t.action.label}
              </button>
            )}
            <button onClick={() => dismiss(t.id)} className="text-ink-500 hover:text-snow" aria-label="Dismiss"><X className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastFn {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
