import type { Inquiry } from './health'
import { createDraft } from './health'
import { emirateFromRateName, parseCustomerData } from './healthPricing'
import type { CustomerData, HealthCatalog, HealthPlan } from './healthPricing'
import { appendKycEmail, buildKycSubmission, coveredPeople, isKycSubmission } from './kycQuestions'
import type { KycDraft } from './kycQuestions'

type Collection<T> = { value: T[]; '@odata.nextLink'?: string }
type ProductRow = {
  aur_premium: number | string | null
  aur_productsid: string
  aur_name: string
  aur_plan_product_aur_products?: PlanRow[]
  'aur_plan_product_aur_products@odata.nextLink'?: string
}
type PlanRow = { aur_planid: string; aur_name: string; aur_vat: number | null }
type RateRow = {
  aur_medical_premium_rateid: string
  aur_name: string
  aur_minimum_age: number
  aur_maximum_age: number
  aur_reference_premium: number
}
type ContactRow = { contactid: string; fullname?: string; emailaddress1?: string }
type QuoteRow = {
  '@odata.etag'?: string
  aur_email_data?: string
  aur_base_premium?: number
  statuscode?: number
  aur_quotesid: string
  aur_name?: string
  aur_customer_data?: string
  aur_gross_premium?: number
  aur_total_amount_charge?: number
  createdon?: string
  _aur_contact_value?: string
}
export class PortalApiError extends Error {
  status: number
  constructor(message: string, status = 0) {
    super(message)
    this.status = status
    this.name = 'PortalApiError'
  }
}
const guidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
function guid(value: string) {
  const clean = value.replace(/[{}]/g, '')
  if (!guidPattern.test(clean)) throw new Error('The server returned an invalid record ID.')
  return clean
}
const literal = (value: string) => `'${value.replace(/'/g, "''")}'`
let tokenPromise: Promise<string> | null = null
async function token() {
  if (!tokenPromise)
    tokenPromise = (async () => {
      const result = await fetch('/_layout/tokenhtml', {
        credentials: 'same-origin',
        cache: 'no-store',
        signal: AbortSignal.timeout(20000),
        headers: { Accept: 'text/html' },
      })
      if (!result.ok)
        throw new PortalApiError(
          'Open this app on Power Pages and sign in to connect to Dataverse.',
          result.status,
        )
      const text = await result.text()
      const value = new DOMParser()
        .parseFromString(text, 'text/html')
        .querySelector<HTMLInputElement>('input[name="__RequestVerificationToken"]')?.value
      if (!value)
        throw new PortalApiError(
          'Your Power Pages session is unavailable. Open the hosted site and sign in again.',
        )
      return value
    })().catch((error) => {
      tokenPromise = null
      throw error
    })
  return tokenPromise
}
/** CRM pagination links are rewritten to this portal, never requested with a CRM bearer token. */
function apiPath(path: string) {
  const url = new URL(path, window.location.origin)
  if (url.origin === window.location.origin && url.pathname.startsWith('/_api/'))
    return url.pathname + url.search
  if (url.hostname === 'insureai.crm6.dynamics.com' && /^\/api\/data\/v9\.\d\//.test(url.pathname))
    return '/_api/' + url.pathname.replace(/^\/api\/data\/v9\.\d\//, '') + url.search
  throw new Error('The server returned an unsupported API continuation URL.')
}
async function request<T>(
  method: 'GET' | 'POST' | 'PATCH',
  path: string,
  body?: unknown,
  options?: { ifMatch?: string },
): Promise<{ data: T; response: Response }> {
  const verificationToken = await token()
  let response: Response
  try {
    response = await fetch(apiPath(path), {
      method,
      credentials: 'same-origin',
      cache: 'no-store',
      signal: AbortSignal.timeout(60000),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'OData-Version': '4.0',
        'OData-MaxVersion': '4.0',
        __RequestVerificationToken: verificationToken,
        Prefer: method === 'GET' ? 'odata.include-annotations="*"' : 'return=minimal',
        ...(method === 'PATCH' ? { 'If-Match': options?.ifMatch ?? '*' } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
  } catch {
    throw new PortalApiError(
      'The connection was interrupted. Check your connection and retry; your form has been kept.',
    )
  }
  const text = response.status === 204 ? '' : await response.text()
  let data: unknown = undefined
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      if (response.ok)
        throw new PortalApiError(
          'Power Pages returned a sign-in page instead of data. Sign in again.',
        )
    }
  }
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) tokenPromise = null
    const detail =
      data && typeof data === 'object'
        ? (data as { error?: { message?: string } }).error?.message
        : ''
    throw new PortalApiError(
      detail ||
        (response.status === 403
          ? 'Your account does not have permission for this request.'
          : `Power Pages could not complete the request (${response.status}).`),
      response.status,
    )
  }
  return { data: data as T, response }
}
async function all<T>(path: string): Promise<T[]> {
  const result: T[] = []
  const seen = new Set<string>()
  let next: string | undefined = path
  while (next) {
    const normalized = apiPath(next)
    if (seen.has(normalized) || seen.size >= 500)
      throw new Error('The server returned an invalid pagination sequence.')
    seen.add(normalized)
    const { data } = await request<Collection<T>>('GET', normalized)
    if (!data || !Array.isArray(data.value))
      throw new Error('Power Pages returned an unexpected collection response.')
    result.push(...data.value)
    next = data['@odata.nextLink']
  }
  return result
}
function numeric(value: unknown, label: string) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0)
    throw new Error(`${label} is missing or invalid in Dataverse.`)
  return value
}
export async function loadHealthProduct(): Promise<Pick<HealthCatalog, 'product' | 'plans'>> {
  const products = await all<ProductRow>(
    '/_api/aur_productses?$select=aur_productsid,aur_name,aur_premium&$expand=aur_plan_product_aur_products($select=aur_planid,aur_name,aur_vat)&$filter=' +
      encodeURIComponent("aur_name eq 'Health Insurance'"),
  )
  if (products.length !== 1)
    throw new Error('Exactly one Health Insurance product must be configured in Dataverse.')
  const product = products[0]
  const plansLink = product['aur_plan_product_aur_products@odata.nextLink']
  // A relationship link without a paging token does not require another read.
  const pagedPlans = plansLink && /[?&]\$(?:skiptoken|skip)=/i.test(plansLink)
  const extra = pagedPlans
    ? await all<PlanRow>(
        '/_api/aur_plans?$select=aur_planid,aur_name,aur_vat&$filter=' +
          encodeURIComponent('_aur_product_value eq ' + guid(product.aur_productsid)),
      )
    : []
  const plans: HealthPlan[] = [
    ...new Map(
      [...(product.aur_plan_product_aur_products ?? []), ...extra].map((row) => [
        row.aur_planid,
        row,
      ]),
    ).values(),
  ].map((row) => ({
    id: guid(row.aur_planid),
    name: row.aur_name,
    vat: numeric(row.aur_vat, 'Plan VAT'),
  }))
  if (!plans.length) throw new Error('No plan is available for Health Insurance.')
  // The portal can serialize this whole-number field as a numeric string.
  // Validate before conversion so blank or malformed values never become zero.
  const rawPremium = product.aur_premium
  const basePremium = numeric(
    typeof rawPremium === 'string' && /^\d+$/.test(rawPremium.trim())
      ? Number(rawPremium.trim())
      : rawPremium,
    'Product premium',
  )
  if (!Number.isSafeInteger(basePremium))
    throw new Error('Product premium must be a whole number in Dataverse.')
  return {
    product: { id: guid(product.aur_productsid), name: product.aur_name, premium: basePremium },
    plans,
  }
}
export async function loadHealthCatalog(): Promise<HealthCatalog> {
  const [product, rows] = await Promise.all([
    loadHealthProduct(),
    all<RateRow>(
      '/_api/aur_medical_premium_rates?$select=aur_medical_premium_rateid,aur_maximum_age,aur_minimum_age,aur_name,aur_reference_premium',
    ),
  ])
  const rates = [...new Map(rows.map((row) => [row.aur_medical_premium_rateid, row])).values()].map(
    (row) => {
      const minimumAge = numeric(row.aur_minimum_age, 'Minimum age'),
        maximumAge = numeric(row.aur_maximum_age, 'Maximum age')
      if (minimumAge > maximumAge || !Number.isInteger(minimumAge) || !Number.isInteger(maximumAge))
        throw new Error('An age band is invalid in the premium rate list.')
      return {
        id: guid(row.aur_medical_premium_rateid),
        name: row.aur_name,
        emirate: emirateFromRateName(row.aur_name),
        minimumAge,
        maximumAge,
        referencePremium: numeric(row.aur_reference_premium, 'Reference premium'),
      }
    },
  )
  if (!rates.length) throw new Error('The medical premium rate list is empty.')
  return { ...product, rates }
}
function createdId(response: Response): string | null {
  for (const header of ['entityid', 'OData-EntityId', 'Location']) {
    const value = response.headers.get(header)
    const match = value?.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)
    if (match) return guid(match[0])
  }
  return null
}
function quoteRecord(row: QuoteRow): Inquiry {
  const parsed = row.aur_customer_data ? parseCustomerData(row.aur_customer_data) : null
  return {
    rawCustomerData: row.aur_customer_data,
    emailData: row.aur_email_data,
    etag: row['@odata.etag'],
    id: guid(row.aur_quotesid),
    basePremium: row.aur_base_premium,
    dataverseStatus: row.statuscode,
    name: row.aur_name,
    createdAt: row.createdon ?? '',
    draft: parsed?.draft ?? createDraft(),
    customerData: parsed?.customerData,
    unreadable: !parsed,
    grossPremium: row.aur_gross_premium,
    totalAmountCharge: row.aur_total_amount_charge,
    contactId: row._aur_contact_value,
  }
}
const quoteSelect =
  'aur_quotesid,aur_name,aur_customer_data,aur_email_data,aur_base_premium,aur_gross_premium,aur_total_amount_charge,statuscode,createdon,_aur_contact_value'
