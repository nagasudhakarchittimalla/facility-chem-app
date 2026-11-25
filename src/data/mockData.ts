// ---------------------------------------------------------------------------
// Mock data for ChemTrack. All companies, people and products are fictitious.
// ---------------------------------------------------------------------------
import type { Facility, HazardClass, InventoryRecord, Product, SdsDocument, Unit } from '../types'

export const HAZARD_CLASSES: HazardClass[] = [
  'Flammable',
  'Corrosive',
  'Toxic',
  'Oxidizer',
  'Irritant',
  'Health Hazard',
  'Environmental',
  'Compressed Gas',
]

export const YEARS: number[] = [2023, 2024, 2025, 2026]

export const facilities: Facility[] = [
  {
    id: 'F-100',
    name: 'Riverside Manufacturing Plant',
    code: 'RMP',
    address: '1200 River Rd, Columbus, OH 43215',
    manager: 'Dana Whitfield',
    employees: 342,
    areaSqFt: 185000,
    type: 'Manufacturing',
    locations: [
      { id: 'L-101', name: 'Warehouse A – Bay 1', type: 'Warehouse' },
      { id: 'L-102', name: 'Warehouse A – Bay 4', type: 'Warehouse' },
      { id: 'L-103', name: 'Production Line 2', type: 'Production' },
      { id: 'L-104', name: 'Flammables Cage', type: 'Hazmat Storage' },
      { id: 'L-105', name: 'Maintenance Shop', type: 'Maintenance' },
    ],
  },
  {
    id: 'F-200',
    name: 'Northgate Research Lab',
    code: 'NRL',
    address: '48 Innovation Way, Madison, WI 53703',
    manager: 'Priya Raman',
    employees: 87,
    areaSqFt: 42000,
    type: 'Laboratory',
    locations: [
      { id: 'L-201', name: 'Lab 1 – Fume Hood Row', type: 'Laboratory' },
      { id: 'L-202', name: 'Lab 2 – Analytical', type: 'Laboratory' },
      { id: 'L-203', name: 'Acid Cabinet A', type: 'Hazmat Storage' },
      { id: 'L-204', name: 'Solvent Cabinet B', type: 'Hazmat Storage' },
    ],
  },
  {
    id: 'F-300',
    name: 'Harbor Distribution Center',
    code: 'HDC',
    address: '9 Pier Ave, Baltimore, MD 21230',
    manager: 'Marcus Lee',
    employees: 156,
    areaSqFt: 260000,
    type: 'Distribution',
    locations: [
      { id: 'L-301', name: 'Dock Staging', type: 'Warehouse' },
      { id: 'L-302', name: 'High-Bay Racking R3', type: 'Warehouse' },
      { id: 'L-303', name: 'Corrosives Room', type: 'Hazmat Storage' },
      { id: 'L-304', name: 'Gas Cylinder Yard', type: 'Outdoor' },
    ],
  },
  {
    id: 'F-400',
    name: 'Summit Water Treatment Facility',
    code: 'SWT',
    address: '700 Summit Pkwy, Denver, CO 80202',
    manager: 'Elena Brooks',
    employees: 64,
    areaSqFt: 98000,
    type: 'Utility',
    locations: [
      { id: 'L-401', name: 'Chemical Feed Building', type: 'Production' },
      { id: 'L-402', name: 'Bulk Tank Farm', type: 'Outdoor' },
      { id: 'L-403', name: 'Lab & QC Room', type: 'Laboratory' },
    ],
  },
]

