# AI notes

AI assistance was used to scaffold this Next.js frontend from the supplied take-home brief. The current page is a placeholder and does not implement the required group, expense, split, or balance flows. No automated tests have been added or run.

The frontend dependency audit reported seven moderate advisories in the transitive TypeScript ESLint development-tool chain and no high or critical advisories. `npm audit fix` did not resolve them; no forced upgrade was applied.

## Review process for workflow and planning changes

Codex assisted with the project workflow, specification and GitHub issue planning. Before each commit, review the staged diff for unintended changes, secrets and accuracy against the brief; check changed links and run checks appropriate to the staged content. The scaffold has an extra closing `main` tag discovered during source review; it remains to be fixed as part of frontend implementation. Do not claim tests passed without running them.
