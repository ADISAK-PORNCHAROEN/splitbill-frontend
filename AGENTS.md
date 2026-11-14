# SplitBill Frontend Agent Guide

Next.js App Router frontend for the SplitBill take-home brief; the present page is a scaffold.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Working agreements

- Preserve existing changes and distinguish the brief's requirements from implemented behavior. Read the installed Next.js documentation before code changes.
- Money must follow the brief: decimal strings at the API boundary, no floating-point monetary calculations, deterministic satang allocation in member order. Keep assumptions documented in README.md.
- Never commit secrets; keep API authorization and errors explicit. Do not install tools, alter hooks, deploy or transmit data without the appropriate request.
- Work primarily on `develop`. When an issue or ticket is complete, open a pull request from `develop` to `main` and merge it after the required reviews and checks pass; link the issue to the pull request. Do not close the issue before the corresponding change is merged.
- Preserve an incremental commit history for the take-home submission: when committing, split work into meaningful, independently reviewable changes and verify each change as appropriate. Do not submit all work as a single bulk commit. Review AI-generated code before each commit and record the review process in `AI_NOTES.md`.

## Find the source

- Entry points are `src/app/page.tsx`, `src/app/layout.tsx`, and `src/app/globals.css`. Use `.agents/skills/graphify/SKILL.md` for relevant discovery when its CLI or supported existing-graph fallback is available; confirm results against source. Otherwise use targeted search.

## Read by task

| Task | Read first |
| --- | --- |
| Product behavior | PRODUCT.md and CONTEXT.md |
| UI design | DESIGN.md and the existing host Impeccable skill; do not download its separate engine without an explicit user request |
| Architecture and API | docs/ARCHITECTURE.md; for API integration, mocks, errors or retry behavior also read docs/backend-api-contract.md |
| Tests and behavior changes | docs/TESTING.md and `.agents/skills/test-engineering/SKILL.md` |
| Every code change | `.agents/skills/security-review/SKILL.md` and docs/TESTING.md |
| Security | SECURITY.md and docs/SECURITY-MODEL.md |
| Hooks, only on explicit request | `.agents/skills/hook-management/SKILL.md`; establish host, scope, event and behavior first |
| Workflow status | docs/AI-FOUNDATION-REPORT.md and docs/agents/skills-checklist.md |

## Completion

Report actual verification, limitations and unresolved failures. `npm run lint` and `npm run build` exist; choose checks appropriate to the change and do not claim unrun checks passed. Vitest and Playwright commands are documented in `docs/TESTING.md`.