export const products: Product[] = [
  {
    id: 'P-001', name: 'Acetone, Technical Grade', sku: 'NV-ACT-55', manufacturer: 'Norvale Chemical Co.',
    category: 'Solvent', physicalState: 'Liquid', unit: 'L', signalWord: 'Danger',
    hazards: ['Flammable', 'Irritant'], storage: 'Store in flammables cabinet away from ignition sources.',
    ingredients: [{ name: 'Acetone', cas: '67-64-1', min: 99, max: 100 }],
  },
  {
    id: 'P-002', name: 'Isopropyl Alcohol 99%', sku: 'NV-IPA-99', manufacturer: 'Norvale Chemical Co.',
    category: 'Solvent', physicalState: 'Liquid', unit: 'L', signalWord: 'Danger',
    hazards: ['Flammable', 'Irritant'], storage: 'Keep container tightly closed in a cool, ventilated area.',
    ingredients: [{ name: 'Propan-2-ol', cas: '67-63-0', min: 99, max: 100 }],
  },
  {
    id: 'P-003', name: 'Sodium Hydroxide 50% Solution', sku: 'AK-NAOH-50', manufacturer: 'Alkemi Industrial',
    category: 'Base', physicalState: 'Liquid', unit: 'L', signalWord: 'Danger',
    hazards: ['Corrosive'], storage: 'Store in corrosion-resistant containers. Keep away from acids.',
    ingredients: [
      { name: 'Sodium hydroxide', cas: '1310-73-2', min: 49, max: 51 },
      { name: 'Water', cas: '7732-18-5', min: 49, max: 51 },
    ],
  },
  {
    id: 'P-004', name: 'Sulfuric Acid 93%', sku: 'AK-H2SO4-93', manufacturer: 'Alkemi Industrial',
    category: 'Acid', physicalState: 'Liquid', unit: 'L', signalWord: 'Danger',
    hazards: ['Corrosive', 'Health Hazard'], storage: 'Store in acid cabinet. Segregate from bases and organics.',
    ingredients: [
      { name: 'Sulfuric acid', cas: '7664-93-9', min: 92, max: 94 },
      { name: 'Water', cas: '7732-18-5', min: 6, max: 8 },
    ],
  },
  {
    id: 'P-005', name: 'Hydrochloric Acid 37%', sku: 'AK-HCL-37', manufacturer: 'Alkemi Industrial',
    category: 'Acid', physicalState: 'Liquid', unit: 'L', signalWord: 'Danger',
    hazards: ['Corrosive', 'Toxic', 'Irritant'], storage: 'Ventilated acid cabinet. Keep away from metals.',
    ingredients: [
      { name: 'Hydrogen chloride', cas: '7647-01-0', min: 36, max: 38 },
      { name: 'Water', cas: '7732-18-5', min: 62, max: 64 },
    ],
  },
  {
    id: 'P-006', name: 'Hydrogen Peroxide 35%', sku: 'OX-H2O2-35', manufacturer: 'Oxyline Supply',
    category: 'Oxidizer', physicalState: 'Liquid', unit: 'L', signalWord: 'Danger',
    hazards: ['Oxidizer', 'Corrosive'], storage: 'Vented containers. Keep away from combustibles.',
    ingredients: [
      { name: 'Hydrogen peroxide', cas: '7722-84-1', min: 34, max: 36 },
      { name: 'Water', cas: '7732-18-5', min: 64, max: 66 },
    ],
  },
  {
    id: 'P-007', name: 'Methanol, ACS Reagent', sku: 'NV-MEOH-ACS', manufacturer: 'Norvale Chemical Co.',
    category: 'Solvent', physicalState: 'Liquid', unit: 'L', signalWord: 'Danger',
    hazards: ['Flammable', 'Toxic', 'Health Hazard'], storage: 'Flammables cabinet. Ground containers when transferring.',
    ingredients: [{ name: 'Methanol', cas: '67-56-1', min: 99.8, max: 100 }],
  },
  {
    id: 'P-008', name: 'Toluene', sku: 'NV-TOL-01', manufacturer: 'Norvale Chemical Co.',
    category: 'Solvent', physicalState: 'Liquid', unit: 'L', signalWord: 'Danger',
    hazards: ['Flammable', 'Health Hazard', 'Irritant'], storage: 'Flammables cabinet. Avoid prolonged exposure.',
    ingredients: [{ name: 'Toluene', cas: '108-88-3', min: 99.5, max: 100 }],
  },
  {
    id: 'P-009', name: 'Xylene, Mixed Isomers', sku: 'NV-XYL-MX', manufacturer: 'Norvale Chemical Co.',
    category: 'Solvent', physicalState: 'Liquid', unit: 'L', signalWord: 'Warning',
    hazards: ['Flammable', 'Health Hazard', 'Irritant'], storage: 'Flammables cabinet.',
    ingredients: [
      { name: 'Xylene (mixed isomers)', cas: '1330-20-7', min: 80, max: 85 },
      { name: 'Ethylbenzene', cas: '100-41-4', min: 15, max: 20 },
    ],
  },
  {
    id: 'P-010', name: 'Ethylene Glycol Coolant', sku: 'GT-EG-CL', manufacturer: 'Glidetech Lubricants',
    category: 'Coolant', physicalState: 'Liquid', unit: 'L', signalWord: 'Warning',
    hazards: ['Toxic', 'Health Hazard'], storage: 'Store in closed containers. Keep from pets & children.',
    ingredients: [
      { name: 'Ethylene glycol', cas: '107-21-1', min: 90, max: 95 },
      { name: 'Diethylene glycol', cas: '111-46-6', min: 1, max: 5 },
      { name: 'Dipotassium phosphate', cas: '7758-11-4', min: 1, max: 3 },
    ],
  },
  {
    id: 'P-011', name: 'Sodium Hypochlorite 12.5%', sku: 'AQ-NAOCL-12', manufacturer: 'AquaPure Solutions',
    category: 'Disinfectant', physicalState: 'Liquid', unit: 'L', signalWord: 'Danger',
    hazards: ['Corrosive', 'Oxidizer', 'Environmental'], storage: 'Cool, dark area. Never mix with acids or ammonia.',
    ingredients: [
      { name: 'Sodium hypochlorite', cas: '7681-52-9', min: 12, max: 13 },
      { name: 'Sodium hydroxide', cas: '1310-73-2', min: 0.5, max: 1 },
      { name: 'Water', cas: '7732-18-5', min: 85, max: 87 },
    ],
  },
  {
    id: 'P-012', name: 'Nitric Acid 70%', sku: 'AK-HNO3-70', manufacturer: 'Alkemi Industrial',
    category: 'Acid', physicalState: 'Liquid', unit: 'L', signalWord: 'Danger',
    hazards: ['Corrosive', 'Oxidizer', 'Toxic'], storage: 'Dedicated oxidizing-acid cabinet.',
    ingredients: [
      { name: 'Nitric acid', cas: '7697-37-2', min: 68, max: 71 },
      { name: 'Water', cas: '7732-18-5', min: 29, max: 32 },
    ],
  },
  {
    id: 'P-013', name: 'Ammonium Hydroxide 29%', sku: 'AK-NH4OH-29', manufacturer: 'Alkemi Industrial',
    category: 'Base', physicalState: 'Liquid', unit: 'L', signalWord: 'Danger',
    hazards: ['Corrosive', 'Toxic', 'Environmental'], storage: 'Cool, ventilated base cabinet.',
    ingredients: [
      { name: 'Ammonia', cas: '1336-21-6', min: 28, max: 30 },
      { name: 'Water', cas: '7732-18-5', min: 70, max: 72 },
    ],
  },
  {
    id: 'P-014', name: 'Heavy-Duty Degreaser DX-200', sku: 'GT-DX200', manufacturer: 'Glidetech Lubricants',
    category: 'Cleaner', physicalState: 'Liquid', unit: 'L', signalWord: 'Warning',
    hazards: ['Irritant', 'Environmental'], storage: 'Store between 5–35 °C.',
    ingredients: [
      { name: '2-Butoxyethanol', cas: '111-76-2', min: 5, max: 10 },
      { name: 'Sodium metasilicate', cas: '6834-92-0', min: 1, max: 5 },
      { name: 'Alcohol ethoxylate', cas: '68439-46-3', min: 1, max: 5 },
      { name: 'Water', cas: '7732-18-5', min: 80, max: 90 },
    ],
  },
  {
    id: 'P-015', name: 'Hydraulic Oil ISO 46', sku: 'GT-HYD-46', manufacturer: 'Glidetech Lubricants',
    category: 'Lubricant', physicalState: 'Liquid', unit: 'L', signalWord: 'None',
    hazards: ['Environmental'], storage: 'Store indoors in original containers.',
    ingredients: [
      { name: 'Distillates, hydrotreated heavy paraffinic', cas: '64742-54-7', min: 95, max: 99 },
      { name: 'Zinc dialkyldithiophosphate', cas: '68649-42-3', min: 0.5, max: 1.5 },
    ],
  },
  {
    id: 'P-016', name: 'Ferric Chloride 40% Coagulant', sku: 'AQ-FECL3-40', manufacturer: 'AquaPure Solutions',
    category: 'Water Treatment', physicalState: 'Liquid', unit: 'L', signalWord: 'Danger',
    hazards: ['Corrosive', 'Irritant'], storage: 'Lined tanks. Corrosive to most metals.',
    ingredients: [
      { name: 'Ferric chloride', cas: '7705-08-0', min: 38, max: 42 },
      { name: 'Hydrochloric acid', cas: '7647-01-0', min: 0.1, max: 1 },
      { name: 'Water', cas: '7732-18-5', min: 57, max: 61 },
    ],
  },
  {
    id: 'P-017', name: 'Calcium Hypochlorite Granules 65%', sku: 'AQ-CAOCL-65', manufacturer: 'AquaPure Solutions',
    category: 'Disinfectant', physicalState: 'Solid', unit: 'kg', signalWord: 'Danger',
    hazards: ['Oxidizer', 'Corrosive', 'Environmental'], storage: 'Dry, cool area. Separate from organics & acids.',
    ingredients: [
      { name: 'Calcium hypochlorite', cas: '7778-54-3', min: 65, max: 70 },
      { name: 'Sodium chloride', cas: '7647-14-5', min: 10, max: 20 },
      { name: 'Calcium hydroxide', cas: '1305-62-0', min: 1, max: 4 },
    ],
  },
  {
    id: 'P-018', name: 'Sodium Bicarbonate', sku: 'AK-NAHCO3', manufacturer: 'Alkemi Industrial',
    category: 'Neutralizer', physicalState: 'Solid', unit: 'kg', signalWord: 'None',
    hazards: [], storage: 'Store dry.',
    ingredients: [{ name: 'Sodium hydrogen carbonate', cas: '144-55-8', min: 99, max: 100 }],
  },
  {
    id: 'P-019', name: 'Compressed Nitrogen', sku: 'OX-N2-300', manufacturer: 'Oxyline Supply',
    category: 'Gas', physicalState: 'Gas', unit: 'cyl', signalWord: 'Warning',
    hazards: ['Compressed Gas'], storage: 'Secure cylinders upright with chains.',
    ingredients: [{ name: 'Nitrogen', cas: '7727-37-9', min: 99.99, max: 100 }],
  },
  {
    id: 'P-020', name: 'Acetylene, Dissolved', sku: 'OX-C2H2-145', manufacturer: 'Oxyline Supply',
    category: 'Gas', physicalState: 'Gas', unit: 'cyl', signalWord: 'Danger',
    hazards: ['Compressed Gas', 'Flammable'], storage: 'Store upright, away from oxygen cylinders (6 m).',
    ingredients: [
      { name: 'Acetylene', cas: '74-86-2', min: 99, max: 100 },
      { name: 'Acetone (solvent)', cas: '67-64-1', min: 0, max: 1 },
    ],
  },
  {
    id: 'P-021', name: 'Epoxy Floor Coating Part A', sku: 'DC-EPX-A', manufacturer: 'DuraCoat Systems',
    category: 'Coating', physicalState: 'Liquid', unit: 'L', signalWord: 'Warning',
    hazards: ['Irritant', 'Health Hazard', 'Environmental'], storage: 'Store at 10–30 °C. Keep sealed.',
    ingredients: [
      { name: 'Bisphenol A diglycidyl ether resin', cas: '25068-38-6', min: 60, max: 80 },
      { name: 'Benzyl alcohol', cas: '100-51-6', min: 5, max: 10 },
      { name: 'Titanium dioxide', cas: '13463-67-7', min: 5, max: 10 },
    ],
  },
  {
    id: 'P-022', name: 'Phosphoric Acid 85%', sku: 'AK-H3PO4-85', manufacturer: 'Alkemi Industrial',
    category: 'Acid', physicalState: 'Liquid', unit: 'L', signalWord: 'Danger',
    hazards: ['Corrosive'], storage: 'Acid cabinet.',
    ingredients: [
      { name: 'Phosphoric acid', cas: '7664-38-2', min: 84, max: 86 },
      { name: 'Water', cas: '7732-18-5', min: 14, max: 16 },
    ],
  },
]

