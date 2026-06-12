# Project Review + Improvements

## Context

Review of the project against `docs/ARCHITECTURE.md` and current status. The project is in production-ready shape (CI/CD complete, OpenAPI client migration merged, dark mode shipped, 45 test files, no TODOs), but the review found four concrete gaps, all selected for implementation.

## Review Findings

**Doc drift (~85% accurate):**

- `ARCHITECTURE.md` still documents `src/lib/api-types.ts` — file deleted; types now come from `@jorgetroya80/donations-api-client@1.7.1` (migration merged v0.2.16)
- API client section describes raw ky usage; actual `src/lib/api.ts` wraps the generated client via `createClient()` + custom `pageableQuerySerializer()`
- Missing: 403 `PASSWORD_CHANGE_REQUIRED` rotation flow (v0.2.21), `use-page-title.ts` hook, Vite `/api` proxy
- Version drift: react-router 7.15.0 (doc says 7.14.1), ky 2.0.2 (doc 2.0.1)

**Code gaps:**

- Zero error boundaries — any render error white-screens the app
- No code splitting — all routes eagerly imported in `src/App.tsx`
- `toggleSort` / `sortIndicator` / `ariaSort` copy-pasted across 4 list pages (donations, donors, expenses, users)

**Noted, not in scope:** reports-page.tsx at 354 lines with thin tests; stale local `feat-security` branch; ~15 minor dependency updates; missing ARIA landmarks; no toast system.

## Implementation Plan

### 1. Update `docs/ARCHITECTURE.md`

- Tech stack table: add `@jorgetroya80/donations-api-client 1.7.1`; bump react-router → 7.15.0, ky → 2.0.2
- Project structure: remove `api-types.ts`, add `layouts/use-page-title.ts`
- API Client section: rewrite to reflect generated client + `pageableQuerySerializer()`; mention 403 password-rotation handling alongside the 401 hook
- Type System section: note types imported from the api-client package instead of a local file
- Update again at the end to reflect items 2–4 (error boundary, lazy routes, shared sort hook)

### 2. Error boundaries

- New `src/components/error-boundary.tsx` — class component, fallback UI with translated message + reload button; plain HTML + Tailwind
- Add `errors.*` keys to `src/locales/es.json`
- Root boundary inside providers in `App.tsx`; per-route boundary around `AppLayout`'s `<Outlet>` so nav survives page crashes
- Test: component that throws → fallback renders

### 3. Route code splitting

- `App.tsx`: convert page imports to `React.lazy()` (keep providers, guards, layout eager)
- `<Suspense>` fallback using existing `src/components/skeleton.tsx`, placed at the `AppLayout` outlet level
- Verify: `pnpm run build` shows per-feature chunks; existing tests still pass

### 4. Shared sort hook

- New `src/lib/use-sort.ts`: `useSort(initial, onSortChange?)` returning `{ sort, toggleSort, sortIndicator, ariaSort }`; pages pass `() => setPage(0)` as the change callback
- Replace duplicated blocks in the 4 list pages: donations, donors, expenses, users
- Unit test for the hook; existing page tests verify behavior unchanged

## Verification

1. `pnpm run typecheck` — clean
2. `pnpm run test` — all pass, new tests included
3. `pnpm run check` — Biome clean
4. `pnpm run build` — succeeds, output shows split chunks per feature
5. Manual: `pnpm run dev`, navigate routes, confirm lazy chunks load and sort toggling works on all 4 list pages
