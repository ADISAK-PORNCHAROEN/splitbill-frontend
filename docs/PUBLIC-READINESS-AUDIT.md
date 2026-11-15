# Public-readiness audit

Audit date: 2026-11-16

Branch: `develop`

## Result

The audit found no confirmed secret or credential in the tracked source or Git history that was available for review. It found one production-code environment fallback and removed it. The API origin now comes from `NEXT_PUBLIC_API_BASE_URL`, which the client validates before making requests.

The remaining literal URLs, ports and identities belong to local setup instructions, mock fixtures, or the opt-in local integration test. The report classifies them below. It does not mark the repository public-ready. The repository remains private, deployment settings have not been reviewed, and `SECURITY.md` has no documented reporting channel or supported-version policy.

## Scope and method

The initial post-change scan at commit `0da788d` covered all 14 local refs after fetching both remote branches and all seven advertised GitHub pull-request head refs. Those refs contained 275 reachable Git objects, including 160 blobs. The full local object database contained 441 objects and 275 blobs, including 115 unreachable blobs and 51 unreachable trees; Git reported no unreachable commits. This includes dangling objects left by prior local work, not only the files currently reachable from a branch.

After PR [#15](https://github.com/ADISAK-PORNCHAROEN/splitbill-frontend/pull/15) merged as `97af779`, a final scan fetched every remotely advertised ref (two branches and eight pull-request head refs; no tags or merge refs) and included all local refs. At that snapshot, 15 refs contained 283 reachable Git objects, including 163 blobs. The local object database contained 449 objects and 278 blobs, including 115 unreachable blobs and 51 unreachable trees; Git reported no unreachable commits. The same 14 raw pattern matches remained, and all were triaged as described below. This snapshot covers `main` at `97af779` and `develop` at `5b62613`, before this documentation-only update.

A Python standard-library scan read the blobs without printing matched values. It checked for private-key blocks, common provider token formats, JWT-shaped strings, credentials embedded in URLs, and quoted assignments to secret, token, password, database and key fields. It reported 14 raw pattern matches: one credential-shaped URL at `tests/unit/api.test.tsx:15`, verified as synthetic invalid-input test data, and 13 generic sensitive-assignment matches in an old unreachable local Impeccable helper. The helper references a token supplied at runtime through `window.__IMPECCABLE_TOKEN__`; it contains no token value and is excluded from the tracked project. These are false positives, and no confirmed secret or credential was found. A separate sensitive-name match in `DESIGN.md:5` referred to visual design tokens.

No dedicated secret scanner was installed. The scan used available Git and Python tools and did not install additional software. The tracked source includes no CI workflow, deployment manifest, database connection string, server credential or production feature flag. The only tracked `.env*` file is `.env.example`. No `.env`, `.env.local` or `.env.production` file exists in the working tree. Git ignores those paths and common private-key file extensions, and no ignored secret file is tracked.

## Findings and classifications

| Location | Classification | Risk and evidence | Remediation and status |
| --- | --- | --- | --- |
| `src/app/_components/splitbill-screen.tsx:17` before this change | Environment value | A loopback API URL silently became the production default when configuration was missing. A deployed browser could send requests to the wrong origin. | Removed the fallback. `SplitbillApi` now rejects missing or malformed configuration with a setup error. Fixed and covered by unit tests and a missing-variable build check. |
| `src/lib/api/splitbill.ts:87-104`, `.env.example:2`, `README.md:18,22`, `docs/TESTING.md:5`, `docs/SECURITY-MODEL.md:5` | Environment value, intentionally public | `NEXT_PUBLIC_API_BASE_URL` is the browser's backend origin. Next.js embeds it in client JavaScript at build time. It contains no credential and is not a server secret. | Kept as the only app environment variable. The client accepts an HTTP or HTTPS origin and rejects credentials, paths, queries and fragments. Setup docs state that the origin is public and must be set before each build. |
| `playwright.config.ts:3,7,9-10`, `docs/TESTING.md:11,26-32` | Test environment values | `PLAYWRIGHT_BASE_URL` selects a test server. The default browser server binds to loopback on port `3100`. The examples use local ports only. | Kept as local Playwright configuration. It does not configure the deployed app. |
| `tests/e2e/real-api.spec.ts:3-11`, `docs/backend-api-contract.md:3,20,65,67` | Test environment values and historical test evidence | The opt-in test uses a loopback API default, a `SPLITBILL_REAL_API` gate, seeded test identities and a dedicated local database. The test rejects non-loopback API hosts. | Kept as test-only configuration. This audit did not set the opt-in flag or contact an API or database. The documentation labels the values and evidence as local integration. |
| `.gitignore:27-43` | Secret-file exclusion | `.env*` files and common private-key file extensions are ignored, with `.env.example` as the only exception. No ignored credential files are tracked. | Kept and extended for `.key`, `.p8`, `.p12`, `.pfx`, `.jks` and `.keystore`. |
| `tests/unit/api.test.tsx:4,15` | Mock data and false positive | The API client uses a local mock origin. A malformed-origin test includes a fake username and password to verify that credentials are rejected. Neither value authenticates to a service. | Kept as test fixtures. They are not configuration and do not belong in `.env`. |
| `README.md:20`, `docs/backend-api-contract.md:20` | Local setup values | `localhost` and `127.0.0.1` with port `3000` describe the development browser origin and backend CORS defaults. They are not deployment origins. | Kept as local documentation. The deployment origin remains unconfigured and must be supplied at build time. |
| `src/app/prototype/page.tsx:6` | Framework setting, false positive | `NODE_ENV` is set by Next.js and hides the unlinked prototype in production. It is not a project feature flag or secret. | Kept as a standard framework environment check. |
| `DESIGN.md:5` | False positive, project constant | The scanner matched the word `tokens` in the visual design specification. These values describe the interface, not access tokens or environment settings. | No change. Design constants remain in design documentation. |
| Old unreachable Impeccable helper blobs, `impeccable/scripts/live-browser.js:22,4151,4171,4215,4264,4283,5348,5570,5821,6293,6450,7571,11590,11602` | False positive, local tooling reference | An excluded local helper reads a browser token from `window.__IMPECCABLE_TOKEN__` and inserts the runtime value into local automation requests. The Git object is not reachable from any branch, tag or pull-request ref. No token value is stored in the blob. | No repository change. The helper is not part of the tracked project or the refs that can be pushed. |
| `SECURITY.md:3` | Open project-policy item | The file says that no security reporting channel or supported-version policy exists. This audit did not verify whether GitHub private vulnerability reporting is enabled. | Still open. The repository owner must choose and document the reporting channel and supported versions. This audit does not claim public readiness while the policy remains undefined. |

Project identities such as Alice and Bob, group ID `1`, sample amounts and the equal-split rules are test or domain data. They are not secrets or environment settings and remain in fixtures and contract documentation. Public documentation links, the README's public video attachment, package registry URLs and `NODE_ENV` are static project or tool values, not runtime API configuration.

## Security review

The review followed the repository's manual security-review contract. The relevant OWASP Top 10:2025 category is [A02 Security Misconfiguration](https://top10.owasp.org/2025/A02_2025-Security_Misconfiguration/) because a missing deployment origin previously fell back to loopback. The code now fails when the value is missing or malformed.

The selected ASVS 5.0.0 checks are [V13.3.1](https://github.com/OWASP/ASVS/blob/v5.0.0/5.0/en/0x22-V13-Configuration.md), which prohibits backend secrets in source and build artifacts, and [V14.2.1](https://github.com/OWASP/ASVS/blob/v5.0.0/5.0/en/0x23-V14-Data-Protection.md), which prohibits sensitive values in URLs and query strings. The frontend uses no backend secret. The API origin parser rejects credentials and query strings. Backend secret storage and deployment behavior are outside this repository review.

No WSTG deployment scenario was run because this audit had no deployed target. Mock-backed browser tests exercised the local UI only. The real-API test was skipped, so this review makes no new claim about backend authorization or persistence.

## Verification

- `npm test`: 25 tests passed.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run test:e2e`: 12 mock-backed tests passed and the opt-in real-API test was skipped.
- `npm run build` with a loopback API origin: passed.
- `npm run build` with `NEXT_PUBLIC_API_BASE_URL` unset: failed with the expected setup error.
- `git diff --check`: passed.
- `git check-ignore` covered `.env`, `.env.local`, `.env.production` and common private-key extensions. `git ls-files -ci --exclude-standard` and the tracked secret-file query returned no files.

No production or shared data was used. No secret rotation was indicated by this scan. No Git history was rewritten. The repository visibility remains private.
