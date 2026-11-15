# Testing

## Standard checks

- Before running the app, the production build or mock-backed browser tests, copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_API_BASE_URL` to an HTTP or HTTPS backend origin. The browser can read this value, and Next.js embeds it at build time. Mock-backed browser tests intercept API requests and do not require a running backend.
- `npm test` runs Vitest under `tests/unit/`.
- `npm run lint` runs the configured ESLint checks.
- `npx tsc --noEmit` checks TypeScript separately.
- `npm run build` checks the production build.
- `npx playwright install chromium` installs the browser for the first local browser run.
- `npm run test:e2e` starts a Next.js development server on `127.0.0.1:3100` and runs `tests/e2e/` against mock API responses.

## Behavior coverage

The Vitest suite covers exact satang parsing/formatting, range and precision limits, ordered equal-split remainder, positive exact allocations, API headers and payload strings, response-shape validation, cancellation and error translation.

The mock-backed Playwright suite covers per-user groups, delayed stale responses, empty and retryable error states, equal and exact previews, under/over/matched shares, invalid amount precision, submitted order/shape, payer-only delete confirmation, same-key/same-payload uncertain retry with edited draft preservation, refresh failure after successful creation and narrow mobile layout. Mock response shapes in this suite come from the agreed [backend API contract](backend-api-contract.md); mocks cannot prove backend behavior.

## Real backend integration

An opt-in `tests/e2e/real-api.spec.ts` drives the browser against the current local backend contract. It needs seeded users `alice`, `bob`, `carol` and group 1; a backend configured to allow the app origin; and a dedicated local test database. The spec creates two uniquely named expenses, validates the equal and exact shares returned by the API, replays the same key/payload, checks a zero-sum balance, verifies that Bob cannot delete Alice's expense, deletes the test expenses and checks refreshed UI data. Its `403`, `404` and `400` status probes use Playwright's direct API request client because the UI correctly hides or blocks those requests. Mock-backed browser tests cover the user-visible error messages; they do not prove backend response behavior.

Start a local frontend and backend using their normal development commands. Then set:

```powershell
$env:PLAYWRIGHT_BASE_URL = "http://127.0.0.1:3100"
$env:SPLITBILL_REAL_API = "1"
$env:SPLITBILL_REAL_API_URL = "http://127.0.0.1:8000"
npm run test:e2e -- tests/e2e/real-api.spec.ts
```

The real test refuses non-loopback API hosts. Still point it only at a dedicated, disposable local database: it creates records and deletes only IDs returned by its own create calls. Never direct it at shared, staging or production data. When `PLAYWRIGHT_BASE_URL` is set, Playwright uses that existing frontend server and does not start its own. Otherwise the default test command owns and starts its local server.

## Previous backend integration run

On 2026-11-15, `npm test` passed 16 tests, `npm run lint` passed, `npx tsc --noEmit` passed and `npm run build` passed. The mock-backed `npm run test:e2e` run passed 12 scenarios and skipped the one opt-in real-API case. The real-API case passed separately against the production Next.js app and the backend using an isolated local database. The backend `uv run --locked pytest` run passed 37 tests with one upstream Starlette/httpx deprecation warning. See [the API contract](backend-api-contract.md) for the real journey's observed statuses and limits.

## Public-readiness verification

On 2026-11-16, `npm test` passed 25 tests, `npm run lint` passed, `npx tsc --noEmit` passed and `npm run build` passed with a loopback API origin. A separate build with `NEXT_PUBLIC_API_BASE_URL` unset failed with the expected setup error. The mock-backed `npm run test:e2e` run passed 12 scenarios and skipped the opt-in real-API case. This run did not call a backend or use database data. The detailed source and history review is in [the public-readiness audit](PUBLIC-READINESS-AUDIT.md).

Record mock and real-backend outcomes separately. Backend tests are the evidence for concurrent idempotency, payer-only soft deletion, group access and zero-sum invariants. Run `npm run lint`, unit tests, browser tests, typecheck and build for a code change. Read `.agents/skills/test-engineering/SKILL.md` and `.agents/skills/security-review/SKILL.md` for behavior changes.
