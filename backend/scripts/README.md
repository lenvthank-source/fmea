# Backend maintenance scripts

- `backfill-public-handles.cjs`: after building the backend, repair missing legacy trial handles atomically while preserving IDs and historical names. The current database compatibility trigger also assigns handles to older API inserts during rollout.

Run from backend with configured environment using `node scripts/backfill-public-handles.cjs`. Never reset the database or delete reservation tombstones.
