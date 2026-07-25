# Plan: Per-donor "Ver donaciones" action on DonorsPage

Branch: `feat-query-donations-by-person`

## Summary

Add a per-row action to [donors-page.tsx](../../src/features/donors/donors-page.tsx) that lets the user
jump from a donor in the list to that donor's date-range statement. Rather than rebuild any date/query
UI, the action navigates to the **existing** Reports donor-statement screen with the donor preselected:
`` `/reports?tab=donor-statement&donorId=${donor.id}` ``.

The target screen already does everything — date-range picking, querying, currency/date formatting, and
empty/error/loading states — and already reads `?tab=` and `?donorId=` from the URL. So this is navigation
only: one new `Link` per row, one i18n key, one test. No new hooks, components, or state.

## Why it works with zero changes to the Reports side (verified)

- [reports-page.tsx](../../src/features/reports/reports-page.tsx) reads `?tab=` and activates the
  `donor-statement` tab when `tab=donor-statement`.
- [donor-statement-tab.tsx](../../src/features/reports/donor-statement-tab.tsx) reads `?donorId=`,
  validates it (positive integer), and drives `useDonorStatement(donorId, range)`; the query fires as soon
  as a valid `donorId` is present. Range defaults to `currentMonthRange()`.
- [donor-picker.tsx](../../src/features/donors/donor-picker.tsx) resolves the selected donor's name via
  `useDonor(value)` (`:27`, `:81`), so a donor arriving via URL displays correctly even though the picker
  is a search combobox.

## Dependency graph

```
reports-page.tsx / donor-statement-tab.tsx  (exist, no change)  ─┐
DonorPicker name resolution via useDonor    (exists, no change)  ─┤→  donors-page.tsx  →  verify
i18n key donors.statementLabel              (new)               ─┘
```

All edits land in one component + one locale file — a single vertical slice.
Sequence: edit → i18n → test → lint → typecheck → manual.

## Phase 1 — Add the action (one vertical slice)

### 1. [src/features/donors/donors-page.tsx](../../src/features/donors/donors-page.tsx)

Beside the existing edit `Link` in the Actions cell (`donors-page.tsx:99-112`):

- Add `FileBarChart` to the existing `import { Pencil, Plus } from 'lucide-react'` (same icon the
  donor-statement tab uses — keeps the visual association).
- Wrap the two actions in `<div className="flex gap-1">`.
- New `Link`:
  ```tsx
  <Link
    to={`/reports?tab=donor-statement&donorId=${donor.id}`}
    className={buttonVariants({ variant: 'ghost', size: 'icon' })}
    aria-label={t('donors.statementLabel')}
  >
    <FileBarChart size={14} aria-hidden="true" />
  </Link>
  ```
- Widen the Actions column header from `w-16` to `w-24` (`donors-page.tsx:82`) to fit two icon buttons.

### 2. [src/locales/es.json](../../src/locales/es.json)

Add under `donors`, next to `donors.editLabel` (`es.json:112`):

```json
"statementLabel": "Ver donaciones"
```

Existing donor-statement strings live under `reports.*` and are reused as-is on the target screen — no new
`reports` keys needed.

### 3. [src/features/donors/donors-page.test.tsx](../../src/features/donors/donors-page.test.tsx)

Add a test asserting each donor row renders a link with
`href="/reports?tab=donor-statement&donorId=<id>"`, following the existing test's row/link queries.

### CHECKPOINT A — static + unit

- `pnpm run test` → new + existing `donors-page.test.tsx` green.
- `pnpm run check` → Biome lint/format clean, new import ordered, no unused imports.
- `pnpm run build` → type-checks clean.

## Phase 2 — Verify behavior

Manual (`pnpm run dev` → `/donors`):

- Each row shows two ghost icon buttons: edit (pencil) + statement (bar chart).
- Click the statement icon → lands on `/reports?tab=donor-statement&donorId=<id>` with the
  donor-statement tab active, the donor's name shown in the picker, and the current-month statement loaded.
- Adjust the date range → results update.
- A11y: the statement link exposes `aria-label="Ver donaciones"`; icon is `aria-hidden`.

### CHECKPOINT B — done

Static checks pass + manual flow works → ready to commit.

## Boundaries

- Scope = `donors-page.tsx` + `es.json` + `donors-page.test.tsx`.
- Do NOT add a modal, inline expander, or new query hook — navigation only (chosen approach).
- Do NOT touch the Reports screen, `useDonorStatement`, or `DonorPicker`.
- Do NOT persist the date range in the URL — the donor-statement tab keeps range in local state; leave that
  behavior as-is.