// Which products are stocked at which locations
const stockPlan: Record<string, Record<string, string[]>> = {
  'F-100': {
    'L-101': ['P-003', 'P-014', 'P-015', 'P-018'],
    'L-102': ['P-010', 'P-021', 'P-022'],
    'L-103': ['P-002', 'P-014', 'P-015'],
    'L-104': ['P-001', 'P-008', 'P-009'],
    'L-105': ['P-015', 'P-019', 'P-020', 'P-010'],
  },
  'F-200': {
    'L-201': ['P-001', 'P-007', 'P-008'],
    'L-202': ['P-002', 'P-006', 'P-018', 'P-019'],
    'L-203': ['P-004', 'P-005', 'P-012', 'P-022', 'P-013'],
    'L-204': ['P-001', 'P-002', 'P-007', 'P-009'],
  },
  'F-300': {
    'L-301': ['P-014', 'P-010', 'P-018'],
    'L-302': ['P-002', 'P-015', 'P-021', 'P-001'],
    'L-303': ['P-003', 'P-004', 'P-005', 'P-011'],
    'L-304': ['P-019', 'P-020'],
  },
  'F-400': {
    'L-401': ['P-011', 'P-016', 'P-017', 'P-003'],
    'L-402': ['P-011', 'P-016', 'P-004'],
    'L-403': ['P-005', 'P-006', 'P-012', 'P-013', 'P-018'],
  },
}

