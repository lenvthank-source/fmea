---
plan_id: contact-email-notifications
revision: 1
status: ready
created_at: "2026-10-21"
updated_at: "2026-10-21"
execution_authorization: not_requested
completed_at: null
---

# Contact enquiries: internal notification and customer receipt

## Start here

Research and implementation specification only. Product code, migrations, accounts, DNS and email delivery have NOT been changed. The user requested comparison and a plan; implementation and live configuration require subsequent authorization. Code tasks are ready; production activation depends on the setup gates below.

- Repository: `F:/proj-fmea`, branch `main`, version 0.12.3, baseline `4781f8b45e12a1db3c6e9402e324dd1a8e97582d`.
- Working tree was clean at research start. Preserve all released homepage and PFD work.
- Read `.agents/AGENTS.md`, `.agents/ACTIVE_STATE.md`, this plan, then [SOURCES.md](SOURCES.md). Run `graphify query "contact enquiry AuthService mail delivery"` before source discovery. Use the graph-first rule in any authorized subagent prompt.
- User confirmed `quality@fmeapex.online` is active and monitored. It is the internal notification recipient and customer Reply-To address.
- First executable task after implementation authorization: T01, starting with endpoint/configuration verification. Integrator owns schema/API contracts and completion evidence. Default to sequential execution; this plan does not authorize subagents, provider account creation, paid upgrades or publication.

## Goal and provider decision

A legitimate visitor submits the current form. The enquiry remains available in the backend; one separate notification goes to `quality@fmeapex.online`, and a separate acknowledgement goes to the visitor. Replies reach the monitored mailbox. Delivery failures never erase the enquiry or duplicate an already submitted email.

| Provider | Verified free transactional allowance | Capacity with two separate emails per enquiry | Decision |
| --- | --- | --- | --- |
| Resend | 3,000/month; 100/day | Up to 1,500/month and 50/day before other usage | Recommended |
| Brevo | 300/day; unused daily allowance does not roll over | Up to 150/day before other usage | Alternative if daily spikes exceed Resend's cap |
| MailerSend | 500/month | Up to 250/month | Too small for 500–1,000 enquiries/month |

These capacities are arithmetic, not a delivery guarantee. If the user's target means 500–1,000 **emails**, that is 250–500 paired enquiries; if it means 500–1,000 **enquiries**, allow 1,000–2,000 emails. Resend fits both monthly scenarios, but a burst above roughly 50 paired enquiries/day can defer mail. Other account usage, testing, and received Resend inbox emails share quota. Recheck the actual account plan at setup.

Use transactional `/emails`, not marketing Broadcasts or the marketing plan's contact allowance. No newsletter signup, automatic provider failover, paid overages or Resend inbox migration. Existing `quality@fmeapex.online` stays at its current mailbox provider.

Recommended architecture: existing NestJS endpoint + existing Neon/Postgres + a small durable mail outbox + Resend HTTPS API. Use a free Cloudflare scheduled Worker for hourly retry dispatch. No new Redis requirement, SMTP transport, paid Render cron or always-on worker is necessary for this initial volume. This is zero *additional service fee within allowances*, not a claim that the whole hosting stack has no limits.

## Verified findings and causal explanation

