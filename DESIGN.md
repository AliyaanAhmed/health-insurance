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

## Inquiry list, record view and shared loader

The list now uses a semantic table with applicant avatars, references, cover type/emirate, people count, status, date sorting and explicit open links. Search matches name/reference/emirate; status buttons and a coverage filter combine. Three quiet summary counts introduce the table. Six fictional samples cover all three paths and are explicitly labelled. New session previews share the same table.

A dedicated /inquiries/{id} hash route replaces the old record modal. The record identity header leads into Overview, People in cover and Activity tabs. Main content uses labelled read-only values, and an aside summarizes cover count, emirate/rule label and actionable email/telephone contacts. The People tab uses an interactive person picker and shared portrait/date/field primitives. Sample activity is explicitly illustrative; session previews show only their actual preparation event. Unknown IDs have a return action.

PageLoader is a reusable centered full-screen health-themed surface: Phosphor heartbeat tile, thin orbit, breathing halo, dots and indeterminate rail. Opening a record currently uses a cancellable 650ms local transition to demonstrate the loader without claiming a backend request. It respects reduced motion and offers Back to inquiries. Loaded records focus their title. src/InquiryRecords.css owns these screens; existing health tokens, fonts and mobile/RTL behavior are reused.

Detail alignment: on desktop/tablet, the tabs occupy their own grid row and the cover-summary aside shares the content row with the first detail section. The Your health cover card therefore starts at Cover details, rather than at the tabs.

## Inquiry view: premium, documents and family structure

The latest reference replaces the identity-only header with two columns: inquiry name/status on the left and a collapsible premium breakdown on the right. Inquiry names use the exact structure "Inquiry for Health Insurance - applicant email" in both the record header and table. Pricing shows total prominently, then base/additional/gross premium, VAT rate/amount and total. Fixtures supply illustrative prices and a sample VAT rate; user-created previews remain Not calculated yet. No underwriting calculation or production tax assumptions have been introduced.

Overview retains cover details and Applicant information (never driver information). The summary aside remains aligned with the first detail section below the tabs. Activity is removed; only Overview and People in cover remain. People use an accessible family diagram: applicant/sponsor root with connected relationship groups and all member detail cards visible. Groups can collapse without implying that only one member is selected. Sponsor is explicitly not included for dependents-only.

Documents is the final full-width section. Samples have labelled illustrative PDF metadata with local HTML previews; those previews clearly state that no file was uploaded. Session-created inquiries show an empty attachments state. Upload remains outside the create form until requested. Existing teal palette, sizes, responsive reflow and reduced motion apply.

Latest record tab refinement: Overview is renamed Details. Remove the Everyone in this cover shortcut. Documents is the last component inside Details, and is not rendered in People in cover.

Sample content preference: inquiry applicants and family members use fictional Emirati Arabic names in English transliteration, with UAE nationality and corresponding example.com email addresses.

## Documents and direct creation

Latest flow replaces OTP with Create Inquiry. All cover paths now pass through Documents before One last look. Documents uses the supplied Stylized Emirates ID upload card-2.png and Passport Visa Upload Illustration-1.png in small reference tiles, then a teal drag/drop surface and Browse files. Attachments support PDF/JPG/PNG/WEBP, 10 MB each, 10 files maximum; these are prototype upload limits, not insurer requirements. Documents remain optional until business rules specify otherwise. Each added file displays name, size, preview and remove. Rejected/duplicate files show reasons. Final review includes attachments with Edit.

Create Inquiry validates the draft and completed document step, shows an 850ms centered creation loader, creates a local record with attached File objects, and opens its Details view directly without a second loader. A ref guards duplicate clicks, and leaving cancels pending creation. Image/PDF preview and download are shared by create/review/view. Blob URLs are scoped to an open preview and revoked on close; files are never put into localStorage or sent to a server. Refresh clears session files. Existing summary alignment and Details-only document placement remain.

Final review layout: One last look pairs Cover details and applicant/sponsor details in a two-column grid, followed by paired member sections. Review cards use compact label/value spacing. Documents remains the final full-width attachment section. Below 768px, review sections stack for readability.

Navigation motion refinement: hash-route changes use the browser View Transition API with a 380ms overlapping outgoing/incoming opacity crossfade. flushSync commits the next React route in the snapshot callback and scrolling resets before the incoming capture. There is no navigation timer or empty editor interval. Capture-level fading temporarily disables nested editor/intro/hero entrance animations to avoid a double fade. Repeated navigation skips the previous transition. Reduced motion navigates directly; unsupported browsers retain the existing incoming component transitions.

Crossfade replay fix: route entrance animations stay disabled after native crossfade navigation has been activated. Clearing only the in-flight marker no longer re-enables/restarts editor or intro animations at the end of a transition, preventing the second fade/jerk.

