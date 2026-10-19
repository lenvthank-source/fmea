# Workflow: physical routing and analytical coverage

See the [rule register](../../.agents/context/engineering-rule-register.md).

1. Create manufacturing operations with stable IDs/numbers and explicit activity types.
2. Create/review physical graph nodes and directed routes, including decisions, parallel paths, dispositions and rework.
3. Save revision topology with an expected version; resolve conflicts before overwriting.
4. Link PFMEA analyses to actual operation identities across documents; allow multiple analyses per operation.
5. Review missing manufacturing coverage and justified exclusions. Graphical boundaries/connectors need no artificial failure rows.

The current implementation uses revision pfdGraph/pfdGraphVersion and existing ProcessStep records. GET/PUT `/api/v1/revisions/:id/pfd-graph` handles topology; `/pfd-steps` handles operations. The frontend uses SVG, not a React Flow pfd_step coordinate schema. Table order and equipment/variation text must not invent routes.

Sequence-only legacy data is an unreviewed draft, not verified physical flow. Preserve historical links and approved data. Confirm actual deletion semantics in PfdService before changing operations; never promise blanket cascaded analysis deletion. Graph save concurrency protects topology, not every historical edit path.

Use one symbol/graph definition for screen and export. Customer notation/coverage requirements apply only in their contractual scope.
