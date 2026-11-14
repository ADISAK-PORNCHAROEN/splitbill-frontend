# Architecture

The Next.js App Router renders `src/app/page.tsx` under the server `src/app/layout.tsx`. `src/app/providers.tsx` is the client boundary for TanStack Query. The existing home page is a static scaffold; no SplitBill API integration or user journey is implemented yet.

## Source organization

- `src/app/_components/`: components specific to the SplitBill page.
- `src/components/ui/`: reusable native UI controls. These controls do not contain SplitBill or API logic; callers supply accessible labels.
- `src/hooks/`: React hooks for future data and interaction logic.
- `src/lib/api/`: future API boundary, including identity headers and error translation.
- `src/lib/splitbill/`: future pure money and allocation logic.
- `src/types/`: shared domain types when contracts are established.
- `tests/unit/` and `tests/e2e/`: Vitest and Playwright tests.

Future flow: select user → permitted groups → entry and allocation preview → API submission → refresh expenses and balances. The brief identifies requests with `X-User`; the accepted backend specification describes `/groups` and its endpoints, but those endpoints are not yet implemented. Coordinate actual response/error contracts and CORS before integration. Use decimal strings at the network boundary and exact monetary representation. Selection occurs in the browser; do not claim group data is server-rendered before a user is known.
