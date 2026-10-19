# InsureAI Health - Technical and Design Guide

Last updated: October 16, 2026.

## 1. Project scope

InsureAI Health is a responsive health-insurance request SPA built for Microsoft Power Pages code sites. The current implementation captures cover, applicant/sponsor and family information, retrieves Dataverse reference rates, calculates per-person premiums, and saves/retrieves contacts and health quotes through the portal Web API. Required API settings are prepared locally; the existing anonymous web-role permissions are retained for this internal POC. Authentication identity, policy purchase and production SMS are not integrated. The current Dataverse section at the end supersedes earlier prototype implementation notes.

The existing Motor Insurance site is a separate project. This application has its own source and Power Pages configuration.

## 2. Technology stack

| Area | Implementation |
| --- | --- |
| UI framework | React with React DOM; functional components and hooks |
| Language | TypeScript with TSX, strict unused-code checks and browser DOM types |
| Development/build | Vite with the official React plugin; ES modules |
| Styling | Plain CSS, custom properties, Grid, Flexbox and media queries |
| Icons | Phosphor Icons React components |
| Routing | Small custom hash router; no routing package |
| State | React useState, useRef, useEffect, useMemo and Context |
| Translation | Local English/Arabic dictionary with React Context |
| Fonts | Locally bundled variable fonts from Fontsource |
| Images | User-provided PNG assets and optimized WebP derivatives |
| Hosting target | Microsoft Power Pages SPA/code site |
| Package management | npm and package-lock.json |
| Calendar | Custom React DateCalendar with native HTML Popover API |
| Dialogs | Shared native HTML dialog wrapper |

There is no Tailwind, Bootstrap, Material UI, shadcn, Redux, React Router or external translation service in the current application.

## 3. Packages and exact dependency versions

The table below is generated from package.json and package-lock.json. The lockfile records resolved versions; npm ci reproduces that dependency tree. A semver range in package.json can differ from the resolved version.

| Package | Group | Declared range | Locked version | Purpose |
| --- | --- | --- | --- | --- |
| @phosphor-icons/react | Runtime | ^2.1.10 | 2.1.10 | Outline, fill and duotone UI icons |
| react | Runtime | ^19.2.8 | 19.3.1 | Component UI and hooks |
| react-dom | Runtime | ^19.2.8 | 19.3.1 | Browser rendering |
| @axe-core/playwright | Development | ^4.13.0 | 4.13.0 | Accessibility inspection tooling |
| @fontsource-variable/inter | Development | ^5.3.0 | 5.3.0 | Bundled variable UI font |
| @fontsource-variable/manrope | Development | ^5.3.0 | 5.3.0 | Bundled variable heading font |
| @fontsource-variable/noto-sans-arabic | Development | ^5.3.0 | 5.3.0 | Bundled variable Arabic font |
| @playwright/test | Development | ^1.64.1 | 1.64.1 | Existing browser scenarios |
| @types/node | Development | ^24.13.3 | 24.19.2 | Node tool configuration types |
| @types/react | Development | ^19.2.18 | 19.3.0 | React TypeScript declarations |
| @types/react-dom | Development | ^19.2.7 | 19.3.0 | React DOM TypeScript declarations |
| @vitejs/plugin-react | Development | ^6.1.1 | 6.1.2 | React integration with Vite |
| oxlint | Development | ^1.81.0 | 1.88.0 | Source linting |
| prettier | Development | ^3.9.10 | 3.9.10 | Code/document formatting |
| sharp | Development | ^0.35.5 | 0.35.5 | PNG/WebP optimization |
| typescript | Development | ~6.0.2 | 6.0.3 | Static types and TSX compilation checks |
| vite | Development | ^8.3.0 | 8.3.4 | Development server and production bundling |

Development packages support authoring, assets and quality tooling; the font packages supply CSS/font files that Vite bundles into the website. React and Phosphor power the rendered UI. Playwright and axe are optional local inspection tools, not code delivered to visitors.

## 4. Running the application

Use a Node.js release compatible with the pinned Vite version and npm. The package does not currently pin a Node engine.

```sh
npm ci
npm run dev -- --host 0.0.0.0 --port 5173
```

Open http://localhost:5173/. The default development server supports hot updates. Vite configuration deduplicates React, prebundles its main entry points and Phosphor, and waits briefly for file writes to settle on Windows.

