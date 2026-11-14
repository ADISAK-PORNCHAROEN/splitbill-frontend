# AI notes

AI assistance was used to scaffold this Next.js frontend from the supplied take-home brief. The current page is a placeholder and does not implement the required group, expense, split, or balance flows. The initial scaffold had no automated tests.

The frontend dependency audit reported seven moderate advisories in the transitive TypeScript ESLint development-tool chain and no high or critical advisories. `npm audit fix` did not resolve them; no forced upgrade was applied.

## Review process for workflow and planning changes

Codex assisted with the project workflow, specification and GitHub issue planning. Before each commit, review the staged diff for unintended changes, secrets and accuracy against the brief; check changed links and run checks appropriate to the staged content. Source review found an extra closing `main` tag in the AI-assisted scaffold; it was removed when establishing the frontend structure, and the page was checked with a build and browser smoke test. Do not claim tests passed without running them.

## Frontend structure

Codex helped establish shared controls, a TanStack Query provider, source folders, and Vitest/Playwright setup. The feature flows remain unimplemented. Review the staged diff, package audit, relevant tests and build before committing AI-assisted code.
