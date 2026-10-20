# BACKEND/SRC/MODULES/PFD Directory

Purpose: Module folder managing pfd logic and assets.

## Directory Metadata
- **Path**: `backend/src/modules/pfd`
- **Files Count**: 7
- **Subdirectories Count**: 1

## File Map

| File | Purpose / Responsibility |
| :--- | :--- |
| [`pfd-graph.spec.ts`](./pfd-graph.spec.ts) | Manufacturing graph validation and identity-preserving remap checks. |
| [`pfd-graph.ts`](./pfd-graph.ts) | Revision-owned explicit physical routing schema, validation, legacy draft and ID remapping. |
| [`pfd-symbols.json`](./pfd-symbols.json) | Generated original symbol registry with stable IDs, categories, SVG geometry, ports and provenance; keep frontend/backend hashes identical. |
| [`pfd.controller.ts`](./pfd.controller.ts) | Controller managing API endpoints for Process Flow Diagram steps. |
| [`pfd.module.ts`](./pfd.module.ts) | NestJS module registering PFD components. |
| [`pfd.service.spec.ts`](./pfd.service.spec.ts) | Source code component implementing pfd.service.spec functionality. |
| [`pfd.service.ts`](./pfd.service.ts) | Service managing process flow step creations, re-ordering, and PFMEA linkages. |

## Subdirectories

- [dto](./dto/README.md) - Subdirectory folder containing localized modules.
