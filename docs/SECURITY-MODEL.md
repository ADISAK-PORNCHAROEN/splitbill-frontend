# Security model

Current application is static scaffold with no observed API calls, authentication or persistence. The brief specifies `X-User` identity, membership-gated group access, payer-only soft deletion, and idempotent expense creation. The frontend must not be treated as the enforcement boundary: the API must enforce these rules. API origin, deployment and error contracts remain unestablished. Never commit secrets. Review actual trust boundaries when integration is introduced; this setup did not execute a security scan.