| Command | Purpose |
| --- | --- |
| npm run dev | Local Vite development server |
| npm run build | TypeScript project check followed by Vite production output in dist/ |
| npm run preview | Serve the existing production build locally |
| npm run lint | Oxlint checks |
| npm run format | Prettier formatting for the listed sources and documentation |
| npm run format:check | Check formatting without writing changes |
| npm run assets:optimize | Generate optimized image derivatives using Sharp |
| npm run test:ui | Existing Playwright browser scenarios |

Existing browser tests and design-qa.md contain evidence from earlier iterations. They are not certification of every later requested UI change; some scenario expectations may need updating for the latest reset and auto-navigation behavior. Repeated browser testing/captures were intentionally skipped during the recent user-guided refinements.

## 5. Source ownership

| File | Responsibility |
| --- | --- |
| src/main.tsx | React application entry |
| src/App.tsx | Route rendering, draft lifecycle, session inquiry list, coverage changes and verification orchestration |
| src/useRoute.ts | Hash navigation and path helpers |
| src/Landing.tsx | Navbar, landing hero, coverage entry actions, success and empty inquiry views |
| src/Inquiry.tsx | Cover groups, applicant/sponsor fields, family members, stepper and validation flow |
| src/Summary.tsx | Live health-cover summary and shared review content |
| src/ui.tsx | Fields, choice groups, gender choices, avatars, hints, dialogs and buttons |
| src/DateCalendar.tsx | Shared custom year/month/day date picker |
| src/health.ts | Data types, catalogs, defaults, validation, age calculations and artwork mapping |
| src/formUtils.ts | Invalid-field focus helper |
| src/Verification.tsx | Six-digit local demo verification |
| src/i18n.tsx | Arabic dictionary and language provider |
| src/language-context.ts | Shared language context and hook |
| src/index.css | Canonical colors, fonts, radii, global accessibility and scrollbar styles |
| src/App.css | Component styling, animations, responsive rules and later visual refinements |
| src/assets/ | Original supplied artwork and optimized derivatives |
| public/ | Public static assets including favicon |
| scripts/ | Asset optimization and earlier local inspection utilities |
| tests/ | Existing browser flow tests |
| docs/health-field-map.md | Detailed business field mapping |
| DESIGN.md | Design decisions and chronological user refinements |
| UX-CONTRACT.md | Interaction rules and later behavior changes |
| powerpages.config.json | Code-site build output and bundle configuration |
| .powerpages-site/ | Existing Power Pages site export/metadata |

Some component styles were refined through later CSS overrides. The last applicable rule and matching breakpoint determine the actual appearance. This guide summarizes the current standard, while source CSS remains authoritative.

## 6. Design direction

The visual system uses deep teal, pale mint, white surfaces and restrained shadows. The landing has a larger editorial headline and an organic curved healthcare photograph. The inquiry uses quieter, compact product UI.

Current landing choices are rounded, text-led action boxes in a single row, with small outline person/family/group icons inside mint tiles, explanatory text and an upper-corner diagonal arrow. They do not use portrait PNGs. All original supplied artwork remains available in assets for future work.

The right hero photograph, glass healthcare tile and care message remain part of the landing. Decorative banners and stethoscope guidance images were removed from the form to reduce its height. Member portraits and gender artwork remain where they identify a person or choice.

## 7. Theme tokens

src/index.css owns the semantic tokens.

| Token | Value |
| --- | --- |
| --health-primary | #08675F |
| --health-primary-hover | #07564F |
| --health-primary-soft | #E6F4EE |
| --health-ink | #103B36 |
| --health-body | #244A43 |
| --health-muted | #526B65 |
| --health-canvas | #F6FAF8 |
| --health-surface | #FFFFFF |
| --health-border | #D7E5DF |
| --health-control-border | #76958B |
| --health-gold | #E7C88C |
| --health-success | #16704A |
| --health-warning | #8A5B12 |
| --health-error | #B42318 |
| --health-error-surface | #FFF1EF |
| --health-focus | #08675F |

Additional tokens:

- Heading font: Manrope Variable, with Noto Sans Arabic fallback.
- Body/UI font: Inter Variable, with Noto Sans Arabic fallback.
- Arabic overrides both font families to Noto Sans Arabic Variable first.
- Standard control radius: 12px.
- Standard card radius: 20px; landing choices use 16px.
- Header height token: 76px, with responsive adjustments.
- Standard card shadow: 0 12px 36px rgb(16 59 54 / 6%).
- Scrollbar colors: thumb #9AB8AC, hover #648E7F, active #08675F, track #EDF4F0.

