---
name: "PFD-PFMEA Linking & Gap Analysis"
description: "Maintain explicit manufacturing routing, PFD/PFMEA operation traceability, graph review and meaningful coverage without inventing topology or failures."
---
# PFD and PFMEA linking

PFD is physical routing; PFMEA structure is analytical decomposition. Preserve existing operation IDs, numbering, linkedPfdStepId references and downstream analysis. Multiple analyses may reference one operation across document revisions.

- Store routes explicitly in revision `pfdGraph` with `pfdGraphVersion`; nodes reference process steps plus separate boundary/connector/disposition nodes.
- `GET/PUT /api/v1/revisions/:id/pfd-graph` reads/writes the graph with version checks. Existing `/pfd-steps`, batch, import, patch/delete and reorder endpoints remain separate.
- Table order, equipment names, variation notes and layout positions must not invent edges.
- Support branches, parallel paths and deliberate rework loops; distinguish inspection from result decisions and hold/rework/scrap/return outcomes.
- Default legacy sequences to unreviewed drafts. Do not infer missing branches, approval or customer acceptance.
- Use documented manufacturing notation/legend. No chemical-equipment symbol guessing from names.
- Validate graph endpoints, revision membership, permissions, isolation and locks immediately; check topology completeness for reviewed/released graphs.
- Coverage concerns manufacturing activities; graphical connectors/boundaries require no invented FMEA row. Record justified exclusions.
- Screen and SVG/PDF/XLSX must share graph semantics, readable labels and operation identity.

Source: `backend/src/modules/pfd/pfd.controller.ts:1`, `pfd-graph.ts:1`. The former claims about React Flow, pfd_step coordinates, automatic background consistency engines and generic `/pfd` endpoints were historical proposals, not the current contract.

## Rule authority
Read `.agents/context/engineering-rule-register.md` for source applicability and verification status. Separate official requirements, customer additions, product policy and implementation gaps. Do not invent compliance guarantees or rewrite approved records.
