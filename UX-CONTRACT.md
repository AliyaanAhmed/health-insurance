# InsureAI Health interaction contract

Visual ownership: [DESIGN.md](DESIGN.md). Business evidence: user-supplied October 15, 2026 build brief, theme/design guide, two reference screens and eSanad audit. This is a local UI implementation; Dataverse, real OTP and insurer APIs are not connected.

## Routes and state

- Hash routes: `/`, `/inquiry/{stage}/{group}?for={coverageTarget}`, `/inquiries`, `/complete`.
- Only enum navigation state is in the URL. Drafts and prepared preview inquiries live in React memory. Refresh resets them; a deep inquiry refresh returns to Cover.
- Landing choices carry their coverage target into the form without asking again. Back and header navigation preserve the current in-memory draft. My inquiries offers Resume.
- `self`: Cover → Your details → Review. `self_and_dependents`: Cover → Your details → Family → Review. `dependents_only`: Cover → Sponsor details → Family → Review. Steps are renumbered.
- Visa type never implies Golden Visa. Applying a coverage target starts a completely fresh draft, per the user?s explicit reset preference.

## Canonical UI map

| Capability     | Canonical owner                                    | Source of truth             | Variants                                                       | Evidence                       |
| -------------- | -------------------------------------------------- | --------------------------- | -------------------------------------------------------------- | ------------------------------ |
| Select/Listbox | `ChoiceGroup`, `CountryPicker`                     | Design + this contract      | Native radio; searchable modal with button list                | `tests/health-flow.spec.ts`    |
| Date           | `DateField`                                        | `health.ts` date validation | Typed DD/MM/YYYY; native calendar button                       | Browser validation/back tests  |
| Form           | `Inquiry` + shared fields + `health.ts` validators | Supplied field map          | Cover/applicant/member/review                                  | Six complete route tests       |
| Scrollbar      | `src/index.css`                                    | DESIGN.md                   | Document; geometry exception for country/member lists          | Narrow browser overflow checks |
| Toast          | `notify` in `App.tsx`                              | This contract               | Success/info; Undo for member removal                          | Removal/Undo browser test      |
| CRUD           | `App` + `Inquiry`                                  | This contract               | In-memory prepare/read/member edit/remove                      | End-to-end local inquiry tests |
| Dialog         | `Modal`                                            | Native dialog               | Help, country, relationship, cover change, OTP, inquiry detail | Keyboard/browser tests         |

There is no data table requiring row-selection ownership. Prepared inquiries are a small session-only collection rendered as cards with local search.

## Fields and validation

- Cover asks four short groups: Employee/Investor, nationality, visa emirate, visa status.
- Applicant asks three short groups: gender/marital status, DOB/salary band, name/contact.
- Nationality catalog uses ISO country/territory codes and localized display names, with five shortcuts and full search.
- DOB is a date-only ISO string after a complete entry. Partial typed text is retained while editing and rejected on Continue. UI always shows day/month/year. Age is derived; future dates are rejected. There are no unapproved insurer age limits.
- Phone is a string of nine local digits with a +971 prefix, not an integer. Prefix eligibility is not invented beyond the supplied nine-digit contract.
- Exactly AED 4,000 is a separate pending confirmation state, per the user's explicit decision. It is never mapped into above/below silently.
- Forms use `noValidate`; validation after blur/Continue provides associated inline text and an error summary. Continue remains actionable so the reason is discoverable. The first invalid field receives focus.
- Route changes focus the question heading. Opening a member editor from Add person focuses the name field.

## Members

- Family target offers spouse, children and parents. Dependents-only also offers other sponsored family, matching the audited entry path; underwriting eligibility/limits remain unconfirmed.
- One spouse, repeatable children/parents/other; no arbitrary maximum member count or age eligibility is imposed.
- Each member requires full name, DOB and gender. Per the user?s explicit business rule, spouse members are female and do not show a gender selector. Children, parents and other members require explicit gender selection.
- Only one member editor is open. Switching preserves unfinished edits. A member is Complete only when saved and valid. Editing a saved field marks it unsaved again.
- Save member stays in the family step, with a clear next action: open another incomplete member or Continue to review.
- Removal offers persistent Undo until dismissed or replaced by another operation. Applying a coverage choice clears all draft answers and member rows, including when reselecting the same target.

## Summary and review

- Every captured value is viewable and editable. Compact summary masks contact information; explicit Show all details and review expose the full value.
- People completion is separate from overall inquiry progress. Dependents-only excludes the sponsor from insured-person counts and labels them explicitly.
- Summary Edit preserves all other input. Person links open the correct member editor.
- Mobile summary is a disclosure above the editor. Actions stay accessible with page-bottom space and safe-area padding.

## Creation and documents