Teal indicates actions and selection; mint indicates selected/contextual surfaces. Red is reserved for errors. Borders, labels, icons and state text supplement color. The gold token exists as an accent but is not a primary action color.

## 8. Typography and font-size standard

Sizes are CSS pixels and responsive ranges. Manrope is used for headings, Inter for controls/body text and Noto Sans Arabic for Arabic. Font files are bundled locally; no runtime Google Fonts request is required.

| Element | Current sizing / behavior |
| --- | --- |
| Hero heading | Desktop clamp(56px, 4.8vw, 76px), line-height 1.04, weight 800; tablet 48-68px; mobile 44-62px |
| Hero supporting sentence | 16px desktop, 14px mobile |
| Landing coverage question | 19px |
| Coverage choice labels | 16px, reduced to 14px at widths up to 1199px |
| Coverage choice helper | 11px desktop, 10px mobile |
| Navbar links | 14px baseline, responsive header variants |
| Inquiry main heading | clamp(26px, 2.3vw, 35px); 26px mobile; line-height 1.18 |
| Inquiry introductory description | 13px |
| Question heading | 22px |
| Question description | 13px |
| Field labels | 14px baseline |
| Text input values | 14px baseline |
| Choice labels | 13px compact baseline; some visa/mobile labels 12px |
| Choice helper text | 11px compact baseline; some mobile helpers 10px |
| Stepper label/status | 12px/10px desktop, compact variants below that |
| Form action buttons | 13px baseline; mobile variants may use 12px |
| Field errors | 11px with warning icon |
| Field format hint | 10px |
| Age badge | 10px |
| Calendar title | 14px |
| Calendar period | 13px |
| Calendar year/month/day controls | 12px |
| Calendar instruction/weekdays | 11px/10px |

Headings use heavier weights and tighter letter spacing. UI text generally uses 400-650 variable weights. Arabic overrides Latin spacing/font settings where needed.

## 9. Layout and responsive behavior

- Landing maximum width: 1536px; desktop split is approximately 54% copy and 46% hero image.
- Coverage actions stay in a three-column row. Small screens stack the icon within each action to preserve label space.
- Hero image uses an organic CSS clip shape where supported, with rounded-corner fallback.
- Inquiry maximum width: 1536px with approximately 28px outer padding and 24px column gaps.
- Desktop inquiry: 150px vertical icon step rail, flexible center editor and 320px summary.
- At 1024-1199px, the rail/summary tighten to approximately 125px/280px.
- Below 1024px, the stepper becomes horizontal and the summary becomes a disclosure above the editor.
- Below 768px, gutters and controls become more compact; member field columns reflow.
- Summary may stick only when its measured height fits the viewport.
- Back/Continue are in normal document flow below the form. They are not sticky.
- Form/editor radius uses the shared card/control tokens, with approximately 18-22px editor padding.

## 10. Coverage paths and inquiry fields

The three landing choices are:

1. Just me: employment or family visa holder.
2. Me & my dependents: spouse, children or parents.
3. Dependents only: sponsor already insured elsewhere.

| Stage | Fields and behavior |
| --- | --- |
| Cover | Visa type, nationality, visa emirate and visa status; one question group per field |
| Applicant/sponsor - basics | Gender and marital status |
| Applicant/sponsor - personal | Date of birth and monthly salary band |
| Applicant/sponsor - contact | Full name, email and UAE mobile number with +971 prefix |
| Family | Add relationship, then full name, DOB and gender where applicable; edit one member at a time |
| Review | Captured cover, applicant/sponsor and member data with edit actions |
| Verification | Local demo six-digit OTP dialog |

Visa type choices are Employee and Investor. Visa status choices are New visa, Renewal, Visit visa and Cancelled visa. Nationality uses a searchable country picker with quick choices. Marital status choices include Single, Married, Divorced and Widowed.

The visa emirate options display the labels provided by the user: Abu Dhabi / DoH rules, Dubai / DHA rules, and the remaining emirates / MoH rules. These subtitles do not implement insurance eligibility or regulatory logic.

