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
- Guided cover and personal/sponsor details, conditional member step, editable summary and review.
- One member editor at a time, female spouse without a gender selector per the user business rule, parent/child artwork pairs, saved completion and removal with Undo.
- English/Arabic, RTL, mobile summary disclosure, responsive actions and reduced motion.
- Demo verification uses **123456**, sends no SMS, and prepares only an in-memory preview inquiry.
- My inquiries lists previews prepared in the current browser visit. Refresh clears all draft/prepared data.
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
- `src/Verification.tsx`: local demo verification only.
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
