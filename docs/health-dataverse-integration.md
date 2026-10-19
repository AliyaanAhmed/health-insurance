# Health Dataverse integration

## Business decisions

Calls use the hosting Power Pages origin and its anti-forgery token from `/_layout/tokenhtml`. No CRM bearer token, client secret, signed flow URL or `Xrm` dependency is bundled. Localhost has no portal session and displays a load error while keeping entered answers.

- Premium currency: **AED**, using source amounts unchanged. No currency conversion; salary bands remain AED.
- VAT-inclusive whole-number charge: **always round up** after adding the selected plan's VAT. The implementation sums integer cents and computes `Math.ceil(subtotalCents * (100 + vatPercent) / 10000)`. VAT is not rounded to cents before the final ceiling, which would incorrectly turn a total such as 100.002 into 100 rather than 101.
- One related plan is selected automatically. Multiple plans require an explicit choice.
- Ages are completed years on the current local date; minimum/maximum rate ages are inclusive.
- Names such as `Abu Dhabi - 18-30` identify the emirate; numeric min/max columns identify the age band. All dependents use the applicant's selected visa emirate.
- Just me prices only the applicant; Me & my dependents prices both; Dependents only excludes the sponsor.
- Missing or overlapping matching rates prevent submission. No prices are guessed from adjacent ages/emirates. The supplied sample has Dubai/Abu Dhabi through age 60 and two Sharjah bands; live data may contain more.
- The panel displays one pre-VAT gross reference amount, or a clearly labelled priced-person subtotal while incomplete, plus a count. Changes animate without delaying calculation.

## Flow

1. Entering creation loads Health Insurance product/plan data and every current premium-rate page.
2. `buildCustomerData()` derives the full customer JSON whenever form state, plan or catalog changes. `customerDataJson` serializes it. There is no separately maintained mutable copy.
3. Create a Request validates required answers and saved members. It looks up the entered email with an escaped OData literal. Multiple matching contacts stop the operation.
4. Reuse that contact or create firstname/lastname/email/address1_telephone1. A one-word full name is retained as the last name.
5. POST the quote with contact/product/plan binds, gross premium, rounded VAT-inclusive total and serialized customer JSON. Title: `Inquiry for Health Insurance - <email>`. No Motor status code is copied.
6. Keep the loader visible through all contact/quote operations and list refresh. Failures retain answers. A confirmed new record stays visible even if the subsequent list read fails or its cache lags.
7. My Requests reads Health Insurance quotes and reconstructs the summary modal from stored JSON. Unsupported or malformed JSON displays an unavailable-details message instead of invented details.

## Endpoints

| Purpose               | Portal entity set / columns                                                                                                                                           |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Product/plans         | `aur_productses`: `aur_productsid,aur_name`, filter `aur_name eq 'Health Insurance'`; expand `aur_plan_product_aur_products(aur_planid,aur_name,aur_vat)`             |
| Plan continuation     | `aur_plans`: `aur_planid,aur_name,aur_vat`, filter `_aur_product_value eq <product ID>` if expanded plans have a continuation                                         |
| Rates                 | `aur_medical_premium_rates`: `aur_medical_premium_rateid,aur_name,aur_minimum_age,aur_maximum_age,aur_reference_premium`                                              |
| Contact lookup        | `contacts`: `contactid,address1_name,address1_telephone1,emailaddress1,fullname`; entered-email filter, two matches sufficient                                        |
| Contact create        | `contacts`: `contactid,firstname,lastname,emailaddress1,address1_telephone1`                                                                                          |
| Quote create          | `aur_quoteses`: `aur_quotesid,aur_name,aur_contact,aur_product,aur_plan,aur_gross_premium,aur_total_amount_charge,aur_customer_data`                                  |
| Request list/recovery | `aur_quoteses`: `aur_quotesid,aur_name,aur_customer_data,aur_gross_premium,aur_total_amount_charge,createdon,_aur_contact_value`; Health product filter, newest first |

Pagination is followed. Trusted CRM continuation URLs are rewritten to the portal origin; unrelated hosts are rejected. HTML/login responses, missing tokens and permission errors produce visible failures. Requests have timeouts and POST is never silently retried.

Stable client-generated contact and quote GUIDs support retries during this browser visit. A potentially lost quote response triggers a lookup of its GUID before another attempt; conflict responses attempt recovery. This is not a cross-table transaction: a contact may remain if quote creation fails. Refresh clears retry checkpoints; check My Requests before resubmitting after an uncertain result. No PII is logged or stored in localStorage.

Read the raw numeric `aur_reference_premium` value and treat it as AED. Do not inspect currency annotations, retrieve a transaction-currency ID, assign a currency lookup or perform currency conversion. Dataverse supplies the default quote status.

## Customer JSON: schema version 1

