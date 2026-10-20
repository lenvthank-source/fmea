# Workflow: iterative design and process FMEA

Authority: [engineering rule register](../../.agents/context/engineering-rule-register.md).

DFMEA uses a dedicated revision-owned model, not manufacturing operations or equipment strings. GET/PUT `/api/v1/revisions/:id/dfmea-document`; POST `/fork` creates a new draft without changing the prior approved baseline. PFMEA continues its explicit `/pfmea-rows` APIs.

1. Define scope, boundary, team, milestones and applicable criteria. Record actual parameter context; diagrams show only authored information.
2. Build stable system/subsystem/component identities and interfaces. Move/delete with referential checks. A boundary diagram or structure tree can establish the boundary; parameter representations apply as appropriate, not as a universal stage prerequisite.
3. Add functions, measurable requirements and function relationships.
4. Model focus functions, modes, higher-level effects and lower-level causes explicitly. Assign controls and O/D at each cause, severity from linked effects.
5. Evaluate integer ratings. AP is calculated read-only from the identified configured profile; its numerical handbook conformity remains independently unverified. High AP requires documented team review/action-or-justification under the selected policy.
6. Track actions, ownership, dates, evidence and effectiveness. Initial ratings remain intact; verified reassessment is separate. Detection improvement alone never lowers effect severity.
7. Document results, limitations, communication and reviewed downstream characteristic mappings or justified exclusions. Readiness links lead to affected records/activities. Submit separately from engineering approval.

Revisit activities freely; incomplete drafts are valid. Enforce permissions, valid relationships, locks and expected versions immediately. Legacy bags are preserved read-only and may be mapped only through explicit user-selected chains; source IDs and the audit actor are retained. No silent splitting or generated example failures.

Exports include every analysis, initial and reassessed information, actions and provenance. Native complete-model imports are structurally validated and previewed. Edited narrative DFMEA worksheets cannot safely reconstruct many-to-many relationships and are rejected with a mapping explanation instead of ignoring edits or guessing.
