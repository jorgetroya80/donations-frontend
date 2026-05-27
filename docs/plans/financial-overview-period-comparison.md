# Improve Financial Overview Charts — Period Comparison

## Context

The financial overview dashboard shows totals for a selected date range but gives no temporal context. Treasurer and pastor can't detect financial trends or anomalies early. The fix: add period-over-period comparison to the existing charts so every view automatically shows "vs previous period."

No backend changes needed — existing `balance`, `donationSummary`, and `expenseSummary` endpoints accept date ranges. We just call them twice.

---

## Scope

**In:**
- % change indicator (↑/↓ + %) on all 3 KPI cards vs previous period
- Expense bar chart converted to grouped comparison (current vs previous period, side by side)
- Previous period auto-calculated from current date picker selection (same duration, immediately before)

**Not doing:**
- Monthly trend chart — no single API endpoint returns grouped-by-month data; would require 6–12 parallel calls
- Donation pie chart comparison — pie charts don't communicate comparison well; keep as-is
- Budget vs actual — requires new backend data

---

## Implementation

### Critical file
`src/features/dashboard/financial-overview.tsx`

No hook changes needed — `useBalance`, `useDonationSummary`, `useExpenseSummary` already accept `{ from, to }`.

### Step 1 — Calculate previous period date range

Add helper alongside `formatDate`:

```ts
function previousRange(from: Date, to: Date): { from: string; to: string } {
  const days = dayjs(to).diff(dayjs(from), 'day') + 1
  return {
    from: dayjs(from).subtract(days, 'day').format('YYYY-MM-DD'),
    to: dayjs(from).subtract(1, 'day').format('YYYY-MM-DD'),
  }
}
```

### Step 2 — Fetch previous period data

In `FinancialOverview`, add:
```ts
const prevDateParams = previousRange(range.from, range.to)
const prevBalance = useBalance(prevDateParams)
const prevExpenses = useExpenseSummary(prevDateParams)
```

### Step 3 — % change on KPI cards

Add small helper:
```ts
function pctChange(current: number, previous: number): number | null {
  if (!previous) return null
  return ((current - previous) / Math.abs(previous)) * 100
}
```

Each KPI card gets a `<span>` below the amount showing e.g. `↑ 12%` (green) or `↓ 8%` (red). Render nothing if `prevBalance` is still loading.

### Step 4 — Grouped expense bar chart

Merge current + previous expense data by category:
```ts
const expenseChartData = currentCategories.map((cur) => {
  const prev = prevExpenses.data?.totalsByCategory?.find(e => e.category === cur.category)
  return {
    category: expenseChartConfig[cur.category]?.label ?? cur.category,
    current: cur.total ?? 0,
    previous: prev?.total ?? 0,
  }
})
```

Replace single `<Bar dataKey="total">` with two bars:
```tsx
<Bar dataKey="current" name="Actual" fill="var(--chart-1)" radius={[0, 4, 4, 0]} />
<Bar dataKey="previous" name="Anterior" fill="var(--chart-2)" radius={[0, 4, 4, 0]} />
```

Update `expenseChartConfig` to include `current` and `previous` keys for tooltip labels.

---

## Verification

1. Load dashboard with default (current month) range → 3 KPI cards show % vs previous month
2. Change date picker to a custom range → KPI % and expense bars update to compare vs equal-length prior period
3. Pick a range where previous period has no data → % shows `—`, bars show 0 for "previous"
4. Confirm tooltip on expense chart shows both values with currency formatting
5. `pnpm run check` passes (no type errors, no lint issues)