```text
{
  schemaVersion: 1, currency: "AED",
  coverageTarget, visaType, nationalityCode, visaEmirate, visaStatus,
  product: { id, name }, plan: { id, name, vat },
  applicant: {
    fullName, dateOfBirth, gender, maritalStatus, salaryBand, email, mobile,
    age, insured, referencePremium, rateId, premiumStatus
  },
  members: [{
    id, relationship, fullName, dateOfBirth, gender, saved,
    age, insured, referencePremium, rateId, premiumStatus
  }],
  premium: {
    pricedPeople, totalPeople, partialGrossPremium, grossPremium,
    vatPercent, vatAmount, exactTotalAmount, totalAmountCharge,
    complete, rounding: "ceil-whole-unit"
  }
}
```

Unmatched amounts are `null`, not zero. Status explains excluded, missing DOB/emirate, loading, missing/ambiguous rate or priced. JSON preserves submission-time ages, rate IDs and amounts; historical records are not recalculated using today's catalog.

## Portal settings and current access limitation

The read-only site export on 2026-10-16 found five table permissions but **no `Webapi/` settings**. Matching `enabled` and minimum `fields` files are prepared in `.powerpages-site/site-settings` for logical names `aur_products`, `aur_plan`, `aur_medical_premium_rate`, `contact` and `aur_quotes`. Their GUIDs identify new setting records. Preserve unrelated live configuration when applying these ten records.

Contact and Inquiry permissions currently have **Global scope**, grant all CRUD operations and include **Anonymous Users**, Authenticated Users and Administrators. Those permissions were not changed. Enabling customer-data APIs with that scope would expose records beyond their intended owner; the Health product filter is not authorization.

For this internal POC, the user explicitly confirmed retaining the existing anonymous web-role permissions. No permission changes or additional authentication flow are requested. The account menu remains a preview identity, and My Requests reads Health Insurance records visible under those existing permissions. Apply the prepared API settings through the Health site configuration workflow; code upload and settings deployment are separate actions. No live contact or quote was created during implementation.

Client pricing is a display/submission snapshot. Authoritative underwriting/payment logic must validate rate IDs, ages, plan and totals server-side because clients can edit their payloads.

## Implementation

`healthPricing.ts` owns calculations/serialization; `powerPagesApi.ts` owns I/O; `useHealthCatalog.ts` owns loading; `healthIntegrationContext.ts` exposes the live model; `PremiumRange.tsx` displays it; `App.tsx` coordinates submission. No additional dependency was required.

## Deployment ? October 16, 2026

Production build passed. `pac pages upload-code-site --rootPath . --siteName "Health Insurance SPA"` completed successfully against Insure AI, including the ten API enable/field setting records in the generated deployment manifest. The existing anonymous POC permissions were retained. No separate settings upload was necessary. No live contact or quote was created for verification. Earlier notes about pending/local-only settings are superseded by this release.

## Plan lookup fix

A relationship next-link without a paging token does not trigger an extra plan query. The expanded plan rows are reused. Actual paged plans still load through the product-filtered collection. The plan field allowlist includes `_aur_product_value`; quote allowlists also include `_aur_product_value` and `_aur_contact_value` used by reads/filters. Catalog loading runs silently; the create form does not display a product/plan loading banner or raw API error.

## Saved-member pricing revision

Applicant pricing updates immediately when DOB and visa emirate identify a rate. New members use pending-save status and do not enter the gross sum until Save member. Editing a saved member retains a confirmedDetails snapshot for pricing until the revised details are saved; visa-emirate changes still reprice confirmed people. Gross premium is the current matched-person sum, even while other family entries are unfinished; final VAT-inclusive totals remain blocked until all insured members are saved and priced. Premium range is customer-facing copy for a single animated AED estimate, with no fabricated numeric lower/upper bounds.

## Product base premium and inquiry status flow

Product loading also selects the whole-number aur_premium field. It is validated as a nonnegative integer and copied unchanged into quote aur_base_premium, product.premium and premium.basePremium in customer JSON. It is not divided by 100 or added to the existing person-rate gross calculation.

Quote POST explicitly sets statuscode 751820006 (Inquiry Created). After confirmed creation, PATCH the same quote to statuscode 751820007 (Product Match), using If-Match: *. The submission loader remains active through PATCH. A failed finalization retains the confirmed quote in the retry checkpoint; retry recovers/finalizes that same quote rather than creating another. Recovered records already advanced to another status are not moved backwards. The product/quote API field settings include aur_premium, aur_base_premium and statuscode. Existing POC quote Update permission supports PATCH.

Single applicants cannot add spouse or child entries. Changing marital status to Single clears existing spouse/child entries and their premium contributions, with a visible notification. Parent and other permitted relationships remain available.

Portal response compatibility: aur_premium may arrive as a number or a digits-only string such as '1'. Valid strings are converted to a safe integer; blanks, malformed text, fractions and unsafe integers are rejected. aur_base_premium is always sent as a JSON number.
