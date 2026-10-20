# PFD symbols and automatic diagrams — delivery

Updated 2026-10-20. Working changes after published v0.11.0 (a19a3bb); no new version, commit or push authorized. Implemented against the user-approved PFD plan. Application notation is not a standards-conformity claim.

## Plan coverage

| Requirement | Implemented behavior |
|---|---|
| Reference inventory | Public guide, symbol guide, usage collection, catalog searches and related industrial PFD links exhausted within exposed public navigation.31unique records;13relevant public SVG previews downloaded/hashed outside the application;18unrelated exclusions retained. No public native editable template export exposed. Exact inventory and limitations: docs/references/pfd-template-inventory.json. |
| Original shape library |408stable original SVG symbols, covering366source-name entries with explicit duplicate aliases,12manufacturing activities,13basic shapes,30arrow variants and4annotations. Frontend/backend catalogs are byte-identical with recorded SHA256. All entries have labels, categories, bounded cardinal ports and verification status. No downloaded SVG is shipped. |
| Symbol selection |Separate manufacturingSymbolId/engineeringSymbolId in table, add/edit interfaces and imports. Equipment cannot alter stepType. Manufacturing choices must match actual activity. Legacy icons remain read-only translations with ambiguity/conflict findings. No narration-based equipment inference. |
| Shape browser |Search, enabled libraries, labelled previews, selected state, Apply/Clear/Cancel and keyboard controls. Basic/arrows/annotations are graphical nodes, not invented manufacturing operations. |
| Dual display |Manufacturing default; engineering mode uses explicit equipment with activity secondary. Missing equipment generates findings and manufacturing fallback. Node inspector retains full engineering fields. |
| Automatic arrangement |Explicit Build/Rebuild sequence preview creates unreviewed drafts and lists replaced authored routes. Arrange preserves edge/operation identities; Apply/Discard/Undo and manual movement remain. New operations remain unconnected. Decision outcomes are never inferred. |
| Routing |Bundled local ELK worker with proper engine protocol,30-second timeout, cancellation/error cleanup. Horizontal/vertical layouts; measured labels/ports; vertical text column clear of connectors; explicit junctions use temporary internal layout nodes while authored identities remain. Unmarked crossings stay unconnected; orphan junctions require review. |
| Persistence/protection |Graph v2 stores display/direction, annotations, ports, route points, junctions and labels; v1 readable, writable saves upgrade. Strict IDs/geometry/membership; actual actor/project/type/trial/revision checks inside mutation transactions; optimistic graph versions.404never grants write access. |
| Compatibility |Additive nullable symbol fields, complete selection/graph cloning, preserved approved history. Native workbook topology remaps source IDs explicitly. Legacy table imports retained; malformed native geometry or invalid symbols rejected before applying. |
| Outputs |One shared SVG renderer for screen/SVG/PDF/embedded XLSX snapshot; complete table, symbol IDs, connections and native metadata. Print tiles retain relevant geometry, unique markers, node index and routing register; empty tiles omitted. |
| Responsive |PFD tabs stack and keep labels/badge; shared document header wraps; shape browser fits320px. Canvas pans within its own viewport. |

## Verification

- Backend production build PASS;174tests/20suites PASS, including41PFD service/graph tests. Frontend production build/TypeScript PASS;43focused regressions PASS across PFD, DFMEA, Control Plan and lineage (26PFD including21layout/export/metadata and5symbol tests).
- Real configured database:105explicit-symbol steps, v2geometry, stale conflict, trial/reference and approved protections, complete revision cloning; all synthetic transaction records rolled back. Existing DFMEA/CP rollback workflow rerun after integration.
- Actual browser normal sign-in with isolated tenant-local non-admin role: searched/selected Pump gear, saved it without changing operation meaning, built/applied/saved and exported a diagram. Corrected actual browser worker-protocol defect rather than relying on Node-only tests. Keyboard Apply and route-preserving arrangement checked.
- Browser105-operation revision:107nodes including boundaries, OP105present exactly once; preview/apply/save succeeded. Manufacturing remains the default.320px document and shape dialog fit without horizontal document overflow.
- Actual downloaded XLSX:8operations and a separate105-operation workbook; final row, selected manufacturing/equipment IDs, v2engineering/vertical geometry, native graph, separate four-way arrow annotation and embedded diagram PNG retained. Metadata chunking preserves surrogate-pair Unicode across cell boundaries.
- Independent PDF rendering uses official WeasyPrint70.0 over actual print adapter HTML:105operations in each mode;54diagram tiles plus full indexes/registers (78PDF pages). All105identities retained and all words within page margins. Visual inspection verified symbols/Unicode, separate vertical label column and continuation references. Tile clipping reduced large exports from13–15MB to~0.2–0.25MB. Customer-specific form acceptance is separate.

## Reproduction and limits

- Backend: npm run build; npm test -- --runInBand; node --env-file=.env scripts/verify-pfd-symbols.cjs verify; node --env-file=.env scripts/verify-controlled-engineering.cjs.
- Frontend: npm run build; node --test src/features/pfd/utils/*.test.mjs plus controlled engineering frontend suites.
- scripts/collect-pfd-references.py archives exposed public references; scripts/build-pfd-symbols.py regenerates both catalogs from the external inventory. backend/scripts/render-pfd-print-fixture.mjs creates synthetic print HTML. Never log fixture credentials or environment secrets.
- Source archive and visual proof are outside shipped assets under the task visualization directory.13SVG files are public graphical previews, not native editable Creately projects. Account-only or undiscoverable content was not accessed. No exact ISO/ISA/customer glyph certification is asserted.
- Existing independent FMEA rating/AP reference gap and11legacy sampling review items remain unchanged. No reverse synchronization or sample engineering decisions added.
