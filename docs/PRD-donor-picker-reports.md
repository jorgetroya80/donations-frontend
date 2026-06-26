# Spec: Use DonorPicker in Reports donor-statement tab

## Objective

Replace the hand-rolled base-ui `Autocomplete` in the donor-statement tab of
[reports-page.tsx](../src/features/reports/reports-page.tsx) with the existing server-side
searchable [DonorPicker](../src/features/donors/donor-picker.tsx) component.

**Target users:** report viewers selecting a donor to generate a statement.

**Problem:** the current picker uses client-side `useDonors()` from
[use-donations.ts](../src/features/donations/use-donations.ts), which hard-fetches the first 100
donors and filters in-browser — cannot scale past 100, and duplicates picker UI that already
exists. DonorPicker debounces a `search` term into the search-capable `useDonors()` in
[use-donors.ts](../src/features/donors/use-donors.ts) (backend search-by-term endpoint).

**Outcome:** donor search hits the backend by term (no 100-donor cap), reports reuses the shared picker.

## DonorPicker contract (drop-in)

```ts
<DonorPicker value={number | null} onChange={(id: number | null) => void} />
```

Self-contained: own input, clear button, keyboard nav, loading/empty/error states. Emits donor id —
exactly what `donorId` state and `useDonorStatement(donorId, range)` already expect. Already used in
[donation-form.tsx:198](../src/features/donations/donation-form.tsx).

## Commands

- `pnpm run check` — Biome lint + format
- `pnpm run build` — type-check + build
- `pnpm run test` — unit tests
- `pnpm run dev` — dev server (port 3000)

## Project structure (files touched)

All edits in one file: [src/features/reports/reports-page.tsx](../src/features/reports/reports-page.tsx).

1. **Delete** the `DonorList` helper (lines 170–187).
2. In `DonorStatementTab`:
   - Remove `const { data: donorsPage } = useDonors()` (line 193) and
     `const donors = donorsPage?.content ?? []` (line 199).
   - Replace the whole `<Autocomplete.Root>…</Autocomplete.Root>` block (lines 204–231) with:
     ```tsx
     <div className="w-64">
       <DonorPicker value={donorId} onChange={setDonorId} />
     </div>
     ```
     (fixed-width wrapper keeps it tidy next to `DateRangePicker` in the `flex flex-wrap` row;
     DonorPicker's root is fluid `flex-1`).
   - Keep `donorId` state and `useDonorStatement(donorId, …)` untouched.
3. **Remove now-orphaned imports** (made unused by this change only):
   - `import { Autocomplete } from '@base-ui/react'` (line 1)
   - `import type { DonorResponse } from '@jorgetroya80/donations-api-client'` (line 2)
   - `CircleX` from the `lucide-react` import (line 4)
   - `import { useDonors } from '@/features/donations/use-donations'` (line 18)
4. **Add** `import { DonorPicker } from '@/features/donors/donor-picker'`.

## Code style

- Match surrounding patterns; surgical changes only (CLAUDE.md §3).
- No new abstractions — DonorPicker is reused as-is.
- React Compiler enabled (no manual memoization). Tailwind v4 classes. Biome formatting.

## Testing strategy

1. `pnpm run check` — no lint errors / no unused imports.
2. `pnpm run build` — type-checks (DonorPicker `value`/`onChange` match `donorId` state).
3. `pnpm run test` — existing suite green
   ([donor-picker.test.tsx](../src/features/donors/donor-picker.test.tsx) unaffected).
4. Manual (`pnpm run dev` → Reports → Donor statement tab): type a term → list comes from backend
   search; pick a donor → statement loads; clear (X) → resets to "no donor selected".

## Boundaries

**Always:**

- Keep the change scoped to `reports-page.tsx`.
- Reuse the existing `DonorPicker` and search-capable `useDonors()` — no new picker code.

**Ask first:**

- Any change to `DonorPicker` itself or to `useDonorStatement`.
- Touching i18n files.

**Never:**

- Delete the orphaned i18n keys `reports.searchDonor` / `reports.noDonorsFound` (DonorPicker uses
  its own `donations.searchDonor` / `donations.noDonorsFound`). They become unused but removal is
  out of scope — flag only.
- Refactor adjacent tabs (`DonationSummaryTab`, `ExpenseSummaryTab`).
