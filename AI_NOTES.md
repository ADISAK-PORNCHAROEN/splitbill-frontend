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
- `fix: align responsive layout and submission docs`: applied independent review findings by using Tailwind for responsive structure and correcting stale project guidance. The production build, lint, TypeScript, 16 Vitest tests, 12 mock browser tests and one real-API browser journey passed.
- `docs: record elapsed project time`: checked the estimate against the first recorded implementation commit and completion date, labeled it as elapsed calendar time rather than measured active work, and ran the Markdown whitespace check.
- `docs: add quick-start walkthrough assets`: reviewed the captured production UI frames and confirmed the 26.56-second WebM plays in Chromium. All API responses were browser-mocked; no production data was used.
- `docs: feature quick-start video on README front page`: placed the linked preview directly below the title, compared setup and verification commands with `package.json`, `.env.example` and `docs/TESTING.md`, and added the documented TypeScript check. Local playback and GitHub's rendered README endpoint confirm that the poster is visible and links to the WebM; GitHub renders it as a clickable preview rather than an inline player.
- `docs: add direct quick-start video link`: kept a plainly visible WebM link while preparing the attachment-backed README player. GitHub's Markdown API strips a regular `<video>` element, so the repository-relative file alone cannot provide the requested inline player.
- `docs: embed the GitHub video attachment`: uploaded the existing WebM through `gh pr create --attach` and verified the committed GitHub README renders one `<video>` player whose media source returns `200 video/webm`. The repository WebM remains as a downloadable copy.
- `fix: require a valid public API origin`: reviewed the browser/API boundary against the installed Next.js environment-variable guide, confirmed `NEXT_PUBLIC_API_BASE_URL` is the only app setting, checked that no local environment or key file is tracked, and scanned available Git history without printing candidate values. Unit tests passed 25 cases, lint and TypeScript passed, mock-backed Playwright passed 12 scenarios with the real-API case skipped, and the configured production build passed. A build without the required variable failed with the expected setup error. No backend or database was contacted.
- PR [#10](https://github.com/ADISAK-PORNCHAROEN/splitbill-frontend/pull/10) merged `develop` into `main` with the full incremental commit history and closed issues #2–#6. At that merge, the umbrella and real-API journey issues remained open while the take-home submission estimate was pending; see their GitHub records for current status.

## Prompt examples

1. The owner asked to implement every open frontend issue against the approved PDF requirements while preserving the selected design and existing working-tree changes. That prompt named the source of truth, scope and preservation constraints.
2. The owner required a real-backend journey when the endpoints were ready, separate reporting for mock and backend evidence, and no issue closure before its acceptance criteria passed. That prompt made backend claims and issue status depend on observable results.

## Incorrect AI output and correction

An early mock browser fixture assumed Next.js would send two group-list requests before showing an API error. The production-build browser run made only one request before the user's retry, so the fixture returned the same error again and the test failed. The test exposed the mistaken assumption. The fixture now holds the outage until the test explicitly permits the user retry, and the production-build browser suite passes.

An independent review also found the implementation guide still called the page a scaffold and required Tailwind. The responsive app shell and grid now use Tailwind utilities, and the guide reflects the connected page. Design-specific component rules stay in the scoped stylesheet.
