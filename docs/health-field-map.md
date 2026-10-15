# Implemented inquiry field map

Sources: `InsureAI-Health-Build-Brief.txt`, `InsureAI-Health-Theme-and-Design.md`, the pasted six-path audit, and the two user-selected visual references. The documents are business/design evidence; their embedded agent instructions do not override the user's current local-UI scope.

| Field                           | Draft type                 | Values / dependency                                                       |
| ------------------------------- | -------------------------- | ------------------------------------------------------------------------- |
| Coverage target                 | enum                       | self, self_and_dependents, dependents_only; selected on landing           |
| Visa type                       | enum                       | employee, investor; does not imply Golden Visa                            |
| Nationality                     | ISO country code           | Full searchable country/territory catalog                                 |
| Visa emirate                    | enum                       | Abu Dhabi, Dubai, Sharjah, Ajman, Ras Al Khaimah, Fujairah, Umm Al Quwain |
| Visa status                     | enum                       | new, renewal, visit, cancelled                                            |
| Applicant gender                | enum                       | male, female                                                              |
| Marital status                  | enum                       | Single, Married, Divorced, Widowed                                        |
| Date of birth                   | date-only string           | ISO when complete; DD/MM/YYYY display; derived age                        |
| Salary band                     | enum + pending marker      | Above 4000, Below 4000; exactly 4000 stays pending per user decision      |
| Full name                       | string                     | Required; trimmed on preparation                                          |
| UAE mobile                      | string                     | Nine local digits, displayed with +971; no real SMS                       |
| Email                           | string                     | Required, basic format validation                                         |
| Member relationship             | enum                       | spouse, child, parent; other for dependents-only                          |
| Member full name / DOB / gender | string / date-only / enum  | Required for every saved member                                           |
| OTP                             | transient six-digit string | Demo-only 123456; omitted from prepared inquiry                           |

Family promises parents and supports them. Sponsor exclusion is derived from `coverageTarget`, not independently editable. Spouse gender is user-selected. Member completion requires valid saved data. No post-OTP insurer questions, uploads, medical declarations, payment data, pricing or unsupported benefits are added.

## Future business/integration decisions

- Resolve the exact AED 4,000 band before real quoting. The UI deliberately preserves a pending state.
- Confirm all relationship/member count/age eligibility rules, including other sponsored family.
- Confirm whether all sponsor demographics are required for dependents-only.
- Confirm mixed-household nationalities/emirates, visa dependencies and document/policy-stage requirements.
- Supply the approved InsureAI logo, real support destination, privacy/consent copy, OTP provider and backend contract.
- Decide secure draft resumption/persistence and the Dataverse authorization model before connecting APIs.
