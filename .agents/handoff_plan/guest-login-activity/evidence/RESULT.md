# Baseline reproduction result

Date:2026-10-21. Source: main@4781f8b45e12a1db3c6e9402e324dd1a8e97582d, version0.12.3.

Executed the real AuthService.createGuestUser, getMe and UserService.checkAndArchiveInactiveUsers using installed TypeScript runtime, a fake transaction/client and fake token signer. Original inline fixture exited0 with:

```
REPRODUCED: guest session succeeds while both activity timestamps are null.
REPRODUCED: /me records activity, but lastLoginAt remains null, so the current admin cell still says Never logged in.
CONFIRMED: archive predicate does not read lastActivityAt.
ISOLATION: mocked Prisma and token signing only; no database, accounts or real sessions used.
```

Persisted PostgreSQL rows were not inspected; defaults were reproduced from the inspected nullable schema without default values. The screenshot's exact deployed revision and production impact counts remain unverified. Password-login write failures were observed as a possible source path, not simulated on a live account.

The saved baseline-repro.cjs is the portable form of the same fixture. It is historical evidence, not the future correctness test. After the fix, its null assertions should no longer pass. The implementation must add positive desired-behavior tests under normal backend suites.