// Deterministic pseudo-random generator so the mock data is stable
function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(20261124)

const CONTAINERS: Record<Unit, [container: string, size: number][]> = {
  L: [['Bottle (4 L)', 4], ['Drum (208 L)', 208], ['Pail (20 L)', 20], ['Tote (1000 L)', 1000]],
  kg: [['Bag (25 kg)', 25], ['Pail (45 kg)', 45], ['Drum (100 kg)', 100]],
  cyl: [['Cylinder', 1]],
}

function buildInventory(): InventoryRecord[] {
  const rows: InventoryRecord[] = []
  let n = 1
  for (const [facilityId, locs] of Object.entries(stockPlan)) {
    for (const [locationId, productIds] of Object.entries(locs)) {
      for (const productId of productIds) {
        const product = products.find((p) => p.id === productId)!
        const options = CONTAINERS[product.unit]
        const [container, size] = options[Math.floor(rand() * options.length)]
        let count = Math.max(1, Math.round(rand() * 10))
        for (const year of YEARS) {
          // Year-over-year drift; some items were added in later years
          if (year === 2023 && rand() < 0.15) continue
          count = Math.max(1, count + Math.round((rand() - 0.45) * 4))
          const month = 1 + Math.floor(rand() * 11)
          rows.push({
            id: `INV-${String(n++).padStart(4, '0')}`,
            productId,
            facilityId,
            locationId,
            year,
            container,
            containerCount: count,
            quantity: count * size,
            unit: product.unit,
            maxDailyAmount: Math.round(count * size * (1.2 + rand())),
            lastUpdated: `${year}-${String(month).padStart(2, '0')}-${String(1 + Math.floor(rand() * 27)).padStart(2, '0')}`,
          })
        }
      }
    }
  }
  return rows
}

