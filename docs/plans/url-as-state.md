# Spec: URL as State — migrate in-page UI state to search params

## Context

The request was to "explore using the URL/route as application state." Exploration showed the app **already uses react-router v7 for all top-level navigation** (lazy routes in `src/app-routes.tsx`, `ProtectedRoute`/`RoleRoute` guards, sidebar `NavLink`s). What is *not* in the URL is in-page UI state held in local `useState`: pagination, sort, date-range filters, the reports tab, and the donor-statement selection. Consequence today: reload or shared link loses list position/sort/tab.

**User decisions (locked):**
- Scope: **pagination + sort** (4 list pages), **reports tab + donor selection**. Out of scope: date-range filters, donor free-text search, modals, sidebar collapse.
- Approach: **hand-rolled hooks over `useSearchParams`** — no new dependency (no nuqs).
- Reports tab as **query param** (`/reports?tab=expenses`), not nested routes.
- History: **`replace` + clean defaults** (default values omitted from URL) for page/sort/donorId; **push** for tab switches (tabs feel like places; Back toggles tabs but never steps through pagination/sort tweaks).

On approval, this spec is saved to `docs/plans/url-as-state.md` in the repo (first implementation step, before any code).

## Objective

Reload- and share-safe list/report state: `/donations?page=2&sort=amount,asc` and `/reports?tab=donor-statement&donorId=5` restore exactly that view. Success = deep links work, defaults keep URLs clean, Back never steps through filter tweaks, all existing tests pass.

## Tech Stack

React 19 + TypeScript, Vite 8, react-router 7.15 (`useSearchParams` — currently used nowhere), Vitest 4 + Testing Library + MSW, Biome. No new dependencies.

## Commands

- Test: `pnpm run test` (watch: `pnpm run test:watch`)
- Lint/format: `pnpm run check`
- Build: `pnpm run build`
- Dev: `pnpm run dev` (port 3000)

## Design

### `src/lib/use-page-param.ts` (new)

URL param is **1-based** (human-facing: `?page=3` is what the UI labels "Page 3"); internal state stays **0-based** (matches the API). Page 1 is the clean default — no param. Parse with `Number()`, not `parseInt` — strict rejection of `'1.5'` / `'2abc'` instead of silent truncation.

```ts
export function usePageParam() {
  const [searchParams, setSearchParams] = useSearchParams()
  const raw = searchParams.get('page')
  const parsed = raw === null ? Number.NaN : Number(raw)
  const page = Number.isInteger(parsed) && parsed >= 2 ? parsed - 1 : 0

  function setPage(next: number) {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev)
      if (next <= 0) params.delete('page')
      else params.set('page', String(next + 1))
      return params
    }, { replace: true })
  }
  return { page, setPage }
}
```

Call sites change `setPage((p) => p + 1)` → `setPage(page + 1)` (value derived from URL; no functional overload).

### `src/lib/use-sort.ts` (rework)

Signature changes from `useSort(initial, onSortChange?)` to `useSort(defaultSort, sortableFields)`:
- Reads `sort` from URL; falls back to `defaultSort` when the param is missing or invalid (field not in allowlist, or dir not asc/desc — prevents `?sort=foo,asc` reaching the API).
- `toggleSort` writes `sort` **and deletes `page` in the same `setSearchParams` call** (atomic — replaces the `onSortChange: () => setPage(0)` callback; two separate calls would clobber each other).
- Default sort → param deleted (clean URL). `{ replace: true }`.
- `sortIndicator` / `ariaSort` unchanged.

Per-page field allowlists (from existing `toggleSort` call sites):
- donations: `useSort('donationDate,desc', ['donationDate', 'amount'])`
- donors: `useSort('fullName,asc', ['fullName'])`
- expenses: `useSort('expenseDate,desc', ['expenseDate', 'amount'])`
- users: `useSort('username,asc', ['username'])`

### List pages (identical mechanical diff × 4)

`src/features/{donations,donors,expenses,users}/…-page.tsx`: drop `const [page, setPage] = useState(0)`, use `usePageParam()`, pass field allowlist to `useSort`. DateRangePicker `onChange` still calls `setPage(0)` — single URL writer per event, safe. React-query hooks unchanged (`page`/`sort` feed query keys as before; back/forward hits cache naturally).

### `src/features/reports/reports-page.tsx`

