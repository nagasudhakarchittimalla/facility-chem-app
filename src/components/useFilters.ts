import { useSearchParams } from 'react-router-dom'

type FilterSetter<T> = (key: keyof T & string, value: string) => void

/** Filters stored in the URL so they survive navigation & can be shared. */
export function useFilters<T extends Record<string, string>>(defaults: T): [T, FilterSetter<T>, () => void] {
  const [params, setParams] = useSearchParams()
  const values = Object.fromEntries(Object.keys(defaults).map((k) => [k, params.get(k) ?? defaults[k]])) as T
  const set: FilterSetter<T> = (key, value) => {
    const next = new URLSearchParams(params)
    if (value === defaults[key] || value === '') next.delete(key)
    else next.set(key, value)
    // dependent filter: reset location when facility changes
    if (key === 'facility') next.delete('location')
    setParams(next, { replace: true })
  }
  const reset = () => setParams(new URLSearchParams(), { replace: true })
  return [values, set, reset]
}
