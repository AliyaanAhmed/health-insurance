# InsureAI Health

## Overview

Public health insurance inquiry SPA for UAE residents and their families, implemented in React and TypeScript for Power Pages. The October 15, 2026 references and supplied health design guide replace the temporary Nura placeholder identity.

The landing route is a brand surface with one hero. The inquiry is a product surface: predictable actions, manageable question groups, meaningful illustrations and a live, editable summary. The signature is the doctor/mother/child photograph paired with three illustrated coverage choices. Forms remain quieter than the hero.

## Colors

Runtime token ownership is **Model B**: `src/index.css` is the canonical semantic token source; this document records accepted values and rationale. `src/App.css` consumes these variables. There is no Tailwind or separate theme adapter.

| Role              | CSS token                 | Value     |
| ----------------- | ------------------------- | --------- |
| Primary           | `--health-primary`        | `#08675F` |
| Primary hover     | `--health-primary-hover`  | `#07564F` |
| Primary soft      | `--health-primary-soft`   | `#E6F4EE` |
| Heading           | `--health-ink`            | `#103B36` |
| Body              | `--health-body`           | `#244A43` |
| Muted             | `--health-muted`          | `#526B65` |
| Canvas            | `--health-canvas`         | `#F6FAF8` |
| Surface           | `--health-surface`        | `#FFFFFF` |
| Divider           | `--health-border`         | `#D7E5DF` |
| Control boundary  | `--health-control-border` | `#76958B` |
| Decorative accent | `--health-gold`           | `#E7C88C` |
| Success           | `--health-success`        | `#16704A` |
| Warning           | `--health-warning`        | `#8A5B12` |
| Error             | `--health-error`          | `#B42318` |
| Error surface     | `--health-error-surface`  | `#FFF1EF` |
| Focus             | `--health-focus`          | `#08675F` |

Use teal for decisions and states, mint for context, and white for functional surfaces. No decorative gradients or premium/benefit claims. Error, selected and saved states have icons or text as well as color.

## Typography

Locally bundled variable fonts: Manrope headings, Inter UI/body, Noto Sans Arabic for Arabic. Imports live in `src/index.css`; both font-family variables are overridden under `[dir=rtl]`.

- Hero: 56?76px desktop, 44?62px mobile, weight 800; compact horizontal coverage cards use 12?14px labels.
- Inquiry intro: 27–38px, weight 750, 1.2 line height.
- Editor headings: 22–24px, weight 750.
- Standard form labels/values: 14px desktop; typed mobile fields 16px to avoid mobile input zoom.
- Summary rows: 12px desktop, 11px on compact mobile layouts; supplementary status 10–11px.
- Arabic uses natural script metrics and less negative letter spacing. Dates, mobile numbers and emails remain LTR.

## Layout

Header 76px desktop and 65px mobile. Landing: 52/48 split, copy on the left, photograph on the right, three equally weighted entry choices. No default selection and no sections below the hero. Short desktop screens compact the content; narrow screens put the image after the choices.

Inquiry: 1536px maximum, compact gutters, vertical icon step rail on the left, flexible editor in the middle and 320px summary on the right. Below 1024px, progress becomes horizontal and the summary is a disclosure above the editor. The document owns scrolling.

Form headings and editors have no decorative imagery. Meaningful member and gender portraits remain compact. Back and Continue always follow the editor in normal document flow.

## Elevation & Depth

Editor and summary use `--health-shadow: 0 12px 36px rgb(16 59 54 / 6%)`. Avoid nested elevated cards. The hero pill has a restrained translucent treatment. Dialogs use a dim backdrop and clear focus containment.

## Shapes

`--radius-control: 12px`; `--radius-card: 20px`. Entry choices use 16px. Avatars and status markers may be circular. The hero image has a large rounded leading edge, with no CSS-drawn people or recreated screenshot backgrounds.

## Components

| Capability               | Owner                                        | Token / behavior mapping                                                      |
| ------------------------ | -------------------------------------------- | ----------------------------------------------------------------------------- |
| Primary/secondary button | `ui.tsx` / `.button`                         | Primary, hover, focus, control radius                                         |
| Field/error              | `TextField`, `ErrorText` in `ui.tsx`         | Control boundary, error, associated error IDs                                 |
| Radio choices            | `ChoiceGroup`, `GenderGroup`                 | Native radio behavior, full-tile hit area, focus on containing tile           |
| Date                     | `DateField`                                  | Explicit DD/MM/YYYY text, ISO date-only model, native calendar affordance     |
| Country selection        | `CountryPicker` in `Inquiry.tsx`             | Searchable modal with native buttons; not an imitation combobox               |
| Dialog                   | `Modal` in `ui.tsx`                          | Native modal dialog, focus containment/restoration, Escape and backdrop close |
| Person art               | `Avatar`, `CoverageArtwork`, `art` asset map | Supplied PNGs converted to WebP, original PNGs retained                       |
| Summary/review           | `Summary.tsx`                                | Semantic label/value rows; shared captured data                               |
| Status/notification      | `Status`, `notify` in `App.tsx`              | Text + icon, polite live announcement, recoverable Undo                       |
| Scrollbars               | Global `index.css`                           | Thumb, track, hover and active tokens, forced-colors fallback                 |

