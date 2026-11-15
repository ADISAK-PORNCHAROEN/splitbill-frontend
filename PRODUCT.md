# SplitBill frontend

Status: feature implementation and local verification are complete on `develop`; GitHub completion is pending the reviewed pull request merge. The PDF time-spent field still needs the owner's estimate before issue #7 and umbrella issue #1 are complete. Current evidence is in README.md, AI_NOTES.md and docs/backend-api-contract.md. Source requirements are Developer-Take-Home-Test.pdf pages 1–4 (user-provided brief) and the owner's grill-with-docs decisions.

## Purpose and users

The brief describes group members recording shared costs and seeing net balances. The frontend is a single Next.js, TypeScript and Tailwind page integrated with the API. Visual design is not assessed; correctness, usability and code quality are.

## Required journeys and acceptance

- Select a user and only that user's groups; enter description, amount, payer, and either equal shares among selected members or exact shares.
- Preview shares live. Exact mode shows the unallocated amount and disables submission until shares equal the total. Explain API errors in plain language.
- Show expenses and distinguish amounts owed to and by each member. Format THB amounts such as `1,000.00`.
- Match backend allocation: `100.00` split in order among three gives `33.34`, `33.33`, `33.33`. Avoid floating-point error: `0.1 + 0.2` displays `0.30`; document the approach in README.

## Business constraints from the brief

Exact shares sum to the total to the satang; distribute equal-split remainder one satang at a time in listed order. Group balances sum to exactly zero. Transmit monetary amounts as strings, reject amounts at most zero or with more than two decimal places. Payer and all split members must belong to the group; only group members access it. Repeating an idempotency key in a group returns the original expense, including concurrent requests. Expenses are immutable; only the payer may soft-delete one, and deleted expenses are excluded from balances. Backend is authoritative for enforcement.

## Status and decisions

The page implements the specified user/group, expense, split, balance and payer-delete journeys. Verification status is tracked in [the backend API contract](docs/backend-api-contract.md) and [testing guide](docs/TESTING.md); mock checks and real-backend checks are reported separately. The brief requires documenting assumptions and the backend choice of 403 or 404 for unauthorized group access, with rationale, in README, and AI use in AI_NOTES.md. No deadline date is inferable without the brief receipt date. See docs/ARCHITECTURE.md.

## Frontend decisions confirmed by owner

- Show an expense delete action only to the current user when they are the payer; confirm before deletion and refresh expenses and balances after success. The backend remains authoritative for permissions.
- Use English for the interface.
- Give the interface a distinctive design while retaining all required features, correctness, usability and necessary states.

- Equal-split participants follow the order displayed in the group; preview and submitted order must match.
- On user or group change, clear the form; warn before discarding unsaved input.
- Agree the API contract with the backend, use test/development fixtures as needed, and separately verify integration with the real API when available.
- Visual direction: warm and friendly, while retaining all required functionality, clarity and states.

- On opening an expense form, default the payer to the selected user and select all group members for the split; allow changes. Preserve each split mode’s inputs when switching modes within the same form; preview and submit only the active mode.
- On an uncertain network failure, let the user retry the same request with the same idempotency key. Editing the payload creates a new request and key; do not imply this prevents duplicates if the earlier result is unknown.
- Show distinct loading, empty and error states for groups, expenses and balances.

- When a submission outcome is unknown after a network failure, explain uncertainty, offer retry of the identical request with its original key, and offer refreshing expenses to inspect before editing and sending a new request.
- In exact mode show Remaining when under-allocated and Over by when over-allocated; prevent submission until shares match.
- Ignore stale responses after changing the selected user or group; display only the current selection’s data.
- Show amount validation next to the input and disable submission for zero, negative, or more than two decimal places; never round an invalid input silently. Selected exact shares must be positive under the agreed backend target.

- Both split modes allow selecting participants; exact mode displays and submits shares only for selected members. Selected exact shares must be positive under the agreed backend target.
- After a successful create or delete, reload expenses and balances. Distinguish mutation success from a later refresh failure, and offer refresh retry.
- Accept ungrouped decimal entry such as `1000.50`; format displayed amounts with grouping such as `1,000.50`.

- The owner and backend handoff agree on positive shares for selected participants in exact mode; document this project assumption in README. Equal allocation allows zero shares when there are fewer satang than participants.
- Disable user/group switching while a mutation request is in flight; restore controls on failure and communicate uncertain outcomes.

- The owner selected the revised Clear Together visual direction on 2026-11-15; see DESIGN.md for desktop and mobile reference images. The prototype uses illustrative data and is not the implemented product.
