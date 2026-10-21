---
plan_id: guest-login-activity
revision: 1
status: in_progress
created_at: "2026-10-21"
updated_at: "2026-10-21"
execution_authorization: user_approved
completed_at: null
---

# Correct guest sign-in history and inactivity interpretation

## Entry, scope and baseline

User supplied an admin Users screenshot showing authenticated guest accounts labelled "Never logged in" and asked "Check and plan". This artifact authorizes neither implementation nor a production data repair. The separate contact-email-notifications plan remains pending and unchanged.

Repository `F:/proj-fmea`, main@`4781f8b45e12a1db3c6e9402e324dd1a8e97582d`, published version0.12.3. Existing dirty changes at start: contact email plan/index/ACTIVE_STATE and generated Graphify files from that planning task. Preserve them. No new version/commit/push requested.

Read `.agents/AGENTS.md`, `.agents/ACTIVE_STATE.md`, this plan and `evidence/RESULT.md`. Before source discovery run `graphify query "lastLoginAt createGuestUser getMe UserService AdminPanel"`; include this requirement in any later authorized subagent prompt. Use actual inspected code over aspirational/stale SSO and testing prose. Current auth uses tenantId claims and browser storage; do not redesign authentication to conform to a stale skill.

Ready for code implementation after user authorization. Production historical audit/repair is not performed and must remain a separate, reviewable action. First task: T01. One integrator owns auth semantics and test expectations; sequential execution is adequate.

## Root cause and evidence

| ID | Verified location / behavior | Meaning |
| --- | --- | --- |
| F01 | `frontend/src/features/admin/AdminPanel.tsx:509` renders `item.lastLoginAt ? date : 'Never logged in'`. `UserService.findAll`, `backend/src/modules/user/user.service.ts:36`, selects lastLoginAt but not lastActivityAt. | Null storage is treated as proof of no sign-in; frontend cannot show the already separate activity timestamp. No mapping bug was found for lastLoginAt itself. |
| F02 | `AuthService.createGuestUser`, `backend/src/modules/auth/auth.service.ts:537`, creates the user at554 and returns signed access/refresh tokens at632–647. The create data omits both timestamp fields. `schema.prisma:49–50` makes both nullable with no default. | A successful passwordless guest session leaves lastLoginAt null. This is the main source defect matching the screenshot. |
| F03 | `AuthService.getMe`, auth.service.ts:717–745, updates lastActivityAt only; refresh at440–484 also updates activity only. The guest frontend normally fetches /me after receiving tokens (`AuthContext.tsx:304` onward). | A guest can be authenticated and active while lastLoginAt stays null indefinitely. Refresh and activity do not represent a new sign-in. |
| F04 | Password login at317 updates both timestamps at367–371 using an unawaited write with an empty catch. Signup at54 issues tokens in both branches without setting these fields. Legacy createTryToken at651 also issues sessions without recording sign-in. | Missing instrumentation exists beyond guests. Password timestamp failure/race is possible from source, but was not reproduced against production. Cover actual session-establishing entrypoints without changing their permissions. |
| F05 | `UserService.checkAndArchiveInactiveUsers`, user.service.ts:9–33, uses lastLoginAt or createdAt and ignores lastActivityAt. It runs before findAll returns the users. | A user created over15 days ago can be classified inactive despite recent recorded activity. This is a verified predicate risk, not evidence that specific screenshot users have already been wrongly archived. |
| F06 | Schema stores guestExpiresAt separately. UI shows Active/Archived account status and a separate expiry caption. | Active is an account flag, not "online". The expiry caption does not establish when a sign-in happened. Preserve the distinction from15-minute access tokens,72-hour session inactivity and24-hour custom-project limits. |

### Reproduction actually run

Imported the real AuthService and UserService through installed ts-node with mocked Prisma and token signing. Guest session creation completed with both fields null; /me then set lastActivityAt while leaving lastLoginAt null. Captured archive predicate contained no lastActivityAt. Exit0. No database, real accounts, passwords, real tokens or external network were used. Saved fixture/output: `evidence/baseline-repro.cjs`, `evidence/RESULT.md`.

The supplied screenshot plus this source/mocked-path result establishes a code defect. Actual deployed build identity and per-user historical values were not inspected; do not invent production counts or claim all old rows have the same history. Avoid opening the live admin list merely to reproduce: its GET currently invokes an archive mutation.

## Required behavior and decisions

### D01 — Distinct timestamp meanings

- lastLoginAt means the most recent successful server-side establishment of a user session, including passwordless guest entry and signup that automatically signs the new user in.
- lastActivityAt means the most recent activity the backend actually records. It is not an online-presence heartbeat, every UI click, a guest expiry extension, or a new sign-in.
- Account creation, sign-in, recorded activity, guest expiry and archival status remain distinct. Health pings, page rendering, admin viewing another user, invalid credentials and failed token verification cannot invent a sign-in.
- Null means not recorded, not proof that the person never entered the application. Preserve existing API lastLoginAt name and UTC timestamp storage; expose lastActivityAt additively in the tenant-scoped user list.

