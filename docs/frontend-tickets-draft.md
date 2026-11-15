# SplitBill frontend tickets — approved breakdown

Source: [frontend specification](frontend-spec.md). This breakdown was approved for publication as GitHub issues. The backend endpoints and agreed contract are now available; the opt-in real-API journey is recorded in [the contract verification](backend-api-contract.md). Contract fixtures remain for controlled frontend tests and do not establish backend correctness. The GitHub issues are the status source; dependencies below record the approved implementation order.

## 1. Select a user and view their group's balances

**Blocked by:** None. The read API contract is agreed and implemented by the backend.

**What it delivers:** A user can select an identity and an accessible group and see its members, expenses and balance signs from the backend read API; controlled contract fixtures cover isolated frontend tests.

- [ ] Send the selected identity, show only returned groups and show members, newest-first expenses and clearly distinguished balances for the chosen group.
- [ ] Cover loading, empty and plain-language error states, user/group changes and stale responses.
- [ ] Fix the existing scaffold parsing issue as needed to run the journey; verify the journey against a controlled API and record real-API availability.

## 2. Record an equal-split expense

**Blocked by:** 1.

**What it delivers:** A member previews an equal split, records an expense and sees refreshed expenses and balances.

- [ ] Default payer and participants as agreed; allow changing them and preserve displayed member order in the request.
- [ ] Calculate without floating-point errors; `100.00` split three ways yields `33.34`, `33.33`, `33.33`; cover the agreed `0.01` zero-share edge.
- [ ] Validate positive amount and precision, send decimal strings and an idempotency key, and distinguish mutation success from refresh failure.
- [ ] Test the user-visible journey and error states against the contract; identify real API integration status.

## 3. Record an exact-split expense

**Blocked by:** 2.

**What it delivers:** A member enters selected participants' exact shares, sees the remaining or excess amount, and saves only a valid allocation.

- [ ] Show Remaining/Over by and disable submission until valid shares sum to the total; retain each mode's input when switching.
- [ ] Follow the agreed positive exact-share rule and document the assumption; submit only the active selected participants.
- [ ] Test under, over, matched and invalid-precision cases and successful refresh.

## 4. Delete an expense as its payer

**Blocked by:** 2; deletion API availability is a separate integration dependency.

**What it delivers:** A payer confirms and deletes an expense, then sees the updated list and balances.

- [ ] Show delete only to the payer, require confirmation and present backend authorization errors clearly.
- [ ] Verify successful deletion, refresh failure after success and behavior for a non-payer; the backend must enforce permissions and soft deletion.

## 5. Recover safely from uncertain submissions

**Blocked by:** 2.

**What it delivers:** A member understands when a create request may have succeeded and can retry the same request without generating a new idempotency key.

- [ ] Preserve the original payload and key for an identical retry; offer refresh to inspect current expenses before an edited request.
- [ ] Explain that an edited request uses a new key and an earlier unknown outcome may cause duplication.
- [ ] Block selection changes while mutation is in flight, restore controls on failure, and test delayed and uncertain outcomes.

## 6. Verify the complete journey with the real API

**Blocked by:** 3, 4 and 5. The corresponding backend endpoints and contract are available.

**What it delivers:** A reviewer can run the complete frontend journey against the actual backend and reproduce the documented results.

- [ ] Exercise selection, both split types, create, balance refresh, payer-only delete and errors with real API data.
- [ ] Record the backend tests or evidence for group authorization, zero-sum balances and concurrent idempotency; do not claim frontend tests prove them.
- [ ] Document money handling, assumptions, reproducible setup/tests and known limitations; verify required submission documentation and placeholder environment configuration.

## Published issues

- [Spec #1](https://github.com/ADISAK-PORNCHAROEN/splitbill-frontend/issues/1)
- [Ticket 1 — #2](https://github.com/ADISAK-PORNCHAROEN/splitbill-frontend/issues/2)
- [Ticket 2 — #3](https://github.com/ADISAK-PORNCHAROEN/splitbill-frontend/issues/3)
- [Ticket 3 — #4](https://github.com/ADISAK-PORNCHAROEN/splitbill-frontend/issues/4)
- [Ticket 4 — #5](https://github.com/ADISAK-PORNCHAROEN/splitbill-frontend/issues/5)
- [Ticket 5 — #6](https://github.com/ADISAK-PORNCHAROEN/splitbill-frontend/issues/6)
- [Ticket 6 — #7](https://github.com/ADISAK-PORNCHAROEN/splitbill-frontend/issues/7)
