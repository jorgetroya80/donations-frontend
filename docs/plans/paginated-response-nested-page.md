# Plan: Migrate to nested `page` paginated response shape

## Context

API ([issue #134](https://github.com/jorgetroya80/donations-frontend/issues/134), upstream [donations-api#33](https://github.com/jorgetroya80/donations-api/issues/33)) adopts Spring Data stable page serialization (`VIA_DTO`). Breaking change: pagination metadata moves from the response root into a nested `page` object.

**Before:** `{ content, totalElements, totalPages, number, size, pageable, sort, first, last, numberOfElements, empty }`
**After:** `{ content, page: { size, number, totalElements, totalPages } }`

Removed root fields: `totalElements, totalPages, number, size, pageable, sort, first, last, numberOfElements, empty`. `content` unchanged.

Frontend currently reads `data.number`, `data.totalPages`, `data.totalElements` directly off paged responses. Removed fields `first/last/numberOfElements/empty/pageable/sort` are **not used anywhere** — no derivation needed. Migration is mechanical: prefix metadata reads with `.page` and re-nest test mocks.

## Prerequisite (do first, out of scope for code changes)

Upgrade `@jorgetroya80/donations-api-client` from `1.7.1` to the new **major** version once published. Regenerated types: `PagedModel*Response { content, page: PageMetadata }`; old `Page*Response`, `PageableObject`, `SortObject` gone. `package.json:31`.

> Status (2026-06-13): new major **not yet published**. This plan is written ahead; run the upgrade first, then apply code/test changes below.

## Files to change

### 1. Metadata reads (production code)

Pattern: `data.<field>` → `data.page?.<field>`, keeping existing `?? 0` fallbacks.

- [src/features/donations/donations-page.tsx:174-190](../../src/features/donations/donations-page.tsx) — `data.number` (x3), `data.totalPages` (x2) → `data.page?.number`, `data.page?.totalPages`
- [src/features/donors/donors-page.tsx:136-152](../../src/features/donors/donors-page.tsx) — same pattern
- [src/features/expenses/expenses-page.tsx:174-190](../../src/features/expenses/expenses-page.tsx) — same pattern
- [src/features/users/users-page.tsx:147-163](../../src/features/users/users-page.tsx) — same pattern
- [src/features/dashboard/use-user-stats.ts:15](../../src/features/dashboard/use-user-stats.ts) — `data.totalElements` → `data.page?.totalElements` (keep `totalUsers` shape)

No changes in `use-donations.ts` / `use-donors.ts` / `use-expenses.ts` / `use-users.ts` — they return `data` untouched. Request-side `pageableQuerySerializer` ([src/lib/api.ts:71-87](../../src/lib/api.ts)) is unaffected (query params, not response).

### 2. Test mocks (re-nest metadata under `page`)

Replace root `totalElements/totalPages/size/number` with `page: { size, number, totalElements, totalPages }`.

- [src/test/msw-handlers.ts](../../src/test/msw-handlers.ts) — 4 handlers: donations (~146-150), donors (~247-251), expenses (~328-332), users (~404-408)
- [src/features/donations/use-donations.test.tsx](../../src/features/donations/use-donations.test.tsx) — mock ~101-108; assertion ~33
- [src/features/donors/use-donors.test.tsx](../../src/features/donors/use-donors.test.tsx) — mock ~91-98; assertion ~33
- [src/features/expenses/use-expenses.test.tsx](../../src/features/expenses/use-expenses.test.tsx) — mock ~103-110; assertion ~33
- [src/features/users/use-users.test.tsx](../../src/features/users/use-users.test.tsx) — mock ~95-104; assertion ~28

Test assertions reading `result.current.data.totalElements` → `result.current.data.page.totalElements`.

## Verification

1. `pnpm run build` — TypeScript compiles against new types (catches any missed `.page` prefix; old root fields no longer exist on type).
2. `pnpm run test` — all hook/page tests green with re-nested mocks.
3. `pnpm run check` — Biome clean.
4. Manual (against new API): load donations, donors, expenses, users list views; click prev/next; confirm page counter (`page X / total`) correct and buttons disable at bounds. Confirm dashboard user-stats `totalUsers` correct.

## Notes

- Use optional chaining `data.page?.field ?? 0` to stay null-safe (matches current `?? 0` usage).
- If new `PageMetadata` types are non-optional, `?.` is harmless; keep fallbacks for empty-state safety.
