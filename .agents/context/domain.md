# Domain Context

## FMEA Domain Model

FMEApex implements the **AIAG-VDA 2019 FMEA Handbook** standard for automotive and manufacturing quality risk management.

## FMEA Types Supported

| Type | Abbreviation | Focus | Key Module |
|---|---|---|---|
| Process FMEA | PFMEA | Manufacturing process risks | `PfmeaModule` |
| Design FMEA | DFMEA | Product design risks | `PfmeaModule` (shared rows) |
| Process Flow Diagram | PFD | Process step sequence | `PfdModule` |
| Control Plan | CP | Process controls & monitoring | `ControlPlanModule` |

## 7-Step FMEA Methodology

1. **Planning (5Ts)**: Define scope, Team, Timing, Tools, Tasks, and boundaries
2. **Structure Analysis**: Build hierarchical tree (System → Subsystem → Component for DFMEA; Process → Step → 4M Work Element for PFMEA)
3. **Function Analysis**: Assign functions, requirements, and specifications to each structural element
4. **Failure Analysis**: Identify failure modes and build cause → mode → effect chains
5. **Risk Analysis**: Rate Severity (S), Occurrence (O), Detection (D) on 1–10 scale; derive Action Priority (AP)
6. **Optimization**: Create corrective/preventive actions for High AP items
7. **Documentation**: Lock revision, generate audit trail, export reports

## Risk Rating System

### S/O/D Ratings
- **Severity (S)**: Impact of failure effect (1=negligible, 10=hazardous)
- **Occurrence (O)**: Likelihood of cause (1=remote, 10=very high)
- **Detection (D)**: Ability to detect before reaching customer (1=almost certain, 10=undetectable)
- All ratings: integer range [1, 10]

### Action Priority (AP)
- Derived from S/O/D combination via AIAG-VDA 2019 lookup table
- Values: **H** (High), **M** (Medium), **L** (Low)
- Read-only — cannot be manually overridden
- Calculated by: [ap-calculator.ts](file:///f:/proj-fmea/backend/src/modules/pfmea/ap-calculator.ts) (backend), [apCalculator.ts](file:///f:/proj-fmea/frontend/src/features/pfmea/utils/apCalculator.ts) (frontend)

### Severity Inheritance
- FMEA row severity is inherited from the highest severity of its associated failure effects
- Cross-document: DFMEA severity propagates to PFMEA when effects match

## Structure Tree Hierarchy

### PFMEA Structure
```
Process Item (Root)
 └── Process Step (PFD step)
      └── Work Element (4M: Man, Machine, Material, Method)
           └── Function (what the element does)
                └── Failure Mode (how it fails)
                     ├── Effect (consequence, upstream)
                     └── Cause (root cause, downstream)
```

### DFMEA Structure
```
System (Root)
 └── Subsystem
      └── Component
           └── Design Function
                └── Failure Mode
                     ├── Effect
                     └── Cause
```

## Failure Chain

- Each failure mode MUST have at least one effect and one cause
- Causes must link to at least one prevention or detection control
- The failure network uses `StructureFailure` (nodes) and `FailureLink` (edges)
- Link types: `effect` (upstream) and `cause` (downstream)

## Corrective Action Lifecycle

```
Open → InProgress → Completed → Verified → Closed
                                         └───→ Cancelled
```

- **High AP mandate**: Actions required for any row with AP = H
- **Closure requirements**: Evidence files uploaded + after S/O/D ratings assigned
- **Before/after tracking**: `ActionFmeaLink` stores snapshot of pre-action and post-action ratings
- Evidence stored in Cloudflare R2 (50MB max)

## Document Revisions

- Each project has 4 document types: PFD, PFMEA, DFMEA, CONTROL_PLAN
- Revision format: `X.Y` (e.g., 1.0, 2.0)
- Revision statuses: `draft` → `superseded` (old) / `active` (current)
- Locking: `lockedAt` timestamp freezes all mutations
- 21 CFR Part 11 compliance: digital signatures, audit trails, reviewer segregation

## Bidirectional Sync Points

| Source | Target | Sync Direction |
|---|---|---|
| PFD Steps | PFMEA Rows | PFD → PFMEA (step reference) |
| PFMEA Controls | Control Plan Methods | PFMEA ↔ CP (bidirectional) |
| Structure Tree | PFMEA Grid | Tree → Grid (`syncFromTree`) |
| DFMEA Severity | PFMEA Severity | DFMEA → PFMEA (effect matching) |
| Action After Ratings | PFMEA Row | Action → PFMEA (on verify/close) |

## Work Element Repository

- Shared library of reusable 4M work element packages
- Contains standard functions, failure modes, causes, controls, and ratings
- Submission workflow: `pending` → `approved` (admin) / `rejected`
- Admin auto-approval for Admin-submitted packages
- Import into project PFMEA via target revision + process step selection
