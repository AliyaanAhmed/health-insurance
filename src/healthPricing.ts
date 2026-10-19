import { ageOf, createDraft, emirates } from './health'
import type { Draft, Person } from './health'
import type { KycSubmission } from './kycQuestions'

export interface HealthPlan {
  id: string
  name: string
  vat: number
}
export interface PremiumRate {
  id: string
  name: string
  emirate: string
  minimumAge: number
  maximumAge: number
  referencePremium: number
}
export interface HealthCatalog {
  product: { id: string; name: string; premium: number }
  plans: HealthPlan[]
  rates: PremiumRate[]
}
export type PremiumStatus =
  | 'priced'
  | 'excluded'
  | 'missing-dob'
  | 'missing-emirate'
  | 'missing-rate'
  | 'ambiguous-rate'
  | 'loading'
  | 'pending-save'
export interface PersonPremium {
  age: number | null
  insured: boolean
  referencePremium: number | null
  rateId: string | null
  premiumStatus: PremiumStatus
}
export interface CustomerData {
  kyc?: KycSubmission
  schemaVersion: 1
  currency: 'AED'
  coverageTarget: Draft['coverageTarget']
  visaType: string
  nationalityCode: string
  visaEmirate: string
  visaStatus: string
  product: HealthCatalog['product'] | null
  plan: HealthPlan | null
  applicant: Draft['applicant'] & PersonPremium
  members: (Draft['members'][number] & PersonPremium)[]
  premium: {
    basePremium: number | null
    pricedPeople: number
    totalPeople: number
    partialGrossPremium: number
    grossPremium: number | null
    vatPercent: number | null
    vatAmount: number | null
    exactTotalAmount: number | null
    totalAmountCharge: number | null
    complete: boolean
    rounding: 'ceil-whole-unit'
  }
}
export const PREMIUM_CURRENCY = 'AED' as const
const cents = (value: number) => Math.round(value * 100)
export function normalizeEmirate(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z]/g, '')
    .replace('rasalkhaima', 'rasalkhaimah')
    .replace(/hh$/, 'h')
}
export function emirateFromRateName(name: string) {
  const prefix = name.split(/\s*[-\u2013\u2014]\s*\d/)[0].trim()
  return (
    emirates.find((emirate) => normalizeEmirate(emirate) === normalizeEmirate(prefix)) ?? prefix
  )
}
function personPremium(
  person: Person,
  insured: boolean,
  emirate: string,
  catalog: HealthCatalog | null,
): PersonPremium {
  const age = ageOf(person.dateOfBirth)
  const base = { age, insured, referencePremium: null, rateId: null }
  if (!insured) return { ...base, premiumStatus: 'excluded' }
  if (age === null) return { ...base, premiumStatus: 'missing-dob' }
  if (!emirate) return { ...base, premiumStatus: 'missing-emirate' }
  if (!catalog) return { ...base, premiumStatus: 'loading' }
  const matches = catalog.rates.filter(
    (rate) =>
      normalizeEmirate(rate.emirate) === normalizeEmirate(emirate) &&
      age >= rate.minimumAge &&
      age <= rate.maximumAge,
  )
  if (matches.length !== 1)
    return { ...base, premiumStatus: matches.length ? 'ambiguous-rate' : 'missing-rate' }
  return {
    ...base,
    referencePremium: matches[0].referencePremium,
    rateId: matches[0].id,
    premiumStatus: 'priced',
  }
}
/** The live customer JSON is derived from form state; no separate mutable copy can become stale. */
export function buildCustomerData(
  draft: Draft,
  catalog: HealthCatalog | null,
  plan: HealthPlan | null,
): CustomerData {
  const applicant = {
    ...draft.applicant,
    ...personPremium(
      draft.applicant,
      draft.coverageTarget !== 'dependents_only',
      draft.visaEmirate,
      catalog,
    ),
  }
  const members = (draft.coverageTarget === 'self' ? [] : draft.members).map((member) => ({
    ...member,
    ...(member.saved || member.confirmedDetails
      ? personPremium(
          member.saved ? member : member.confirmedDetails!,
          true,
          draft.visaEmirate,
          catalog,
        )
      : {
          age: ageOf(member.dateOfBirth),
          insured: true,
          referencePremium: null,
          rateId: null,
          premiumStatus: 'pending-save' as const,
        }),
  }))
  const insured = [applicant, ...members].filter((person) => person.insured)
  const priced = insured.filter((person) => person.premiumStatus === 'priced')
  const subtotalCents = priced.reduce((sum, person) => sum + cents(person.referencePremium!), 0)
  const complete =
    insured.length > 0 &&
    insured.length === priced.length &&
    members.every((member) => member.saved) &&
    Boolean(plan)
  const grossPremium = priced.length ? subtotalCents / 100 : null
  // Round the final charge only: rounding VAT to cents first can incorrectly
  // turn a total such as 100.002 into 100 instead of the required 101.
  const vatAmount = complete ? (subtotalCents * plan!.vat) / 10000 : null
  const exactTotalAmount = complete ? (subtotalCents * (100 + plan!.vat)) / 10000 : null
  return {
    schemaVersion: 1,
    currency: PREMIUM_CURRENCY,
    coverageTarget: draft.coverageTarget,
    visaType: draft.visaType,
    nationalityCode: draft.nationalityCode,
    visaEmirate: draft.visaEmirate,
    visaStatus: draft.visaStatus,
    product: catalog?.product ?? null,
    plan,
    applicant,
    members,
    premium: {
      basePremium: catalog?.product.premium ?? null,
      pricedPeople: priced.length,
      totalPeople: insured.length,
      partialGrossPremium: subtotalCents / 100,
      grossPremium,
      vatPercent: plan?.vat ?? null,
      vatAmount,
      exactTotalAmount,
      totalAmountCharge: exactTotalAmount === null ? null : Math.ceil(exactTotalAmount),
      complete,
      rounding: 'ceil-whole-unit',
    },
  }
}
/** Do not treat old or malformed JSON as a valid request. */
export function parseCustomerData(
  text: string,
): { draft: Draft; customerData: CustomerData } | null {
  try {
    const data: unknown = JSON.parse(text)
    if (!data || typeof data !== 'object') return null
    const d = data as CustomerData
    if (
      d.schemaVersion !== 1 ||
      !['self', 'self_and_dependents', 'dependents_only'].includes(d.coverageTarget) ||
      !d.applicant ||
      !Array.isArray(d.members)
    )
      return null
    const person = (value: unknown): value is Person =>
      Boolean(
        value &&
        typeof value === 'object' &&
        ['fullName', 'dateOfBirth', 'gender'].every(
          (key) => typeof (value as Record<string, unknown>)[key] === 'string',
        ),
      )
    if (
      !person(d.applicant) ||
      !['maritalStatus', 'salaryBand', 'email', 'mobile'].every(
        (key) => typeof (d.applicant as unknown as Record<string, unknown>)[key] === 'string',
      )
    )
      return null
    if (
      !['visaType', 'nationalityCode', 'visaEmirate', 'visaStatus'].every(
        (key) => typeof (d as unknown as Record<string, unknown>)[key] === 'string',
      )
    )
      return null
    if (
      !d.members.every(
        (m) =>
          person(m) &&
          typeof m.id === 'string' &&
          ['spouse', 'child', 'parent', 'other'].includes(m.relationship),
      )
    )
      return null
    const amount = (value: unknown) =>
      value === null || (typeof value === 'number' && Number.isFinite(value) && value >= 0)
    if (
      !d.premium ||
      typeof d.premium !== 'object' ||
      !amount(d.premium.grossPremium) ||
      !amount(d.premium.totalAmountCharge)
    )
      return null
    if (d.product && (typeof d.product.id !== 'string' || typeof d.product.name !== 'string'))
      return null
    if (
      d.plan &&
      (typeof d.plan.id !== 'string' ||
        typeof d.plan.name !== 'string' ||
        typeof d.plan.vat !== 'number' ||
        !Number.isFinite(d.plan.vat))
    )
      return null
    return {
      customerData: { ...d, currency: PREMIUM_CURRENCY },
      draft: {
        ...createDraft(d.coverageTarget),
        visaType: d.visaType,
        nationalityCode: d.nationalityCode,
        visaEmirate: d.visaEmirate,
        visaStatus: d.visaStatus,
        applicant: d.applicant,
        members: d.members,
      },
    }
  } catch {
    return null
  }
}
