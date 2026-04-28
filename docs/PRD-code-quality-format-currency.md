# PRD: Code Quality — Shared Formatter Utilities

## Problem Statement

Two utility functions — `formatCurrency` and `currentMonthRange` — are defined verbatim in four separate feature files (donations page, expenses page, financial overview, reports page). Each copy imports `dayjs` independently for the same operation. This duplication creates a maintenance risk: any change to currency locale, format options, or fiscal month boundary logic must be applied in four places. A missed update produces inconsistent formatting across the application.

## Solution

Extract `formatCurrency` and `currentMonthRange` into a shared `src/lib/formatters.ts` module. Update all four call sites to import from the shared module. Delete the local duplicate definitions. Cover the shared module with unit tests so that formatting regressions are caught automatically.

## User Stories

1. As a developer changing the currency display format (e.g., adding decimal places or switching locale), I want to edit one function in one file, so that the change propagates to every page automatically.
2. As a developer changing the fiscal month range logic (e.g., adjusting for a non-calendar-month fiscal period), I want to edit one function, so that all date filters stay consistent.
3. As a developer reviewing the codebase, I want utility functions to live in `src/lib/`, so that I know where to find shared business logic without searching feature directories.
4. As a developer writing a new feature that displays currency amounts, I want an existing `formatCurrency` utility to import, so that I do not introduce another duplicate.
5. As a developer, I want `formatCurrency` covered by unit tests for normal, zero, negative, and large amounts, so that formatting regressions are caught in CI.
6. As a developer, I want `currentMonthRange` covered by unit tests that assert the returned start and end dates match the current month's boundaries, so that filter initialization bugs are caught in CI.

## Implementation Decisions

### New module: `src/lib/formatters.ts`
- Export `formatCurrency(amount: number): string` — wraps `Intl.NumberFormat` with the locale and currency currently used across all call sites.
- Export `currentMonthRange(): { from: Date; to: Date }` — returns the start and end of the current calendar month using `dayjs`.
- No default export; named exports only for tree-shaking clarity.
- The module imports `dayjs` once. No other dependencies.

### Call site updates
- Remove the local `formatCurrency` and `currentMonthRange` definitions from the four feature files.
- Add a single import from `src/lib/formatters` at the top of each file.
- No logic changes — the extracted functions are identical to the existing duplicates.

### Files affected
- `src/features/donations/donations-page.tsx`
- `src/features/expenses/expenses-page.tsx`
- `src/features/dashboard/financial-overview.tsx`
- `src/features/reports/reports-page.tsx`

## Testing Decisions

Good tests for pure utility functions assert the output for a range of inputs. They do not mock `Intl.NumberFormat` or `dayjs` internals — they test the function's observable return value.

### `formatCurrency`
- Zero: `formatCurrency(0)` returns the expected zero-currency string for the configured locale.
- Positive integer: `formatCurrency(1000)` returns the correctly formatted string.
- Positive decimal: `formatCurrency(99.5)` returns the correctly formatted string with fractional digits.
- Negative amount: `formatCurrency(-250)` returns a correctly formatted negative currency string.
- Large amount: `formatCurrency(1_000_000)` returns a correctly formatted string with grouping separators.

### `currentMonthRange`
- `from` is the first moment of the current calendar month (start of day on day 1).
- `to` is the last moment of the current calendar month (end of day on last day).
- Both values are `Date` instances.
- Test is time-dependent — use `dayjs()` in the test itself to derive expected values dynamically rather than hardcoding dates.

### Prior art
- Look at existing unit test files in `src/features` or `src/lib` for the test runner setup and import patterns used in this project.
- Tests live in a `*.test.ts` file co-located with the module or in `src/lib/__tests__/`.

## Out of Scope

- Changing the currency locale or format (e.g., switching from `es-ES` / `EUR` to another locale) — that is a product decision, not a refactor.
- Extracting other utility functions not currently duplicated.
- Adding a date formatting utility (separate concern).
- The `Select` controlled value bug in donation and expense forms (tracked separately).

## Further Notes

This is a pure refactor with no user-facing behavior change. The risk of regression is low because the extracted functions are identical copies of existing code. The unit tests serve primarily to document the expected output format and catch future accidental changes.

Run `npm run check` after updating call sites to verify Biome does not flag any import order issues introduced by the new import.
