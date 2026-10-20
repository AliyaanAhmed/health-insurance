import type { CustomerData } from './healthPricing'
import man from './assets/optimized/man.webp'
import woman from './assets/optimized/woman.webp'
import boy from './assets/optimized/boy.webp'
import girl from './assets/optimized/girl.webp'
import father from './assets/optimized/father.webp'
import mother from './assets/optimized/mother.webp'
import hero from './assets/optimized/healthcare-hero.webp'
import family from './assets/optimized/family.webp'
import stethoscope from './assets/optimized/stethoscope.webp'
import glass from './assets/optimized/glass-tile.webp'
import shield from './assets/optimized/shield.webp'

export const art = {
  man,
  woman,
  boy,
  girl,
  father,
  mother,
  hero,
  family,
  stethoscope,
  glass,
  shield,
}
export type CoverageTarget = 'self' | 'self_and_dependents' | 'dependents_only'
export type Gender = '' | 'male' | 'female'
export type Relationship = 'spouse' | 'child' | 'parent' | 'other'
export type Stage = 'cover' | 'details' | 'family' | 'tpa' | 'documents' | 'review'
export type TpaNetwork = 1 | 2 | 3
export const tpaNetworks = [
  { value: 1, label: 'Basic Network', adjustment: 0 },
  { value: 2, label: 'Standard Network', adjustment: 10 },
  { value: 3, label: 'Premium Network', adjustment: 20 },
] as const
export function tpaErrors(draft: Draft): Errors {
  return draft.tpa === 'NextCare' &&
    tpaNetworks.some((network) => network.value === draft.tpaNetwork)
    ? {}
    : { tpaNetwork: 'Please select a plan.' }
}
export type SalaryBand = '' | 'above_4000' | 'below_4000' | 'pending_4000'
export interface Person {
  fullName: string
  dateOfBirth: string
  gender: Gender
}
export interface Applicant extends Person {
  maritalStatus: string
  salaryBand: SalaryBand
  mobile: string
  email: string
}
export interface Member extends Person {
  confirmedDetails?: Person
  id: string
  relationship: Relationship
  saved: boolean
}
export interface Draft {
  tpa: string
  tpaNetwork: TpaNetwork | null
  documents: InquiryDocument[]
  documentsConfirmed: boolean
  coverageTarget: CoverageTarget
  visaType: string
  nationalityCode: string
  visaEmirate: string
  visaStatus: string
  applicant: Applicant
  members: Member[]
}
export interface InquiryPremium {
  base: number
  additional: number
  taxPercent: number
}
export interface InquiryDocument {
  id: string
  name: string
  category: 'applicant' | 'visa' | 'family'
  sample?: boolean
  file?: File
}
export interface Inquiry {
  rawCustomerData?: string
  emailData?: string
  etag?: string
  basePremium?: number
  dataverseStatus?: number
  customerData?: CustomerData
  name?: string
  unreadable?: boolean
  grossPremium?: number
  totalAmountCharge?: number
  contactId?: string
  premium?: InquiryPremium
  documents?: InquiryDocument[]
  sample?: boolean
  status?: 'reviewing' | 'ready' | 'received'
  id: string
  draft: Draft
  createdAt: string
}
export type Errors = Record<string, string>
export const coverageOptions: { value: CoverageTarget; label: string; helper: string }[] = [
  { value: 'self', label: 'Just me', helper: 'Employment or family visa holder' },
  {
    value: 'self_and_dependents',
    label: 'Me & my dependents',
    helper: 'Spouse, children or parents',
  },
  { value: 'dependents_only', label: 'Dependents only', helper: 'I am already insured elsewhere' },
]
export const emirates = [
  'Abu Dhabi',
  'Dubai',
  'Sharjah',
  'Ajman',
  'Ras Al Khaimah',
  'Fujairah',
  'Umm Al Quwain',
]
export const visaOptions = [
  { value: 'employee', label: 'Employee', helper: 'I have an employment or family visa' },
  { value: 'investor', label: 'Investor', helper: 'I own, or am a partner in, a company' },
]
export const statusOptions = [
  { value: 'new', label: 'New visa', helper: 'My first residence visa' },
  { value: 'renewal', label: 'Renewal', helper: 'Renewing my existing visa' },
  { value: 'visit', label: 'Visit visa', helper: 'Visiting or changing to residence' },
  { value: 'cancelled', label: 'Cancelled visa', helper: 'My previous visa was cancelled' },
]
export const maritalOptions = ['Single', 'Married', 'Divorced', 'Widowed']
export const relationshipLabels: Record<Relationship, string> = {
  spouse: 'Spouse',
  child: 'Child',
  parent: 'Parent',
  other: 'Other dependant',
}
export const stageLabels: Record<Stage, string> = {
  cover: 'Cover',
  details: 'Your details',
  family: 'Family',
  tpa: 'Plans',
  documents: 'Documents',
  review: 'Review',
}
export const countryCodes =
  'AF AX AL DZ AS AD AO AI AQ AG AR AM AW AU AT AZ BS BH BD BB BY BE BZ BJ BM BT BO BQ BA BW BV BR IO BN BG BF BI CV KH CM CA KY CF TD CL CN CX CC CO KM CG CD CK CR CI HR CU CW CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FK FO FJ FI FR GF PF TF GA GM GE DE GH GI GR GL GD GP GU GT GG GN GW GY HT HM VA HN HK HU IS IN ID IR IQ IE IM IL IT JM JP JE JO KZ KE KI KP KR KW KG LA LV LB LS LR LY LI LT LU MO MG MW MY MV ML MT MH MQ MR MU YT MX FM MD MC MN ME MS MA MZ MM NA NR NP NL NC NZ NI NE NG NU NF MK MP NO OM PK PW PS PA PG PY PE PH PN PL PT PR QA RE RO RU RW BL SH KN LC MF PM VC WS SM ST SA SN RS SC SL SG SX SK SI SB SO ZA GS SS ES LK SD SR SJ SE CH SY TW TJ TZ TH TL TG TK TO TT TN TR TM TC TV UG UA AE GB UM US UY UZ VU VE VN VG VI WF EH YE ZM ZW'.split(
    ' ',
  )
