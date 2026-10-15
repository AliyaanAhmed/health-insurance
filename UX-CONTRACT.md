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

## Demo verification and completion

- Review opens a clearly labelled demo six-digit OTP dialog. Code `123456`; no SMS and no network writes. Leading zeroes remain strings, paste/autoadvance/backspace/arrows work, resend has a countdown.
- Wrong/incomplete codes show inline errors. The brief pending state prevents duplicate finish actions. Raw OTP is not copied into the prepared inquiry.
- Completion says the inquiry preview is ready and explicitly says nothing was submitted. My inquiries shows session-only prepared records, actual entered data and a read-only detail view; no fabricated plans/premiums.

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