Images are optimized by `scripts/optimize-assets.mjs` into `src/assets/optimized`. Do not hand edit generated WebP files; update supplied originals and regenerate. Portrait crops are controlled per character in CSS. Standard icons come from Phosphor.

## Do's and Don'ts

- Keep entry copy exactly as requested. Carry the selection into the form.
- Use Continue; do not jump when a radio is selected.
- Show sponsor exclusion explicitly. Do not infer spouse gender.
- Reflect valid saved member completion, not just row count.
- Keep the unfinished AED 4,000 salary boundary visible as pending confirmation.
- Use real supplied images, semantic controls, meaningful focus and reduced-motion support.
- Do not collect medical history, documents, IDs or payment details outside the supplied scope.
- No fake advisor link: the current header offers a functional How it works dialog. Replace it with real support only when a destination exists.
- The InsureAI Health text identity is used with a standard product icon; a dedicated approved InsureAI logo asset has not been supplied.
- The frontend uses session memory only; no identity/contact data or raw OTP goes into persistent storage or URL parameters.

## Reference reconciliation

The latest direct user feedback supersedes the earlier reference guidance: three horizontal landing choices, larger headline, organic hero image edge, vertical desktop step rail, compact options without visible radio circles, no decorative form imagery, and actions in normal flow. Valid single-answer Cover questions advance automatically after a short selection transition. Multi-field steps require Continue.

Latest refinement: landing copy is two headline lines plus one supporting sentence. Three quiet text-only coverage cards retain hover/focus feedback; no portrait artwork. The right hero image stays as accepted. Gender tiles use the original portrait crop. Single-answer advancement holds the selection, fades out and fades in the next question over roughly one second overall, with reduced-motion support. Navbar labels are Home and My Inquiries. Translation remains the local React Context dictionary in src/i18n.tsx.

Latest revision: coverage targets use small supplied PNG artwork above labels, with no card background or enclosing border; hover uses a quiet underline and artwork movement. Valid single-field Cover choices navigate immediately with no timer or outgoing fade; only the incoming question fades from 55% to full opacity over 340ms so there is no blank interval.

Relationship picker: child shows boy and girl together; parent shows father and mother together. Labels and gender option text are vertically centered beside artwork. Spouse is female by explicit user business rule and has a two-field name/DOB editor without a gender selector.

Coverage choice affordance refinement: compact white action cards with a visible light teal boundary, circular arrow, mint hover/focus state and pressed feedback. Just me uses Smiling Man with Health Shield-1.png; Dependents only uses Smiling Parents Under a Health Shield-2.png. Three options stay in a single row.

Latest coverage choice preference: no pictures. Compact text-only actions use a slim teal leading edge, restrained corners, larger 16px labels (14px mobile), supporting text, and a directional arrow. Three choices remain in one row.

Coverage style refinement: remove the leading teal accent. Use an even subtle border, 16px corners, white surface and soft elevation on hover; retain larger labels and directional arrows.

Coverage icon refinement follows the latest user reference: person/family/group outline icons in soft mint square tiles beside the text, with an upper-corner diagonal arrow. Existing teal colors and rounded boxes remain. Narrow mobile cards stack the icon above the label to retain legibility.

Visa emirate options include the user-provided rule subtitles: Abu Dhabi ? DoH rules; Dubai ? DHA rules; all other emirates ? MoH rules. These are option subtitles, not an added rules explanation or eligibility logic.

Date picker: shared DateCalendar replaces the native date input picker. A compact teal/white popover opens on year choices, then month and day; users can return to year/month selection from the period header. Future dates are disabled, manual DD/MM/YYYY entry remains, and locale-aware Gregorian labels support Arabic. Native popover provides Escape/outside dismissal; calendar controls support keyboard focus and day arrows.

Reset preference: refresh or coverage selection starts a new empty inquiry at Cover question 1, including reselecting the same coverage. Form remount clears internal validation and calendar state. Coverage dialog explains that all previous answers will be cleared.

Calendar opening refinement: open directly on the day grid for the current month/year when the field is empty, with today outlined but not committed. Existing values open their selected month/year. Header month/year buttons still open the respective choice grids.
