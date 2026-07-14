---
name: "PLM, ERP, and MES Data Integrations"
description: "Governs BOM imports from PLM, routing syncs from ERP, characteristics alignment, and MES closed-loop defect feedbacks."
---

# PLM, ERP, and MES Data Integrations Skill

This skill governs data synchronization with external PLM (Siemens Teamcenter, PTC Windchill), ERP (SAP, Oracle), and MES systems.

## 1. Integration Actions & Capability Matrix
1. **PLM Integration**:
   - *Inbound*: Ingest Bill of Materials (BOM) hierarchy, design specs, and tolerances to seed the starting DFMEA tree.
   - *Outbound*: Export completed FMEA analysis sheets back to PLM.
   - *Bidirectional*: Synchronize Special/Critical characteristics using webhooks.
2. **ERP Integration**:
   - *Inbound*: Sync parts master list and operational routings to automatically generate sequence nodes in the PFD.
   - *Outbound*: Export manufacturing control limits.
3. **MES Integration (Closed-Loop Quality)**:
   - *Outbound*: Export SPC control limits, sample sizes, and frequencies (via REST or OPC-UA) to guide line operators.
   - *Inbound*: Defect rates webhook. Receives quality statistical values. If defect statistics indicate occurrence rates higher than current Occurrence (O) ratings, the system flags the row with a validation warning.

## 2. Integrity Rules
- **Webhook Authentication**: Inbound webhook requests must supply tenant verification tokens in headers.
- **Outbound Webhook Signatures**: Outbound webhook requests carry HMAC-SHA256 signatures of the payload in the `X-FMEA-Signature` header for verify-headers.
- **Webhook Event Types**: Support dispatching events:
  - `fmea.revision.approved`
  - `fmea.row.created`
  - `fmea.row.updated`
  - `action.created`
  - `action.closed`
  - `control_plan.updated`
- **Tenant Scope**: Integrations must validate the tenant credentials before mapping data to FMEA tables.

## 3. Key Database Tables
- `project` / `document`: Anchor point for imports.
- `process_step` / `characteristic`: Target structures for routing and characteristics.
- `trace_link`: Maps ERP/PLM identifiers with `link_type = 'integration_mapping'`.

## 4. API Endpoints
- `POST /api/v1/integrations/plm/import-bom` — Trigger BOM import.
- `POST /api/v1/integrations/erp/sync-routing` — Pull ERP routings to seed PFD steps.
- `POST /api/v1/integrations/webhooks` — Endpoint for receiving external webhooks (MES defect rates).

## 5. Related Skills
- `pfd-pfmea-linking`: ERP routing maps directly to PFD steps.
- `fmea-authoring`: Seeds the initial System/Subsystem structure from PLM.
- `corrective-actions`: MES occurrence data can trigger corrective action reviews.
