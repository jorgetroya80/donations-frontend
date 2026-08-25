# Spec: Replace dashboard comparison bar charts with a category ranking

## Objective

Replace the two `ComparisonBarChart` cards in
[financial-overview.tsx](../src/features/dashboard/financial-overview.tsx) — "Donaciones por tipo"
and "Gastos por categoría" — with a ranked list: one row per category, sorted descending, showing a
proportional bar, the exact amount, and the variation against the previous period.

**Target users:** treasurers (`canViewReports`) landing on the dashboard.

**Problem:** the current charts render two horizontal bar series (current + previous) with no axis
and no value labels, so no figure is readable without hovering. A shared linear scale flattens
everything below the largest category — with IRPF at 21.450 € and Mantenimiento at 310 €, the small
bar is a 2 px sliver. The comparison the charts perform (current vs previous) is already answered by
the three `StatCard`s directly above them.

**Outcome:** every category shows its exact amount and its variation without interaction; the
biggest cost sits at the top; the card stops competing with the stat cards above it.

**Not in scope:** the monthly trend chart. That needs time-series endpoints, tracked in
[donations-api#51](https://github.com/jorgetroya80/donations-api/issues/51), and lands as a separate
spec once the API ships.

## Assumptions

1. Zero new API calls. The six queries in `FinancialOverview` (`balance`, `donations`, `expenses` ×
   current/previous) stay exactly as they are — this design consumes data already in memory.
2. The date range picker, the `StatCard` row, and `QuickActions` are untouched.
3. Spanish stays the only locale; new strings go in `src/locales/es.json`.
4. The design is the "Opción A" artboard reviewed on 2026-08-25.

## Tech stack

React 19 · TypeScript · Vite 8 · Tailwind v4 · react-i18next · TanStack Query 5 ·
Vitest + Testing Library + MSW. No new dependencies.

## Commands

- `pnpm run check` — Biome lint + format + import organizing
- `pnpm run typecheck` — `tsc --build --force`
- `pnpm run test` — unit tests
- `pnpm run build` — production build
- `pnpm run dev` — dev server (port 3000)

## Project structure (files touched)

```
src/features/dashboard/
  category-ranking.tsx        NEW — presentational ranked list
  category-ranking.test.tsx   NEW — colocated tests
  pct-change.tsx              NEW — PctChange extracted from stat-card.tsx
  stat-card.tsx               EDIT — import PctChange instead of defining it
  financial-overview.tsx      EDIT — build ranking rows, render CategoryRanking
  financial-overview.test.tsx EDIT — assert on rows instead of chart mocks
src/locales/es.json           EDIT — new keys
```

## Component contract

```tsx
export interface RankingItem {
  key: string          // API enum value: 'TITHE' | 'IRPF' | …
  label: string        // already translated
  current: number
  previous: number | null | undefined
}

export interface CategoryRankingProps {
  items: RankingItem[]
  inverted?: boolean   // true for expenses: an increase is bad
}

export function CategoryRanking({ items, inverted }: CategoryRankingProps)
```

Presentational only: no hooks into React Query, no `t()` calls for category names (the caller
translates), no sorting decisions left to the caller.

### Rendering rules

1. **Sort** descending by `current`. Ties break by `label` (`localeCompare`, stable across renders).
2. **Bar width** is `current / max(...items.current) * 100`%, so the largest row is always full
   width. A row with `current === 0` renders a zero-width bar. Every bar has `min-w-[3px]` so a
   present-but-tiny category stays visible.
3. **Track**: `bg-muted` behind the bar, marking the 100 % reference. `aria-hidden` — it is
   decoration, the number next to it is the content.
4. **Amount** via `formatCurrency` from [formatters.ts](../src/lib/formatters.ts).
5. **Variation** via the extracted `PctChange`, with `inverted` passed through. Same visual language
   as the stat cards above (`↑`/`↓` + one decimal, `text-success` / `text-destructive`) — this
   deliberately differs from the mockup's `+15,7 %` so the two blocks read as one system.
6. **New category**: when `calcPctChange` returns `null` because `previous` is `0` or missing and
   `current > 0`, render `t('dashboard.newCategory')` in `text-muted-foreground` — not an arrow.
7. **Empty `items`** renders nothing; the caller keeps showing its existing `EmptyState`.

### Markup

A `<table>` — this is tabular data (category, amount, variation) and a table gives screen readers
row/column context for free. The bar lives inside the category cell as an `aria-hidden` decoration.
`<caption className="sr-only">` names the table, since the visible `CardTitle` sits outside it.

## Caller changes in `financial-overview.tsx`

1. **Union both periods** when building expense rows. Today expense rows map over
   `expenses.data?.totalsByCategory` only ([financial-overview.tsx:73](../src/features/dashboard/financial-overview.tsx:73)),
   so a category that existed last period and is `0` now silently disappears — a −100 % that never
   shows. Donations already union both sets
   ([financial-overview.tsx:60](../src/features/dashboard/financial-overview.tsx:60)); mirror that
   for expenses.
2. **Drop the Diezmo/otros split.** `titheData` / `otherDonationsData` exist only because the two
   charts needed different `max-h` classes. One ranking replaces both.
3. **Card header** shows the period total from `grandTotal` (`DonationSummaryResponse.grandTotal` /
   `ExpenseSummaryResponse.grandTotal`) — an existing DTO field the dashboard does not use yet.
4. `comparisonConfig` and the `ChartConfig` import become unused for the comparison charts;
   `donationChartConfig` is still needed for the type labels.

## New i18n keys (`src/locales/es.json`)

```json
"dashboard": {
  "newCategory": "nuevo",
  "periodTotal": "total {{amount}}",
  "rankingCaption": "{{title}}, importe y variación frente al periodo anterior"
}
```

## Code style

Match the surrounding feature slice: kebab-case file names, plain HTML + Tailwind v4, no wrappers
around base-ui, no manual `useMemo`/`useCallback` (React Compiler), Biome formatting.

```tsx
const rows = [...items].sort((a, b) => b.current - a.current || a.label.localeCompare(b.label))
const max = rows[0]?.current ?? 0

return (
  <table className="w-full text-sm">
    <caption className="sr-only">{caption}</caption>
    <tbody>
      {rows.map((item) => (
        <tr key={item.key}>
          <td className="py-1.5 pr-3 text-right align-middle whitespace-nowrap">{item.label}</td>
          <td className="w-full py-1.5">
            <div aria-hidden="true" className="bg-muted h-5 rounded">
              <div
                className="bg-chart-1 h-5 min-w-[3px] rounded"
                style={{ width: `${max > 0 ? (item.current / max) * 100 : 0}%` }}
              />
            </div>
          </td>
          <td className="py-1.5 pl-3 text-right font-medium whitespace-nowrap">
            {formatCurrency(item.current)}
          </td>
          <td className="py-1.5 pl-3 text-right whitespace-nowrap">
            <PctChange current={item.current} previous={item.previous} inverted={inverted} />
          </td>
        </tr>
      ))}
    </tbody>
  </table>
)
```

## Testing strategy

Vitest + Testing Library, colocated `*.test.tsx`, rendered through
[test-utils.tsx](../src/test/test-utils.tsx), API mocked with
[msw-handlers.ts](../src/test/msw-handlers.ts). Never assert against the real network.

`category-ranking.test.tsx`:

1. Rows come out sorted descending regardless of input order.
2. The largest row's bar is `width: 100%`; a proportionally smaller row is not.
3. `previous: 0` with `current > 0` renders "nuevo", not a percentage.
4. `previous > 0` with `current: 0` renders a −100 % decrease.
5. `inverted` flips the colour: an increase is `text-destructive` in expenses,
   `text-success` in donations.
6. Empty `items` renders nothing.

`financial-overview.test.tsx`:

7. A category present only in the previous period still renders a row (the union fix).
8. Both card totals render from `grandTotal`.
9. The existing loading / error / empty-state assertions still pass.

`stat-card.test.tsx` must pass **unchanged** after `PctChange` is extracted — that is the proof the
extraction was behaviour-preserving.

Manual pass (`pnpm run dev`, treasurer account): change the date range and confirm rows re-sort and
totals track; check dark mode; check a narrow viewport (the ranking must not overflow its card).

## Boundaries

**Always:**

- Keep the six existing report queries as they are — no new requests, no new hooks.
- Reuse `formatCurrency`, `calcPctChange`, `Card`, `EmptyState`.
- Run `pnpm run check`, `pnpm run typecheck` and `pnpm run test` before committing.
- Branch and PR; never commit to `main`.

**Ask first:**

- Any change to `StatCard`'s rendered output.
- Adding a locale key outside the `dashboard` namespace.

**Never:**

- Fabricate or client-side-derive a monthly series to fake the trend chart before
  [donations-api#51](https://github.com/jorgetroya80/donations-api/issues/51) ships.
- Touch `QuickActions`, `UserStats`, or the date range picker.
- Remove the `EmptyState` branches.
- Delete `comparison-bar-chart*.tsx`, `src/components/ui/chart.tsx`, their tests, or the `recharts`
  dependency — they are kept deliberately for the trend chart (see Resolved decisions).

## Success criteria

- [ ] Both dashboard cards render a ranked table; no `ComparisonBarChart` is mounted.
- [ ] Every category shows its amount as text — no hover needed to read any figure.
- [ ] Categories are ordered descending by current-period amount, and every category with data in
      either period is rendered — no cap, no truncation.
- [ ] A category present only in the previous period renders with a −100 % variation.
- [ ] A category present only in the current period renders "nuevo".
- [ ] Expense increases render red, expense decreases green; donations the reverse.
- [ ] The dashboard issues the same six report requests as before this change.
- [ ] `pnpm run check`, `pnpm run typecheck` and `pnpm run test` all pass; `stat-card.test.tsx` is
      unmodified.
- [ ] Dark mode and a 375 px viewport both render without overflow.

## Resolved decisions

1. **Dead chart code stays.** After this change `comparison-bar-chart.tsx`, its lazy wrapper and its
   tests have no callers, and `src/components/ui/chart.tsx` + `recharts` (3.8.0) are used by nothing
   else. They stay in the repo so the trend chart can pick them back up when
   [donations-api#51](https://github.com/jorgetroya80/donations-api/issues/51) ships. Their tests
   keep running. Since nothing imports the lazy wrapper, the recharts chunk simply stops being
   fetched on the dashboard route — `recharts` remains a dependency and is no longer in any route's
   critical path.
2. **Every category is shown.** No row cap, no "ver todo" affordance. All eight expense categories
   render when they have data in either period; the card grows to fit.
