# Backend maintenance scripts

- `backfill-public-handles.cjs`: after building the backend, repair missing legacy trial handles atomically while preserving IDs and historical names. The current database compatibility trigger also assigns handles to older API inserts during rollout.

Run from backend with configured environment using `node scripts/backfill-public-handles.cjs`. Never reset the database or delete reservation tombstones.

- `audit-engineering-integrity.cjs`: read-only cross-project relationship and legacy sampling-default review report. It does not repair engineering decisions.
- `verify-controlled-engineering.cjs`: real database workflow verification inside an isolated transaction; always rolls back synthetic data and confirms cleanup.
- `browser-engineering-fixture.cjs`: `validate`, `seed`, and exact-manifest `cleanup` for an isolated synthetic tenant with non-admin author/reviewer/approver roles, 30 DFMEA chains and 105 CP lines. Credentials are written only to the temporary manifest. Cleanup verifies markers and preserves global reservations/permissions.
- `render-engineering-print-fixtures.cjs [output-directory]`: generates synthetic full-revision HTML using the actual frontend print adapter for independent PDF layout inspection. No browser automation or real data access.

Database scripts use `node --env-file=.env scripts/<name>.cjs`. Never print environment secrets or synthetic credential manifests into logs. Fixture approval means QA workflow verification only, not a production engineering approval or a standards-conformity claim.

- `verify-pfd-symbols.cjs`: `verify` runs105-operation/symbol/v2/concurrency/trial/approval/clone checks in an always-rolled-back transaction. `seed`, `activate-large <manifest>` and `cleanup <manifest>` manage a marker-verified isolated normal-login browser fixture with tenant-local non-admin roles; never print its temporary credentials.
- `render-pfd-print-fixture.mjs <output-directory>`: actual shared renderer produces105-operation SVG/PDF-print HTML in both modes for offline pagination inspection; no browser automation or real project access.
