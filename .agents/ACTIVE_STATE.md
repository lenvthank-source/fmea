# FMEApex — active handoff

Updated 2026-10-20. Workspace F:/proj-fmea. User confirmed release **0.12.0** for commit and push to origin/main. PFD implementation and release ledger are complete; publication is being finalized. See versions/v0.12.0.md. Prior published baseline: 0.11.0 / a19a3bb.

## Current objective/status
Implemented the full approved PFD symbol/library/automatic-layout plan using the same resumed specialists pfd_backend,pfd_table,pfd_canvas. All slices completed, parent integrated and verified actual browser/database/PDF behavior. Read **docs/specs/pfd-symbols-delivery.md** first; source inventory docs/references/README.md. Prior controlled DFMEA/Control Plan release evidence remains docs/specs/controlled-engineering-delivery.md.

## Working implementation
-408original application SVGs:366public source-name entries mapped with explicit aliases,12manufacturing activities,13basic,30arrows,4annotations. Registry copies frontend/src/features/pfd/symbols/pfd-symbols.json and backend/src/modules/pfd/pfd-symbols.json generated together; coverage SHA recorded. Original glyphs are NOT independently ISO/ISA/customer-verified.
-Explicit nullable manufacturingSymbolId/engineeringSymbolId on steps, validated IDs and activity compatibility. Engineering selection never changes stepType. Table/add/edit/import/duplicate paths preserve selections. Legacy icons translated read-only; ambiguous/conflicting marks remain findings, no equipment-name guessing.
-Searchable enabled-library shape browser with labelled SVGs, Apply/Clear/Cancel, keyboard controls, responsive dialog above sticky metadata header. Annotation shapes are not invented operations.
-Dual display Manufacturing(default)/Engineering, horizontal(default)/vertical. Shared symbol/port/label renderer. Vertical labels beside glyphs, away from routing. Full engineering details stay in inspector.
-Build/Rebuild sequence is disclosed unreviewed preview; Apply/Discard/Undo. Arrange preserves routes/identities; newoperations unconnected; no invented decision/parallel/rework paths. Local ELK0.12 worker uses published protocol,30s timeout/cancel/error cleanup. Explicit shared junctions preserved via internal temporary layout nodes; unmarked crossings stay separate; orphan dots need manual review.
-Graphv2 adds modes/direction,annotationnodes,cardinalports,points,junctions,labelPosition; v1readable, writable save upgrades. Actual actor/tenant/project/type/trial/reference/expiry/lock checks inside mutations; optimistic graph versions.404never grants write. Legacy PFD/PFMEA step interfaces retain pfmea permissions; graphPFDonly.
-Complete symbol/graph cloning and native import remapping preserves operation links and protected baselines. Additive migration20261020190000_pfd_selected_symbols applied;7migrationscurrent, Prisma regenerated, catalog emitted in productiondist. No legacy analysis rewrite.
-Shared screen/SVG/PDF/XLSX geometry, complete table/connection/native metadata and embedded PNG. Unicode metadata chunks never split surrogate pairs. PDF tiles include only visible geometry, unique markers and complete indexes/registers; skip empty tiles but retain real route continuations.

## Verification
-Backend production build PASS; **174tests/20suites PASS** incl41PFD. Frontend production build/TypeScript PASS; **43focused tests PASS** across PFD/DFMEA/CP/lineage. Existing nonfatal MUIbarrel/largechunk warnings remain.
-RealDB verify-pfd-symbols.cjs PASS:105steps/symbols/v2geometry/staleconflict/trial/reference/approvedlocks/fullclone. Existing verify-controlled-engineering.cjs PASS afterintegration. Both alwaysrollback; synthetic transaction tenants absent.
-Actual browser normal non-admin tenant sign-in: gearselection kept activityoperation; localworkerBuild/Apply/Save, keyboardApply, mode/direction, routepreservinglayout, reload and separate arrowannotation succeeded.105operations produced107nodes+annotation, OP105once.320px page and dialog fit with no document overflow. Actual defects caught/fixed: nestedworkerprotocol, verticalconnector/label overlap, tab/header overflow, dialog layering, oversized/empty PDF tiles.
-Actual downloaded XLSX8and105operations retained finalrows,symbolIDs,v2engineering/verticalgeometry,annotation and embeddedPNG; nativeparser checked.
-Independent officialWeasyPrint70 print QA:105operations eachmode,54diagramtiles+indexes/registers=78PDFpages each. All105IDs/Unicode retained, all text withinmargins; visually inspected labelcolumn/ports/continuations. Final files~0.2–0.25MB instead of13–15MB before tileclipping. Customer-specific form acceptance separate.
-Reference inventory31publicrecords;13relevantSVGpreviews downloaded/hashed externally,18unrelated exclusions. Allsixguideexamples covered. No public native editable template download exposed; do not claim previews are nativeprojects or absolute coverage of inaccessibleprivatecatalog.
-QA127session signedout; temporarytabs and320pxharness removed. Exact-marker cleanup removed isolatedPFDtenant,tenant-localroles and credentialmanifest; globalpermissions/reservations and realprojects untouched.

## Runtime/artifacts/reproduction
Vite5173 retained. Finalbuilt taskAPI3000 hidden PID**29192**, node dist/main.js; health/database connected. Verify port/process identity before restart; never stop unrelatedNode. Ignoredlogs backend/local-api.*. Redis absent=inertdevelopmentqueues.
Artifacts outside shippedassets: C:/Users/Palak/.codex/visualizations/2026/10/18/01a15026-af67-7522-87fc-f43cefdb4e2b/{pfd-reference-archive,pfd-print-qa,pfd-shape-browser.png,pfd-engineering-browser.png,pfd-shapes-320px.png}.
Run backend build/tests; frontend build + node --test src/features/pfd/utils/*.test.mjs and controlled frontend suites. Backend scripts README documents rollback/fixture/render commands; root scripts README documents public inventory and catalog generation. Never print environment/temporarycredentials.

## Remaining gates
1.Public SVG previews available; native editable Creately exports require access not currently exposed. No copied sourceSVG shipped.
2.Exact ISO/ISA/customer glyph verification remains pending; original application symbols not certification. Prior independent numerical FMEA/AP table verification and11legacy sampling-review items remain unchanged.
3.Deployment/customer-form acceptance separate. No FMEA-MSR or reverse CP synchronization.
README sync and finalGraphify refresh required/completed before turnend; optionalSQLextractor warning remains. Use graphify query before source discovery. User confirmed 0.12.0 for this publication; future releases need separate version confirmation.