| ID | Finding and evidence | Consequence / remedy |
| --- | --- | --- |
| F01 | `frontend/src/features/landing/LandingPage.tsx:66` POSTs name/email/company/type/message to `${API_BASE_URL}/auth/contact`. It handles response.ok and form states. | The form is already wired in source. Do not replace it with a third-party hosted form or `mailto:` submission. Actual deployed URL/configuration has not been inspected in this research. |
| F02 | `backend/src/modules/auth/auth.controller.ts:48` is public. `AuthService.createContactInquiry`, `auth.service.ts:678`, only creates a database record. No mail call exists on that path; no mail package/configuration is present in the inspected dependencies and module. | Missing delivery integration explains absent emails; preserve database receipt and add delivery after persistence. |
| F03 | `backend/prisma/schema.prisma:775` ContactInquiry stores fields, isRead and createdAt. `user.controller.ts:34`, `user.service.ts:280` and `AdminPanel.tsx:144` expose the existing admin enquiry inbox. | Preserve historical rows and read/unread behavior. Never re-mail historical enquiries automatically. |
| F04 | Contact body is an inline TypeScript type. `main.ts` registers ValidationPipe, but this inline object supplies no decorated DTO validation. | Introduce a concrete validated class before enabling a public email-sending side effect. |
| F05 | `app.module.ts` imports ThrottlerModule but registers no ThrottlerGuard in APP_GUARD. | Module import alone is not proof this public route is protected. Install a contact-specific guard and test actual HTTP enforcement; do not globally change login/trial limits. |
| F06 | `backend/src/queues/queues.module.ts:31` exits without REDIS_URL and has no email queue. | Do not put important email work into an inert queue or rely solely on unawaited promises. Persist the two delivery jobs transactionally. |
| F07 | Existing deployment targets are Cloudflare Pages, Render and Neon. Current Dockerfile uses Node 22. Official Render free-service docs block SMTP ports 25/465/587 and describe idle suspension. | Use HTTPS; an in-process timer alone cannot guarantee retries. Scheduled retry calls must survive backend suspension. |
| F08 | Global contact enquiry reads are permission-gated but not tenant-filtered (`user.service.ts:280`); the general permission guard lets any Admin role bypass permission checks. | Existing central-inbox authorization needs its own assessment. Do not widen it by adding delivery payloads or generic resend controls to this release. No new public list/read/resend endpoints. Existing admin authorization is not evidence of platform-owner-only access. |

These are inspected source findings, not claims of successful production submissions. No real enquiry was submitted and no customer mail was sent during research. Legacy deployment prose contains stale commands; use current additive migration instructions, never copy old `db push` examples.

## D01 — Sender, recipients and message content

- Proposed sender: `FMEApex <contact@notify.fmeapex.online>`, conditional on verifying that sending subdomain. Store the actual chosen sender in backend configuration; never send from the visitor's address.
- Internal notification: To fixed `quality@fmeapex.online`; Reply-To validated visitor email; subject `New FMEApex enquiry — <allowed type>`; body contains reference, name, email, company, type, timestamp and full submitted message.
- Customer acknowledgement: To validated visitor email; Reply-To `quality@fmeapex.online`; subject `We've received your FMEApex enquiry`; plain-language body:

  > Hi {name}, thanks for contacting FMEApex. We've received your enquiry and our team will get back to you. Your reference is {reference}. You can reply to this email if you'd like to add anything. — FMEApex

- Two independent sends; no shared To/CC/BCC, no customer visibility of other leads. The customer receipt does not repeat arbitrary submitted message text or links, reducing its usefulness for email bombing/phishing.
- Use fixed, code-owned HTML and plain-text templates; escape all user strings; reject header line breaks in name/email/company. Message can contain newlines and Unicode. Never turn user input into raw HTML, headers, subject fragments beyond the validated type, or an arbitrary recipient.
- Match the site's paper/graphite/green/orange identity with email-safe markup, legible text and a text alternative. No remote tracking pixels, open/click tracking, invented SLA or marketing content.
- Add only provider-generated DNS verification records for the sending subdomain/return path. Preserve the existing root-domain inbound MX and mailbox configuration. A Resend sending identity is not a replacement for the working support inbox.

## D02 — Public request and receipt contract

Retain `POST /api/v1/auth/contact` and the five existing business fields. Add a decorated `ContactInquiryDto` with:

- name: trimmed, required, 1–150 chars; email: trimmed valid address, max254; company: optional trimmed, max200, empty -> null.
- type: exactly the existing four options: Demo Request; Excel Data Migration; Enterprise On-Premises License; Architecture & Security Review.
- message: trimmed required, 1–5000 chars; preserve meaningful newlines/Unicode.
- submissionId: optional UUID for legacy callers; required/generated by the updated homepage. Unknown body fields remain rejected by ValidationPipe.
- turnstileToken: max2048; required and verified for new production submissions; website: optional honeypot, must be empty. Do not silently discard a legitimate-looking request as success.

New success body: `201 { id, received: true, notifications: 'queued' | 'disabled' | 'dry_run' }`. Existing frontend uses only response.ok, so no consumer requires returning the full enquiry. Do not expose provider errors/credentials or claim inbox delivery.

Errors: 400 invalid fields; 403 challenge rejected/expired; 409 reused submissionId with changed business content; 429 contact-abuse limit; 503 challenge-verification service unavailable before acceptance; database failure -> normal server error, no emails. A provider failure AFTER database commit must still return the received result, with the queued record retained.

