# Plan: Code Quality — Shared Formatter Utilities

> Source PRD: docs/PRD-code-quality-format-currency.md

## Architectural decisions

- **New module location**: `src/lib/` — consistent with existing shared utilities in the project (`src/lib/utils.ts`, `src/lib/api-types.ts`)
- **Named exports only** — no default export; tree-shaking clarity, consistent with existing `src/lib/` modules
- **No behavior change** — extracted functions are identical copies of existing code; this is a pure refactor
- **`dayjs` import** — lives in the new module only; removed from the four feature files that currently import it solely for `currentMonthRange`
- **Tests** — co-located in `src/lib/` alongside the module, consistent with existing test placement patterns

---

## Phase 1: Extract utilities, update call sites, and add unit tests

**User stories**: 1, 2, 3, 4, 5, 6

### What to build

Single end-to-end slice: create the shared module, migrate all call sites, delete duplicate definitions, and add unit tests in one pass. Since this is a pure refactor with no behavior change, there is no value in splitting extraction from testing.

**New module** — `src/lib/formatters.ts` exports:
- `formatCurrency(amount: number): string` — wraps `Intl.NumberFormat` with the locale and currency currently used in all call sites
- `currentMonthRange(): { from: Date; to: Date }` — returns start and end of the current calendar month via `dayjs`

**Call site updates** — remove local duplicate definitions from four feature files and add a single import from `src/lib/formatters`. The function signatures and return values are identical; no call site logic changes.

**Unit tests** — `src/lib/formatters.test.ts`:
- `formatCurrency`: zero, positive integer, positive decimal, negative amount, large amount with grouping separators
- `currentMonthRange`: `from` is first moment of current month, `to` is last moment; both are `Date` instances; expected values derived dynamically using `dayjs()` in the test (no hardcoded dates)

Run `npm run check` after the migration to verify Biome import-order rules are satisfied across all updated files.

### Acceptance criteria

- [ ] `src/lib/formatters.ts` exists and exports `formatCurrency` and `currentMonthRange` as named exports
- [ ] No local `formatCurrency` or `currentMonthRange` definition remains in any feature file
- [ ] All four feature files import from `src/lib/formatters`
- [ ] All pages that display currency amounts or use the default date range render identically before and after the change
- [ ] `npm run check` passes with no lint or import-order errors
- [ ] `npm run test` passes with no regressions
- [ ] Unit test: `formatCurrency(0)` returns expected zero-currency string
- [ ] Unit test: `formatCurrency(1000)` returns correctly formatted string with grouping
- [ ] Unit test: `formatCurrency(99.5)` returns correctly formatted string with fractional digits
- [ ] Unit test: `formatCurrency(-250)` returns correctly formatted negative currency string
- [ ] Unit test: `currentMonthRange().from` equals start of current month
- [ ] Unit test: `currentMonthRange().to` equals end of current month
- [ ] Unit test: both return values are `Date` instances
