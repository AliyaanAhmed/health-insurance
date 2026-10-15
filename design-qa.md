# InsureAI Health design QA

final result: passed

## Sources and rendered evidence

- Landing reference: `C:/Users/Hp/Downloads/LandingPage-Reference.png`, 1536×1024 pixels.
- Family reference: `C:/Users/Hp/Downloads/Form-Reference.png`, 1536×1024 pixels.
- Governing visual specification: user-supplied `InsureAI-Health-Theme-and-Design.md`, version 2.0. Its compact illustration, responsive, accessibility and no-default-selection requirements take precedence over exaggerated/sample details in the mockups.
- Browser: fresh headless Google Chrome, explicitly authorized after the in-app browser connection was unavailable.
- Desktop CSS viewport: 1536×1024, device scale factor 1. Source and viewport captures are compared at equal pixel dimensions, without stretching.
- Full-view evidence: `.qa/landing-comparison.png`, `.qa/family-comparison.png`. Each contains the source on the left and the rendered implementation on the right.
- Focused evidence: `.qa/landing-detail-comparison.png`, `.qa/family-detail-comparison.png`. Choice rows and person inputs were inspected beyond the full-view comparison.
- Implementation captures: `.qa/landing-desktop.png`, `.qa/family-desktop-viewport.png`, `.qa/family-desktop.png`, `.qa/country-picker.png`.
- Responsive evidence: `.qa/landing-mobile.png`, `.qa/cover-mobile.png`, `.qa/family-mobile.png`, `.qa/landing-arabic-mobile.png` at 390×844; additional 320×740 overflow check.
- State matched for family: applicant and spouse Complete, child Editing with name/DOB/gender populated. Synthetic names and the current derived ages differ from the mockup. The comparison excludes transient notifications and keyboard skip-link focus. The full-page capture retains content below the viewport where the summary naturally requires scrolling.

## Findings and comparison history

1. **P2, resolved — introductory spacing.** The first family capture showed surplus space between progress and the heading caused by automatic grid-row distribution. The navigation row now uses `min-content`, keeping the intro and editor together. Final evidence: `.qa/family-comparison.png`.
2. **P2, resolved — notification overlap.** The initial bottom notification overlapped Save member. Notifications now sit below the header, leave form actions accessible, and support explicit dismissal/Undo. Final core actions are fully visible in the family viewport and mobile captures.
3. **P2, resolved — small portrait crops and role mismatch.** Landing people now have clearer torso/face crops. Gender-choice artwork for parents uses the supplied older parent portraits; child/adult imagery follows age and relationship without choosing a gender value. Final evidence: landing detail and mobile family captures.
4. **P2, resolved — capture timing and hidden skip-link artifacts.** Early captures caught the entrance animation mid-opacity. Capture now waits for the settled rendered state; automated contrast checks wait for fonts and finite animations. The keyboard-only skip link is clipped when unfocused, eliminating offscreen full-page capture artifacts. Settled comparison evidence was reopened after fixes.
5. **Resolved functional issue — coverage radio hit area.** Country/coverage keyboard checks exposed an image intercepting the visually hidden coverage radio. Native radios now have full-tile hit areas and containing-tile focus rings. The confirmation/cancel tests pass.
6. **Resolved development issue — stale hot refresh.** Vite was restarted after dependency changes. React is deduplicated, dependencies are pre-optimized together, and file watching waits for writes to complete. The final fresh-browser capture has no runtime, console, HTTP or request failures.

No actionable P0/P1/P2 issue remains in the implemented local workflow.

## Required fidelity surfaces

| Surface | Review result |
|---|---|
| Fonts/typography | Locally bundled Manrope, Inter and Noto Sans Arabic. Hierarchy, wrapping, input labels and RTL text inspected. Sizes follow the written theme guide rather than enlarging every control to match the generated mockup. |
| Layout/spacing | Split hero, three full-row navigation choices, horizontal stepper, one active member editor and persistent desktop summary follow the intended structure. Family artwork is deliberately compact per the guide. Narrow layouts keep content in document flow with an expandable summary and accessible bottom actions. |
| Colors/tokens | Deep teal actions/headings, pale mint context, white editors and clear input boundaries match the supplied token system. Settled-state axe AA checks passed; errors and statuses have text/icons as well as color. |
| Image fidelity/quality | Actual supplied PNG subjects are used through transparent WebP derivatives, retaining originals. No screenshot backgrounds or CSS-drawn people. The standalone photograph has a different crop from the generated mockup; the final crop preserves the care interaction. All generated WebP artwork is approximately 630 KB total. |
| Copy/content | Requested three entry labels/helpers are preserved. Sponsor exclusion, optional member stage, explicit gender, salary boundary and full review are implemented. How it works replaces the unconnected advisor action. No invented premiums, plans or eligibility claims. |

## Runtime verification

- `npm run build`: passed, TypeScript + production bundle.
- `npm run lint`: passed, no source lint warnings/errors.
- `npm run format:check`: passed.
- `npx playwright test`: **9 passed** in the final run, covering all six visa/coverage paths plus validation/recovery, keyboard/accessibility, mobile/RTL/reduced motion.
- Accessibility: axe `wcag2a`, `wcag2aa`, `wcag21aa` checks passed on settled landing, cover, country dialog and active family editor.
- Keyboard skip link preserves the SPA hash route; validation focuses the first invalid field; Escape closes the country dialog and restores focus.
- Required-field/future-date/email/mobile validation; searchable-country empty state; back preservation; explicit spouse gender; parent support; one-spouse limit; removal/Undo; cancelled and confirmed coverage changes exercised.
- OTP wrong-code handling, paste/autofill of six digits, busy completion and local result list/detail exercised. No app API/cloud-flow writes or persistent browser data were observed.
- `scripts/capture-ui.mjs`: final result `errors: []`, `consoleErrors: []`, `failedRequests: []`, `httpErrors: []`, `overflow: false`.
- The separate skill Python static auditor could not run because Python is not installed. `premium-audit.json` records this availability limitation and does not claim that audit passed.

## Accepted differences and remaining integration work

- The supplied theme guide requires smaller family art and a 320–400px summary; these intentionally differ from the oversized form mockup.
- No choice is preselected on the landing page. Hover/focus/selected states exist; a mockup's highlighted family tile is not a stored default.
- The InsureAI text identity uses a library product icon pending an approved standalone logo asset. The original generated reference logos are not copied.
- Advisor contact is not connected; the useful How it works dialog is implemented instead.
- Exactly AED 4,000 remains marked for confirmation, as directed by the user.
- Real SMS, Dataverse, insurer rules, remote draft persistence and legal/consent copy remain for integration. Completion clearly identifies the local preview.
- Real-device software-keyboard behavior, non-Chromium browser engines and native-language content approval remain future release checks; desktop mobile emulation does not prove those environments.

## Implementation checklist

- [x] Reference composition and focused controls compared with actual browser output.
- [x] Supplied artwork mapped, optimized and placed without stretching people.
- [x] Guided inquiry works through every requested coverage/visa combination.
- [x] Editing, validation, recovery and mobile/RTL states exercised.
- [x] Settled browser capture has no console/runtime/resource errors.
- [x] Local dev server remains running at `http://localhost:5173/`.
