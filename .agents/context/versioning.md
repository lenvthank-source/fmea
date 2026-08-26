# Versioning & Ledger

Single source: root `package.json#version` (now `F:\proj-fmea\package.json:3`, `backend/package.json:3`, `frontend/package.json:4` must stay in sync — `AGENTS.md §5`).

## Process (must confirm with user)
1. User confirms intended bump (never silent).
2. Bump semver `MAJOR.MINOR.PATCH` in root + `backend/` + `frontend/` `package.json`.
3. Create `versions/vX.Y.Z.md` append-only (template `F:\proj-fmea\versions\README.md`) — human + agent-parseable fixed order: Summary, Changes, Files Touched (`path:line`), Schema/Migrations, Breaking/Notes.
4. Update `versions/README.md` index (append row).
5. Commit + push `main` (or hold per user).

`versions/` is append-only — never edit existing ledger.

## Index (leading entries)
| Version | Date | Summary |
|---------|------|---------|
| v0.0.0 | 2026-08-12 | Init scaffold |
| v0.1.0 | 2026-08-20 | Replication + project CRUD |
| v0.2.0 | 2026-08-24 | Revision workflow (Submit→InReview→Approve/Reject), semver 1.9→1.10 fix, junction clone, `RevisionGuard` |
| v0.2.1 | 2026-08-25 | `CommonModule @Global RevisionGuard` fix + `ToastProvider` warning/error split |
| v0.2.2 | 2026-08-25 | Pagination (`unwrapPaginated {data,total}`), `D.map`/`i.filter` guards |
| v0.2.3 | 2026-08-26 | Admin editable S/O/D scales (Simple Groups 1..10 global), B-tree indexes `project[tenantId,status,createdAt]`, `lastLoginAt` fire-and-forget, `session` in login to avoid extra `/me` |
| v0.3.0 (next) | 2026-08-27 planned | Session hydration + 72h sliding `lastActivityAt`, PFD Import wiring (`ExcelImportWizard` → `POST /pfd-steps/batch`), Linkage blink fix (remove `zoom/pan` deps), deletes via `ConfirmDialog` (multi-value + unlink), history guards (`submittedAt/approvedAt`, draft-only PATCH, effective date validation), `.agents` context expansion + `AGENTS.md §6` |

## Schema / migration linkage
- `backend/prisma/schema.prisma` 41 models; `prisma db push` (no migrations). Additions noted in ledger under **Schema/Migrations** with required commands:
  - `v0.2.3`: `SeverityScale/OccurrenceScale/DetectionScale` (`schema.prisma:791`) + indexes (`schema:165`) → `npx prisma generate && npx prisma db push` or `migrate dev --name add-rating-scales`
  - `v0.3.0`: `User.lastActivityAt @map("last_activity_at")` (`schema:46-48`) + `@@index([lastActivityAt])` if added → same commands + `ensureSeeded` on boot.

## Decisions ↔ versions trace
- ADRs live in `.agents/memory/decisions.md:6` (tenant filter, db push, global guards, admin bypass, auto-deploy, local R2 fallback) — add row per version bump linking `versions/vX.Y.Z.md`.
- Decision to stay B-tree (no `pg_trgm`) recorded `v0.2.3` ledger note; matrix-simple-groups decision, Fab keep-floating, nav shift (`globalMenuItems`) likewise.

## Build stamps
- Ledger must list **exact files:lines** touched (e.g., `frontend/src/features/auth/AuthContext.tsx:46 isHydrating + hydration`, `backend/src/modules/auth/auth.service.ts:367 lastActivityAt`).
- Stale `.agents/` is a bug — review freshness each minor (see `AGENTS.md §6.3` sync `python .agents/skills/readme_sync/scripts/sync_readmes.py` + `tsc` builds).

## Planned backlog (not yet versioned)
- Diff endpoint `GET /revisions/:id/diff/:otherId` (SAD 1576, Sprint 10)
- Clone-on-activate (append-only rollback prevention; currently pointer swap `project.service:1381`)
- Multi-approver quorum config + `changes_requested` state + `approval.digitalSignatureHash`
- `ControlPlanRow` `stepIdMap` remap completeness (`project.service:948`)