Front-end success wording: `Your enquiry has been received. Our team will get back to you.` Preserve entered values on errors. No acknowledgement-delivered claim and no promised response time.

## D03 — Additive persistence and idempotency

Extend ContactInquiry with nullable unique submissionId (UUID) and nullable contentHash (SHA256 of fixed-order normalized five business fields). Historical rows remain null. Do not backfill email jobs.

Proposed ContactEmailOutbox, platform-owned and related only to the existing central ContactInquiry:

- UUID id, inquiryId FK; kind OWNER_NOTIFICATION or CUSTOMER_ACK; unique(inquiryId, kind).
- state pending / sending / submitted / failed / needs_review / dry_run.
- Immutable provider payload snapshot (from, one to, reply_to, subject, html, text), templateVersion, stable provider idempotency key `contact/<outbox UUID>/v1`.
- attempts, nextAttemptAt nullable (null means held/manual review), leaseToken/leaseUntil nullable, firstAttemptAt/ambiguousSince nullable, providerMessageId/submittedAt nullable, sanitized errorCode, createdAt/updatedAt.
- Index pending state+nextAttemptAt; keep retry leases reclaimable, and updates conditional on the owning lease token. Do not add fake engineering tenant references or grant public access to the outbox.

In one Prisma transaction: check existing submissionId + hash, enforce daily recipient cap, create enquiry, create exactly two outbox records in live/dry_run mode. Rollback all if any creation fails. Concurrent uniqueness/serialization races must reload/retry safely; do not let the generic P2002 error handler turn a valid replay into an unrelated engineering conflict.

A matching previously accepted ID returns its existing receipt BEFORE attempting to consume another Turnstile token, and never creates new jobs. A changed payload gets409. First/new IDs still require challenge validation before persistence. Treat token and honeypot as transport fields, not contentHash inputs. Legacy no-ID callers get a server UUID, with no claim of network-retry deduplication across requests.

Keep initial POST retries and provider retries separate. Provider deduplication is only24h [S05], so it cannot replace durable submission uniqueness and submitted-state checks.

## D04 — Dispatch, retries and free-host execution

- Implement a small provider adapter using Node22 fetch and Resend `POST https://api.resend.com/emails`, Bearer API key, JSON payload and Idempotency-Key. No new email SDK is required for v1. Use an8s request timeout and persist the identical payload/key for every retry.
- After the transaction commits, await a bounded attempt for the new enquiry's two jobs, owner first, at most18s total. Do not hold a DB transaction during network I/O. If time expires, leave unfinished jobs durable; return received, not a form failure.
- Claim jobs atomically with a120s lease + fresh leaseToken; send outside the transaction; only the current lease owner can complete/change it. A reclaimed ambiguous send uses the same idempotency key. Successful accepted sends become submitted with the provider message ID and are never automatically resent.
- Dispatch one request at a time per invocation, initially at most one start per second; honor the provider's actual rate/reset/retry-after headers. Other invocations may overlap, but job leases and stable provider keys prevent duplicate work; do not assume a per-process throttle is a global quota.
- Network timeout and5xx are ambiguous: retry with the same key inside its24h window using delays1m,5m,15m,1h,4h,8h, with jitter. Stop automatic ambiguous retries at23h from the first ambiguous send or after7 attempts; mark needs_review. No exactly-once guarantee across unknown provider outcomes after expiry.
- Rate-limit429: respect retry-after/ratelimit-reset. Daily quota429: defer to next UTC day with jitter. Monthly quota429: set needs_review with errorCode monthly_quota_exceeded and null nextAttemptAt for operator review/reset verification; do not assume first-of-calendar-month equals the account billing reset. Definitively rejected quota sends differ from ambiguous network outcomes.
- Bad key/domain/payload: mark failed/configuration error, no tight retry loop, keep the enquiry and other delivery's outcome. Do not roll back or resend a submitted owner message because the acknowledgement failed.
- Only call a state submitted/provider-accepted. Without signed delivery webhooks, do not label it delivered, read or received by a person. Provider dashboard and a controlled inbox check supply initial delivery acceptance evidence.

