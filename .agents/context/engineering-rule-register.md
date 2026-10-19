# Engineering rule register

Reviewed 2026-10-19. This supersedes conflicting historical methodology claims. Public summaries do not substitute for licensed manuals.

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
| CP synchronization | Current implementation | Explicit PFMEA→CP and PFD→CP sync; CP PATCH updates CP only. `backend/src/modules/control-plan/control-plan-row.service.ts:143` | Automatic reverse/BullMQ listeners NOT implemented. Re-sync can recreate mapped rows; inspect changes. |
| Action effectiveness | Product policy/implementation gap | Review evidence and justify after ratings; ActionService syncs after ratings supplied with verified/closed updates. | Complete transition/evidence/linked-revision enforcement NOT established by current service. |
| Revision controls | Product implementation | RevisionGuard protects endpoints where invoked; retain approval/reviewer protections. | Audit per endpoint; not proof of regulatory certification. |
| Packages | Product data model | Functions → work-element failure causes → controls; approval differs from completeness; reassess imported ratings. | Do not invent process modes/effects. |
| Trial identity | Explicit user requirement | Server publicHandle; immutable permanent global reservations without user/tenant cascade. `backend/src/modules/auth/public-handle.ts:1` | Collision/concurrency/exhaustion/session tests; migration preserves historical identity fields. |
| Exports | Product templates | Shared graph semantics across screen/SVG/PDF/XLSX; eight-column sheet remains supported. | Template is not universal standard/customer approval. |

## Maintenance
Update source status and smallest relevant skill/context/workflow whenever rules change. Distinguish verified source, customer addition, product policy, historical proposal and gap. Never reconstruct proprietary AP matrices from memory or silently rewrite approved records. Record actual migrations/verification/gaps in ACTIVE_STATE.