Salary bands are above AED 4,000 and below AED 4,000. Exactly AED 4,000 has an explicit pending-business-confirmation state and is not silently assigned to either band.

Phone values are strings of nine local digits; DOB is stored as an ISO date string after complete input. The UI displays manual date entry as DD/MM/YYYY. No arbitrary insurer age limits are invented.

## 11. Family-member rules

- Self-only has no Family stage.
- Family coverage offers spouse, child and parent; dependents-only also offers other sponsored family.
- One spouse can be added. Under the user's explicit business rule, spouse gender is female and no gender selector is shown.
- Children, parents and other members require explicit gender selection.
- Child relationship artwork shows both boy and girl; parent artwork shows both father and mother.
- Option text is centered vertically beside its artwork.
- Member records have separate saved/valid states. Editing a saved record makes it incomplete until saved again.
- Removing a member offers Undo within the current draft.
- Dependents-only labels the applicant as sponsor and excludes the sponsor from insured-member counts.
- Portrait selection follows gender, relationship and age; unknown gender uses a neutral icon.

## 12. Form behavior, validation and resets

Native radio inputs provide semantic selection, but visible radio circles are removed. Selected choices use teal borders and mint backgrounds. Inputs have associated labels, error text and visible keyboard focus. Continue validates and focuses the first invalid field.

Valid single-field Cover selections navigate immediately to the next question. There is no outgoing fade or artificial delay. The incoming editor fades from partial to full opacity over about 340ms. Multi-field groups use Continue. Back remains available.

Refreshing creates a fresh draft and returns inquiry routes to Cover question 1. Choosing a landing coverage action or applying a coverage change also starts a completely blank draft, including when reselecting the same option. It clears answers, family rows, active editor, validation, calendar state, verification and Undo notices. Explicit Resume and normal step navigation preserve the current draft. Autocomplete is disabled on inquiry fields to discourage browser restoration of previous customer inputs.

No localStorage, sessionStorage or backend persistence is used for inquiry data. Prepared previews are in React memory and disappear on refresh.

## 13. Custom date picker

DateField and DateCalendar are shared across applicant and family editors.

- Opening an empty date shows the current month/year day grid with today outlined; it does not select today automatically.
- Opening a filled date shows its selected month/year.
- Header buttons switch to month and paginated year choices.
- Choosing a year leads to month choices; choosing a month leads to days. The value is committed only when a day is chosen.
- Future days/months/years are disabled. Past years can be paginated without introducing an insurer eligibility limit.
- Manual DD/MM/YYYY typing remains available.
- Clear date removes the current value.
- The native Popover API handles the surface and outside dismissal; Escape and the close control dismiss it. Keyboard arrow navigation is provided within the day grid.
- Calendar labels use Intl.DateTimeFormat with the Gregorian calendar and the current language.

Modern browser support for the HTML Popover API is required by this custom picker.

## 14. Translation and Arabic

There is no automatic translation service, AI translation call or i18next dependency. src/i18n.tsx contains an explicit Arabic string dictionary; src/language-context.ts exposes locale, toggle and t(text) through React Context.

English text is the lookup key. Arabic uses the mapped value, falling back to the English text if a translation is missing. Switching language updates document.lang and document.dir. Arabic uses RTL layout and the bundled Noto Sans Arabic font. Date, email and phone inputs retain readable LTR treatment where appropriate. Add new user-facing strings to the dictionary when adding UI.

## 15. Icons, imagery and motion

Icons are real Phosphor React components, not generated SVG drawings. The UI uses person/group icons, shield/check status icons, calendar and directional controls. Decorative icons/artwork are hidden from assistive technology when the associated label already supplies the meaning.

Original user artwork is retained in src/assets. Sharp creates compact WebP derivatives under src/assets/optimized. The hero and several member portraits use those derivatives. The two newer shield PNGs are retained as supplied, although the latest landing choices use outline icons instead of images.

Motion is restrained: hover feedback, incoming question fade and initial hero appearance. prefers-reduced-motion removes nonessential transitions and movement. There is no animation framework dependency.

## 16. Accessibility and platform primitives

- Shared labels, fieldsets/legends, native radio semantics and inline errors.
- Keyboard focus indicators and a skip-to-content link.
- Current/completed/pending step text in addition to icon/color.
- Native dialog semantics for modal workflows with focus management.
- Reduced-motion support and RTL-aware directional icons.
- Responsive layouts and semantic controls rather than image-only actions.

