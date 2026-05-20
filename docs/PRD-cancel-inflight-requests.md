# PRD: Cancel In-Flight GET Requests on Route Change

## Problem Statement

When a user navigates away from a page that has a pending network request, the request continues running in the background until it completes. The browser's Network tab shows these requests as active even after the user has moved to a different route. This wastes bandwidth, adds unnecessary load to the backend, and in edge cases can cause stale data to interfere with the current view.

## Solution

Wire React Query's built-in cancellation mechanism to the HTTP client so that in-flight GET requests are automatically aborted when the user navigates away. React Query v5 already passes an `AbortSignal` to every `queryFn` via `QueryFunctionContext` — the signal fires when the query's observer unmounts (i.e., route change). The fix is to forward that signal to the `ky` HTTP client on every read query, so the underlying `fetch` call is aborted.

Mutations (POST, PUT) are intentionally excluded. Cancelling a write mid-flight risks partial state on the backend. Aborted requests produce a silent cancellation — no error state, no UI feedback — which is the correct behavior for a navigation-triggered cancel.

## User Stories

1. As a user navigating between pages, I want pending data requests to be cancelled, so that bandwidth is not wasted on data I will never see.
2. As a user navigating away from the Donations list, I want the in-flight donations fetch to abort, so that the browser shows the request as cancelled in the Network tab.
3. As a user navigating away from the Donors list, I want the in-flight donors fetch to abort automatically.
4. As a user navigating away from the Expenses list, I want the in-flight expenses fetch to abort automatically.
5. As a user navigating away from the Users list, I want the in-flight users fetch to abort automatically.
6. As a user navigating away from the Dashboard, I want any pending balance or summary queries to abort automatically.
7. As a user navigating away from the Reports page, I want any pending report queries to abort automatically.
8. As a user navigating away while a detail page (e.g. donation edit) is loading, I want the single-resource fetch to abort automatically.
9. As a user, I want cancelled requests to be completely silent — no error toast, no error state, no UI change.
10. As a developer, I want create and update mutations to continue completing even if the user navigates away, so that no data is lost or partially written.
11. As a developer, I want the cancellation to be handled at the data layer (query hooks), not in individual page components, so the behavior is consistent across all routes.
12. As a developer, I want the 401 logout hook on the API client to remain unaffected — aborted requests never reach `afterResponse`, so no spurious logouts occur.

## Implementation Decisions

### Modules Modified

- **Query hook files** (`use-donations`, `use-donors`, `use-expenses`, `use-users`, `use-dashboard-data`, `use-reports`): Each `useQuery` call's `queryFn` must destructure `signal` from `QueryFunctionContext` and pass it to the ky request options. No other changes.
- **API client** (`src/lib/api.ts`): No changes needed. ky accepts `signal` as a per-request option. The 401 `afterResponse` hook is not affected because aborted requests do not reach response hooks.
- **Mutation hooks**: No changes. `useMutation` calls do not receive a signal from React Query.

### Architectural Decisions

- Cancellation is handled at the query hook layer, not at the component or router layer. This keeps components unaware of the cancellation mechanism.
- React Query v5's built-in signal is used — no manual `AbortController` creation is needed anywhere.
- The fix is purely additive: one destructured parameter and one option added per `queryFn`. No new abstractions, no new utilities.
- Mutations are out of scope. POST and PUT calls continue to completion regardless of navigation.

### Cancellation Behavior

- React Query aborts the signal when the query's last observer unmounts, which happens when the route-owning component unmounts.
- ky forwards the signal to `fetch`, which natively aborts the HTTP request at the browser level.
- The thrown `AbortError` is caught by React Query, which marks the query as cancelled (not errored). No UI state changes.

## Testing Decisions

A good test verifies observable behavior, not internal wiring. The right test confirms that navigating away causes the network request to abort — not that `signal` is passed to ky.

### What to test

- **Query hook cancellation**: Mock the ky API client. Call the query hook. Abort the signal that React Query would pass. Verify ky's request was called with a signal and that the signal was aborted.
- **No error state on abort**: After aborting, verify the query does not transition to `error` state and no error is surfaced to the component.

### Modules to test

- Each modified query hook (`useDonations`, `useDonors`, `useExpenses`, `useUsers`, and dashboard/report hooks).

### Prior art

- Existing tests in `src/features/*/` that mock `api` from `@/lib/api` and assert on `useQuery` behavior can serve as the baseline pattern.

## Out of Scope

- Cancelling mutations (POST, PUT, DELETE) on navigation.
- Any UI indication that a request was cancelled.
- Cancellation for non-navigation scenarios (e.g., rapid filter changes causing previous query to be superseded — React Query handles this differently via query key changes and stale-while-revalidate).
- Changes to the router or route guards.
- Changes to the `api.ts` client configuration.

## Further Notes

- React Query v5 introduced automatic signal threading as the recommended pattern. This change brings the codebase into alignment with that recommendation.
- The `ky` library (v2.0.1) passes `signal` directly to the underlying `fetch` call, so no ky-specific workaround is needed.
- This change reduces backend load proportionally to the number of navigations users make before slow requests complete — most impactful on slow connections or large data sets (reports, paginated lists).
