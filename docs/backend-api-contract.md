# Backend API contract for the frontend

Status: **agreed target, not implemented or verified**. The backend currently exposes only the health endpoint. Use this contract to design the client and controlled mocks; passing against a mock is not evidence of integration with the real backend.

Source: backend `docs/FRONTEND-API-HANDOFF.md` provided on 2026-11-14 (SHA-256 `dc0692c6e9f09e0f88c7b7243d6575764151a35592a53ea464b1bcbca5994162`); backend `docs/BACKEND-SPEC.md` at `e6b3673dc66f7c657145c4f59a4384ebef77c8df`. The handoff was untracked in the backend working tree when read. Confirm the current backend contract and actual behavior before integration; update this record when the owners agree on changes.

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

Send `X-User` with every request. Missing, empty or unknown identities result in `400`. This header is a brief-specified identifier, not authentication. Send a nonempty `Idempotency-Key` for each create request. Configure the API origin separately; its deployment value and CORS configuration are not established.

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

The precise shape of `shares` and fields for groups, members and balances shown in the handoff are **proposals for mocks**, not final schemas. Keep them isolated at the API boundary; confirm before treating them as a stable contract. Likewise, the agreed error envelope is:

```json
{"error":{"code":"…", "message":"…"}}
```

Specific error codes and messages, including `INVALID_SPLIT`, are **proposed mock examples**, not a confirmed enumeration. Handle unknown codes and malformed or unavailable error responses without relying on a proposed code as exhaustive. Present errors in plain language. Never treat a frontend permission check as the authorization boundary.

## Integration verification

Test the agreed request, allocation and retry behavior with controlled API responses. When the backend endpoints are available, verify the same journeys against the real API, including `201`/`200`, `204`, `400`/`403`/`404`, plain-language errors and refreshed lists and balances. Test delayed responses when the selected identity or group changes. Record backend evidence separately for group access, zero-sum balances, payer-only soft deletion and concurrent idempotency. Real schema, CORS, API origin and error-code confirmation remain open until observed and agreed.
