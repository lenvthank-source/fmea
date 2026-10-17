# Testing Rules

## Current Test Coverage

The project has minimal automated test coverage.

### Backend Tests

| Test File | Type | What It Tests |
|---|---|---|
| [app.controller.spec.ts](file:///f:/proj-fmea/backend/src/app.controller.spec.ts) | Unit | `AppController.getHello()` returns `'Hello World!'` |
| [ap-calculator.spec.ts](file:///f:/proj-fmea/backend/src/modules/pfmea/ap-calculator.spec.ts) | Unit | AIAG-VDA 2019 AP lookup across S/O/D boundary values |
| [app.e2e-spec.ts](file:///f:/proj-fmea/backend/test/app.e2e-spec.ts) | E2E | `GET /` endpoint integration test |

### Frontend Tests

- **No test files exist** in `frontend/src/`
- No `test` script in `frontend/package.json`

## Test Commands

```bash
# Backend unit tests
cd backend && npm test

# Backend unit tests (watch mode)
cd backend && npm run test:watch

# Backend test coverage
cd backend && npm run test:cov

# Backend e2e tests
cd backend && npm run test:e2e

# Backend debug tests
cd backend && npm run test:debug
```

Source: [backend/package.json](file:///f:/proj-fmea/backend/package.json)

## Test Framework

- **Backend**: Jest 30 + ts-jest + supertest (for e2e)
- **Frontend**: No test framework configured

## Test Configuration

- E2E config: [test/jest-e2e.json](file:///f:/proj-fmea/backend/test/jest-e2e.json)
- Test files excluded from production build via [tsconfig.build.json](file:///f:/proj-fmea/backend/tsconfig.build.json)

## Build Validation

```bash
# Frontend type-check + build
cd frontend && npm run build   # runs: tsc -b && vite build

# Frontend lint
cd frontend && npm run lint    # runs: oxlint

# Backend compile
cd backend && npm run build    # runs: nest build

# Backend lint
cd backend && npm run lint     # runs: eslint with --fix

# Backend format
cd backend && npm run format   # runs: prettier --write
```

## Testing Guidelines

- Follow existing test patterns (Jest `describe`/`it` blocks)
- AP calculator tests demonstrate boundary-value testing approach
- Use `@nestjs/testing` `Test.createTestingModule()` for unit tests
- Use `supertest` for e2e HTTP tests
- New features should add tests following existing patterns when applicable