export async function loadHealthRequests(productId: string): Promise<Inquiry[]> {
  const rows = await all<QuoteRow>(
    '/_api/aur_quoteses?$select=' +
      quoteSelect +
      '&$filter=' +
      encodeURIComponent('_aur_product_value eq ' + guid(productId)) +
      '&$orderby=createdon desc',
  )
  return rows.map(quoteRecord)
}
export interface SubmissionCheckpoint {
  createdInquiry?: Inquiry
  contactId?: string
  newContactId?: string
  quoteId: string
  quoteAttempted: boolean
  signature: string
}
const INQUIRY_CREATED = 751820006
const PRODUCT_MATCHED = 751820007
export async function submitHealthRequest(
  data: CustomerData,
  checkpoint: SubmissionCheckpoint,
  progress: (label: string) => void,
): Promise<Inquiry> {
  if (
    !data.product ||
    !data.plan ||
    !data.premium.complete ||
    data.premium.grossPremium === null ||
    data.premium.totalAmountCharge === null
  )
    throw new Error(
      'Complete all insured people and resolve their premium rates before creating the request.',
    )
  if (!Number.isInteger(numeric(data.product.premium, 'Product premium')))
    throw new Error('Product premium must be a whole number.')
  const email = data.applicant.email.trim()
  const findContact = () =>
    all<ContactRow>(
      '/_api/contacts?$select=contactid,address1_name,address1_telephone1,emailaddress1,fullname&$filter=' +
        encodeURIComponent('emailaddress1 eq ' + literal(email)) +
        '&$top=2',
    )
  progress('Finding your contact')
  if (!checkpoint.contactId) {
    const contacts = await findContact()
    if (contacts.length > 1)
      throw new Error(
        'More than one contact uses this email. Resolve the duplicate contact before continuing.',
      )
    if (contacts.length) checkpoint.contactId = guid(contacts[0].contactid)
    else {
      progress('Creating your contact')
      const names = data.applicant.fullName.trim().split(/\s+/)
      // A stable primary key also protects contact creation after a lost response
      // while the portal's email lookup cache is still catching up.
      checkpoint.newContactId ??= crypto.randomUUID()
      try {
        const { response } = await request('POST', '/_api/contacts', {
          contactid: guid(checkpoint.newContactId),
          firstname: names.length > 1 ? names[0] : null,
          lastname: names.length > 1 ? names.slice(1).join(' ') : names[0],
          emailaddress1: email,
          address1_telephone1: '+971' + data.applicant.mobile,
        })
        checkpoint.contactId = createdId(response) ?? checkpoint.newContactId
      } catch (error) {
        if (!(error instanceof PortalApiError) || ![409, 412].includes(error.status)) throw error
        const existing = await all<ContactRow>(
          '/_api/contacts?$select=contactid,emailaddress1&$filter=' +
            encodeURIComponent('contactid eq ' + guid(checkpoint.newContactId)),
        )
        if (
          existing.length !== 1 ||
          existing[0].emailaddress1?.toLowerCase() !== email.toLowerCase()
        )
          throw error
        checkpoint.contactId = guid(existing[0].contactid)
      }
    }
  }
  const recover = async () => {
    const matches = await all<QuoteRow>(
      '/_api/aur_quoteses?$select=' +
        quoteSelect +
        '&$filter=' +
        encodeURIComponent(
          'aur_quotesid eq ' +
            guid(checkpoint.quoteId) +
            ' and _aur_product_value eq ' +
            guid(data.product!.id),
        ),
    )
    return matches[0] ? quoteRecord(matches[0]) : null
  }
  const finalize = async (record: Inquiry): Promise<Inquiry> => {
    checkpoint.createdInquiry = record
    // Do not move a recovered request backwards if another process advanced it.
    if (record.dataverseStatus !== undefined && record.dataverseStatus !== INQUIRY_CREATED)
      return record
    progress('Finalizing your request')
    try {
      await request('PATCH', '/_api/aur_quoteses(' + guid(record.id) + ')', {
        statuscode: PRODUCT_MATCHED,
      })
    } catch (error) {
      throw new Error(
        'Your request was saved, but could not be finalized. Retry to finish the same request. ' +
          (error instanceof Error ? error.message : ''),
      )
    }
    const matched = { ...record, dataverseStatus: PRODUCT_MATCHED }
    checkpoint.createdInquiry = matched
    return matched
  }
  if (checkpoint.createdInquiry) {
    progress('Checking your request')
    return finalize((await recover()) ?? checkpoint.createdInquiry)
  }
  if (checkpoint.quoteAttempted) {
    progress('Checking your request')
    const existing = await recover()
    if (existing) return finalize(existing)
  }
  progress('Creating your request')
  checkpoint.quoteAttempted = true
  try {
    const { response } = await request('POST', '/_api/aur_quoteses', {
      aur_quotesid: guid(checkpoint.quoteId),
      aur_name: 'Inquiry for Health Insurance - ' + email,
      'aur_contact@odata.bind': '/contacts(' + guid(checkpoint.contactId) + ')',
      'aur_product@odata.bind': '/aur_productses(' + guid(data.product.id) + ')',
      'aur_plan@odata.bind': '/aur_plans(' + guid(data.plan.id) + ')',
      aur_gross_premium: data.premium.grossPremium,
      aur_base_premium: data.product.premium,
      statuscode: INQUIRY_CREATED,
      aur_total_amount_charge: data.premium.totalAmountCharge,
      aur_customer_data: JSON.stringify(data),
    })
    const id = createdId(response) ?? checkpoint.quoteId
    checkpoint.quoteId = id
    const parsed = parseCustomerData(JSON.stringify(data))!
    return await finalize({
      id,
      name: 'Inquiry for Health Insurance - ' + email,
      createdAt: new Date().toISOString(),
      draft: parsed.draft,
      customerData: data,
      grossPremium: data.premium.grossPremium,
      totalAmountCharge: data.premium.totalAmountCharge,
      contactId: checkpoint.contactId,
      basePremium: data.product.premium,
      dataverseStatus: INQUIRY_CREATED,
    })
  } catch (error) {
    // Never blindly repeat a POST after a lost response. The stable client GUID makes retry recoverable.
    if (error instanceof PortalApiError && (error.status === 409 || error.status === 412)) {
      const existing = await recover()
      if (existing) return finalize(existing)
    }
    throw error
  }
}
export const FOLLOW_UP_STATUS = {
  emiratesIdRequired: 751820020,
  ipcVerification: 751820017,
  kycRequired: 751820019,
  determineInquiry: 751820008,
} as const
export const EMIRATES_UPLOAD_FLOW =
  '/_api/cloudflow/v1.0/trigger/a7705574-23ca-f111-a05a-6045bd40375a'

