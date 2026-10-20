# Domain algorithms and configured risk profile

See [rule register](../context/engineering-rule-register.md). Implementation parity is not independent handbook conformity.

## Ratings/AP
S/O/D must be finite integers 1–10; missing/invalid/fractional values return no AP, never truncate. Use applicable customer/process/design criteria rather than invented generic rating anchors. Backend `backend/src/modules/pfmea/ap-calculator.ts:1` and browser `frontend/src/features/pfmea/utils/apCalculator.ts:1` preserve existing numerical mappings. AP is calculated/read-only. Tests execute both implementations over all 1,000 combinations. Numerical handbook conformity remains pending an independently verified licensed reference. Do not duplicate threshold summaries from memory.

## Severity/effectiveness
Use maximum linked effect severity where implemented. Better detection/prevention alone does not justify lower effect severity. High priority requires documented team decisions under applicable policy. Low AP and completed actions do not establish acceptable risk or effectiveness.

## Drafts/review
Allow incomplete drafts and revisiting seven activities. Enforce isolation, permissions, references, integer inputs and locks immediately. Before review/release report missing structure, functions, failure chains, controls, ratings, coverage and action/effectiveness information. No placeholder failures for graphical connectors.

## Physical routing
PFD stores explicit nodes/edges; PFMEA structure is analytical decomposition. Position, table numbering, equipment lists and variation sources must not silently define routes. Preserve operation identity and deliberate rework loops.

## Known gaps
CP edits do not automatically propagate backwards. Canonical CP uses reviewed source changes, explicit conflicts and fingerprinted exclusions. ActionService now enforces ordered transitions, evidence and linked-revision safeguards; reassessment is separate from baseline. Exact full handbook numerical AP validation and production RLS remain unverified. Consult actual service tests and the rule register.
