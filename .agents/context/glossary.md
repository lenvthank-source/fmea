# Glossary

Project-specific terms, abbreviations, and domain names.

## FMEA & Quality Terms

| Term | Definition |
|---|---|
| FMEA | Failure Mode and Effects Analysis |
| PFMEA | Process FMEA (manufacturing process risk analysis) |
| DFMEA | Design FMEA (product design risk analysis) |
| PFD | Process Flow Diagram |
| CP | Control Plan |
| AIAG | Automotive Industry Action Group |
| VDA | Verband der Automobilindustrie (German auto industry association) |
| AP | Action Priority (H/M/L derived from S/O/D lookup) |
| S/O/D | Severity / Occurrence / Detection ratings (1–10) |
| RPN | Risk Priority Number (legacy, NOT used in AIAG-VDA 2019) |
| 4M | Man, Machine, Material, Method (work element categories) |
| 5Ts | Team, Timing, Tools, Tasks, boundary (planning elements) |
| CFT | Cross-Functional Team |
| 21 CFR Part 11 | FDA regulation for electronic records and signatures |
| IATF 16949 | Automotive quality management standard |

## Technical Terms

| Term | Definition |
|---|---|
| Tenant | Isolated workspace/organization in multi-tenant architecture |
| RLS | Row-Level Security (PostgreSQL session-based isolation) |
| RBAC | Role-Based Access Control |
| JWT | JSON Web Token (authentication) |
| Neon | Serverless PostgreSQL hosting provider |
| pgvector | PostgreSQL extension for vector similarity search |
| HNSW | Hierarchical Navigable Small World (vector index algorithm) |
| R2 | Cloudflare R2 (S3-compatible object storage) |
| BullMQ | Node.js message queue library |
| Prisma | TypeScript ORM for database access |
| MUI | Material-UI (React component library) |

## Codebase-Specific Terms

| Term | Definition |
|---|---|
| Work Element | 4M category node in PFMEA structure tree |
| Structure Function | Function/requirement node attached to a tree element |
| Structure Failure | Effect/mode/cause node in the failure network |
| Failure Link | Edge connecting failure modes to effects or causes |
| Link Action | Corrective action attached to a specific failure link |
| Process Step | PFD step (also referenced in PFMEA/CP rows) |
| Process Item | Container entity for process steps within a revision |
| Package | Reusable work element template in the Repository |
| Evidence | File attachment proving corrective action completion |
| Guest Tenant | Special workspace (`guest-tenant`) for trial/demo accounts |
| Revision | Versioned snapshot of document content (PFD/PFMEA/DFMEA/CP) |
| Locked Revision | Revision with `lockedAt` set — permanently immutable |
| AP Lookup | Pure function mapping S/O/D to H/M/L per AIAG-VDA 2019 table |