- Documents precedes final review for all coverage paths. Optional local files can be browsed/dropped, previewed, removed and edited from final review. The user sees file type, count and size limits and rejection reasons.
- Create Inquiry validates all preceding stages and the document-step acknowledgement. It shows the themed loader, then creates one session record and navigates directly to /inquiries/{id}. OTP is removed. Duplicate creation is guarded; leaving during the pending transition cancels it.
- Files are stored only as browser-memory File objects attached to the draft/record. Real image/PDF previews and downloads use temporary Blob URLs, revoked on preview unmount. Refresh clears records/files; coverage changes clear draft files. No backend upload, Dataverse write or persistence is claimed.

## Locale, accessibility and resilience

- English and Arabic share data/state and controls. Arabic uses RTL, localized labels/validation and Noto Sans Arabic. Dates, phone and email remain readable LTR.
- Native radios preserve arrow-key navigation; entire tiles are hit targets. Native dialogs contain focus and restore it on close. No browser alert/confirm/prompt is used.
- All interactive controls have hover, pressed, visible focus and disabled/busy behavior. Reduced motion removes nonessential translation/animation.
- The app has no backend calls, authentication workflow or asynchronous data fetching. Server failure/retry/offline/conflict states belong to the future integration phase, not simulated successful persistence.

## Latest user layout and navigation changes

- Three landing coverage choices share one row; the hero heading has stronger scale than choice labels.
- Desktop inquiries use a vertical icon rail, compact central form and right summary.
- Valid single-field Cover selections navigate immediately. Only the next question fades in; there is no outgoing fade or navigation delay. Back and Continue remain available.
- Options use selected background and border without visible radio indicators; native radio semantics remain.
- Decorative form illustrations are removed. Actions appear immediately below the editor in normal flow.

DateField now uses the shared DateCalendar native-popover surface instead of the browser date picker. Open on the day grid at today for an empty field or the existing selected date. Header controls let users choose year/month; changing year/month does not commit a value until a day is chosen. Manual input remains. Future dates are disabled, years paginate back to 0001 without adding insurer eligibility rules, and closing without selection preserves the current date.

Latest reset behavior: browser refresh creates an empty in-memory draft and returns every inquiry URL to Cover question 1. Selecting a landing coverage option or applying a coverage choice resets answers, members, active editor, errors, calendar state, verification and undo notice. In-form navigation and explicit Resume preserve the current draft. Browser autocomplete is disabled on inquiry fields.

## Inquiry table and read-only record routes

- /inquiries lists six labelled fictional records plus session-created previews; demo rows return on refresh, while form answers and user-created previews still reset. Samples do not prefill the create form.
- Search matches applicant name, ID and emirate; status and coverage filters combine. Created-date sorting toggles. No matching records provides Clear filters.
- Applicant links and row arrow links open /inquiries/{id}; invalid/unavailable IDs render Inquiry not found with a return link. Refresh supports sample deep links. Session-only records become unavailable after refresh.
- The record view is read-only. Overview uses shared cover/applicant mappings; People selects an insured person; Activity distinguishes illustrative sample events from local preparation. Sponsor is excluded from insured-person count.
- Date/time rendering uses the client Asia/Karachi timezone; activity times are labelled PKT.
- Copy reference handles clipboard denial; email and phone are explicit user-operated links.
- PageLoader opens centrally during a cancellable 650ms local record transition; there is no network request or fabricated percentage. It uses a status announcement, a return action and reduced-motion styling. The loaded page focuses its heading.
- New labels are mapped by src/inquiryTranslations.ts and merged into the existing React Context dictionary. No new runtime packages.

## Latest record view changes

- Record name is derived from product plus applicant email; the table and detail header share that naming convention.
- Overview shows Cover details and Applicant information. Activity tab/timeline is removed.
- PremiumBreakdown renders optional record pricing, with a native open/collapse control. Sample base/additional amounts and a fictional demonstration VAT rate are fixture data, not eligibility/rating/tax advice. Displayed gross is base plus additional; tax and totals round for display. No prices are derived for real session previews.
- People in cover displays a family tree with an applicant/sponsor root and spouse, children, parents and other branches as present in the data. All people and details are visible by default; only relationship groups collapse. No member selection state exists. Sponsor is excluded from insured count when appropriate.
- Documents appears after the detail layout. Samples have explicit illustrative preview buttons. Preview content is local HTML, not an uploaded/downloadable PDF. New session records have no documents. There is no upload step yet.

Latest stage order: self uses Cover ? Your details ? Documents ? Review; family adds Family before Documents; dependents-only uses Sponsor details. The completed Documents flag permits review after the user continues, including with no files. Draft file edits clear that acknowledgement. Legacy sections describing a future upload step or OTP are superseded by this implementation.

CustomSelect.tsx is now the canonical dropdown/listbox primitive; CustomSelect.css owns its theme. InquiryList coverage filter and CountryPicker use it. Country search accepts localized/English country names and ISO codes. Selection invokes the existing behavior, including single-question auto-navigation. Popovers support outside dismissal, Escape, focus restoration on selection and keyboard navigation. Native select controls have been removed from the active UI.