Home width refinement: remove the landing page's 1536px maximum and use the full available width. Disable the reserved stable scrollbar gutter only while the landing page is present; actual scrolling remains available when content overflows.

Responsive spacing refinement: landing actions no longer enforce a minimum height, so short one-line descriptions do not leave a large empty area below. Inquiry outer gutters increase to 40-72px across laptop widths, 36px on tablet and 20-28px on mobile; the existing large desktop centered layout remains.

Custom dropdown refinement: CustomSelect is the shared listbox owner for select-style fields and filters, replacing the native coverage filter and the nationality modal. Menus use white rounded surfaces, soft shadow, mint active/selected rows and teal checkmarks, with custom caret rotation. Nationality supports search and existing quick choices. Keyboard arrows, Enter, Escape, Home/End and typeahead for unsearchable lists are supported. Native popover places the menu above overflow containers and repositions for viewport room and RTL. No dropdown library was added.

## Latest customer simplification (supersedes earlier record/stepper designs)

Replace all person illustrations with Phosphor person/child/gender/group icons, including member tiles, gender choices and relationship selection. The hero photograph and healthcare decorative assets remain.

Navbar removes My Inquiries. AccountMenu.tsx adds a top-right user icon and native popover with only name, email and a My Inquiries hyperlink. It uses a fixed local preview identity until authentication is supplied.

My Inquiries becomes a small responsive card collection (three columns desktop, two tablet, one mobile), designed for a few inquiries. One explicitly labelled sample is shown, rather than a table of many unrelated customers. Cards identify the health product, coverage choice and covered members. No arbitrary purchase limit is enforced by the frontend: inquiries are not purchased policies.

Opening a card renders a minimal standalone summary with no global navbar, tabs, pricing breakdown or documents. Back returns to the card collection. The prior elaborate detail layout and its family-tree/premium/document components have been removed.

Creation has no left stepper and no document step. The form and right-side compact card are the only columns. The shared InquirySummaryCard shows Cover for, Nationality, Visa emirate/status, Name, Age, Salary and relationship counts for Members. Answered values have small checks and direct edit actions; placeholders use a dash. No progress bar, long guidance or repeated section headers are shown. The same card powers the read-only inquiry summary, with member names appended. SimpleExperience.css is the final layout ownership layer for this revision.

Navbar refinement: remove the Home navigation link. The linked InsureAI Health logo is the home action; header uses a two-column logo/actions layout.

Inquiry summary interaction refinement: inquiry cards are buttons that open the shared native-dialog summary modal over the unchanged card collection. Closing via the close control, Escape or backdrop returns to the cards without route navigation and restores focus. New inquiry creation opens this same modal on My Inquiries. Standalone detail navigation is removed; older detail links normalize to the card collection with the matching modal. The modal uses a 480px white rounded surface, soft blurred backdrop and the existing compact summary card.

Customer-facing labels: Create a Request replaces Create Inquiry; My Requests replaces My Inquiries. Related New request, Request summary, Request created and creation/back labels use the same terminology. Internal model and hash-route names remain stable.

Live quote panel refinement: create-only heading is Your quote so far, with a quiet live dot, mint coverage tile and functional change control. Answer rows use small field icons, full-row edit targets, check-to-pencil hover feedback and Add actions for unanswered values. A subtle filled-answer rail and one-line edit hint support orientation without another stepper. Answer-value updates fade briefly. Read-only request modal stays minimal; all styling is scoped to quote-live-card.

Quote-panel navigation constraint: unanswered rows are plain non-interactive placeholders, with no Add text or plus icon. Only rows with an existing answer expose the edit button. New answers must come through the normal step-by-step form.

Final-review alignment refinement: sections in each two-column row stretch to the tallest card, so Cover details and applicant/sponsor details share equal height.

Quote-panel premium range: PremiumRange.tsx adds a create-only annual AED range, a bounded range visualization and expandable explanation. Coverage-specific amounts are explicitly labelled Sample range and held as presentation fixtures, not calculated underwriting prices. No nationality, medical, age, salary or member-based rating rules are invented. The actual pricing integration will replace these fixtures with approved ranges. No exact premium is presented.

Quote-block compactness: cover selection and premium range share a contiguous rounded block, with a mint cover header and compact range body. Remove the inter-card gap and reduce internal spacing without removing the explanatory control.

Quote footer refinement: remove the filled-answer progress bar. Retain only the small edit hint below the answers.

## Dataverse integration (current behavior, 2026-10-16)

