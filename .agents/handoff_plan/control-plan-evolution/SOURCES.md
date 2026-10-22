# Evidence and source register

Research checked2026-10-22; handoff packaged2026-10-23. Rules must identify source edition/section/applicability/status. This register is not a substitute for authorized complete manuals. Do not copy complete copyrighted publications into shipped assets.

| ID | Source / inspected section | Supported claim and limits |
|---|---|---|
| S01 | [AIAG CP-1 official overview](https://www.aiag.org/training-and-resources/manuals/details/CP-1), Overview | Confirms first-edition Control Plan guidance includes Safe Launch, automated manufacturing and software management topics. Public overview does not expose complete form/requiredness criteria. Licence access remains unverified. |
| S02 | [IATF official SI index](https://www.iatfglobaloversight.org/iatf-169492016/iatf-169492016-sis/), English entry | Links November2025 interpretations; use the applicable published language/edition. Check for newer editions at implementation; do not freeze a timeless “latest” claim. |
| S03 | [IATF November2025 SI collection](https://www.iatfglobaloversight.org/wp/wp-content/uploads/2025/11/IATF-16949-SIs-Nov-2025.pdf), SI11 p13; SI24 pp22–23; SI25 pp23–24 | SI11 distinguishes existing alternatives from a universal requirement to invent backups. SI24 permits automated-process summaries with direct managed-system references. SI25 revises general CP identification and retains other AnnexA sections. These summaries do not establish every CP field/rule. Apply only in relevant scope. |
| S04 | [Official customer-specific requirements index](https://www.iatfglobaloversight.org/oem-requirements/customer-specific-requirements/) | Index listed Ford effective June15,2026 and GM effective October30,2025 during research. No OEM profile is selected or fully verified by this handoff. A project customer label alone is insufficient applicability. |
| S05 | [AIAG APQP/CP FAQ URL](https://www.aiag.org/docs/default-source/quality-/apqp_cp-faqs.pdf) | Tool access failed in this research. Local engineering register preserves earlier public-summary limitations; no fresh FAQ content verification or full-gap-analysis claim made here. |
| S06 | [PDFKit text documentation](https://pdfkit.org/docs/text.html), Text measurements/Fonts | Public APIs support measuring wrapped text and embedded fonts; not proof of all Unicode/script glyphs. Bundle/test actual licensed font files. |
| S07 | [PDFKit tables](https://pdfkit.org/docs/table.html), column/row spans and widths | Provides building blocks for compact CP output. Independent pagination/long-text/continuation tests remain necessary. |
| S08 | [PDFKit getting started](https://pdfkit.org/docs/getting_started.html), Node installation/output | Supports server-side PDF generation. No dependency was installed in planning; pin and test a Node22-compatible implementation version in T05. |
| S09 | R/Control_Plan_Consolidated_Development_Plan.md | User-supplied requirements and proposed architecture, hashed in baseline.json. Its statements about source code/manual evidence were independently checked where possible; not themselves proof of code behavior or conformity. |
| S10 | .agents/context/engineering-rule-register.md; .agents/AGENTS.md; scoped READMEs | Local policy and prior-reference limitations. Source code overrides stale factual descriptions; user requirements control product choices. See AUDIT E18 for actual stale docs. |

## Proposed rule provenance

- Tenant isolation/revision locks/guest restrictions: existing security/product contracts, preserve and test.
- One operation-wise CP with multiple controls, reviewed imports, exact source navigation and selected extracts: user requirements CP-F01–F16.
- Typed execution modes, content-bound review, source fence, private approval package,10minute intent and50MiB package cap: explicit software/product design decisions, not claimed handbook mandates.
- Approver segregation and independent action verification: existing product policies, not certification claims.
- Customer-neutral baseline: no customer rules inferred. Add an immutable overlay only after explicit applicability and authorized reference verification.
- Full CP-1/AIAG-VDA/IATF conformity, OEM acceptance and measurement/sampling criteria: unverified/unconfigured where complete evidence is unavailable. The application profile must say so.

No arbitrary templates, sample values or marketing claims are evidence of engineering correctness. Exact source hashes/paths and actual baseline test outputs are under evidence/.