export function countryName(code: string, locale = 'en') {
  return code ? (new Intl.DisplayNames([locale], { type: 'region' }).of(code) ?? code) : ''
}
export function createDraft(coverageTarget: CoverageTarget = 'self'): Draft {
  return {
    coverageTarget,
    documents: [],
    tpa: 'NextCare',
    tpaNetwork: null,
    documentsConfirmed: false,
    visaType: '',
    nationalityCode: '',
    visaEmirate: '',
    visaStatus: '',
    applicant: {
      fullName: '',
      dateOfBirth: '',
      gender: '',
      maritalStatus: '',
      salaryBand: '',
      mobile: '',
      email: '',
    },
    members: [],
  }
}
export function todayISO() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}
export function ageOf(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value > todayISO()) return null
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day)
    return null
  const now = new Date()
  return (
    now.getFullYear() -
    year -
    (now.getMonth() + 1 < month || (now.getMonth() + 1 === month && now.getDate() < day) ? 1 : 0)
  )
}
export function personErrors(person: Person): Errors {
  const errors: Errors = {}
  if (person.fullName.trim().length < 2) errors.fullName = 'Please enter a full name.'
  if (ageOf(person.dateOfBirth) === null)
    errors.dateOfBirth = 'Enter a valid date of birth that is not in the future.'
  if (!person.gender) errors.gender = 'Please select a gender.'
  return errors
}
export function applicantErrors(applicant: Applicant): Errors {
  const errors = personErrors(applicant)
  if (!applicant.maritalStatus) errors.maritalStatus = 'Please select a marital status.'
  if (!applicant.salaryBand) errors.salaryBand = 'Please select a salary band.'
  if (!/^\d{9}$/.test(applicant.mobile))
    errors.mobile = 'Enter the 9-digit UAE mobile number after +971.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(applicant.email.trim()))
    errors.email = 'Enter a valid email address.'
  return errors
}
export function coverErrors(draft: Draft): Errors {
  const errors: Errors = {}
  if (!draft.visaType) errors.visaType = 'Please select a visa type.'
  if (!draft.nationalityCode) errors.nationalityCode = 'Please choose your nationality.'
  if (!draft.visaEmirate) errors.visaEmirate = 'Please select the emirate of your visa.'
  if (!draft.visaStatus) errors.visaStatus = 'Please select your visa status.'
  return errors
}
export const isApplicantComplete = (draft: Draft) =>
  Object.keys(applicantErrors(draft.applicant)).length === 0
export const isMemberComplete = (member: Member) =>
  member.saved && Object.keys(personErrors(member)).length === 0
export function stagesFor(target: CoverageTarget): Stage[] {
  return target === 'self'
    ? ['cover', 'details', 'tpa', 'review']
    : ['cover', 'details', 'family', 'tpa', 'review']
}
export function portrait(person: Partial<Person>, relationship?: Relationship) {
  if (!person.gender) return null
  const female = person.gender === 'female'
  const age = ageOf(person.dateOfBirth ?? '')
  if (relationship === 'parent' || (age !== null && age >= 60))
    return { src: female ? art.mother : art.father, kind: female ? 'mother' : 'father' }
  if ((relationship === 'child' && age === null) || (age !== null && age < 18))
    return { src: female ? art.girl : art.boy, kind: female ? 'girl' : 'boy' }
  return { src: female ? art.woman : art.man, kind: female ? 'woman' : 'man' }
}
export function displayDate(value: string, locale = 'en') {
  if (ageOf(value) === null) return ''
  const [year, month, day] = value.split('-').map(Number)
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-AE' : 'en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(year, month - 1, day))
}
export function formatMobile(mobile: string, masked = false) {
  return mobile
    ? masked
      ? `+971 ••• ••• ${mobile.slice(-3)}`
      : `+971 ${mobile.slice(0, 2)} ${mobile.slice(2, 5)} ${mobile.slice(5)}`
    : ''
}
export function maskedEmail(email: string) {
  const [local, domain] = email.split('@')
  return domain ? `${local.slice(0, 2)}•••@${domain}` : ''
}
export function normalizeDigits(value: string) {
  return value
    .replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 1776))
    .replace(/\D/g, '')
}
