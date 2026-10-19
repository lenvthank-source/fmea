# Domain context

Canonical source/status: [engineering rule register](engineering-rule-register.md). Source defines implemented behavior; design documents do not prove implementation or certification.

## Documents
DFMEA analyzes design functions/failures across system/subsystem/component context. PFMEA analyzes process functions and cause → mode → effect relationships across item/step/work element. PFD stores physical routing and branches, separate from analytical hierarchy. Control plans record characteristics, methods, sampling, frequency, and reaction plans with traceable sources.

## Seven activities and drafts
Planning/preparation → structure → functions → failures → risk → optimization → results documentation. Allow revisiting and incomplete drafts. Validate references, permissions, isolation, integer ratings and locks immediately; completeness before review/release. Documentation is broader than approval/locking.

## Work elements/packages
AIAG/VDA errata examples use Man/Machine/Material/Environment. Preserve Method and other customer/company extensions. Packages contain functions and work-element failure causes/controls; imported ratings require context reassessment. Approval differs from completeness; never invent process modes/effects in package diagrams.

## Risk
Use integer S/O/D 1–10 and applicable criteria. Effective severity uses maximum linked effects where aggregation implemented. AP is calculated H/M/L. Current browser/backend profiles agree across 1,000 combinations; numerical handbook conformity remains pending independent verification. Low AP/completed tasks do not establish acceptable risk. Detection changes alone do not lower severity.

## Actual synchronization and protection
Retain cross-document operation references, multiple analyses/controls per operation, revision locks and tenant/reviewer protections. CP supports explicit PFMEA/PFD sync; ordinary CP PATCH does not update PFMEA. Re-sync can recreate mapped rows: inspect changes. Audit/approval software features alone do not establish regulatory certification.

## Actions/PFD status
Actions support owners, due dates, notes, evidence and after ratings. Full evidence/state-transition/linked-revision enforcement is not established by current ActionService. PFD graph migration and final integration status are tracked in ACTIVE_STATE.