This section supersedes the earlier sample pricing/records. The create panel shows one animated AED reference premium calculated from live emirate/age rates, with a priced-person count and clear incomplete/unmatched states. No sample range or lower/upper labels remain. Plan VAT is applied to the final whole-number charge, always rounded up. Salary questions remain AED. Existing compact layouts, iconography and transition behavior are preserved.

The themed creation loader reflects actual contact lookup/create, quote creation and list refresh. Errors preserve answers and expose a retry path. My Requests reads Health Insurance quotes from Dataverse and opens their saved JSON in the minimal modal, including gross and VAT-inclusive amounts. No runtime fixture rows are injected. API field settings are prepared locally; the existing anonymous permissions are retained for the internal POC as confirmed by the user. See docs/health-dataverse-integration.md.

Catalog loading runs silently when the create form opens. No product/plan loading banner or raw backend error is rendered in the form. A failed load keeps a short customer-facing retry message.

Premium panel refinement: customer-facing heading Premium range, a single AED amount, annual-estimate caption and a quiet range-style rail with no invented numeric bounds. Amount counts smoothly to the updated sum; the rail pulses on saved membership/price changes. Remove reference-premium, Before VAT and DOB/emirate instructional copy. Applicant pricing starts on valid DOB/emirate; new members enter the sum only on Save member. Existing-member edits retain their last confirmed pricing until saved again.

Premium estimate polish: remove the decorative slider/rail and shield icon. Use a compact heading row, aligned AED/amount baseline, quiet people badge and one footer divider. Every amount change starts at zero and counts in whole units with a 1.8-second sine ease; exact cents appear only in the settled value. A keyed counter prevents stale previous values flashing on updates. Reduced-motion skips counting.

Request summary redesign: dedicated read-only modal at 740px maximum width, with a mint coverage header, paired cover/applicant sections, side-by-side member tiles and two premium tiles. Gross premium and Premium to be charged remain explicit, with the final charge visually emphasized. Mobile sections stack while member tiles retain two columns. Existing modal focus/Escape behavior remains. My Requests uses the shared centered heartbeat loader during its actual data fetch, with loading text available to screen readers only. No artificial wait is added.

Summary header refinement: coverage label, selection and covered-person count are grouped together on the left. Gross premium and Premium to be charged appear as compact inline totals on the right, separated by a quiet vertical divider. Remove the bottom premium tiles. On small screens, totals share a row beneath the coverage information inside the same header.

Empty premium spacing: do not render the people-count row until at least one person is priced. Remove the amount row minimum height in the empty state and leave only a 10px gap before the estimate help divider.

My Requests loading refinement: use PageLoader in embedded mode inside the request-card region, preserving navbar, My Requests title and New request action. The centered heartbeat animation has the visible caption Loading requests. The fullscreen creation loader remains unchanged.

Premium counter refinement: advance from zero in AED 50 increments, settling on the exact amount, including any remainder. Limit the animation to 900ms for large totals; reduced motion displays the final amount immediately.

Single marital status hides Spouse and Child in the add-person modal. Existing spouse/child entries are cleared when switching to Single, and the total recalculates. Creation remains in the themed loader until both inquiry creation and Product Match status update complete. Product aur_premium is stored unchanged as the whole-number base premium.

Single applicant family shortcuts: the inline Spouse and Child buttons have native disabled attributes plus muted gray text/background/borders, no hover elevation and a not-allowed cursor. The add-person modal continues hiding those ineligible relationships.

## Request follow-ups ? October 17, 2026

Status-aware card actions are sibling buttons to the summary button, never nested interactive controls. Upload Emirates ID is shown only for 751820020; KYC completion only for 751820019 unless submitted, when View KYC remains available. Refresh requests picks up backend status changes.

Canonical Modal gains a dismissible/busy variant, preserving native focus trapping, Escape/backdrop handling and focus return to the card when an action disappears. FollowUps.css owns new surfaces. Upload uses the supplied ID front/back sample PNGs, a dropzone/browse alternative, preview, per-file states and actual file-count progress. Confirmed files are retained on retry; final status changes only after all file acknowledgements.

KYC uses shared ChoiceGroup/Avatar primitives, horizontal member navigation, a shared family-history step, age/gender-conditioned person sections and final review. It never repeats shared family history or infers a child diagnosis from a parent. Positive answers reveal concise detail inputs. Question source and routing are in src/kycQuestions.ts and docs/HEALTH-KYC-QUESTIONS.md. Submitted answers become immutable read-only accordions. Bilingual labels/questions follow the current locale. Health details and files are kept only in page memory before server submission, not localStorage.

## Create and KYC refinements — October 19, 2026

The final create action is Submit. PremiumRange remains the shared live estimate surface: its maximum is the existing partial gross premium, its minimum is 90% of that maximum rounded to two decimal places. This is a display range only; persisted gross premium and VAT calculations are unchanged. Both endpoints animate together, respect reduced motion, and use the active number locale. The compact range track is decorative, not a slider or progress control. The DOH/KYC note stays visible, including when an estimate is unavailable.

