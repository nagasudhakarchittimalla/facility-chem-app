import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import * as seed from '../data/mockData'
import type { AppAction, AppState, SdsDocument, StoreLookups, StoreValue } from '../types'

const StoreContext = createContext<StoreValue | null>(null)
const STORAGE_KEY = 'chemtrack-state-v2'

const initialState: AppState = {
  facilities: seed.facilities,
  products: seed.products,
  inventory: seed.inventory,
  sdsDocuments: seed.sdsDocuments,
  sdsRequests: {},
}

function nextId(prefix: string, list: { id: string }[], pad = 3): string {
  const max = list.reduce((m, x) => Math.max(m, parseInt(x.id.split('-')[1], 10) || 0), 0)
  return `${prefix}-${String(max + 1).padStart(pad, '0')}`
}

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_PRODUCT': {
      const product = { ...action.product, id: nextId('P', state.products) }
      return { ...state, products: [...state.products, product], lastCreatedId: product.id }
    }
    case 'UPDATE_PRODUCT':
      return { ...state, products: state.products.map((p) => (p.id === action.product.id ? action.product : p)) }
    case 'ADD_INVENTORY': {
      const item = { ...action.item, id: nextId('INV', state.inventory, 4) }
      return { ...state, inventory: [...state.inventory, item] }
    }
    case 'UPDATE_INVENTORY':
      return { ...state, inventory: state.inventory.map((i) => (i.id === action.item.id ? action.item : i)) }
    case 'RESTORE_INVENTORY':
      return { ...state, inventory: [...state.inventory, action.item] }
    case 'REQUEST_SDS_UPDATE': {
      const date = new Date().toISOString().slice(0, 10)
      const sdsRequests = { ...state.sdsRequests }
      action.productIds.forEach((id) => (sdsRequests[id] = date))
      return { ...state, sdsRequests }
    }
    case 'DELETE_INVENTORY':
      return { ...state, inventory: state.inventory.filter((i) => i.id !== action.id) }
    case 'ADD_SDS_VERSION': {
      const { productId, version } = action
      // Uploading a new version fulfils any pending update request
      const { [productId]: _cleared, ...sdsRequests } = state.sdsRequests || {}
      const next: AppState = { ...state, sdsRequests }
      const existing = next.sdsDocuments.find((d) => d.productId === productId)
      if (existing) {
        return {
          ...next,
          sdsDocuments: next.sdsDocuments.map((d) =>
            d.productId === productId ? { ...d, versions: [...d.versions, version] } : d,
          ),
        }
      }
      const doc: SdsDocument = {
        id: nextId('SDS', next.sdsDocuments),
        productId,
        language: 'English',
        region: 'US / OSHA HazCom 2012',
        versions: [version],
      }
      return { ...next, sdsDocuments: [...next.sdsDocuments, doc] }
    }
    case 'RESET':
      return initialState
    default:
      return state
  }
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...initialState, ...(JSON.parse(raw) as Partial<AppState>) }
  } catch {
    /* ignore */
  }
  return initialState
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* ignore */
    }
  }, [state])

  const helpers = useMemo<StoreLookups>(() => {
    const productById = Object.fromEntries(state.products.map((p) => [p.id, p]))
    const facilityById = Object.fromEntries(state.facilities.map((f) => [f.id, f]))
    const locationById = Object.fromEntries(
      state.facilities.flatMap((f) => f.locations.map((l) => [l.id, { ...l, facilityId: f.id }] as const)),
    )
    const sdsByProduct = Object.fromEntries(state.sdsDocuments.map((d) => [d.productId, d]))
    return { productById, facilityById, locationById, sdsByProduct }
  }, [state])

  const value = useMemo<StoreValue>(() => ({ ...state, ...helpers, dispatch, years: seed.YEARS }), [state, helpers])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
