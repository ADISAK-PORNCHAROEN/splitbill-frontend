# Security model

## Browser and backend boundary

The browser calls the backend directly through `NEXT_PUBLIC_API_BASE_URL`. Next.js embeds this value in the client bundle at build time. Treat it as public configuration. It must contain only an HTTP or HTTPS origin, with no credentials, path, query or fragment. The frontend uses no backend keys, database credentials or other server secrets.

The identity selector sends the selected sample identity in `X-User`. It demonstrates the take-home API contract and does not authenticate a person. Payer-only controls in the UI improve the experience but do not authorize deletion. The backend must enforce identity, group access, input validation, idempotency, deletion permissions and balance calculations.

The frontend displays expense and group data returned by the configured backend. Do not connect this sample identity flow to production data or treat client-side state as an authorization decision.

## Local configuration and tests

Keep `.env.local` and other `.env.*` files out of Git. Commit only `.env.example`, which contains a loopback API origin for local setup. The Playwright real-API test is opt-in and rejects non-loopback API hosts. Run it only against a dedicated local test database. Mock-backed browser tests do not require a backend.

## Review limits

This repository review covers frontend source, configuration, tests, documentation and available Git objects. It does not verify a deployed backend, its secrets manager, authentication, authorization or production CORS configuration. The deployment API origin has not been established. `SECURITY.md` records that no security reporting channel or supported-version policy has been supplied.
