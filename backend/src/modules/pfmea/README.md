# BACKEND/SRC/MODULES/PFMEA Directory

Purpose: Module folder managing pfmea logic and assets.

## Directory Metadata
- **Path**: `backend/src/modules/pfmea`
- **Files Count**: 5
- **Subdirectories Count**: 1

## File Map

| File | Purpose / Responsibility |
| :--- | :--- |
| [`ap-calculator.spec.ts`](./ap-calculator.spec.ts) | Unit tests for the Action Priority calculator. |
| [`ap-calculator.ts`](./ap-calculator.ts) | Configured Action Priority profile with strict integer validation; numerical handbook conformity pending independent verification. |
| [`pfmea-row.controller.ts`](./pfmea-row.controller.ts) | Controller defining API endpoints for PFMEA rows. |
| [`pfmea-row.service.ts`](./pfmea-row.service.ts) | Core service logic managing PFMEA functions, requirements, failure modes, effects, causes, and action priority calculations. |
| [`pfmea.module.ts`](./pfmea.module.ts) | NestJS module registering PFMEA controllers, services, and AP utilities. |

## Subdirectories

- [dto](./dto/README.md) - Subdirectory folder containing localized modules.