Family member tiles show the relationship below the name. KYC member navigation shows relationship and age. Valid answered sections retain a success border/background and checkmark after moving on; active sections also retain their stronger focus-like selection border. Changing an answer to an incomplete state removes the completed treatment. These are locally answered indicators, not server-save confirmation.

## Spouse gender selection — October 19, 2026

This supersedes the earlier female-only spouse rule. Spouses use the same required Male/Female GenderGroup and responsive three-field editor as other members. New spouses start with no gender selected. No effect normalizes or overwrites a saved spouse gender. KYC continues using the covered person's saved gender and DOB; existing records are not rewritten or inferred from the applicant's gender.

KYC navigation refinement: member/household/review buttons now wrap and grow to fill each available row, rather than remaining content-width in a horizontal scroller. Long names wrap within each button. Completed sections use solid theme teal with white text; completion tick icons are removed. Answered remains available to screen readers. The current step keeps its selection outline independently of completion. This supersedes the earlier completed mint/checkmark treatment.

## TPA network step — October 19, 2026

All create paths include TPA before Review (after Family for dependent covers, after Your details for Just me). The read-only provider is NextCare. The required CustomSelect shows labels only: Basic Network (choice 1, no adjustment), Standard Network (choice 2, +10%), Premium Network (choice 3, +20%). No network is preselected. Shared tpaNetworks in health.ts owns labels/choice values/percentages.

healthPricing.ts applies the selected adjustment once to the combined reference premium, rounds adjusted gross to currency cents, then calculates plan VAT and rounds the final charge upward to a whole AED. Original per-person reference premiums are retained. Both animated range endpoints derive from adjusted gross (90%–100%). Sidebar answers, final review and saved request summary show provider/network. Existing records lacking TPA remain readable with missing values rather than assuming a selected network.

TPA network presentation refinement: replace CustomSelect with the canonical ChoiceGroup, using three equal compact selection boxes on desktop and stacked boxes on narrow screens. Only network labels are shown; selected state uses teal border and mint background. NextCare remains fixed in a compact provider strip above the options. Numeric choices, adjustments, validation, premium animation and persistence are unchanged.

TPA compact field refinement supersedes the provider strip: show the read-only prepopulated NextCare TextField beside the network ChoiceGroup in one desktop row. Network boxes are 50px minimum height, 12px labels and 8px gaps. On mobile the two fields stack, while all three compact network choices remain in one row with wrapping labels. No provider icon/header or divider is rendered.

TPA row placement refinement: TPA TextField and TPA Network ChoiceGroup occupy separate full-width rows at every viewport. Network choices remain three compact boxes in one row. This supersedes the desktop side-by-side field layout.

Saved request header now shows Network adjustment immediately before Gross premium and Premium to be charged, using the same numeric type size. The existing cover-details adjustment remains visible. On narrow screens the pricing area wraps below the cover identity; on phones the adjustment precedes the paired monetary values on its own row.

TPA provider input width refinement: keep the two separate rows, but constrain the read-only NextCare field to 274px maximum (100% on narrower containers), matching the supplied reference. The network choices retain their full-row layout.

## Plans and request progress — October 20, 2026

The former TPA creation step is presented as Plans, with Continue to Plans navigation and one ChoiceGroup only. The fixed NextCare value remains internal and is still sent to Dataverse. Plan tiles show Basic Network 0%, Standard Network 10%, Premium Network 20%; selection retains shared keyboard/focus and selected border/background behavior. Customer JSON premium.networkAdjustmentAmount already stores the added amount before VAT, derived from the original reference subtotal, and is now displayed in saved request summaries without repricing. Sidebar/review labels use Plans rather than TPA.

RequestProgress.tsx owns the read-only six-stage tracker below the saved summary header. Exact status mappings follow the October 20 user table. Current and prior stages are teal; current has a solid marker and aria-current=step; upcoming stages are neutral. The tracker uses an ordered list with descriptive icons, a current-stage label and no navigation buttons. Desktop shows connected horizontal stages; narrow screens use a connected vertical list. Unknown statuses highlight no stage rather than implying completion. It reflects the latest loaded portal status and does not promise live updates.

Plans card refinement: hide the repeated field legend visually while preserving its accessible group label. Each native radio card shows a compact shield icon, network name, and percentage adjustment badge. Selected cards use mint, solid teal icon tile and a small selection marker; hover adds restrained elevation. No invented coverage benefits or recommended tier. Three desktop cards become compact horizontal cards on phones; reduced motion disables hover translation.
