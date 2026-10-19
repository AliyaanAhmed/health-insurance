# InsureAI Health

React 19, TypeScript and Vite SPA for the separate **Health Insurance SPA** Power Pages site.

## Development

```sh
npm install
npm run dev -- --host 0.0.0.0
```

Open `http://localhost:5173`. Live Dataverse calls require the hosted Power Pages origin and session; localhost shows a connection error rather than fabricated prices or records.

## Current experience

- Landing with three coverage choices and healthcare hero.
- Guided Cover → Your/Sponsor details → optional Family → Review flow; no OTP, documents or left stepper.
- Person icons, custom calendar/dropdowns, English/Arabic, RTL and reduced motion.
- **Your quote so far** shows answered-field editing and one dynamically calculated AED reference premium.
- **Create a Request** finds/creates the contact, saves the quote and customer JSON, then opens the saved summary modal over **My Requests**.
- My Requests retrieves Health Insurance quotes from Dataverse; no sample records are injected into the running application.
- Refresh/coverage changes clear unsaved answers. Saved Dataverse requests persist.
- Exactly AED 4,000 salary remains pending business confirmation. Salary stays AED; premiums use AED without conversion, as confirmed.

## Integration

See [Health Dataverse Integration](docs/health-dataverse-integration.md) for endpoints, live JSON model, calculation, rounding, settings and access limitations. The supplied [table/API guide](DATAVERSE-TABLES-AND-WEB-API.md) describes original Motor patterns; the Health integration document records this implementation.

The required API enable/field settings in `.powerpages-site/site-settings` were uploaded with the app on October 16, 2026. The user confirmed that this internal POC will retain its existing anonymous web-role permissions; no permission changes or extra authentication flow are required. The account menu remains a preview identity. Live write verification has not been performed.

## Main files

| File                                         | Responsibility                                  |
| -------------------------------------------- | ----------------------------------------------- |
| `src/health.ts`                              | Form model, options, age helpers and validation |
| `src/healthPricing.ts`                       | Live customer JSON, rate matching and totals    |
| `src/powerPagesApi.ts`                       | Token, catalog, contact and quote operations    |
| `src/useHealthCatalog.ts`                    | Catalog loading and derived JSON                |
| `src/Inquiry.tsx`                            | Guided form and family editing                  |
| `src/Summary.tsx`, `src/PremiumRange.tsx`    | Compact answers and live premium                |
| `src/InquiryList.tsx`, `src/InquiryView.tsx` | Request cards and summary modal                 |
| `src/PageLoader.tsx`                         | Animated operation loader                       |
| `src/SimpleExperience.css`                   | Current customer UI and integration states      |

The [Technical and Design Guide](TECHNICAL-AND-DESIGN-GUIDE.md) records packages, fonts, sizes and theme. The latest integration sections in `DESIGN.md` and `UX-CONTRACT.md` supersede earlier fixture behavior. Dormant upload utilities and sample fixtures remain outside the active flow.

## Build and release

```sh
npm run build
pac pages upload-code-site --rootPath . --siteName "Health Insurance SPA"
```

Website ID: `d8f4dd5d-9fd0-4c5a-9e92-640da9e2dd5c`; environment: `https://insureai.crm6.dynamics.com`. The CLI upload processes changed metadata in `.powerpages-site`, including the ten Web API settings in this release. Do not overwrite current configuration with a stale full export or change Motor Insurance. Deployment is a separate release action.

Legacy browser tests target superseded flows and require updates before reuse. No browser capture cycle or live test records were used during this integration.

Latest release: October 16, 2026 ? production build passed; Health Insurance SPA upload succeeded in Insure AI. Includes AED premium display, Dataverse integration and all ten API settings. No live contact/quote submission was performed.