Proposed maintenance route `POST /api/v1/internal/contact-email/dispatch`: dedicated constant-time shared-secret guard, fixed server batch limit10 and25s runtime budget, no request-supplied recipients or email bodies. JWT public annotation may be needed to bypass the normal login guard, but the dedicated secret guard is mandatory and fail-closed. Return aggregate counts only. Invalid/missing credentials must cause zero DB/network side effects. Extend neither public contact reads nor tenant admin permissions.

Add a tiny Cloudflare scheduled Worker (`ops/contact-email-retry/`) with an hourly trigger at minute7. It sends one authenticated HTTPS POST to the maintenance route with a120s timeout, checks the response and logs only aggregate outcome. Secret lives in Worker secrets and backend env, never the browser or URL. Do not deploy it during planning. Its job is backlog retry, not continuous artificial keep-alive. Bound batch processing and preserve all remaining work for later invocations.

Render free hosting can sleep; retries may be delayed by the hourly schedule and cold starts. Worker scheduled invocations have a15-minute wall-time limit; validate the tiny fetch-only implementation against the free CPU limit. No paid Render cron is part of the selected design.

## D05 — Configuration and abuse protection

Backend proposed env:

- `CONTACT_EMAIL_MODE=off|dry_run|live` (default off). Off preserves existing DB receipt and creates no email jobs; dry_run stores preview jobs that must never be promoted/sent automatically. Live requires valid sender/recipient, API key and production challenge configuration before activation. Provider failure after startup does not stop enquiry persistence.
- `RESEND_API_KEY`, `CONTACT_FROM_EMAIL`, `CONTACT_NOTIFY_EMAIL=quality@fmeapex.online`, `CONTACT_REPLY_TO=quality@fmeapex.online`, `CONTACT_EMAIL_DISPATCH_SECRET`.
- `TURNSTILE_SECRET_KEY`, `CONTACT_ALLOWED_HOSTNAMES` (explicit real deployed hosts, no wildcard); frontend only `VITE_TURNSTILE_SITE_KEY` (public).
- No API key, dispatch secret or Turnstile secret in VITE variables, native workbooks, committed env, logs or plan packets. Document placeholders in backend/.env.example and deployment docs.

Use a managed Cloudflare Turnstile widget with action contact, server Siteverify, hostname+action verification,5-minute/single-use token handling and fresh/reset challenges after errors. No real-account bypass in production; local tests use mocks or official test keys with live sending disabled. Keep the widget accessible and form content intact when challenge loading fails; show the monitored mailto fallback.

Contact-specific HTTP rate guard: initial product-policy default5 requests/IP/minute. Trust a forwarded client IP only after verifying the real Render/Cloudflare proxy topology; never trust arbitrary forwarded headers. Add a durable maximum of5 *new* accepted enquiries per canonical recipient email/UTC day (case-insensitive match), checked inside a serializable transaction with bounded retry. Matching idempotent replays do not consume this cap. These are configurable product protections, not provider limits; protect other auth/engineering routes from accidental throttling changes.

Keep the existing admin inbox untouched in v1 rather than adding email payloads or generic resend access to its currently global permission model. Log enquiry/outbox IDs, outcome/error codes and counts only; never full messages, tokens or mail bodies. Do not create a marketing contact or subscribe visitors.

## Tasks and evidence required

