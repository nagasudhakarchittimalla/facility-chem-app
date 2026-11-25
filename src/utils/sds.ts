import type { SdsDocument, SdsStatus, SdsStatusKey, SdsVersion } from '../types'

export const SDS_MAX_AGE_YEARS = 5

/** Sort order for SDS statuses: most urgent first. */
export const SDS_PRIORITY: Record<SdsStatusKey, number> = { missing: 0, outdated: 1, expiring: 2, current: 3 }
const DAY = 24 * 60 * 60 * 1000

type DateInput = string | number | Date

export function ageInYears(dateStr: DateInput, now: Date = new Date()): number {
  return (now.getTime() - new Date(dateStr).getTime()) / (365.25 * DAY)
}

export function latestVersion(doc: SdsDocument | null | undefined): SdsVersion | null {
  if (!doc || !doc.versions.length) return null
  return [...doc.versions].sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())[0]
}

/**
 * Status of a product's SDS based on the current version's issue date.
 *  - missing:  no SDS on file
 *  - outdated: current version older than 5 years
 *  - expiring: within 6 months of becoming 5 years old
 *  - current:  otherwise
 */
export function sdsStatus(doc: SdsDocument | null | undefined, now: Date = new Date()): SdsStatus {
  const v = latestVersion(doc)
  if (!v) return { key: 'missing', label: 'Missing', age: null, version: null }
  const age = ageInYears(v.issueDate, now)
  if (age > SDS_MAX_AGE_YEARS) return { key: 'outdated', label: 'Older than 5 yrs', age, version: v }
  if (age > SDS_MAX_AGE_YEARS - 0.5) return { key: 'expiring', label: 'Review soon', age, version: v }
  return { key: 'current', label: 'Current', age, version: v }
}

export function reviewDueDate(issueDate: DateInput): Date {
  const d = new Date(issueDate)
  d.setFullYear(d.getFullYear() + SDS_MAX_AGE_YEARS)
  return d
}

export function formatAge(age: number | null | undefined): string {
  if (age == null) return '—'
  const years = Math.floor(age)
  const months = Math.floor((age - years) * 12)
  return years ? `${years}y ${months}m` : `${months}m`
}

export function formatDate(d: DateInput): string {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(n))
}
