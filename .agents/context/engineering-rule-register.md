# Engineering rule register

Reviewed 2026-10-20. This supersedes conflicting historical methodology claims. Public summaries do not substitute for licensed manuals.

## Primary references
- VDA: [VDA QMC overview](https://vda-qmc.de/wp-content/uploads/2023/06/VDA-QMC-White-Paper-FMEA-Englisch.pdf): methodology/structure/function/failure/AP concepts; not the full numerical table.
- ERR: [AIAG/VDA errata version 2, 2 June 2020](https://www.aiag.org/docs/default-source/training-and-resources/erratta-documents/aiag-vda-fmea-handbook-errata-june-2020.pdf), pp. 2–3: Man, Machine, Material, Environment examples and measurable verb/noun functions.
- BOS: [Bosch supplier requirements §2.1](https://assets.bosch.com/media/global/bosch_group/purchasing_and_logistics/information_for_business_partners/downloads/quality_docs/specific_regulations/supplier-quality-requirements.pdf): receiving-to-delivery coverage including logistics/outsourcing; customer requirement where applicable, not universal.
- FORD: [Ford PPAP supplement June 2026 §2.2.5](https://www.iatfglobaloversight.org/wp/wp-content/uploads/2026/06/Ford-Specifics-for-PPAP_June-2026-SCCAF-_-Final.pdf): customer supplement, not a prescription for this canvas layout. Verify applicable edition.
- ASQ: [flowchart guidance](https://asq.org/quality-resources/flowchart): general notation, not customer acceptance certification.

## Rule / source / implementation / status
| Rule | Classification/source | Product behavior/policy and evidence | Verification |
|---|---|---|---|
| Physical routing differs from analytical hierarchy | Methodology VDA/ERR | PFD graph references ProcessStep; PFMEA decomposes item → step → work element. `backend/src/modules/pfd/pfd-graph.ts:1` | Separate models; customer notation reviewed independently. |
| Explicit routing | Product policy; BOS coverage context | Revision pfdGraph/pfdGraphVersion, GET/PUT graph; saved edges independent of table order. `backend/src/modules/pfd/pfd.service.ts:1` | Migration/integration status in ACTIVE_STATE. |
| Activity classification | Product notation | WIP and rejection are annotations; mixed activity marks require review. Equipment names never determine the activity. Explicit operation plus inspection can be combined. | Shared parser/render/export tests. |
| Imported ambiguity | Product policy | Legacy sequences become unreviewed drafts; preserve IDs/data, never infer approval or missing branches. | Validate fixtures/exports. |
| Work-element categories | ERR pp.2–3 | Man/Machine/Material/Environment; preserve Method/customer extensions without silent relabelling. | Terminology verified; controls checked when changed. |
| Iterative drafts | Product policy | Allow incomplete drafts/revisiting activities; references, permissions, isolation, integer inputs and locks immediate; completeness at review/release. | Supersedes blanket sequential gating. |
| Failure coverage | Product review policy, VDA context | Multiple analyses/controls per operation. Flag missing chain/control/rating/coverage information; no invented failures for connectors. | Not a universal one-to-one mapping. |
| AP read-only | Configured profile; VDA concept | Backend ap-calculator.ts and browser apCalculator.ts retain numerical mappings and reject invalid/fractional inputs. | 1,000-combination parity tests; numerical handbook conformity PENDING licensed-reference verification. |
| Severity and ratings | Applicable profile/product behavior | Maximum linked effect where implemented. Detection improvements alone do not justify lower effect severity. | Generic descriptions are not official complete tables. |
| High AP review | Product policy; handbook wording pending | Document team review/action-or-justification under customer/company policy; Low AP is not risk acceptance. | No universal mandate for a new action from every High label. |
| CP synchronization | Product workflow | Canonical preview/resolve/apply; explicit baselines, per-field conflicts, preserved execution decisions, fingerprinted reasoned exclusions. `backend/src/modules/control-plan/control-plan-document.service.ts:1` | Legacy destructive writes retired; reverse propagation NOT implemented. |
| Action effectiveness | Product policy | Ordered states, evidence/effectiveness, protected linked drafts and independent verification. Initial and reassessed ratings remain separate. `backend/src/modules/action/action.service.ts:1` | Service and rolled-back workflow verification; no claim that task status proves effectiveness. |
| Revision controls | Product implementation | RevisionGuard protects endpoints where invoked; retain approval/reviewer protections. | Audit per endpoint; not proof of regulatory certification. |
| Packages | Product data model | Functions → work-element failure causes → controls; approval differs from completeness; reassess imported ratings. | Do not invent process modes/effects. |
| Trial identity | Explicit user requirement | Server publicHandle; immutable permanent global reservations without user/tenant cascade. `backend/src/modules/auth/public-handle.ts:1` | Collision/concurrency/exhaustion/session tests; migration preserves historical identity fields. |
| Exports | Product templates | Shared graph semantics across screen/SVG/PDF/XLSX; eight-column sheet remains supported. | Template is not universal standard/customer approval. |

## DFMEA / Control Plan sources and applicability
- AIAG CP-1: https://www.aiag.org/training-and-resources/manuals/details/CP-1 — Control Plan first edition, public overview; safe-launch development and software guidance. Full manual/form criteria not publicly exposed.
- AIAG/Plexus whitepaper: https://www.aiag.org/docs/default-source/quality-/aiag-plexus-apqp-white-paper-2023.pdf p9 — publicly indexed summary of volume-based frequency/containment, reaction ownership and safe-launch exit decisions. It does not establish a universal sampling value or duration.
- AIAG FAQ: https://www.aiag.org/docs/default-source/quality-/apqp_cp-faqs.pdf — warns the published change list is not a complete gap-analysis basis. Do not infer full conformity from these summaries.
- AIAG/VDA errata p1: boundary diagram OR structure tree; function tree/network and/or parameter diagram as applicable. Support these representations without universal stage gates.
- IATF November 2025 interpretations: https://www.iatfglobaloversight.org/wp/wp-content/uploads/2025/11/IATF-16949-SIs-Nov-2025.pdf SI11 p13: document alternatives when they exist, not invent an alternative for every primary control. SI24 pp22-23: automated-process summaries can reference the system controlling details. SI25 pp23-24: general header/operation/responsibility content; other Annex A sections unchanged. These are not the complete standard.
- Exact DFMEA S/O/D criteria and numerical AP tables: UNVERIFIED against an authorized complete independent reference. VDA overview contains no full table; public errata corrects a single MSR AP entry, not a complete DFMEA table. Registered AIAG FAQ video access does not establish the table contents. Preserve legacy-configured-unverified labeling and all-1000 parity checks without relabelling them conformity validation.
- Baseline: customer-neutral automotive. Customer overlays remain unconfigured until an actual applicable requirement is selected. Ford/Bosch examples never become universal rules.

## Maintenance
Update source status and smallest relevant skill/context/workflow whenever rules change. Distinguish verified source, customer addition, product policy, historical proposal and gap. Never reconstruct proprietary AP matrices from memory or silently rewrite approved records. Record actual migrations/verification/gaps in ACTIVE_STATE.

## Final integrity policies verified 2026-10-20
Reviewed failure-reference snapshots, complete paired reassessment, protected administrative history and approved-baseline activation are product integrity policies, not reconstructed handbook requirements. Backend 154 tests/20 suites and isolated real-database rollback verification pass. Full browser segregated workflow, 30/105-row revision forks, 320px layout and independently rendered 6/37-page PDF checks passed. Exact numerical criteria/AP independent-reference gate remains pending. See docs/specs/controlled-engineering-delivery.md for evidence and limits.