export async function getHealthRequest(id: string): Promise<Inquiry> {
  const { data, response } = await request<QuoteRow>(
    'GET',
    '/_api/aur_quoteses(' + guid(id) + ')?$select=' + quoteSelect,
  )
  if (
    !data ||
    !data.aur_quotesid ||
    guid(data.aur_quotesid).toLowerCase() !== guid(id).toLowerCase()
  )
    throw new Error('This request could not be found.')
  return quoteRecord({
    ...data,
    '@odata.etag': data['@odata.etag'] ?? response.headers.get('ETag') ?? undefined,
  })
}
function currentVersion(record: Inquiry): string {
  if (!record.etag)
    throw new Error('The current request version is unavailable. Refresh and try again.')
  return record.etag
}
function customerObject(record: Inquiry): Record<string, unknown> {
  let value: unknown
  try {
    value = JSON.parse(record.rawCustomerData ?? '')
  } catch {
    throw new Error('The saved request details could not be read. Please contact your advisor.')
  }
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('The saved request details are invalid.')
  return value as Record<string, unknown>
}
export async function saveHealthKyc(record: Inquiry, draft: KycDraft): Promise<Inquiry> {
  const latest = await getHealthRequest(record.id)
  const original = customerObject(latest)
  if (isKycSubmission(original.kyc)) return latest // recovery after a lost successful response
  if (original.kyc !== undefined)
    throw new Error(
      'Existing KYC information uses an unsupported format. Contact your advisor before replacing it.',
    )
  if (latest.dataverseStatus !== FOLLOW_UP_STATUS.kycRequired)
    throw new Error(
      'This request no longer needs KYC information. Refresh your requests to see its latest status.',
    )
  if (latest.unreadable) throw new Error('The saved member details could not be read.')
  const snapshot = (r: Inquiry) =>
    coveredPeople(r).map((p) => [p.id, p.fullName, p.dateOfBirth, p.gender])
  if (JSON.stringify(snapshot(latest)) !== JSON.stringify(snapshot(record)))
    throw new Error(
      'The covered people changed while this form was open. Refresh the request before submitting; your answers have been kept here.',
    )
  const kyc = buildKycSubmission(latest, draft)
  const customerData = { ...original, kyc }
  const email = appendKycEmail(latest.emailData ?? '', kyc)
  await request(
    'PATCH',
    '/_api/aur_quoteses(' + guid(latest.id) + ')',
    {
      aur_customer_data: JSON.stringify(customerData),
      aur_email_data: email,
      statuscode: FOLLOW_UP_STATUS.determineInquiry,
    },
    { ifMatch: currentVersion(latest) },
  )
  return {
    ...latest,
    rawCustomerData: JSON.stringify(customerData),
    emailData: email,
    customerData: { ...latest.customerData!, kyc },
    dataverseStatus: FOLLOW_UP_STATUS.determineInquiry,
  }
}

