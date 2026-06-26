# Plan: Use DonorPicker in Reports donor-statement tab

Source spec: [docs/SPEC-donor-picker-reports.md](../SPEC-donor-picker-reports.md)

## Summary

Single-file swap in [reports-page.tsx](../../src/features/reports/reports-page.tsx): replace the
hand-rolled base-ui `Autocomplete` (client-side, 100-donor cap) with the existing server-side
searchable [DonorPicker](../../src/features/donors/donor-picker.tsx). Drop-in — DonorPicker's
`value: number | null` / `onChange: (id) => void` already match `donorId` state and
`useDonorStatement(donorId, range)`.

## Dependency graph

```
DonorPicker (exists, no change)  ─┐
useDonors search hook (exists)   ─┤→  reports-page.tsx swap  →  manual verify
useDonorStatement (exists)       ─┘
```

No build dependencies between subtasks — all edits land in one file, one vertical slice.
Sequence is: edit → lint → typecheck → test → manual.

## Phase 1 — Swap (one vertical slice)

All in [src/features/reports/reports-page.tsx](../../src/features/reports/reports-page.tsx).

1. Add `import { DonorPicker } from '@/features/donors/donor-picker'`.
2. Delete `DonorList` helper (lines 170–187).
3. In `DonorStatementTab`: remove `useDonors()` call (line 193) + `donors` derive (line 199);
   replace `<Autocomplete.Root>…</Autocomplete.Root>` (lines 204–231) with:
   ```tsx
   <div className="w-64">
     <DonorPicker value={donorId} onChange={setDonorId} />
   </div>
   ```
4. Remove orphaned imports: `Autocomplete` (l1), `DonorResponse` (l2), `CircleX` from lucide (l4),
   `useDonors` from `@/features/donations/use-donations` (l18).

Keep `donorId` state + `useDonorStatement` untouched.

### CHECKPOINT A — static

- `pnpm run check` → no lint / no unused-import errors.
- `pnpm run build` → type-checks clean.
- `pnpm run test` → suite green.

## Phase 2 — Verify behavior

Manual (`pnpm run dev` → Reports → Donor statement tab):

- Type term → list comes from backend search (not 100-cap client filter).
- Pick donor → statement loads (`useDonorStatement` fires).
- Clear (X) → resets to "no donor selected".

### CHECKPOINT B — done

All static checks pass + manual flow works → ready to commit.

## Boundaries

- Scope = `reports-page.tsx` only.
- Do NOT delete orphaned i18n keys `reports.searchDonor` / `reports.noDonorsFound` (flag only).
- Do NOT touch `DonorPicker`, `useDonorStatement`, or adjacent tabs.
