# OpenAI Codex guide: FMEApex

Read [.agents/ACTIVE_STATE.md](.agents/ACTIVE_STATE.md) and [.agents/AGENTS.md](.agents/AGENTS.md) at session start. They own current state and architectural rules.

For methodology, applicability, configured AP verification and implementation gaps, use [.agents/context/engineering-rule-register.md](.agents/context/engineering-rule-register.md). Do not restore historical strict draft gating, guessed PFD routing or unverified compliance claims.

Run `graphify query "<question>"` before source discovery. Use scoped query/path/explain and wiki navigation. After each logical code batch, run `graphify update .`, including later edits; preserve generated output and record extraction blockers. Sync directory READMEs and update active state before handoff.

Backend checks: `npx tsc --noEmit`, `npm run build`, `npm test -- --runInBand`. Frontend: `npx tsc -b`, `npm run build`. Follow canonical release/version confirmation rules before committing or publishing.

The controlled DFMEA and phase-specific Control Plan rebuild is implemented in the working tree. Read `docs/specs/controlled-engineering-delivery.md` and ACTIVE_STATE for tests, migration, source limitations and remaining acceptance gates. Exact numerical standards conformity remains unverified; preserve the explicit profile warning. Prior public/PFD work remains recorded in its historical delivery checklist.

Current release: **0.12.3**, explicitly confirmed by the user for commit and push on 2026-10-21. The demonstration-led homepage is complete; see `versions/v0.12.3.md`, `docs/specs/homepage-story-delivery.md` and ACTIVE_STATE for validation and handoff. Publication targets `origin/main`; verify its SHA against local HEAD when resuming. Hosted deployment completion is separate from Git publication. Future releases need their own version confirmation.

Source indexes under backend/src, backend/prisma and frontend/src are tracked; keep README sync and Graphify current. Never stage runtime logs, credentials or temporary graph locks. Prior PFD source/export limitations and numerical methodology-verification gates remain recorded in their delivery reports.
