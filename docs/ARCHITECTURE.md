# Architecture

Current boundary: Next.js App Router renders `src/app/page.tsx` under `src/app/layout.tsx`, styled by `src/app/globals.css`. No API client, persistence, backend or integration contract exists in this repository. The supplied brief specifies a separate FastAPI backend; do not infer an implemented service or payload beyond the brief.

Required journey: user selection → permitted groups → group expense entry and live allocation preview → API submission → refreshed expense list and balances. None is implemented. The brief identifies the requester via the `X-User` header. Coordinate API URL, error format and remaining request/response details with the backend before integration. Use decimal strings at the network boundary and integer satang or another exact representation for calculations; the eventual chosen approach belongs in README.
