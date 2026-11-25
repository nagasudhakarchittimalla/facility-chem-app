import type { Dispatch } from 'react'

// ---------------------------------------------------------------------------
// Domain model for ChemTrack
// ---------------------------------------------------------------------------

export type HazardClass =
  | 'Flammable'
  | 'Corrosive'
  | 'Toxic'
  | 'Oxidizer'
  | 'Irritant'
  | 'Health Hazard'
  | 'Environmental'
  | 'Compressed Gas'

export type Unit = 'L' | 'kg' | 'cyl'
export type PhysicalState = 'Liquid' | 'Solid' | 'Gas'
export type SignalWord = 'Danger' | 'Warning' | 'None'

export interface StorageLocation {
  id: string
  name: string
  type: string
}

/** A storage location enriched with the facility it belongs to. */
export interface LocationWithFacility extends StorageLocation {
  facilityId: string
}

export interface Facility {
  id: string
  name: string
  code: string
  address: string
  manager: string
  employees: number
  areaSqFt: number
  type: string
  locations: StorageLocation[]
}

export interface Ingredient {
  name: string
  cas: string
  min: number
  max: number
}

export interface Product {
  id: string
  name: string
  sku: string
  manufacturer: string
  category: string
  physicalState: PhysicalState
  unit: Unit
  signalWord: SignalWord
  hazards: HazardClass[]
  storage: string
  ingredients: Ingredient[]
}

/** A product before it has been assigned an id. */
export type NewProduct = Omit<Product, 'id'>

export interface InventoryRecord {
  id: string
  productId: string
  facilityId: string
  locationId: string
  year: number
  container: string
  containerCount: number
  quantity: number
  unit: Unit
  maxDailyAmount: number
  lastUpdated: string
}

export type NewInventoryRecord = Omit<InventoryRecord, 'id'>

export interface SdsVersion {
  version: string
  issueDate: string
  uploadedAt: string
  uploadedBy: string
  fileName: string
  fileSizeKb: number
  notes: string
}

export interface SdsDocument {
  id: string
  productId: string
  language: string
  region: string
  versions: SdsVersion[]
}

export type SdsStatusKey = 'current' | 'expiring' | 'outdated' | 'missing'

export interface SdsStatus {
  key: SdsStatusKey
  label: string
  /** Age of the current version in years, or null when no SDS is on file. */
  age: number | null
  version: SdsVersion | null
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export interface AppState {
  facilities: Facility[]
  products: Product[]
  inventory: InventoryRecord[]
  sdsDocuments: SdsDocument[]
  /** productId -> ISO date an updated SDS was requested from the supplier */
  sdsRequests: Record<string, string>
  lastCreatedId?: string
}

export type AppAction =
  | { type: 'ADD_PRODUCT'; product: NewProduct }
  | { type: 'UPDATE_PRODUCT'; product: Product }
  | { type: 'ADD_INVENTORY'; item: NewInventoryRecord }
  | { type: 'UPDATE_INVENTORY'; item: InventoryRecord }
  | { type: 'RESTORE_INVENTORY'; item: InventoryRecord }
  | { type: 'DELETE_INVENTORY'; id: string }
  | { type: 'REQUEST_SDS_UPDATE'; productIds: string[] }
  | { type: 'ADD_SDS_VERSION'; productId: string; version: SdsVersion }
  | { type: 'RESET' }

export interface StoreLookups {
  productById: Record<string, Product | undefined>
  facilityById: Record<string, Facility | undefined>
  locationById: Record<string, LocationWithFacility | undefined>
  sdsByProduct: Record<string, SdsDocument | undefined>
}

export interface StoreValue extends AppState, StoreLookups {
  dispatch: Dispatch<AppAction>
  years: number[]
}

// ---------------------------------------------------------------------------
// UI
// ---------------------------------------------------------------------------

export interface SelectOption<V extends string = string> {
  value: V
  label: string
}

export type ToastTone = 'success' | 'info' | 'warning'

export interface ToastOptions {
  title: string
  description?: string
  tone?: ToastTone
  action?: { label: string; onClick: () => void }
}