## Current simplified customer journey

This section supersedes earlier table/detail/stepper/upload behavior. Active stage order is Cover ? Your details ? optional Family ? Review. The stepper is not rendered. No document input, review attachments or document output is shown. Creation still validates details and members, guards duplicate clicks and uses the themed creation loader before opening the new minimal summary.

Summary is now InquirySummaryCard in Summary.tsx, shared by create and read-only inquiry views. It uses only essential cover/name/age/salary/member fields; edit actions exist only in creation. People are icons, never character artwork. Member counts exclude the applicant and describe relationship quantities.

My Inquiries is accessed from AccountMenu, uses a small card grid and displays one sample plus local user-created records. No purchase cap is inferred from inquiry count. Opening a card uses /inquiries/{id} but no longer shows a full detail form or global navbar. No tabs, documents, activity or premium breakdown are rendered. Back returns to the cards.

The account menu shows the local previewAccount object, not an authenticated identity. Refresh still clears entered form/session records and restores the single sample. Home/coverage changes start a fresh draft. The shared dropdown, calendar, auto-advance and crossfade behavior remain.

Inquiry summary interaction refinement: inquiry cards are buttons that open the shared native-dialog summary modal over the unchanged card collection. Closing via the close control, Escape or backdrop returns to the cards without route navigation and restores focus. New inquiry creation opens this same modal on My Inquiries. Standalone detail navigation is removed; older detail links normalize to the card collection with the matching modal. The modal uses a 480px white rounded surface, soft blurred backdrop and the existing compact summary card.

## Dataverse behavior (supersedes sample persistence/pricing)

On entering creation, fetch the Health product, related plan VAT and current premium rates. Rebuild customer JSON on every answer/catalog/plan edit. Match inclusive age bands and the selected visa emirate, excluding a sponsor from dependents-only pricing. A missing/overlapping rate is visible and blocks creation; no fallback amount is invented. Premiums display AED without conversion. Gross is the sum of insured-person reference premiums; the final charge includes plan VAT and rounds up to a whole unit.

Creation uses real contact lookup/create and quote POST, with a loader lasting through completion and no artificial timer. Duplicate clicks are guarded; stable IDs permit recovery after an uncertain response during the browser visit. Failures preserve the draft. My Requests reads Health-only quotes; malformed saved JSON produces an honest unavailable-details message. Refresh clears the unsaved draft, not persisted records. Source JSON stores submission-time prices rather than repricing historical requests. Account identity remains a preview; actual access follows the existing anonymous POC permissions, retained as explicitly confirmed by the user.

## Request follow-up ownership

InquiryList owns status-driven action visibility and uses a semantic article with a summary button plus separate follow-up buttons. EmiratesIdModal owns selection/queue state; KycModal owns transient answer drafts and navigation. ui.tsx Modal and ChoiceGroup remain canonical overlays and choices. powerPagesApi.ts owns authenticated flow calls, latest-row reads and ETag-conditional updates. kycQuestions.ts owns eligibility, conditional questions, validation, serialization and email formatting. FollowUps.css uses existing health tokens. Submitted KYC is view-only; no additional clinical inference or price adjustment occurs. Unsaved health answers are not persisted in browser storage. No live flow runs or medical submissions are made for verification.

## October 19 create/KYC UI updates

- Final create button: Submit; submission API, duplicate protection and success destination are unchanged.
- Creation estimate display: minimum = 90% of the current gross estimate, maximum = current gross estimate, minimum rounded to two decimal places. The display discount does not alter persisted reference premiums, gross premium or VAT/total calculations. Both endpoints update from the same pricing snapshot; no draggable input is implied.
- The final quote dependency on DOH checks and member KYC appears as a visible note, translated with the existing dictionary.
- Family and KYC member navigation retain name plus relationship. KYC shows age as well.
- KYC section completion is computed from currently applicable questions and their valid answers, not navigation history. Complete tabs have a success treatment and a checkmark; the current tab remains identifiable separately. Unsaved answer and conditional routing rules remain unchanged.

Spouse gender is explicitly chosen in creation using GenderGroup, validated by personErrors and saved with the member. No default or automatic female override applies. This supersedes the original female-only exception. Existing KYC age/gender routing consumes the saved value without changing its questions or previously submitted answers.

KYC section navigation now uses full-width wrapping flex rows. Completed sections use solid primary teal and an accessible Answered label without visible completion ticks. Review uses a document icon. Active step selection retains aria-current and its outline. Completion still derives from valid currently applicable answers, not visits or saved-server state.

Review edit safety: every ReviewContent edit action has type=button. On the final review, only the explicit Submit button calls the creation handler; the form's implicit submit event is ignored. Earlier steps retain native form submission for Continue/Save member. Editing cover, applicant/sponsor or a member never dispatches a create request.
