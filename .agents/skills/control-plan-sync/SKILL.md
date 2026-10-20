---
name: "Control Plan Generation & Traceability"
description: "Maintain controlled phase plans, explicit source baselines, reviewed conflict resolution, coverage exclusions and immutable engineering revisions."
---
# Controlled Control Plan authoring

Read the engineering rule register and `backend/src/modules/control-plan/control-plan-document.ts:1` before changing methodology or API shape.

- Canonical GET/PUT `/api/v1/revisions/:id/control-plan-document`; PUT requires expectedVersion/document. POST suffixes `/sync-preview`, `/sync-apply`, `/fork` implement reviewed changes and independent phase revision histories. Old row reads remain; old row mutations/destructive generators are retired with explicit errors.
- Select same-project source revisions. Preview candidates; deliberate mapping is necessary when old PFMEA data does not associate a specific control with one characteristic/requirement. Never choose the first arbitrarily.
- Apply only explicit decisions. Each conflicting source field requires source/current resolution. Preserve manual lines and execution decisions. Removed sources are review findings, not automatic deletion. Exclusions need a reason and current source fingerprint; invalidate them when the source changes.
- Selected-source coverage, approved baselines or documented exceptions, and completeness are release-time PRODUCT POLICIES. Allow incomplete drafts. Do not mislabel these application gates as universal handbook requirements.
- Capture full product/process characteristics, actual specification/unit, equipment, evaluation technique, sampling/volume/containment basis, reaction/owner or controlled procedure/system reference. Never generate sampling, frequency, reaction, operator or inspection defaults.
- Protect tenant/project/trial/document type, revision state and expected version inside mutation transactions; preserve frozen headers and prior phase histories. Use cp permissions, not pfmea authority.
- Automatic reverse propagation is NOT implemented. No database listener/BullMQ reverse-sync claim.
- Native XLSX/JSON preserve full model and provenance; import previews must expose changes and never silently ignore edited worksheets. All-row exports use the shared engineering adapter.

Baseline AIAG Control Plan 1st edition plus applicable customer overlay. Source-backed requirements and verification limits are in `.agents/context/engineering-rule-register.md`; no certification claim without full authorized verification.
