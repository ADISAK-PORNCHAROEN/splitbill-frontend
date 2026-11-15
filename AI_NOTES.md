# AI notes

Codex assisted with the project foundation, requirements documentation, selected visual prototype, implementation and verification. The approved source documents remain the user's brief, `docs/frontend-spec.md`, `PRODUCT.md`, `DESIGN.md` and `docs/backend-api-contract.md`.

## Implementation decisions

- Group and expense data is scoped to selected user/group keys in TanStack Query. The API boundary validates responses and keeps identity, HTTP details and backend error codes out of the visual components.
- Monetary state uses integer satang and `BigInt`; request amounts and shares are decimal strings. Equal remainder follows displayed participant order. Positive selected shares in exact mode follow the agreed backend contract and are documented as a project rule.
- Unknown create outcomes retain the original payload and idempotency key. The UI warns before sending an edited draft with a new key. A retry-success regression test preserves edits made to the visible form.
- Payer-only deletion is a convenience boundary in the UI; backend authorization remains authoritative.
- `src/app/prototype/` and its design references are preserved as an illustrative, disconnected design artifact. It is not presented as production data.

## Verification and review trail

The mock-backed browser suite and unit suite verify frontend behavior; they do not prove backend persistence, authorization or concurrent idempotency. An explicitly enabled local integration browser test uses seeded group 1 against a dedicated disposable backend database and removes only the records returned by its own create operations. Exact commands, coverage and limitations are recorded in `docs/TESTING.md` and `docs/backend-api-contract.md`.

For every implementation commit, review the staged diff against the brief and API contract, check for accidental design/prototype changes and secrets, and run the applicable checks. Record each commit and its actual review/check outcome here before pushing. Do not infer success from a mock run when reporting real API behavior.

## Review log

- `feat(money): add exact satang allocation`: reviewed the staged domain parser, formatter, allocator and boundary tests against positive range, precision, ordered remainder and exact-share rules; `npm test` passed 16 tests and `npx tsc --noEmit` passed.
- `feat: implement connected SplitBill workspace`: reviewed the API boundary, query/mutation state, forms, design references and retained prototype for contract alignment and scope; lint and TypeScript passed, all 16 unit tests and 12 mock browser scenarios passed, and desktop/mobile behavior was inspected against the owner-selected reference.
- `test: verify the real SplitBill journey`: reviewed the opt-in integration harness for loopback-only API access, isolated test-data cleanup and contract assertions; 12 mock browser scenarios, one production-build real-API journey and 37 backend tests passed, with one upstream deprecation warning. README, setup and ticket guidance were checked against the actual run.
- `test: stabilize the mocked group retry`: a final production-build browser rerun exposed that the fixture assumed two initial requests, which differs from Next development mode. It now holds the mocked outage until the retry action; production-build Playwright passed all 12 mock scenarios, Vitest passed 16 tests, and lint and TypeScript passed.
