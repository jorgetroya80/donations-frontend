# Spec: Replace Donor Select with Combobox in Reports

## Context

`DonorStatementTab` in `src/features/reports/reports-page.tsx` uses a plain `<select>` to pick a donor before loading their statement. For large donor lists this becomes unusable — all donors are crammed into a dropdown with no way to search. The fix: replace the `<select>` with a type-to-search combobox that filters donors by name as the user types.

The existing `useDonors()` hook (in `use-donations.ts`) already fetches up to 100 donors sorted by name — no API changes needed. The donor statement total already appears in the statement table — no new data required.

## Success Criteria

- `<select>` in `DonorStatementTab` is gone
- Text input lets user type a name; matching donors appear in a filtered dropdown
- Filtering is case-insensitive substring match on `fullName`
- Selecting a donor from the dropdown populates the input and loads their statement (same as before)
- Keyboard: `↑`/`↓` navigate options, `Enter` selects, `Escape` closes
- Clicking outside closes the dropdown
- Shows "No results" message when filter matches nothing
- Existing statement rendering (date, type, payment method, amount, grand total) unchanged
- `pnpm run check` passes (no TS errors, no lint issues)

## Approach

Use `Autocomplete` from `@base-ui/react` (v1.4.1, already installed). Replace the `<select>` in `DonorStatementTab` inline — no new file/component needed.

**State change**: remove the `select`'s `onChange` handler; keep only `donorId` state. The autocomplete handles input internally.

**Key Base-UI parts used**:
- `Autocomplete.Root` — wraps everything; receives `items={donors}` and `itemToStringValue={(d) => d.fullName ?? ''}`
- `Autocomplete.InputGroup` + `Autocomplete.Input` — the text input
- `Autocomplete.Positioner` → `Autocomplete.Popup` → `Autocomplete.List` — dropdown
- `Autocomplete.Item value={donor}` — each donor row, with `onClick={() => setDonorId(donor.id ?? null)}`
- `Autocomplete.Empty` — renders when no items match
- `Autocomplete.useFilteredItems<DonorResponse>()` — hook to get filtered list inside a child component

**Filtering**: `mode='list'` (default) — Base-UI filters items automatically by `itemToStringValue` string as user types.

**Clearing donorId**: use `onValueChange` on `Autocomplete.Root` — when value becomes `''`, call `setDonorId(null)`.

**Inner list component** (needed because `useFilteredItems` must be called inside `Autocomplete.Root`):
```tsx
function DonorList({ onSelect }: { onSelect: (id: number) => void }) {
  const filtered = Autocomplete.useFilteredItems<DonorResponse>()
  return (
    <Autocomplete.List>
      {filtered.map((donor, i) => (
        <Autocomplete.Item key={donor.id} value={donor} index={i}
          onClick={() => onSelect(donor.id ?? 0)}>
          {donor.fullName} — {donor.nationalId}
        </Autocomplete.Item>
      ))}
    </Autocomplete.List>
  )
}
```

Style all Base-UI parts with Tailwind classes (no wrapper component).

## Files to Change

| File | Change |
|------|--------|
| `src/features/reports/reports-page.tsx` | Replace `<select>` with `Autocomplete` in `DonorStatementTab`; add `DonorList` sub-component |
| `src/locales/es.json` | Add `reports.searchDonor` and `reports.noDonorsFound` |

## New i18n Keys

```json
"searchDonor": "Buscar donante...",
"noDonorsFound": "No se encontraron donantes"
```

## Implementation Steps

1. Add `import { Autocomplete } from '@base-ui/react'` to `reports-page.tsx`
2. Define `DonorList` sub-component above `DonorStatementTab` using `Autocomplete.useFilteredItems`
3. In `DonorStatementTab`: replace `<select>...</select>` with:
   ```tsx
   <Autocomplete.Root
     items={donors}
     itemToStringValue={(d) => d.fullName ?? ''}
     onValueChange={(v) => { if (!v) setDonorId(null) }}
   >
     <Autocomplete.InputGroup>
       <Autocomplete.Input placeholder={t('reports.searchDonor')} className="..." />
     </Autocomplete.InputGroup>
     <Autocomplete.Positioner>
       <Autocomplete.Popup className="...">
         <DonorList onSelect={setDonorId} />
         <Autocomplete.Empty className="...">{t('reports.noDonorsFound')}</Autocomplete.Empty>
       </Autocomplete.Popup>
     </Autocomplete.Positioner>
   </Autocomplete.Root>
   ```
4. Style with Tailwind to match existing form inputs (`rounded-md border border-input bg-background px-3 py-2 text-sm`)
5. Add the two i18n keys to `es.json`

## Task Breakdown

### Task 1 — Add i18n keys (XS)

**Description:** Add the two new translation strings needed by the autocomplete UI.

**Acceptance criteria:**
- [ ] `reports.searchDonor` = `"Buscar donante..."` exists in `es.json`
- [ ] `reports.noDonorsFound` = `"No se encontraron donantes"` exists in `es.json`

**Verification:**
- [ ] `pnpm run check` passes

**Dependencies:** None

**Files:** `src/locales/es.json`

**Scope:** XS

---

### Task 2 — Add `DonorList` sub-component (S)

**Description:** Define `DonorList` above `DonorStatementTab`. Calls `Autocomplete.useFilteredItems<DonorResponse>()` and renders the filtered donor list. Add `Autocomplete` import at the top.

**Acceptance criteria:**
- [ ] `import { Autocomplete } from '@base-ui/react'` added
- [ ] `DonorList` renders `Autocomplete.List` with one `Autocomplete.Item` per filtered donor, showing `fullName — nationalId`
- [ ] Each item fires `onSelect(donor.id)` via `onClick`
- [ ] No TypeScript errors

**Verification:**
- [ ] `pnpm run check` passes

**Dependencies:** Task 1

**Files:** `src/features/reports/reports-page.tsx`

**Scope:** S

---

### Task 3 — Replace `<select>` with `Autocomplete.Root` (S)

**Description:** In `DonorStatementTab`, remove the `<select>` block and replace with the full `Autocomplete` tree. Wire `donorId` state: items' `onClick` sets it (via `DonorList`), and `onValueChange` clears it when input is emptied.

**Acceptance criteria:**
- [ ] `<select>` is gone
- [ ] `Autocomplete.Root` wraps `InputGroup` + `Positioner → Popup → (DonorList + Empty)`
- [ ] Typing filters donors; selecting one loads their statement
- [ ] Clearing input hides statement (`donorId` → `null`)
- [ ] `Autocomplete.Empty` shows `t('reports.noDonorsFound')` when no donors match
- [ ] Styles match existing inputs (`rounded-md border border-input bg-background px-3 py-2 text-sm`)

**Verification:**
- [ ] `pnpm run check` passes
- [ ] `pnpm run test` passes (existing tests unchanged)
- [ ] Manual: `pnpm run dev` → Reports → Donor Statement → type name → select → statement loads

**Dependencies:** Task 2

**Files:** `src/features/reports/reports-page.tsx`

**Scope:** S

---

### Checkpoint: Done

- [ ] `pnpm run check` — no TS or lint errors
- [ ] `pnpm run test` — all existing tests green
- [ ] Manual golden path: type → filter → select → statement loads → clear → statement hides