These are implementation features, not a claim of formal accessibility certification.

## 17. Creation and data boundaries

OTP is no longer part of the create flow. Documents precedes final review. Create Inquiry validates the draft, shows an 850ms health-themed loader, creates a session record with attached File objects and opens its detail view directly. No SMS, Dataverse call or backend upload occurs. There is a duplicate-click guard and pending creation is cancelled when leaving the form. Records and files reset on refresh.

Accepted document formats are PDF, JPG, PNG and WEBP, with prototype limits of 10 MB per file and 10 files. Upload is optional until business requirements define mandatory documents. Preview and download use local Blob URLs with cleanup on close.

Dataverse, production authentication, durable storage, consent wording, authorization and insurer integration remain future work.

## 18. Power Pages and repository delivery

powerpages.config.json names Health Insurance SPA, reads built output from dist and uses index.html as its landing page. Existing site metadata is retained in .powerpages-site. The recorded website ID is d8f4dd5d-9fd0-4c5a-9e92-640da9e2dd5c; verify deployment targeting before a future release.

When a Power Pages release is explicitly requested:

```sh
npm run build
pac pages upload-code-site --rootPath .
```

Microsoft Power Platform CLI must already be installed and authenticated. A GitHub push does not deploy the Power Pages website.

Repository exclusions include node_modules, dist, local captures, diagnostic downloads, test results, editor files and credentials. Reproduce build output from the source and lockfile rather than committing generated dependency/build folders.

## 19. Inquiry table, detail page and loader extension

The inquiry list now includes six fictional, explicitly labelled sample inquiries plus any user-prepared session records. src/inquiryData.ts owns fixtures and display helpers. The table in src/InquiryList.tsx supports combined search, status/coverage filtering, newest/oldest sorting, counts, accessible row links, and an empty-filter recovery action.

src/InquiryView.tsx owns the new /inquiries/{id} hash route with Overview, People in cover and Activity tabs. It reuses Summary DataRows/coverRows/applicantRows, Avatar, health field catalogs, formatting helpers and the existing language provider. The record view provides a copyable reference, status, cover/applicant detail groups, person selection, contextual summary, contact links and a clearly illustrative sample timeline. User-created records show only their local preview-preparation event. Unavailable IDs have a dedicated recovery view. No editing or Dataverse calls are introduced.

src/PageLoader.tsx and src/InquiryRecords.css provide a reusable centered loader with an animated Phosphor heartbeat, orbit, halo, dots and indeterminate rail. The current frontend demonstration uses a 650ms cancellable opening transition; future data fetching can mount the same loader while actual work is pending. Reduced motion is respected. The incoming record focuses its heading.

New screen sizes: list heading 34px desktop/27px mobile; record identity 24-34px; section headings 17px; read-only values 13px/12px mobile; table primary names 13px, table helper text 10-11px; loader title 23px/21px mobile. Desktop details use a flexible main column and a 310px aside, reduced to 270px on tablet and one column on mobile.

Arabic additions live in src/inquiryTranslations.ts and merge into the canonical dictionary. No additional packages were installed. Session draft clearing is unchanged: refresh clears entered/user-prepared records but recreates the explicit demo fixtures.

## 20. Inquiry reference layout revision

Inquiry names now follow "Inquiry for Health Insurance - applicant email" in the table and detail header. A split header places identity/status opposite src/PremiumBreakdown.tsx. Pricing is optional InquiryPremium data (base, additional and taxPercent) and is displayed through an accessible collapsible summary. Fixture pricing is illustrative; the sample tax rate is not a statement of applicable health-insurance tax treatment. Real session previews remain unpriced until a rating integration supplies a premium. No backend pricing logic was added.

Activity was removed. src/FamilyTree.tsx replaces the mutually exclusive person selector with an applicant/sponsor root and visible relationship branches. Each person shows name, relationship, DOB, age, gender and inclusion. Relationship groups can collapse.

src/InquiryDocuments.tsx is the final full-width section. The optional InquiryDocument model currently supplies sample PDF filenames/categories and a sample flag. Preview buttons open clearly labelled illustrative HTML document content; they do not imply actual files have been uploaded. A newly created inquiry has no attachments and displays the empty state. Upload in the create wizard is reserved for later work.