### D02 — Reliable future session recording

For new guest creation and both auto-sign-in signup branches, capture one server Date and initialize both fields in the existing user creation transaction. Signed-token failure must roll back the user/role/handle transaction as it already should; do not leave a successful-looking record from a failed session.

For existing-user password sign-in: finish credential/account checks and token signing, then await a tenant+user+active-status scoped timestamp write before returning the success response. Replace the silent fire-and-forget write. If recording fails, return a recoverable server failure and log only an error category/user identifier, not credentials or tokens. Failed authentication must leave timestamp values unchanged.

For the existing createTryToken path, record successful session establishment only after the current token checks/signing and before returning. Do not change its users, roles, permissions or public accessibility under this task; a timestamp patch is not permission to broaden that route.

Use a proposed shared helper `session-activity.ts` or equivalently focused private service helpers. Do NOT put sign-in stamping into generic generateTokens: refresh uses that function too. Helpers accept the actual transaction client when already inside a transaction; do not open a nested top-level transaction or escape a caller's transaction.

Timestamp writes must be monotonic. An older request completing later must not overwrite newer lastLoginAt/lastActivityAt. For existing users, use conditional Prisma updateMany per timestamp (same transaction when marking both), matching id+tenantId+active status and null/older value. Verify account existence/status separately; zero updated rows can legitimately mean the stored timestamp is already newer. Avoid raw SQL/session settings on the pooled connection for this change.

Refresh changes activity only after successful token/user validation; /me retains the existing five-minute activity throttle. Keep those activity writes observable on failure, not empty catches, and monotonic. Preserve the current read-availability policy for best-effort /me activity recording; do not turn a telemetry failure into a fabricated timestamp. Do not set lastLoginAt on refresh, hydration or /me. Retain the current tenant/isGuest/publicHandle/storage/session policies.

### D03 — Truthful compact admin display

In `UserService.findAll`, add lastActivityAt to its existing select, retaining the tenant filter, permissions, roles, ordering and response shape. Frontend UserItem gains nullable lastActivityAt.

Keep the same table and account information. Header may read "Last sign-in". Display:

| lastLoginAt | lastActivityAt | Cell behavior |
| --- | --- | --- |
| Valid timestamp | Any | Formatted sign-in date/time using the current locale; no conversion of activity into sign-in |
| Null | Valid timestamp | "Sign-in not recorded" with a compact secondary "Activity recorded: <date/time>" |
| Null | Null | "Not recorded" |
| Invalid date string | Any | Safe not-recorded fallback, no Invalid Date text |

Preserve the guest-expiry caption and controls, keep narrow layout usable, and do not add summary cards or a new dashboard. New sign-ins become visible on the next successful user-list fetch; do not promise live updates or add background polling as part of this fix. Existing read/refetch actions remain intact. A large UI redesign is out of scope.

### D04 — Archive from the most recent known activity

Preserve tenant scope, active-status filter,15-day threshold and Admin exclusion. Only archive when ALL known signals are older than the cutoff:

- createdAt < cutoff;
- lastLoginAt is null OR lastLoginAt < cutoff;
- lastActivityAt is null OR lastActivityAt < cutoff.

This is equivalent to the latest known timestamp being older than15 days, with creation as the fallback. Preserve the existing strict-less-than boundary: a timestamp exactly at the cutoff is not older. Use one cutoff instant per invocation and an explicit15x24-hour duration to avoid environment-dependent calendar shifts.

Retain the existing archive-on-list invocation for this bounded fix; moving archival into a scheduler is separate scope. Do not reactivate archived users, exclude every guest from housekeeping, change permissions, or extend guestExpiresAt/token/project lifetimes. Update the admin explanatory text to describe inactivity based on recorded activity/sign-in/creation rather than "no login" alone.

### D05 — Legacy data and audit

No schema migration is expected: both columns already exist. Never blanket-backfill lastLoginAt from createdAt, guest expiry, token iat, name, audit narration or lastActivityAt. Existing nulls remain unknown; the next genuine sign-in records an actual timestamp. Existing session refresh/hydration updates activity only.

If production impact counts are requested, make a read-only tenant-scoped aggregate report first: guest/registered counts with null login, null login + known activity, and already-archived accounts with recent activity. Do not export user names/emails to research artifacts or instantiate PrismaService/bootstrap code that seeds/mutates data to perform the audit. A fresh PrismaClient read is appropriate when explicitly authorized/configured. A suspected wrong archive needs individual review; recent activity alone does not prove why its status was changed.

## Ordered tasks

