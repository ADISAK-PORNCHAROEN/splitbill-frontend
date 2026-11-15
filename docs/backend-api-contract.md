# Backend API contract for the frontend

Status: **implemented by backend; frontend integration verified locally on 2026-11-15**. The verification used a production Next.js build, the API at `127.0.0.1:8000` and a dedicated seeded PostgreSQL test database. Mocks alone do not establish integration with the real backend.

Source: backend `docs/FRONTEND-API-HANDOFF.md` at commit `8e4763a93ea31e4c10aacac95585750e3ca8ec0f` (SHA-256 `a6ba4c3fb8c2eb62c716e17e5864b862dfd67798a93b583c56a973817eb6fb23`), read on 2026-11-15. Confirm the current backend contract and actual behavior before integration; update this record when the owners agree on changes.

## Endpoints and identity

Group endpoints use the following paths without an `/api` or `/api/v1` prefix. The existing health endpoint under `/api` is separate.

| Method | Path | Behavior |
| --- | --- | --- |
| GET | `/groups` | List the requester's groups. |
| GET | `/groups/{group_id}` | Get the group and its members. |
| POST | `/groups/{group_id}/expenses` | Create an expense or replay the original result. |
| GET | `/groups/{group_id}/expenses` | List active expenses newest first, then by descending ID for equal timestamps. |
| DELETE | `/groups/{group_id}/expenses/{expense_id}` | Soft-delete an expense; payer only. |
| GET | `/groups/{group_id}/balances` | Get every member's net balance, including zero. |

Send `X-User` with every request. Missing, empty or unknown identities result in `400`. This header is a brief-specified identifier, not authentication. Send a nonempty `Idempotency-Key` for each create request. Configure the API origin separately. The backend defaults to allowing browser origins `http://localhost:3000` and `http://127.0.0.1:3000`; set its `CORS_ORIGINS` for other origins. The deployment origin is not established.

Seeded users: `alice`, `bob`, `carol`, `dan`. Group 1, Chiang Mai trip: alice, bob, carol. Group 2, Office lunch: bob, dan.

## Money and allocation

Transmit all monetary values as decimal strings such as `"1000.00"`, never JSON numbers. A positive expense amount must have at most two decimal places and fit `NUMERIC(12,2)`; reject zero, negative, excess precision and overflow. The frontend must calculate and preview without floating-point errors.

For an equal split, send an ordered, nonempty list of unique group members. Distribute remaining satang one at a time in that order. `100.00` across alice, bob and carol gives `33.34`, `33.33`, `33.33`. `0.01` across three may yield `0.01`, `0.00`, `0.00`.\n
```json
{"description":"Dinner", "paid_by":"alice", "amount":"100.00", "split":{"type":"equal", "members":["alice","bob","carol"]}}
```

For an exact split, each selected member's share is positive and the shares must sum exactly to the expense amount. This positive-share rule is an agreed project decision, not a stated PDF requirement. Payer and participants must be group members, but the payer need not be a participant.

```json
{"description":"Dinner", "paid_by":"alice", "amount":"100.00", "split":{"type":"exact", "shares":{"alice":"50.00", "bob":"30.00", "carol":"20.00"}}}
```

A positive balance means money is owed to that member; negative means they owe money. All group balances must sum to exactly `0.00`.

## Mutation and retry behavior

- A newly created expense returns `201` and the expense; a valid replay of a previously used key in the same group returns `200` and the original expense without creating another, even if the new valid body differs or the requester is another member.
- Identity, group access and request validation apply before replay. An invalid request returns `400`; a nonmember receives `404`.
- The key remains reserved after soft deletion. Replay returns the original expense without restoring it or creating a duplicate. The backend must guarantee this under concurrency; frontend tests cannot prove that guarantee.
- For an uncertain network outcome, retain the original key **and payload** for retry. If the user edits the payload, use a new key and explain that the earlier request may already have succeeded; offer to refresh the expense list.
- Payer deletion returns `204` with no body. A nonpayer member deleting an active expense gets `403`; a repeat deletion and a nonmember request get `404`. Deleted expenses remain stored but are excluded from normal lists and balances.

## Response and error boundary

Agreed success responses are JSON objects or arrays directly, without a `data` wrapper, except `204` deletion which has no body. All monetary fields are strings. Expense responses contain `id`, `group_id`, `description`, `paid_by`, `amount`, `shares` and `created_at`.

The current backend handoff confirms these shapes: groups are `{id, name}`, group detail adds `members` as usernames, balances contain `{member, balance}`, and expense `shares` maps usernames to decimal strings. Keep these details isolated at the API boundary. The error envelope is:

```json
{"error":{"code":"…", "message":"…"}}
```

The current backend uses `bad_request`, `not_found`, `forbidden`, `http_error`, and `internal_error`. Handle unknown codes and malformed or unavailable error responses without assuming this list is exhaustive. Present errors in plain language. Never treat a frontend permission check as the authorization boundary.

## Integration verification

The mock-backed browser suite verified UI states, delayed/stale selection behavior, validation, allocation previews, payer-only visibility, confirmation, same-key/same-payload retry, preserved edits, and refresh failures. `npm run test:e2e` passed 12 mock-backed scenarios; it skips the opt-in real-API spec by default.

The opt-in browser test ran against the production frontend and a real backend at `127.0.0.1:8000`, using a dedicated local PostgreSQL database and CORS permission for `127.0.0.1:3100`. It passed one full journey covering Alice's accessible group, member and balance display, equal allocation and `201`, same-key replay and `200`, exact shares for selected members and `201`, newest-first list refresh, Bob's hidden delete control and payer API rejection `403`, inaccessible group `404`, invalid precision `400`, payer deletion `204`, refreshed expenses and balances, and zero-sum balances. The `403`/`404`/`400` assertions use direct requests from the test runner; visible API error copy is covered by mock-backed browser tests. The form blocks invalid precision before it sends a request. The test removed only the two IDs it created. Backend `uv run --locked pytest` passed 37 tests, including the backend's group authorization, balance, payer-only soft deletion and concurrent idempotency coverage; one upstream Starlette/httpx deprecation warning was reported.

The frontend unit suite passed 16 tests, lint, TypeScript check, production build and 12 mock browser scenarios. The real browser test passed separately with `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3100` and `SPLITBILL_REAL_API=1`. These results establish local integration only. The deployment API origin and any future contract changes still need confirmation before deployment.
