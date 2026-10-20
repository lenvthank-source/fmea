---
name: "PFD-PFMEA Linking & Gap Analysis"
description: "Maintain explicit manufacturing routing, PFD/PFMEA operation traceability, graph review and meaningful coverage without inventing topology or failures."
---
# PFD and PFMEA linking

PFD is physical routing; PFMEA structure is analytical decomposition. Preserve existing operation IDs, numbering, linkedPfdStepId references and downstream analysis. Multiple analyses may reference one operation across document revisions.

- Store routes explicitly in revision `pfdGraph` with `pfdGraphVersion`; support readable v1 and v2 nodes/ports/route points/junctions/display/direction. Nodes reference process steps plus separate boundary/connector/disposition and non-routing annotation nodes.
- `GET/PUT /api/v1/revisions/:id/pfd-graph` reads/writes the graph with version checks. Existing `/pfd-steps`, batch, import, patch/delete and reorder endpoints remain separate.
- Table order never establishes reviewed routes. Explicit Build/Rebuild may propose an unreviewed sequence after preview, replacement disclosure and Apply. Arrange existing routes preserves identities. Equipment names, notes and layout positions must not infer connections.
- Support branches, parallel paths and deliberate rework loops; distinguish inspection from result decisions and hold/rework/scrap/return outcomes.
- Default legacy sequences to unreviewed drafts. Do not infer missing branches, approval or customer acceptance.
- Use documented manufacturing notation/legend. No chemical-equipment symbol guessing from names.
- Validate graph endpoints, revision membership, permissions, isolation and locks immediately; check topology completeness for reviewed/released graphs.
- Coverage concerns manufacturing activities; graphical connectors/boundaries require no invented FMEA row. Record justified exclusions.
- Screen and SVG/PDF/XLSX must share graph semantics, readable labels and operation identity.

Source: `backend/src/modules/pfd/pfd.controller.ts:1`, `pfd-graph.ts:1`. The former claims about React Flow, pfd_step coordinates, automatic background consistency engines and generic `/pfd` endpoints were historical proposals, not the current contract.

## Rule authority
Read `.agents/context/engineering-rule-register.md` for source applicability and verification status. Separate official requirements, customer additions, product policy and implementation gaps. Do not invent compliance guarantees or rewrite approved records.

## Selected symbols and local layout (2026-10-20)
Manufacturing default; explicit engineeringSymbolId never changes stepType. manufacturingSymbolId must be compatible with the declared type. Unambiguous legacy icons translate read-only; conflicts remain findings. Original408-entry registry accounts for366public source names with aliases and30arrow variants; exact ISO/ISA/customer glyph conformity remains unverified. Registry files are generated together with a coverage hash; do not edit copies independently.

ELK engine runs in a bundled local worker through the published API protocol;30-second timeout/cancel/error cleanup preserves edits. Vertical text occupies a dedicated label column. Shared explicit junctions use temporary layout nodes; unmarked crossings stay unconnected and orphan dots need review. Approved revisions remain immutable;404does not grant write capability.

Screen/SVG/PDF/XLSX use shared geometry, selected symbols, full source IDs and native metadata. PDF tiles include visible geometry, unique markers and complete registers; skip empty tiles while retaining real route continuations. The shape dialog must render above the sticky document header so title/close controls stay usable. Public downloaded SVG previews remain outside production assets and are not native editable template downloads. Evidence: docs/specs/pfd-symbols-delivery.md and docs/references/README.md.