| ID | Outcome / owned edits | Dependency and verification |
| --- | --- | --- |
| T01 | First verify the deployed/build API base URL, backend health and contact-route/CORS configuration without sending a real enquiry; correct any demonstrated configuration failure before enabling mail. Fix shared contracts: new DTO under auth/dto; additive schema/migration; outbox types/repository under new backend/src/modules/contact-email; AuthService delegation and AuthModule wiring. | Read F01–F06/D02–D03. Verify create+two jobs atomic; old rows preserved; same-ID concurrency creates one enquiry/two jobs; changed payload409; DB rollback sends nothing. Update existing AuthService constructor mocks where injection changes. |
| T02 | Build provider adapter/config and two safe templates in contact-email; edit backend/.env.example. | T01. Snapshot rendering; validate From/To/Reply-To; Unicode/HTML escape/header injection tests; fake HTTP transport; inspect HTTP request fields and stable idempotency header. Missing live configuration fails activation; off mode retains current intake. |
| T03 | Add contact-specific guard, Turnstile validation and production mode gating; controller uses validated DTO. | T01–T02. Actual Nest HTTP tests prove limits/validation (not just DTO unit tests). Expired/forged/replayed challenges produce no email jobs; accepted retry works despite consumed token. Preserve login/trial endpoints. |
| T04 | Implement leased dispatcher, bounded request attempts, guarded maintenance endpoint and scheduled Worker source/config/tests. | T01–T03. Crash after remote acceptance, overlapping workers, partial pair failure, stale lease,429 variants, deadline,23h ambiguity and no-Redis cases; no accidental paid service dependency. Worker cold-start simulation and denied-token zero-side-effects test. |
| T05 | Update LandingPage contact submit flow and challenge component; preserve theme/labels/quote prefill. | Stable D02 plus T03. Generate submission UUID before first attempt, retain it across uncertain retries, rotate only on edited business content or confirmed success; refresh challenge independently. Test all success/error/challenge states, no double submit, no lost text, keyboard and narrow layout. Keep offer-prefill and trial routing unchanged. |
| T06 | Integration, setup guide, acceptance, README/graph/handoff. | T01–T05. Both builds, relevant backend regressions and meaningful new HTTP/transaction/provider tests; database verification in isolated transaction/schema only. Record actual evidence and remaining live setup gates. No production migration, DNS, real sends or release without appropriate user authorization. |

Proposed file ownership: integrator owns schema, auth controller/module/service and route contracts; provider slice owns contact-email templates/transport; dispatcher slice owns outbox dispatch and ops Worker; frontend slice owns only homepage form/challenge. If parallel work is later explicitly authorized, freeze T01 contracts first and include the graph-first rule in each packet. Otherwise execute the same sequence in one harness.

## Verification commands for the executor (not run during planning)

- From `F:/proj-fmea/backend`: `npx prisma validate`, `npx prisma generate`, `npm run build`, and `npm test -- --runInBand`. Tests must exercise real Nest validation/guards, a mocked provider transport, serializable duplicate submission races, partial pair outcomes and time-controlled retry/lease boundaries. Do not bypass existing regressions or relax production guards to make tests pass.
- From `F:/proj-fmea/frontend`: `npm run build` and `npx oxlint src/features/landing/LandingPage.tsx` plus new contact component files. Use actual browser checks at desktop and narrow widths, keyboard form submission, challenge expiry/retry, quote prefill, preserved entered data and accurate success/error text. Never put real customer data into test fixtures.
- Use an isolated test database/schema for migration preservation and concurrency tests, with fake external transport. Verify one historical enquiry remains unchanged and creates zero jobs; a new accepted enquiry creates one lead/two jobs; a request transaction rollback produces no external calls. Rolling back a database transaction cannot undo a real email.
- Exercise a fake-provider burst beyond100 daily emails: the provider refuses additional sends, accepted jobs stay submitted and unsent jobs remain queued/deferred without duplicate leads. Exercise monthly quota separately without assuming its reset date. Concurrency tests must assert durable uniqueness, not just frontend button disabling.
- After authorized schema deployment, use `npx prisma migrate deploy`, never destructive reset/db push. Production mail acceptance uses only the confirmed owner and an explicitly approved customer-test mailbox. Record provider IDs and both inbox receipts without publishing message content or secrets.
- Run `python .agents/skills/readme_sync/scripts/sync_readmes.py`, `graphify update .` after logical code batches, and update the relevant API/data/deployment rules, this plan's task states and ACTIVE_STATE. A later commit/push needs the separate confirmed release version required by repository rules.

## Acceptance matrix and shortcut safeguards