- `ReportsPage`: `activeTab` derived from `?tab=` (validated against the 3-tab enum, invalid → `'donations'`). `selectTab` sets/deletes `tab` (default `donations` omitted) **and deletes `donorId`** (tab switch unmounts DonorStatementTab today, losing selection — preserve that). Uses default **push** navigation, functional-updater form like all other writers.
- `DonorStatementTab`: `donorId` derived from `?donorId=` (parsed with `Number()`; positive int or null); setter uses `{ replace: true }`, deletes when null. `DonorPicker` is already controlled (`value`/`onChange`) — **zero changes**. Nonexistent donorId degrades via the existing error path.

## Project Structure

- `src/lib/` — shared hooks (`use-sort.ts` reworked, `use-page-param.ts` new, each with sibling `.test.ts`)
- `src/features/<domain>/` — pages + colocated tests
- `src/test/test-utils.tsx` — already wraps renders in `MemoryRouter` with a `route` option; unchanged, used to pass initial URLs

## Testing Strategy

Vitest + Testing Library; hook tests via `renderHook` wrapped in `MemoryRouter` with `initialEntries`; page tests via existing `renderWithProviders(…, { route })`. Assert URL writes with a location probe rendered alongside the page:

```tsx
function LocationProbe() {
  const { pathname, search } = useLocation()
  return <div data-testid="location">{pathname + search}</div>
}
```

Coverage per step (below). MSW list handlers are static (always return page 0), so "loads page 2 from URL" is asserted on the **outgoing request** (`server.use` override capturing `request.url` search params), not the rendered rows.

## Implementation Steps

1. **Rework `use-sort.ts` + `use-sort.test.ts`** — adapt existing 6 tests, replacing the `onSortChange` test with a "deletes `page` on toggle" test (renderHook now needs a MemoryRouter wrapper with `initialEntries`); add: init from `?sort=amount,asc`; fallback for `?sort=garbage` / unknown field / bad dir; toggling back to default removes the param. Same commit as step 2 (pages won't compile against the new signature).
   → verify: `pnpm run test src/lib/use-sort.test.ts`
2. **Add `use-page-param.ts` + test; update the 4 list pages** — hook tests: no param → 0; `?page=3` → internal 2; `?page=1` / `?page=0` / negative / `1.5` / `2abc` → 0; `setPage(2)` writes `page=3`; `setPage(0)` deletes the param.
   → verify: `pnpm run test && pnpm run check` — all existing page tests pass unchanged (they already render in MemoryRouter)
3. **Page-level URL integration tests** (donations page as representative) — sort click writes `?sort=…` and clears `page` (probe); `route: '/donations?sort=amount,asc'` → `aria-sort="ascending"` on Monto header; `?page=3` → outgoing request carries page 2 (MSW capture; static handlers always return page 0, so assert the request, not the rows).
   → verify: `pnpm run test`
4. **Reports page + tests** — tab param read/write/push, invalid tab fallback, deep-link `?tab=donor-statement&donorId=1` renders statement, tab switch clears `donorId`.
   → verify: `pnpm run test && pnpm run check`
5. **Full verification** — `pnpm run test && pnpm run check && pnpm run build`, then dev-server smoke: deep-link `/donations?page=1&sort=amount,asc`, reload persistence, Back across report tabs (steps) vs. paging (doesn't).

## Boundaries

- **Always:** functional-updater form of `setSearchParams` for multi-writer safety; validate every param defensively (invalid → default, no URL rewrite on mount); run `pnpm run test` + `pnpm run check` before each commit; surgical diffs only.
- **Ask first:** any new dependency; changing `ProtectedRoute` redirect behavior; expanding scope to date-range/search params.
- **Never:** break existing test assertions to make them pass; introduce a generic `useSearchParamState` abstraction (rejected as speculative — nuqs-shaped, and can't express the atomic sort+page update).

## Known behaviors accepted (no speculative handling)

- **Out-of-range page** (`?page=999`): the API returns empty content and the page renders the "no donations, create one" EmptyState — misleading when data exists, but unreachable except via a hand-edited link. No clamping; revisit only if it bites.
- **`ProtectedRoute` drops search params**: it redirects to `/login` without preserving the original location — a shared `/donations?page=3` link visited while logged out loses its params after login. Pre-existing limitation, now more visible; optional follow-up.

## Success Criteria

- [ ] `/donations?page=3&sort=amount,asc` (and equivalents on donors/expenses/users) restores state on reload; URL page numbers match the "Page N of M" label (1-based)
- [ ] `/reports?tab=donor-statement&donorId=N` deep-links to a donor statement
- [ ] Default state produces clean URLs (no params)
- [ ] Garbage params fall back to defaults without crashing or hitting the API with invalid sort
- [ ] Back button: steps through report tabs, does not step through page/sort changes
- [ ] All tests pass; `pnpm run check` and `pnpm run build` clean