export const inventory = buildInventory()

// SDS documents: issue dates intentionally include several older than 5 years
const sdsHistory: Record<string, string[]> = {
  'P-001': ['2015-03-10', '2019-06-14', '2023-02-01'],
  'P-002': ['2017-08-22', '2020-04-30'],
  'P-003': ['2016-01-12', '2022-09-05'],
  'P-004': ['2014-11-03', '2018-05-21'],
  'P-005': ['2019-02-11', '2021-07-19', '2024-10-02'],
  'P-006': ['2020-09-14'],
  'P-007': ['2016-04-04', '2021-12-15'],
  'P-008': ['2013-06-30', '2017-10-09'],
  'P-009': ['2018-03-27', '2022-01-18', '2025-05-06'],
  'P-010': ['2019-11-25'],
  'P-011': ['2015-07-08', '2018-08-20', '2021-03-30'],
  'P-012': ['2020-12-01', '2024-03-12'],
  'P-013': ['2016-02-29', '2019-05-17'],
  'P-014': ['2021-08-09', '2023-11-14', '2025-09-22'],
  'P-015': ['2014-05-15'],
  'P-016': ['2019-09-09', '2022-06-27'],
  'P-017': ['2017-12-04', '2021-06-08'],
  'P-018': ['2020-10-10'],
  'P-019': ['2018-01-30', '2023-08-16'],
  'P-020': ['2016-10-17', '2021-02-24'],
  'P-021': ['2021-04-12'],
  // P-022 intentionally has no SDS on file
}

const uploaders = ['Dana Whitfield', 'Priya Raman', 'Marcus Lee', 'Elena Brooks', 'EHS Admin']
const notes = [
  'Initial SDS received from supplier.',
  'Updated to GHS Rev. 7 format.',
  'Revised exposure limits in Section 8.',
  'Updated transport information (Section 14).',
  'Manufacturer address and emergency phone changed.',
  'Reclassified hazard statements per supplier revision.',
]

export const sdsDocuments: SdsDocument[] = Object.entries(sdsHistory).map(([productId, dates], i) => {
  const product = products.find((p) => p.id === productId)!
  return {
    id: `SDS-${String(i + 1).padStart(3, '0')}`,
    productId,
    language: 'English',
    region: 'US / OSHA HazCom 2012',
    versions: dates.map((date, v) => ({
      version: `${v + 1}.0`,
      issueDate: date,
      uploadedAt: date,
      uploadedBy: uploaders[(i + v) % uploaders.length],
      fileName: `${product.sku}_SDS_v${v + 1}.0.pdf`,
      fileSizeKb: 180 + Math.floor(rand() * 600),
      notes: notes[v === 0 ? 0 : 1 + ((i + v) % (notes.length - 1))],
    })),
  }
})
