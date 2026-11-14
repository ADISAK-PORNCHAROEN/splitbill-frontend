# Testing

`package.json` exposes `npm run lint` and `npm run build`; no test script or test runner is configured. Select checks appropriate to the change. The existing scaffold has an extra closing `</main>` in `src/app/page.tsx`, so buildability is not established. No commands were run for this documentation setup.

For behavior changes, use `.agents/skills/test-engineering/SKILL.md` and assess observable cases: user/group access, selection and membership, equal allocation including remainders in order, exact mismatch and unallocated amount, input precision/positive amounts, Thai formatting, API errors, balance signs, and payer-only deletion if implemented. Verify integer precision and decimal string boundaries with realistic edge cases. Review every code diff with `.agents/skills/security-review/SKILL.md`. Document actual commands and results; backend concurrency and access guarantees require backend tests, not frontend assertions.
