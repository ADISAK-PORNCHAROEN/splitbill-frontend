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
