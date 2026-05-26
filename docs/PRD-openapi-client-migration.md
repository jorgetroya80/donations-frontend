# PRD: Migrate to Generated OpenAPI Client

## Problem Statement

Frontend hand-writes `api-types.ts` duplicating every backend type. Backend changes → manual update required. No automated drift check — silent until runtime. `ky` HTTP client repeats URL paths and query shapes in every hook, no request type safety.

## Solution

Replace `api-types.ts` with auto-generated `@jorgetroya80/donations-api-client`. Package generated from backend OpenAPI spec — types and function signatures always match API. Each endpoint becomes a typed function (e.g. `listDonors`, `createDonation`) encoding URL, query params, path params, body type. `ky` is kept as the underlying fetch transport — the generated client's `fetch` option accepts any fetch-compatible function, so a ky instance is passed to retain hook middleware (401 redirect, future retry/timeout). Hook files call generated functions; `ky` is no longer used directly.

Package needs small update to expose default client instance and factory — frontend must not import from internal paths.

## User Stories

1. Dev wants API types generated from OpenAPI spec — no manual sync.
2. Dev wants typed calls like `listDonors({ query: { page, size } })` — no manual URL strings.
3. Dev wants typed path params (e.g. `getDonor({ path: { id } })`) — can't pass wrong type or omit required param.
4. Dev wants body types inferred from function signature — can't send invalid payload.
5. Dev wants 401 redirect preserved — unauthenticated users hit login page.
6. Dev wants `credentials: include` preserved — session auth works.
7. Dev wants single base URL config point — correct origin in dev and prod.
8. Dev wants clean React Query error integration — failed calls surface as errors, no boilerplate per hook.
9. Dev wants `api-types.ts` deleted — no file that can silently drift.
10. Dev wants React Query data types inferred from generated return types — no manual `useQuery` annotations.
11. Dev wants Vite dev proxy to keep routing API requests — local dev unchanged.
12. Dev wants package to export client instance and factory from main index — no internal path imports.
13. Dev wants pagination types precise (e.g. `PageDonorResponse` not generic `PageResponse<DonorResponse>`) — field access always typed.

## Implementation Decisions

### Package update (prerequisite)

`@jorgetroya80/donations-api-client` must export default client instance and factory (`createClient`, `createConfig`) from main index. Prerequisite step in `donations-api` repo before frontend migration.

### Client configuration module

`src/lib/api.ts` configures shared client. A ky instance is created with `credentials: include`, `throwHttpErrors: false`, and an `afterResponse` hook for 401 → `/login` redirect (except login endpoint). This ky instance is passed as `fetch` to `createClient`. Hook files import `{ client }` and pass it to generated functions — no direct ky usage in hook files.

### HTTP call migration

All 10 hook files updated from `ky` to generated functions. Direct mapping: `api.get('donors', { searchParams })` → `listDonors({ query: { page, size } })`, `api.post('donors', { json: data })` → `createDonor({ body: data })`, etc.

### Error handling strategy

`throwOnError: true` at each call site: (a) non-2xx throws, React Query catches — matches `ky` behavior; (b) TypeScript infers `data: T` not `T | undefined` — no non-null assertions in query functions.

### Pagination type mapping

Generic `PageResponse<T>` replaced by specific generated types: `PageDonorResponse`, `PageDonationResponse`, `PageExpenseResponse`, `PageUserResponse`. Used directly in four paginated-list hook files.

### UserRole type

Package doesn't export standalone `UserRole` — inlined as union in `CreateUserRequest`. One component using `UserRole` defines it locally: `type UserRole = 'ADMIN' | 'TREASURER' | 'PASTOR' | 'OPERATOR'`. No wrapper file needed.

### Package placement

Move from `devDependencies` to `dependencies` — package ships runtime HTTP code, not just types. No build impact for Vite SPA, but correct placement avoids confusion.

### ky as fetch adapter

`ky` is retained in `dependencies` as the fetch transport for the generated client. Hook files no longer call ky directly — all API calls go through generated functions. `ky` stays for its middleware layer: the `afterResponse` hook handles 401 redirect today; retry and timeout can be added later without touching hook files.

## Testing Decisions

**Good test:** verify observable behavior — correct API function called with correct args, hook returns expected data shape. Not which HTTP library used internally.

**Modules to test:**
- Hook files (`use-donors`, `use-donations`, `use-expenses`, `use-users`, `use-reports`, `use-dashboard-data`, `use-change-password`) — mutations call right generated function and invalidate right query keys; query functions pass correct query/path params.
- Client config (`src/lib/api.ts`) — 401 interceptor calls `window.location` redirect and clears localStorage; does NOT redirect on 401 from login endpoint.

**Prior art:** check existing `*.test.ts` or `*.spec.ts` in `src/features/` for established mock/test pattern.

## Out of Scope

- `donations-api` backend or OpenAPI spec changes.
- Regenerating client from new spec — existing `1.x` types are target.
- New endpoints or features.
- UI behavior or component logic changes.
- Automated client regeneration in CI.
- Auth migration — login endpoint already excluded from 401 redirect.

## Further Notes

- `@jorgetroya80/donations-api-client` published to GitHub Packages. Ensure `.npmrc` has correct registry and auth token for updated version.
- Vite proxy (`/api` → `http://localhost:8081`) unchanged — same-origin base URL routes through proxy in dev.
- Production (Docker + nginx): same-origin base URL routes to backend container via nginx.
- Branch `feat-install-npm-api-client` has initial commit adding package. Migration continues on this branch.