The new view uses Applicant information, not driver/vehicle fields. The existing right summary alignment is retained. No new dependencies or runtime services were introduced.

## 21. Document-upload and direct-create extension

The active create path no longer mounts Verification. Draft adds documents and documentsConfirmed; Stage adds documents. DocumentUpload.tsx supplies health reference tiles, accessible file selection, drag/drop, count/type/size/duplicate checks, preview and removal. FilePreview.tsx owns temporary image/PDF Blob URLs and download links. InquiryDocument optionally holds a File; record creation copies draft attachments to the new record. InquiryDocuments now previews real local files when present, retaining explicit illustrative previews for sample metadata. The final review reuses it with an Edit action. No packages were added. Original PNG references are bundled as supplied.

The create loader and record-opening loader are coordinated to avoid a repeated delay after creation. The new record opens directly in its Details tab, with its own files available for this session. Older browser tests describing OTP and pre-document step ordering require updates before reuse.

## 22. Shared custom dropdowns

CustomSelect.tsx and CustomSelect.css replace native select menus with a themed popover/listbox primitive. The inquiry table coverage filter uses its compact mode; nationality uses searchable mode and retains quick choices. Options support secondary helper text, selected checkmarks, active highlight, arrow navigation, Enter/Escape, typeahead for non-search lists and localized country search. Browser Popover API avoids clipped menus inside the table; positioning respects viewport edges and RTL. No new package was installed.

## 23. Current minimal customer UI (latest requirements)

This revision supersedes the earlier full inquiry table/detail and document-step descriptions. AccountMenu.tsx owns a native-popover account menu with a local preview profile and a My Inquiries link. The navbar no longer contains that link directly.

InquiryList.tsx now renders a small grid of inquiry cards with product, coverage and member information. One sample is seeded; all user-created session records remain available. InquiryView.tsx has been replaced with a small read-only InquirySummaryCard and return link. App.tsx hides the global navbar on an inquiry summary route. The old FamilyTree.tsx, PremiumBreakdown.tsx and InquiryDocuments.tsx components were deleted.

Summary.tsx owns the shared compact card and relationship-count formatter. Active creation stages exclude Documents, and Inquiry.tsx no longer renders a stepper or upload UI. The two-column layout is form plus 300px answer summary (270px tablet, stacked mobile). User-avatar and gender controls now use Phosphor icons; no new image assets/packages were added. SimpleExperience.css is loaded after older style sheets and owns this revised layout. DocumentUpload.tsx/FilePreview.tsx and supplied reference assets are retained but not part of the current flow.

The preview account is static frontend data until authentication integration; session inquiries are still local and disappear on refresh. No policy-purchase quota or backend enforcement is implied by the small card layout.

## 24. Inquiry summary modal

InquiryView.tsx now wraps the shared compact summary in Modal rather than rendering a standalone page. InquiryList calls App-owned selection state when a card is clicked; the URL/card list remain stable. Creation navigates to My Inquiries and opens the new record in this same modal. Native dialog provides focus containment, Escape and backdrop/close dismissal. No new dependency.

PremiumRange.tsx is the presentation owner for the annual estimated AED range in the create-side quote card. It has three clearly illustrative coverage fixtures, localized number formatting and an expandable explanation. The range changes only with coverage selection. No actual premium calculation, insurer API or eligibility algorithm is implemented.
# Current Dataverse integration

The integration described in [docs/health-dataverse-integration.md](docs/health-dataverse-integration.md) supersedes earlier statements about mock premiums, local-only requests or pending Dataverse work. Existing React/TypeScript/Vite/font packages are retained; no new package was added.

New modules: `healthPricing.ts` (typed customer JSON/rate matching/totals), `powerPagesApi.ts` (same-origin authenticated portal API), `useHealthCatalog.ts`, `healthIntegrationContext.ts`, `HealthCatalogStatus.tsx`. `PremiumRange.tsx` now shows a single live **AED** reference premium. `App.tsx` coordinates contact reuse/create and quote persistence. Gross and VAT-inclusive whole-unit charge are saved with the complete JSON. The final charge always rounds up after VAT. Salary labels remain AED.

Required Web API field settings are prepared locally, not applied to the live site. The existing anonymous POC permissions are retained as confirmed by the user; the account menu remains a preview identity. No browser captures or live contact/quote writes were performed for this integration.

