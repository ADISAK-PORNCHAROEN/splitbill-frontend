# SplitBill frontend specification

Status: Approved and published as [GitHub issue #1](https://github.com/ADISAK-PORNCHAROEN/splitbill-frontend/issues/1). Source: Developer Take-Home Test PDF, especially pages 2–4, and the owner's grill-with-docs decisions through Q21. This document remains the normative frontend specification; implementation and verification status is recorded separately in README.md and the backend API contract.

## Problem Statement

A member of a group needs to record shared costs and understand who owes or is owed money. Without a working interface, members cannot select their group, preview an accurate split, manage their own expenses, or see current balances.

## Solution

Provide one usable, responsive English-language page with a warm, friendly visual identity. Connect it to the API to select an identity and group, show members, expenses and balances, preview exact monetary allocations, create expenses and allow a payer to delete their own expenses. Clearly communicate loading, empty, validation, success, failure and uncertain-submission states.

## User Stories

1. As a member, I want to select my identity, so that requests represent me.
2. As a member, I want to see only my groups, so that I can select a group I can access.
3. As a member, I want to choose a group, so that I can view its members and shared costs.
4. As a member, I want to know when a group is loading or unavailable, so that I can distinguish waiting from an error.
5. As a member without groups, I want an empty-state message, so that I know there is no group to select.
6. As a member, I want to see the group's expenses from newest to oldest, so that I can inspect recent costs.
7. As a member, I want to see an empty expense state, so that I know no expenses have been recorded.
8. As a member, I want to see every member's balance, so that I can understand the group's position.
9. As a member, I want money owed to a person distinguished from money owed by them, so that the signs are clear.
10. As a member, I want zero balances displayed clearly, so that I know when nothing is owed.
11. As a member, I want to enter an expense description and positive amount, so that I can record a shared cost.
12. As a member, I want the current user as the default payer, so that common expenses take less effort to enter.
13. As a member, I want to choose another group member as payer, so that I can record a cost paid by someone else.
14. As a member, I want all group members selected initially, so that I can easily split a group expense.
15. As a member, I want to choose split participants, so that a cost applies only to the people sharing it.
16. As a member, I want an equal split preview, so that I know each share before submitting.
17. As a member, I want remaining satang assigned in the displayed member order, so that the preview agrees with the API.
18. As a member, I want to enter exact shares, so that I can record unequal allocations.
19. As a member, I want to see an amount remaining or over-allocated, so that I can correct an exact split.
20. As a member, I want invalid amounts and mismatched shares explained, so that I can fix them before submitting.
21. As a member, I want invalid precision rejected without silent rounding, so that the recorded amount is what I intended.
22. As a member, I want to switch split modes without losing each mode's inputs, so that I can compare options.
23. As a member, I want only the active split submitted, so that the recorded allocation matches the preview.
24. As a member, I want money formatted with Thai grouping and two decimals, so that amounts are easy to read.
25. As a member, I want exact arithmetic, so that small fractions do not create incorrect shares or balances.
26. As a member, I want a clear success message, so that I know when an expense was recorded.
27. As a member, I want plain-language API errors, so that I know what went wrong.
28. As a member, I want an uncertain network outcome explained, so that I do not assume a request failed when it may have succeeded.
29. As a member, I want to retry the identical uncertain request safely, so that I reduce the risk of duplicate expenses.
30. As a member, I want to refresh the expense list after an uncertain result, so that I can inspect the group's current state.
31. As a payer, I want to delete my expense after confirmation, so that I can correct an unwanted record.
32. As a member, I want another payer's delete action unavailable, so that the interface reflects the access rule.
33. As a member, I want balances and expenses refreshed after a change, so that I can see the current result.
34. As a member, I want refresh failures separated from a successful mutation, so that I do not repeat a successful operation.
35. As a member, I want a warning before my unsaved form is discarded on changing user or group, so that I do not lose work unexpectedly.
36. As a member, I want only the selected user's and group's data displayed, so that late responses do not show the wrong context.
37. As a member, I want controls disabled while a mutation is in flight, so that I do not accidentally change its context.
38. As a mobile or keyboard user, I want clear, operable controls and feedback, so that I can complete the same journey.
39. As a developer, I want reproducible setup, test instructions and money decisions documented, so that I can verify and explain the implementation.

## Implementation Decisions

- Use a single Next.js page with TypeScript and Tailwind. Preserve all required behavior while applying a warm and friendly design.
- The backend is authoritative for membership, authorization, amount validation, allocation, balances, idempotency and soft deletion. Frontend checks improve feedback but do not enforce access.
- Follow [the backend API contract](backend-api-contract.md) for agreed paths, headers, responses and deletion behavior. The current backend handoff confirms response shapes, error codes and local CORS defaults. Configure the API origin and verify the running backend before claiming integration.
- Represent money without floating-point arithmetic. Send decimal strings and document the chosen approach. Reject an expense amount of zero or less or more than two decimal places.
- Equal-split preview uses the same participant order sent to the API and assigns one remaining satang at a time from the start. A positive expense can yield zero shares when there are more participants than satang; the backend handoff agrees.
- The agreed backend target requires positive shares for selected participants in an exact split. This is a project assumption, not an explicit PDF requirement; document it. Include only selected members in the active split.
- Default payer to the current user and select all group members. Preserve each mode's inputs while switching; submit only the active mode. Clear the form after confirmed user/group switching and warn before discarding unsaved input.
- Disable user/group switching during mutation requests. Ignore responses that no longer belong to the active selection. Show distinct loading, empty and error states.
- Retry an identical request after an uncertain failure with its original idempotency key. An edited request uses a new key and may duplicate a previously successful unknown outcome; offer refresh and explain the uncertainty.
- Display the delete action only for the payer and require confirmation. The backend must reject unauthorized deletion. Refresh expenses and balances after successful mutations; present refresh failure separately from mutation success.
- Show API errors in plain language. No full authentication or expense editing is in scope.

## Testing Decisions

- Prefer user-observable behavior over internal implementation details. The owner approved the primary seam: render the page in a browser against a controllable API boundary, then perform the critical journey against the real backend when available.
- Verify exact money and allocation boundaries through behavior-level unit tests and end-to-end journeys. Vitest and Playwright cover the agreed mock and real-local-API seams; see [docs/TESTING.md](TESTING.md).
- Cover `100.00` across three members, `0.01` across three, exact under/over allocation, invalid `10.005`, zero/negative expense amounts, selection order and `0.1 + 0.2 = 0.30` without floating-point money errors.
- Cover identity/group changes, stale responses, loading/empty/error states, authorization errors, delete visibility and confirmation, success followed by refresh failure, unknown submission outcomes and identical retry keys.
- Validate the completed journey with the real API. Backend tests separately prove zero-sum balances, group access, payer-only soft deletion and concurrent idempotency; frontend mocks alone cannot prove these guarantees.

## Out of Scope

Full authentication, expense editing, settlement suggestions and repayments. Backend implementation is a separate dependency, not a claim that it is complete. Deployment, optional extensions and visual work that displaces required functionality are outside this specification.

## Further Notes

The implementation and backend handoff are tracked in this repository; the contract records which API behaviors were exercised locally and which guarantees are established by backend tests. The take-home brief additionally requires reproducible README instructions, assumptions and design decisions, AI_NOTES, placeholder environment configuration, incremental commits and no secrets. The release-wide submission layout remains outside this frontend implementation. The owner approved the proposed testing seam and ticket breakdown.
