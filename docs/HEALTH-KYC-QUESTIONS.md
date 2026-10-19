# Health insurance KYC questionnaire — POC v1

Version: `2026-10-17-v1`. The executable, bilingual question bank is [src/kycQuestions.ts](../src/kycQuestions.ts). This is a proposed health declaration for the POC, not an insurer-approved medical questionnaire, diagnosis, eligibility decision or risk score. Age gates below are product choices for review with underwriting; the cited sources do not mandate this exact routing.

## Research

- [Daman Individual Enhanced application, October 2025](https://www.damanhealth.ae/wp-content/uploads/2025/10/Individual-Enhanced-Application-Form.pdf): member-level ongoing conditions, treatment, hospital care and future care support the common medical-history section.
- [ADNIC Individual Medical Insurance application](https://adnic.ae/documents/20126/52052/Individual%2BMedical%2BInsurance%2BApplication%2BForm.pdf/31668764-92a5-a493-25fe-eb963067b79f?download=true&t=1612170731193&version=1.3): pre-existing conditions, investigations and pregnancy/fertility topics. Its plan-specific wording and marital restrictions are not copied as universal clinical rules.
- [CDC: family history and children](https://www.cdc.gov/family-health-history/family-health-history-and-you/family-health-history-and-your-child.html): family history can matter for a child; it is distinct from the child's own diagnoses. A spouse can have a separate biological family history.
- [CDC: developmental monitoring](https://www.cdc.gov/act-early/about/developmental-monitoring-and-screening.html): supports asking about clinician-advised developmental support in the child-specific section; no screening schedule or diagnostic inference is implemented.
- [CDC: asthma](https://www.cdc.gov/asthma/about/): home exposures are relevant context for children. No diagnosis is inferred from exposure or family history.

All questions are paraphrased. Adult nicotine use, older-adult support and male urinary/prostate questions are proposed extensions for the POC and need underwriting review before a production release. No premium changes or automatic rejections result from these answers.

## Who answers

| Coverage           | People included in the medical questionnaire                 |
| ------------------ | ------------------------------------------------------------ |
| Just me            | Applicant only                                               |
| Me & my dependents | Applicant and every dependent actually stored in the inquiry |
| Dependents only    | Stored dependents only; the uninsured sponsor is excluded    |

The age is recalculated from each insured person's DOB when the questionnaire opens. Relationship labels do not determine age: a 40-year-old dependent child gets adult questions. Missing DOB/name/gender blocks submission rather than silently choosing a questionnaire. The person providing answers declares authority for all listed people, including parental/guardian authority for minors where applicable.

## Shared questions — once per request

1. **Biological family history:** whether any covered person's biological parent/sibling has diabetes, an inherited condition or heart disease before 60. A Yes requires identifying the covered person, relative and condition. This is asked once and is not repeated for children. Different histories for spouses must be identified explicitly; the app does not infer shared genetics.
2. **Home smoke/vape exposure:** shown once only when at least one insured person is under 18. A Yes asks which children are exposed and how often.

## Individual questions

| ID                        | Topic and information requested                                                                                   | Applies to                                  | Conditional details                                   |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | ----------------------------------------------------- |
| `conditions`              | Doctor-diagnosed ongoing conditions, including diabetes, heart/kidney illness, cancer or mental-health conditions | Every insured person                        | Yes: condition, diagnosis timing and treatment        |
| `medicines`               | Prescribed medicines or regular treatment                                                                         | Every insured person                        | Yes: medicine/treatment and indication                |
| `recent_care`             | Surgery, hospital stay or specialist investigations in the past 12 months, excluding routine screening            | Every insured person                        | Yes: reason, approximate date and outcome             |
| `planned_care`            | Symptoms awaiting assessment, pending results or advised treatment/surgery                                        | Every insured person                        | Yes: what is pending and appointments                 |
| `allergies`               | Allergies needing prescription medicine or emergency care                                                         | Every insured person                        | Yes: trigger, reaction and treatment                  |
| `birth`                   | Prematurity or a condition present at birth needing follow-up                                                     | Ages 0–4                                    | Yes: condition, timing and treatment                  |
| `development`             | Clinician-recommended support for growth, development, speech, hearing or learning                                | Ages 0–17                                   | Yes: support/therapy and whether ongoing              |
| `smoking`                 | Tobacco/nicotine use, including shisha and vaping                                                                 | Ages 18+                                    | Former/Current: type, usual amount, start/stop timing |
| `pregnancy`               | Current pregnancy                                                                                                 | Female, ages 18–49                          | Yes: weeks or expected delivery date if known         |
| `pregnancy_complications` | Clinician-identified complications of the current pregnancy                                                       | Only when pregnancy = Yes                   | Yes: condition and care                               |
| `fertility`               | Current fertility treatment                                                                                       | Only when pregnancy = No, female ages 18–49 | Yes: treatment and planned procedures                 |
| `prostate`                | Doctor-diagnosed urinary/prostate condition needing care                                                          | Male, ages 50+                              | Yes: condition and care                               |
| `daily_support`           | Help with daily activities or mobility aid due to a health condition                                              | Ages 60+                                    | Yes: support needed and underlying condition          |

Common answers are Yes / No / Not sure. Nicotine answers are Never / Former / Current. Pregnancy also offers Not applicable. Positive answers require details (2–2,000 characters); Not sure is a valid answer without invented facts. Smoking is not asked of minors, and pregnancy/fertility questions are not asked of minors. Pregnancy questions are not suppressed based on marital status. These conservative POC age gates are configurable in the question bank and are not assertions about what is biologically possible at other ages.

Changing a parent answer removes its now-hidden follow-up answers from the submission. Individual diagnoses and medicines are never inferred from relatives: only shared family background is deduplicated.

## Interaction and persistence

- The modal has a shared-background step, one selectable step per insured person, then review and authority/accuracy declaration.
- Completion indicators mean answered locally, not saved to the server. Unsaved answers stay in this page's memory, including when the modal closes; they are not put in browser storage. Reload/navigation that unloads the page warns while a KYC draft exists.
- Submission validates every applicable answer, even if the user jumps between members.
- On submit, read the latest inquiry and preserve all existing JSON keys. Add one `kyc` object containing version, timestamp, shared answers and member snapshots/answers.
- Generate a readable **KYC Information** section for `aur_email_data`, preserving existing content. Plain text uses headings and question/answer lines; existing HTML receives an escaped HTML section. User-entered details are not injected as HTML.
- One conditional PATCH writes customer JSON, email text and status **751820008 (Determine Inquiry)** together. It uses the latest ETag and refuses stale updates. If a previous successful response was lost, existing submitted KYC is returned instead of appending duplicates.
- Submitted KYC is view-only through the request-card button, including after the status changes. Later correction/versioning is outside this v1 flow.

## Emirates ID companion flow

**751820020 (Emirates ID Required)** exposes Upload Emirates ID. The front/back PNGs supplied by the user are illustrative references, not user documents.

Each selected file is sent sequentially to:

```text
POST /_api/cloudflow/v1.0/trigger/a7705574-23ca-f111-a05a-6045bd40375a
Content-Type: application/x-www-form-urlencoded
__RequestVerificationToken: <portal token>

eventData = JSON.stringify({
  recordId: "<inquiry GUID>",
  "File Content": { name: "<filename>", contentBytes: "<base64 without data URL prefix>" }
})
```

The parameter names follow the user's supplied contract. The `eventData` transport and file object follow [Microsoft's Power Pages integration documentation](https://learn.microsoft.com/en-us/power-pages/configure/cloud-flow-integration). The flow must be registered for the Health site and available to the intended POC web role; no flow role bindings are changed automatically.

Limits reuse the existing document policy: PDF/JPG/PNG/WEBP, 10 MB each, up to 10 files. Files remain in memory. Confirmed files are not resent on retry. An interrupted/unconfirmed response is visibly marked because the server may already have saved that file; no automatic POST retry occurs.

Every file must return **Documents Uploaded Successfully**. An HTTP 202 or another message does not count as confirmation. After all confirmations, read the current inquiry and conditionally PATCH only status to **751820017 (IPC Verification)**. If that final update fails, retry skips already-confirmed files and retries finalization. The upload button disappears when the updated row is applied locally or reloaded.

**751820019 (KYC Info Required)** exposes Complete KYC information; after submission it becomes View KYC information. The request list now has a Refresh action to pick up workflow-driven status changes. The `aur_email_data` column was added to the quote Web API field allowlist.

## Verification scope

This implementation uses static checks and a production build. No ID documents, medical answers, flow runs or live KYC writes are fabricated for testing. The deployed workflow needs one user-controlled upload and submission to confirm its actual trigger/response contract and permissions. Client validation does not replace server-side authorization, file validation or clinical review.
