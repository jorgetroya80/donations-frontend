# Donor Picker — Paginated Table Dialog

## Context

The donation create/edit form (`src/features/donations/donation-form.tsx:194-221`) picks a donor
via a base-ui `Select` populated by `useDonors()` (`src/features/donations/use-donations.ts:80`),
which fetches a single fixed page of **100 donors** (`page:0, size:100`). If donors exceed 100, the
rest are silently dropped, and scrolling a flat 100-item dropdown is poor UX.

The backend `GET /api/v1/donors` exposes **no search param** — only `page`/`size`/`sort`. So instead
of client-side filtering, we replace the `Select` with a **paginated donors table inside a dialog**:
the user pages/sorts through all donors server-side and selects one row. This uses the existing
paginated `useDonors({page,size,sort})` hook from the donors feature and reuses the donors-page
table + pagination + sort patterns.

Decisions confirmed with user: paginated **table** picker (not autocomplete/combobox); built as a
**shared, reusable component** (not inlined in the form).

---

## SPEC

### 1. Objective
Replace the donor `Select` in the donation form with a reusable `DonorPicker`: a trigger field
showing the selected donor (or placeholder) that opens a dialog containing a server-paginated,
sortable donors table. Selecting a row sets `donorId` and closes the dialog. Donor remains optional
(clearable). Solves the >100-donor scaling gap by paging server-side.

### 2. Commands
- `pnpm run dev` — manual verify in browser (port 3000)
- `pnpm run test` — unit tests (vitest + MSW)
- `pnpm run check` — Biome lint + format
- `pnpm run build` — typecheck + build

### 3. Project structure
- **New**: `src/features/donors/donor-picker.tsx` — the shared component. Lives in the donors
  feature (owns the donor hooks); imported cross-feature by donations, like reports already imports
  `useDonors` from donations.
- **New**: `src/features/donors/donor-picker.test.tsx` — component test.
- **Edit**: `src/features/donations/donation-form.tsx` — swap `Select` block for `<DonorPicker>`;
  drop the `donors` prop and the now-unused `Select*` imports.
- **Edit**: `src/features/donations/donation-create-page.tsx` + `donation-edit-page.tsx` — drop
  `useDonors()` call and the `donors={donors}` prop.
- **Keep**: `useDonors()` (parameterless, `use-donations.ts:80`) — still used by `reports-page.tsx:18`.
- **i18n**: add keys under `donations.*` / reuse `donors.*` (table headers `donors.fullName`,
  `donors.nationalId`, pagination `donors.page/previous/next` already exist) in the locale files.

### 4. Code style
- Reuse, don't reinvent:
  - `useDonors({page,size,sort})` — `src/features/donors/use-donors.ts:18`
  - `useDonor(id)` — `src/features/donors/use-donors.ts:38` to resolve the selected donor's name for
    the trigger label (enabled when `id > 0`).
  - `useSort` — `@/lib/use-sort` for sortable headers (mirror `donors-page.tsx:25`).
  - `Dialog*` — `@/components/ui/dialog` (base-ui render-prop wrapper).
  - `Table*` — `@/components/ui/table`; pagination markup copied from `donors-page.tsx:133-160`.
- base-ui via the existing wrapper components only (render-prop pattern, no `asChild`). No new
  base-ui imports beyond the wrappers already in `components/ui`.
- React 19 + compiler: no manual memoization. Match existing Tailwind class conventions.

### 5. Testing strategy
- Vitest + Testing Library + MSW (`src/test/`). Add a paginated MSW handler variant so the table can
  page (the existing donor handler in `src/test/msw-handlers.ts` returns the nested `{content, page}`
  shape — extend it to honor `page`/`size`).
- `donor-picker.test.tsx` covers: opens dialog on trigger click; renders rows; row click calls
  `onChange` with the donor id and closes; next/prev pagination fetches the next page; clear resets
  to `null`; trigger shows selected donor name when a value is set.
- Keep existing donation create/edit page tests green after prop removal.

### 6. Boundaries
- **Always**: keep donor optional (nullable `donorId`); preserve the `Controller`/react-hook-form
  wiring; server-side pagination (no client-side 100-cap filtering); reuse existing hooks/components.
- **Ask first**: any backend/API change (e.g. adding a `?search=` param); migrating `reports-page`
  to this picker (different UX — left as-is for now); changing the donor response shape.
- **Never**: refactor unrelated code; remove the parameterless `useDonors()` (reports depends on it);
  introduce a new dialog/table/combobox library.

---

## Implementation

1. **`DonorPicker` component** (`src/features/donors/donor-picker.tsx`)
   - Props: `{ value: number | null; onChange: (id: number | null) => void }`.
   - Trigger: an outline `Button` (full width) showing `useDonor(value)` → `fullName` when set, else
     the `donations.selectDonor` placeholder; plus a clear affordance when a value is set.
   - Internal state: `open`, `page` (reset to 0 on sort change), `useSort('fullName,asc', …)`.
   - `useDonors({ page, size: 10, sort })` → render `Table` of rows; clicking a row calls
     `onChange(donor.id)` then closes. Prev/Next + `donors.page` indicator from `data.page?.*`.
   - Loading (`Skeleton`) / empty (`EmptyState` or simple message) states mirroring `donors-page`.
   - verify: component renders, paginates, selects.

2. **Wire into the form** (`donation-form.tsx`)
   - Replace the `donorId` `Controller`'s `Select` body with
     `<DonorPicker value={field.value ?? null} onChange={field.onChange} />`.
   - Remove `donors` from `DonationFormProps` + destructure; remove unused `Select*` imports and the
     `DonorResponse` import if now unused.
   - verify: `pnpm run check` clean (no unused imports).

3. **Update pages** (`donation-create-page.tsx`, `donation-edit-page.tsx`)
   - Remove `useDonors()` import/call and `donors`/`donorsPage` vars; remove `donors={donors}` prop.
   - verify: typecheck passes.

4. **i18n** — add any new key (e.g. `donations.changeDonor`, `donors.selectRow` if needed); reuse
   existing `donors.*` table/pagination keys.

5. **Tests** — extend MSW donor handler for pagination; add `donor-picker.test.tsx`; run full suite.

## Verification
- `pnpm run test` — all green, including new `donor-picker.test.tsx`.
- `pnpm run check` && `pnpm run build` — no lint/type errors, no orphaned imports.
- `pnpm run dev` → open donation create page: click the donor field → dialog with paged donors table
  opens → sort by name, page next/prev → click a donor → dialog closes, field shows the name → submit
  saves with correct `donorId`. Open an existing donation in edit: field pre-shows the saved donor.
