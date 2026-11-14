# Testing

- `npm test` runs Vitest unit tests in `tests/unit/`.
- `npx playwright install chromium` installs the browser required for the first local E2E run.
- `npm run test:e2e` starts an isolated local Next.js development server and runs Playwright in `tests/e2e/`.
- `npm run lint` checks project source; bundled agent skill packages are excluded.
- `npm run build` checks the production build.

The current tests cover shared control markup and the scaffold home page, not the unimplemented API journeys. For behavior changes, use `.agents/skills/test-engineering/SKILL.md` and select meaningful tests for user/group access, split allocation, exact mismatch, money precision, API errors, balance signs and payer-only deletion. Backend concurrency and access guarantees require backend integration tests. Review every code diff with `.agents/skills/security-review/SKILL.md`.