export const MAX_ID_FILE_BYTES = 10 * 1024 * 1024
export const MAX_ID_FILES = 10
export function identityFileError(file: File): string {
  if (
    !/\.(pdf|png|jpe?g|webp)$/i.test(file.name) ||
    (file.type && !['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(file.type))
  )
    return 'Use PDF, JPG, PNG or WEBP files.'
  if (!file.size) return 'This file is empty.'
  if (file.size > MAX_ID_FILE_BYTES) return 'Each file must be 10 MB or smaller.'
  return ''
}
const base64File = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('The selected file could not be read.'))
    reader.onload = () => {
      if (typeof reader.result !== 'string' || !reader.result.includes(','))
        return reject(new Error('The selected file could not be read.'))
      resolve(reader.result.slice(reader.result.indexOf(',') + 1))
    }
    reader.readAsDataURL(file)
  })
function uploadAcknowledged(value: unknown, depth = 0): boolean {
  if (depth > 4) return false
  if (typeof value === 'string') {
    if (value.trim() === 'Documents Uploaded Successfully') return true
    try {
      return uploadAcknowledged(JSON.parse(value), depth + 1)
    } catch {
      return false
    }
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const data = value as Record<string, unknown>
  if (data.error || data.success === false) return false
  return Object.entries(data).some(
    ([key, item]) =>
      ['successful', 'body', 'result', 'response', 'message'].includes(key.toLowerCase()) &&
      uploadAcknowledged(item, depth + 1),
  )
}
export async function uploadEmiratesFile(id: string, file: File): Promise<void> {
  const error = identityFileError(file)
  if (error) throw new Error(error)
  const verificationToken = await token()
  const contentBytes = await base64File(file)
  // Power Pages cloud flows accept eventData as a JSON string in form data.
  const body = new URLSearchParams({
    eventData: JSON.stringify({
      recordId: guid(id),
      'File Content': { name: file.name, contentBytes },
    }),
  })
  let response: Response
  try {
    response = await fetch(EMIRATES_UPLOAD_FLOW, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        __RequestVerificationToken: verificationToken,
        'X-Requested-With': 'XMLHttpRequest',
      },
      body,
      signal: AbortSignal.timeout(120000),
    })
  } catch {
    throw new PortalApiError(
      'The upload response was interrupted. The file may already have reached the server. Check before retrying this file to avoid duplicates.',
    )
  }
  const text = await response.text()
  let result: unknown = text
  try {
    result = JSON.parse(text)
  } catch {
    /* a plain success string is also supported */
  }
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) tokenPromise = null
    const apiError =
      result && typeof result === 'object'
        ? (result as { error?: { message?: unknown; innererror?: { message?: unknown } } }).error
        : undefined
    const detail = apiError?.innererror?.message ?? apiError?.message
    throw new PortalApiError(
      `Power Pages document upload failed (${response.status}).` +
        (typeof detail === 'string' ? ' ' + detail.slice(0, 500) : ''),
      response.status,
    )
  }
  if (response.status === 202 || !uploadAcknowledged(result))
    throw new PortalApiError(
      'The document service has not confirmed this file. The file may already be uploaded; check before retrying to avoid duplicates.',
    )
}
export async function finishEmiratesUpload(id: string): Promise<Inquiry> {
  const latest = await getHealthRequest(id)
  if (latest.dataverseStatus === FOLLOW_UP_STATUS.ipcVerification) return latest
  if (latest.dataverseStatus !== FOLLOW_UP_STATUS.emiratesIdRequired)
    throw new Error('The request status changed. Refresh your requests before continuing.')
  await request(
    'PATCH',
    '/_api/aur_quoteses(' + guid(id) + ')',
    { statuscode: FOLLOW_UP_STATUS.ipcVerification },
    { ifMatch: currentVersion(latest) },
  )
  return { ...latest, dataverseStatus: FOLLOW_UP_STATUS.ipcVerification }
}
