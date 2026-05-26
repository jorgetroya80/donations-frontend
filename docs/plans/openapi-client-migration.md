# Plan: Migrate to Generated OpenAPI Client

> Source PRD: docs/PRD-openapi-client-migration.md

## Architectural decisions

- **HTTP client**: `@jorgetroya80/donations-api-client` for typed API calls; `ky` as the underlying fetch adapter (hook middleware, retry, etc.)
- **Base URL**: same-origin (works with Vite proxy in dev, nginx in prod)
- **Auth**: `credentials: include` set on ky instance; 401 → `/login` redirect via ky `afterResponse` hook (except login endpoint); clears `auth_user` from localStorage
- **Error strategy**: `throwOnError: true` at each call site — non-2xx throws, React Query catches; TypeScript infers `data: T` not `T | undefined`; ky configured with `throwHttpErrors: false` so SDK error handling is in charge
- **Pagination types**: specific generated types (`PageDonorResponse`, `PageDonationResponse`, `PageExpenseResponse`, `PageUserResponse`) replace generic `PageResponse<T>`
- **UserRole**: not exported from package — inlined locally as `'ADMIN' | 'TREASURER' | 'PASTOR' | 'OPERATOR'` in the one component that needs it
- **Package placement**: both `@jorgetroya80/donations-api-client` and `ky` in `dependencies`

---

## Phase 1: Package install + Client config

**User stories**: 5, 6, 7, 11, 12

### What to build

Install `@jorgetroya80/donations-api-client@1.7.0`, move it from `devDependencies` to `dependencies`. Add `minimum-release-age=0` to `.npmrc` — global pnpm config has `minimumReleaseAge: 1440` (24h) which blocks installing recently published packages; this overrides it at project level. Replace `src/lib/api.ts` ky-based client with a generated client config that sets the same-origin base URL, enables `credentials: include`, and registers a response interceptor that redirects to `/login` on 401 (except when the request URL includes `/login`). Tests cover the 401 interceptor behavior.

### Acceptance criteria

- [ ] `pnpm install` resolves `@jorgetroya80/donations-api-client@1.7.0` with no errors
- [ ] Package is in `dependencies`, not `devDependencies`
- [ ] `src/lib/api.ts` exports a configured client instance using the generated client factory
- [ ] 401 response triggers `window.location` redirect to `/login` and clears localStorage
- [ ] 401 on the login endpoint does NOT redirect
- [ ] Existing tests pass (no hook files changed yet)

---

## Phase 2: Pioneer hook migration — donors

**User stories**: 1, 2, 3, 4, 8, 10, 13

### What to build

Migrate `src/features/donors/use-donors.ts` end-to-end: replace all `ky` calls with generated typed functions (`listDonors`, `getDonor`, `createDonor`, `updateDonor`, `deleteDonor`). Use `PageDonorResponse` for the paginated list. Update `use-donors.test.tsx` to mock generated functions instead of MSW HTTP handlers. Proves the full pattern — typed query params, typed path params, typed body, React Query data inference — before touching remaining hooks.

### Acceptance criteria

- [ ] `use-donors.ts` imports no `ky` and no `api-types`
- [ ] `listDonors` called with typed query params (`page`, `size`)
- [ ] `getDonor` called with typed path param (`id`)
- [ ] `createDonor`, `updateDonor`, `deleteDonor` called with typed body
- [ ] Pagination uses `PageDonorResponse`, not `PageResponse<DonorResponse>`
- [ ] All `use-donors.test.tsx` tests pass

---

## Phase 3: Migrate remaining hooks

**User stories**: 1, 2, 3, 4, 8, 10, 13

### What to build

Apply the same pattern from Phase 2 to all remaining hook files: `use-donations.ts`, `use-expenses.ts`, `use-users.ts`, `use-reports.ts`, `use-dashboard-data.ts`, `use-user-stats.ts`, `use-change-password.ts`. Each file drops `ky` and `api-types` imports, uses generated typed functions, and has updated tests.

### Acceptance criteria

- [ ] All 7 hook files import no `ky` and no `api-types`
- [ ] Paginated hooks use domain-specific page types (`PageDonationResponse`, `PageExpenseResponse`, `PageUserResponse`)
- [ ] All hook test files pass
- [ ] `pnpm run typecheck` passes

---

## Phase 4: Cleanup

**User stories**: 9

### What to build

Delete `src/lib/api-types.ts` (no remaining imports). Run build and typecheck to confirm nothing references it.

### Acceptance criteria

- [x] `src/lib/api-types.ts` deleted
- [x] `pnpm run build` exits 0
- [x] `pnpm run typecheck` exits 0
- [x] `pnpm run test` exits 0

---

## Phase 5: ky as fetch adapter

### What to build

Re-add `ky` as the underlying fetch transport for the generated client. Pass a ky instance via `createClient({ fetch: kyInstance })`. Move 401 redirect logic from the SDK's `response.interceptors` into ky's `afterResponse` hook. Set `throwHttpErrors: false` so ky behaves like native fetch (no throw on non-2xx) and the SDK's own `throwOnError` per-call logic remains in charge. Use ky v2 hook signature: single destructured object `({ request, response })`.

### Acceptance criteria

- [x] `ky` in `dependencies`
- [x] `src/lib/api.ts` passes `fetch: kyInstance` to `createClient`; no `client.interceptors` call
- [x] ky instance has `throwHttpErrors: false` and `credentials: 'include'`
- [x] 401 hook uses ky v2 `afterResponse` destructured signature `({ request, response })`
- [x] `pnpm run build` exits 0
- [x] `pnpm run test` exits 0 (280/280)