| Task | Owned work / dependencies | Acceptance evidence |
| --- | --- | --- |
| T01 | Freeze D01 semantics and add meaningful tests under backend auth/user. Inspect the current entrypoints and legacy-null cases; author a proposed focused session-activity helper if needed. | Regression reproduces a successful guest session with null login on the baseline; future expectation specifies both timestamps. No schema default-now workaround. |
| T02 | AuthService and helper: guest creation, both signup branches, password login, existing try-token path; monotonic activity-only refresh and /me writes with scoped predicates. Depends T01. | Fake-clock tests prove actual session stamps, transaction rollback, failed-auth no-write, refresh no login change, throttle, write failure visibility, and older completion cannot regress newer stamps. Preserve stable handles and existing session tests. |
| T03 | UserService listing/archive predicate and matching service tests. Depends shared D01/T01 contract; integrate after T02. | Recent activity protects an old guest; all-null old user archives; recent login protects old activity; exactly-at-cutoff stays; Admin and other tenant unchanged; archived users not automatically restored. List returns both nullable timestamps. |
| T04 | AdminPanel type/display helper, header/null labels and archival explanatory copy. Depends T03 API. | Actual guest-created result shows a real sign-in; legacy activity is distinctly labelled; null/invalid values never say Never logged in; existing expiry/actions preserved; keyboard/narrow view checked. |
| T05 | Integrate and document actual outcome, evidence/limits and any remaining data audit. | Backend tests/build, frontend build/focused lint, browser with isolated synthetic accounts; README sync, Graphify refresh and ACTIVE_STATE. Update this plan by task ID; completed only after required checks. No migration, production backfill, commit/push or new release without separate authorization. |

Suggested commands, not executed as implementation checks in this planning turn:

- cwd `F:/proj-fmea/backend`: `npm test -- --runInBand`, `npm run build`. Write focused unit/service tests with fake clocks and mocked failure paths plus tenant-scoped transaction tests in isolated fixtures where required. Do not weaken existing AuthService identity expectations to avoid updating mocks correctly.
- cwd `F:/proj-fmea/frontend`: `npm run build`; `npx oxlint src/features/admin/AdminPanel.tsx` and any added helper. Test formatting with null/valid/invalid ISO values; visually inspect desktop/narrow tables and guest expiry. Never create production guest accounts merely to get a screenshot.
- cwd repository: `python .agents/skills/readme_sync/scripts/sync_readmes.py`, `graphify update .` after each logical code batch and final documentation; `git diff --check`.
- Baseline reproduction only: `node .agents/handoff_plan/guest-login-activity/evidence/baseline-repro.cjs`. Its old-null assertions deliberately cease to pass after the implementation; preserve it as historical evidence, not a CI regression test for the desired future behavior.

## Assumptions and prohibited shortcuts

| ID | Unsafe shortcut | Required safeguard/test |
| --- | --- | --- |
| A01 | Passwordless guest entry is not a real sign-in. | It issues authenticated tokens. Capture the event in the transaction; test immediate admin listing. |
| A02 | Change only the label or fill every null from creation. | Fix future auth writes and preserve unknown historical truth. Separate recorded activity from sign-in in the cell. |
| A03 | Every generateTokens call must record login. | Refresh also uses it. Record session-establishment explicitly at callers; refresh must preserve lastLoginAt. |
| A04 | Catch timestamp failures silently for speed. | Await successful sign-in recording and emit sanitized diagnostics for activity-write failures; tests simulate rejected writes. |
| A05 | Active means online; expiry is last login. | Keep account status, presence, expiry and history separate; no fabricated online indicators. |
| A06 | Use lastActivityAt alone or lastLoginAt alone for archival. | All known timestamps must be older; future/recent timestamps protect against inactivity archiving. Test stale activity with newer login as well as the reverse. |
| A07 | Archive data can be fixed by globally unarchiving users. | Read-only scoped report, then separate review/authorization. No changes to status/history in this plan's research phase. |
| A08 | Reproduce by opening the live admin Users page. | Its GET mutates archive status. Use mocks or isolated synthetic tenants during investigation/verification. |
| A09 | New database defaults ensure existing/new users are correct. | Defaults would mislabel admin-created users who never authenticated. No schema/default change expected. |
| A10 | Date helper, bearer claims or new labels authorize an auth redesign. | Keep tenantId, permissions, trial/session lifetimes and storage unchanged; no SSO/MFA/cookie migration here. |

Allowed implementation discretion: helper naming, localized date presentation and compact typography within current identity. Escalate if deployed schema lacks the two columns, another harness changed auth semantics, or intended archival policy is explicitly sign-in-only rather than inactivity. Do not expand access controls or resurrect accounts to resolve ambiguity.

## Definition of done and execution record

Future guest sessions have non-null login/activity timestamps; every successful session-establishing path has consistent server recording; failed auth and refresh do not create false sign-in history; the admin table distinguishes unknown history from actual events; recent recorded activity is considered by the tenant-scoped archive predicate; old unknown history is preserved. Required checks in T01–T05 have concrete evidence before completed_at is set.

Research completed2026-10-21: source trace + isolated mocked reproduction passed. No production database inspection, data mutation, new account, real token issuance or full product build/test run occurred. Planning-only files and graph/index/handoff changes are the sole outputs. Implementation is not requested yet. When authorized, mark in_progress and append task checkpoints here without erasing these baseline findings.
