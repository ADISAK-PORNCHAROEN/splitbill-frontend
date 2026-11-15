# Architecture

The App Router entry at `src/app/page.tsx` renders the client-driven SplitBill workspace. `src/app/providers.tsx` provides TanStack Query. The API identity is selected in the browser, so group data is intentionally fetched client-side after a user is known.

## Data flow

1. `src/app/_components/splitbill-screen.tsx` owns selected user/group, query keys, mutation lifecycle, request retries and notices.
2. TanStack Query caches by resource, user and group. Request abort signals and selection-scoped keys prevent stale responses from appearing in the active view.
3. `src/lib/api/splitbill.ts` is the HTTP boundary. It sends `X-User` and `Idempotency-Key`, validates the agreed response shapes and translates network/HTTP/contract failures.
4. `src/lib/splitbill/` uses integer satang and `BigInt` to preview splits exactly. Amounts cross the API boundary as decimal strings.
5. `src/app/_components/workspace.tsx` composes SplitBill-specific form, balance and expense panels. Global native control primitives remain under `src/components/ui/`.
6. `src/app/prototype/` is a standalone illustrative design page, not part of the connected expense journey.

## Source organization

- `src/app/`: Next.js routes, layout, global styles and client provider.
- `src/app/_components/`: page-specific SplitBill composition and workspace controls.
- `src/components/ui/`: reusable accessible controls without SplitBill or API logic.
- `src/hooks/`: reusable React hooks when a feature needs them.
- `src/lib/api/`: HTTP requests, response validation and API errors.
- `src/lib/splitbill/`: money parsing, formatting and allocation rules.
- `tests/unit/` and `tests/e2e/`: Vitest boundary/domain tests and browser journeys.

Use [docs/backend-api-contract.md](backend-api-contract.md) as the API source of truth for paths, headers, response/error shapes, allocation, authorization and retry behavior. Backend enforcement remains authoritative for membership, validation, idempotency, balances and deletion. Mocks exercise frontend responses; the opt-in local real-API browser spec exercises the integration without implying production coverage.