| ID | Tempting wrong assumption | Correct boundary / acceptance |
| --- | --- | --- |
| A01 | The form is disconnected, so replace it. | Preserve current API/database/admin contract; add missing delivery. Test persisted enquiry and two jobs. |
| A02 |1,000 enquiries means1,000 sends; marketing free contacts cover this. | Two recipients = two transactional sends; test exactly two independent payloads and calculate volume accordingly. |
| A03 | Set From to the visitor, or replace root MX to use Resend. | Verified sending subdomain, fixed sender; Reply-To visitor only on owner copy. Existing support mailbox still receives replies. |
| A04 | CORS/ThrottlerModule/TypeScript types already stop abuse. | Real DTO + route guard + server challenge + durable recipient cap; use actual HTTP tests and proxy validation. |
| A05 | A fire-and-forget call/Redis queue/Node timer guarantees mail. | Atomic outbox, bounded attempts, external scheduled retry; verify recovery with Redis absent and backend restart. |
| A06 | Retry the pair whenever either copy fails. | Independent job states; submitted copy is never resent. Simulate acknowledgement failure after owner success. |
| A07 | Idempotency keys are permanent or any repeated POST should be blocked. | Durable submission IDs; identical accepted replay returns receipt; provider24h window respected; changed-content409. |
| A08 | A provider200 means delivered to inbox. | State is submitted only; controlled inbox smoke test proves receipt. Optional signed webhook follow-up can add delivery status later. |
| A09 | Send pending rows when toggling dry_run/live, or mail all old enquiries. | Historical/null-ID and dry-run rows are excluded; live activation does not trigger a backfill. |
| A10 | Any tenant Admin can safely receive new global lead payloads. | No new admin listing/resend capability; flag existing central-inbox access separately rather than expanding it. |
| A11 | Browser environment can contain secrets; log provider errors verbatim. | Public site key only in frontend; tests scan client bundle/config and mocked logs for secret/body leakage. |
| A12 | Status ready means implemented or published. | Planning only. Keep status in_progress until tasks and live acceptance required for the agreed scope are evidenced; completed timestamp only after verification. |

Allowed discretion: local helper names, email-safe spacing and test fixture naming. Do not alter provider, recipients, authentication boundaries, retry semantics or quota meaning without a recorded plan revision. Replan if the deployed endpoint differs, the account has different caps, sender-domain ownership is unavailable, or the chosen free scheduler cannot operate under the current account.

## Activation, rollback and remaining gates

1. User authorizes implementation of this plan/revision. Implement and verify with mail mode off/dry_run; do not migrate production in this research turn.
2. Account owner creates/configures Resend Free, obtains a send-scoped key and verifies `notify.fmeapex.online` using provider-generated records. Do not expose keys in chat. Confirm From address, region and account quotas in the actual dashboard. Keep existing inbound MX intact and use existing compatible DMARC policy.
3. Prepare production Turnstile allowed hostnames, site/secret keys and the scheduled Worker secret/target. Verify real proxy/IP trust with forged-header HTTP tests before enabling the contact IP limiter; never use a guessed global trust-proxy setting. Existing Cloudflare access/account availability remains unverified.
4. After separately authorized deployment/migration, activate live only for a controlled test first. Owner notification goes to the confirmed mailbox; customer test address must be supplied/authorized. Verify both actual inboxes, reply routing and one subsequent retry without duplicate mail. Do not use real customers as test targets.
5. Enable hourly retries, inspect initial queue/provider outcomes, then open the normal form. No guaranteed response time or inbox-placement promise.
6. Rollback: switch mail mode off/disable dispatch to stop new sending while keeping the enquiry endpoint/database functional; preserve existing outbox evidence and old enquiries. Before re-enabling dispatch, inspect the pending backlog and explicitly decide whether those existing live jobs should resume; dry_run jobs always stay excluded. Never drop tables or delete leads to roll back.

Optional later scope: signed delivery/bounce/complaint webhooks and a platform-owner-only delivery dashboard/manual retry after the existing central-inbox authorization boundary is resolved. These are not required to describe provider-accepted status accurately in v1, and must not quietly expand this plan.

## Planning verification and execution log

- Inspected the exact frontend/controller/service/schema/admin and deployment paths above. Recorded current commit; no actual contact submission, provider credential inspection, DNS edit, migration, live send or production deployment occurred.
- Read official provider quotas and technical/hosting guidance; the user-supplied `https://resend.com/pricing.md` was fetched directly over HTTPS after the web reader rejected its Markdown content type. It confirms the selected free transactional cap. Sources and access limitations are in SOURCES.md.
- Synthetic executor walkthrough covered lost HTTP response, owner-success/customer-failure,24h idempotency expiry, backend sleep, consumed challenge replay, rate-limit resets and unsafe admin access. Safeguards above were incorporated; no independent subagent was spawned.
- Product builds/tests were not rerun for planning-only work; prior homepage release checks are historical evidence, not mail-integration tests. Every T01–T06 execution check remains unrun.
- Next authorized action: implementation is NOT yet requested. When authorized, mark in_progress, start T01 and checkpoint each task here. No release version/commit/push included.
