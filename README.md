# InsureAI Health SPA

React + TypeScript + Vite frontend for the **Health Insurance SPA** Power Pages code site. Current work is a local UI preview: no Dataverse, real SMS, insurer quoting or persistent customer storage.

See [Technical and Design Guide](TECHNICAL-AND-DESIGN-GUIDE.md) for the complete stack, package versions, fonts, theme, font sizes, layouts, form behavior and deployment notes.

## Run locally

```sh
npm install
npm run dev -- --host 0.0.0.0
```

Open `http://localhost:5173/`. Vite refreshes the UI as source files change.

## Experience

- Hero and three coverage entry choices using the supplied health artwork.
- Guided cover and personal/sponsor details, conditional member step, Documents, editable summary and final review.
- One member editor at a time, female spouse without a gender selector per the user business rule, parent/child artwork pairs, saved completion and removal with Undo.
- English/Arabic, RTL, mobile summary disclosure, responsive actions and reduced motion.
- Final review ends with **Create Inquiry**: a short themed loader creates the session-only record and opens its detail view directly. No OTP is used.
- My Inquiries is a searchable, filterable table with six labelled fictional samples and any previews prepared in the current visit. Refresh clears the draft/user previews and restores the sample fixtures.
- A salary of exactly AED 4,000 stays explicitly pending business confirmation.

## Quality checks

```sh
npm run build
npm run lint
npm run format:check
npm run test:ui
```

Browser tests require the local dev server and installed Google Chrome. They use a fresh headless profile and synthetic local data. Evidence is written to `.qa/` (ignored by source control). See `design-qa.md` for visual comparison and test evidence.

## Assets and structure

The original supplied PNGs remain in `src/assets`. Optimized, transparent WebP copies are in `src/assets/optimized`; regenerate with `npm run assets:optimize`. Variable fonts are bundled with the app.

- `src/health.ts`: field types, option catalogs, pure validation, age/date helpers and asset map.
- `src/ui.tsx`: shared accessible fields, choices, avatars, modal and buttons.
- `src/Inquiry.tsx`: guided question groups, family editing and step validation.
- `src/Summary.tsx`: shared summary/review presentation.
- `src/InquiryList.tsx`: inquiry table, search, status/coverage filters and date sorting.
- `src/InquiryView.tsx`: read-only overview, email-based inquiry title, premium breakdown, family tree, documents and contact summary.
- `src/PremiumBreakdown.tsx`: collapsible pricing summary with illustrative sample amounts and an unpriced state.
- `src/FamilyTree.tsx`: applicant/sponsor root and grouped spouse, child, parent and other member details.
- `src/InquiryDocuments.tsx`: end-of-record attachments, sample previews and empty state.
- `src/PageLoader.tsx`: shared centered animated loading surface, used for inquiry opening.
- `src/inquiryData.ts`: fictional sample fixtures and record display helpers.
- `src/InquiryRecords.css`: list, detail and loader styles.
- `src/DocumentUpload.tsx`: health-document guidance, drag/drop, file validation and removal.
- `src/FilePreview.tsx`: shared local image/PDF preview and download with scoped Blob URLs.
- `src/App.tsx`: hash navigation, in-memory draft/inquiry state and recovery.
- `src/index.css`: canonical health tokens, fonts and global accessibility baseline.
- `DESIGN.md`, `UX-CONTRACT.md`, `docs/health-field-map.md`: durable design, interaction and business scope.

## Power Pages

The separate `powerpages.config.json` and `.powerpages-site` metadata target Health Insurance SPA, website ID `d8f4dd5d-9fd0-4c5a-9e92-640da9e2dd5c`. Keep Motor deployments independent. The UI changes in this iteration are for localhost; upload only when a release is requested:

```sh
npm run build
pac pages upload-code-site --rootPath .
```

Before a future release, confirm the environment/site ID, allowed WebP/font attachments and bundle-cleanup coverage. Real APIs, authorization, draft persistence, consent copy and OTP provider belong to the integration phase.

Document attachments currently remain in browser memory only, along with the local inquiry. Refresh or switching coverage clears the draft files. Supported files are PDF/JPG/PNG/WEBP, up to 10 MB each and 10 files per inquiry. Existing older browser scenarios still reference the superseded OTP flow and need revision before reuse.
