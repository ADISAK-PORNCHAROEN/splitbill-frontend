# SplitBill frontend

A responsive Next.js App Router frontend for the SplitBill take-home brief. Members can select a user and permitted group, inspect expenses and balances, preview equal or exact shares, add expenses and delete expenses they paid. The selected Clear Together visual design is documented in [DESIGN.md](DESIGN.md), with reference images in [docs/design](docs/design/). The separate `/prototype` page is an unlinked illustrative artifact with sample data.

## Run locally

1. Install Node dependencies with `npm ci`.
2. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_API_BASE_URL` to the backend origin.
3. Start the backend with its documented local setup and start this app with `npm run dev`.
4. Open `http://localhost:3000` and choose an identity. The backend must allow this browser origin in `CORS_ORIGINS`.

The sample identity selector is not authentication. The backend treats `X-User` as a take-home test identity and must enforce group access, expense validation, idempotency, deletion permissions and balance calculations itself. Do not deploy the sample identity selector as authentication.

## Money and API decisions

- Parse user input into integer satang with `BigInt`; never calculate money with binary floating-point numbers. Format displayed amounts to two decimals and include grouping separators.
- Send monetary fields as decimal strings. Expense amounts must be positive, fit `NUMERIC(12,2)` and have no more than two decimal places. Invalid precision is rejected without rounding.
- Equal splits allocate remainder satang in displayed and submitted member order. Thus `100.00` for Alice, Bob and Carol is `33.34`, `33.33`, `33.33`; `0.01` may be `0.01`, `0.00`, `0.00`.
- Exact shares for selected members must be positive and sum exactly to the total. Positive selected shares are an agreed project/backend rule, not a requirement explicit in the PDF.
- The frontend displays delete only to the payer and asks for confirmation. The backend remains authoritative. Per the current backend contract, nonmember group access is `404` to avoid disclosing the group, while a group member attempting to delete another payer's active expense receives `403`.
- Each new create uses an idempotency key. An uncertain retry preserves the exact original payload and key. An edited request requires a new key and may duplicate an earlier request whose outcome is unknown; the UI warns and offers a refresh.

See [docs/backend-api-contract.md](docs/backend-api-contract.md) for response shapes, error codes and the handoff revision. The frontend behavior and edge cases are specified in [docs/frontend-spec.md](docs/frontend-spec.md).

## Verify

```sh
npm test
npm run lint
npm run build
npx playwright install chromium
npm run test:e2e
```

Playwright starts a local Next.js server on port `3100` for the mock-backed browser journeys. To run the real-API browser journey, start the backend against a dedicated, disposable test database, allow the Playwright origin in its CORS settings, then set `PLAYWRIGHT_BASE_URL`, `SPLITBILL_REAL_API=1` and optionally `SPLITBILL_REAL_API_URL` before running:

```sh
npm run test:e2e -- tests/e2e/real-api.spec.ts
```

The real-API spec accepts only `localhost` or `127.0.0.1` API origins. It creates uniquely named expenses in seeded group 1, checks reads, balances, exact/equal splits, replay, invalid requests and payer permissions, then deletes only expense IDs returned from those creates. Run it only against a dedicated local test database, never a shared, staging or production dataset. Mocks verify frontend behavior at the API boundary; they do not prove backend authorization or persistence. Backend tests separately verify group authorization, zero-sum balances, payer-only soft deletion and concurrent idempotency.

Detailed test scope and setup notes live in [docs/TESTING.md](docs/TESTING.md). Project architecture is in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). AI-assisted work and review records are in [AI_NOTES.md](AI_NOTES.md).
