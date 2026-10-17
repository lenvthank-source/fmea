# Pull Request Checklist

## Code Quality
- [ ] Follows existing naming and file organization patterns
- [ ] No unused imports or variables
- [ ] Error handling uses NestJS built-in exceptions
- [ ] Frontend lint passes: `cd frontend && npm run lint` (oxlint)
- [ ] Backend lint passes: `cd backend && npm run lint` (eslint)

## Security
- [ ] Database queries include `tenantId` filter
- [ ] New endpoints have `@Permissions()` or `@Public()` decorator
- [ ] Guest users restricted from mutation endpoints
- [ ] Input validated via DTO class-validator decorators
- [ ] No secrets committed

## FMEA Domain
- [ ] S/O/D ratings constrained to [1, 10]
- [ ] AP values derived from lookup (not manually set)
- [ ] Locked revisions block write mutations
- [ ] Failure chains maintain completeness (mode has effect + cause)

## Build & Test
- [ ] `cd frontend && npm run build` passes
- [ ] `cd backend && npm run build` passes
- [ ] `cd backend && npm test` passes
- [ ] No TypeScript errors
