# Plan: Server-side searchable DonorPicker (combobox)

## Context

Backend issue [donations-api#37](https://github.com/jorgetroya80/donations-api/issues/37) shipped: `GET /api/v1/donors` now accepts an optional `search` query param (case-insensitive partial match over `fullName` + `nationalId`, combines with `page`/`size`/`sort`, response shape unchanged).

This is the **frontend follow-up**. Today [`donor-picker.tsx`](../../src/features/donors/donor-picker.tsx) is a Dialog + paginated Table: to find one donor the user pages 10 at a time. We replace it with a **debounced server-side typeahead combobox** built from plain HTML + Tailwind (no base-ui — per project convention; the reports-page Autocomplete does *client-side* filtering and is explicitly the wrong pattern here).

Public component API stays identical (`{ value: number | null; onChange }`), so the consumer [`donation-form.tsx:198`](../../src/features/donations/donation-form.tsx) needs no change. The trigger keeps `id="donorId"` for the existing `<Label htmlFor="donorId">` association.

## Prerequisite (confirmed by user)

A new `@jorgetroya80/donations-api-client` version with `search` is published. Installed **1.8.0** types `ListDonorsData.query` as `{ pageable: Pageable }` only — no `search`. The bump is task 0 and gates everything (TS won't accept `search` until then).

## Dependency graph

```
T0 bump client ─┬─> T1 data layer (useDonors.search + serializer + msw)
                │        │
                │        v
                ├─> T2 useDebouncedValue hook
                │        │
                │        v
                └─> T3 combobox DonorPicker (consumes T1 + T2)
                          │
                          v
                      T4 i18n + a11y + tests + verify
```

## Vertical slices

### T0 — Bump api-client (prerequisite checkpoint)
- `package.json`: bump `@jorgetroya80/donations-api-client` from `1.8.0` to the published version containing `search` (confirm exact number at install).
- `pnpm install`.
- **Verify:** grep that `node_modules/@jorgetroya80/donations-api-client/dist/generated/types.gen.d.ts` `ListDonorsData.query` now includes `search?`. `pnpm typecheck` green.
- 🚧 **CHECKPOINT** — do not proceed if the param isn't present in the regenerated types.

### T1 — Data layer: thread `search` end-to-end
One complete path: caller passes `search` → request carries `search=` → backend (mock) filters.
- `src/features/donors/use-donors.ts`: add optional `search?: string` to `DonorListParams`; include in `queryKey`; pass `query.search` to `listDonors` (type-safe after T0). Omit when empty.
- `src/lib/api.ts` `pageableQuerySerializer`: append `search=${encodeURIComponent(search)}` when present (mirrors existing `from`/`to` handling).
- `src/test/msw-handlers.ts` `GET /donors`: read `url.searchParams.get('search')` and filter `content` case-insensitively over `fullName`/`nationalId` so tests exercise real server-side behavior.
- **Acceptance:** new `useDonors` test asserts a `search` request hits the network with the param and returns the filtered subset.
- **Verify:** `pnpm test src/features/donors/use-donors.test.tsx`, `pnpm typecheck`.

### T2 — Debounce hook
- New `src/lib/use-debounced-value.ts`: `useDebouncedValue<T>(value, delayMs)` — `setTimeout`, cleared on change/unmount. Small, single-purpose (none exists today).
- **Acceptance:** unit test — value updates only after `delayMs` (fake timers).
- **Verify:** `pnpm test src/lib/use-debounced-value.test.ts`.

### T3 — Combobox DonorPicker (replaces dialog internals)
Rewrite `donor-picker.tsx` internals; keep the exported `DonorPicker(props)` signature.
- Plain `<input role="combobox">` with `id="donorId"`, `aria-autocomplete="list"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`.
- Local `inputValue` → `useDebouncedValue(inputValue, ~250ms)` → `useDonors({ page: 0, size: 10, search: debounced, sort: 'fullName,asc' })`.
- Dropdown `role="listbox"`; each donor `role="option"` showing `fullName` + muted `nationalId`. Keyboard: ArrowDown/Up move highlight, Enter selects, Escape/Tab/blur close. Click selects.
- Selected state: when `value` is set, show its name in the closed input. Keep `useDonor(value)` to resolve the label when the selected donor isn't in the current result set (e.g. editing an existing donation).
- Clear (X) button → `onChange(null)`, clears input. Reuse existing `Button`/`Skeleton`/`Alert` where they fit; drop the now-unused `Dialog`/`Table`/`useSort` imports.
- States: loading (skeleton rows), error (`donors.errorLoading`), empty (`noDonorsFound`).
- **Acceptance:** typing filters via server, selecting calls `onChange(id)` and closes, clear resets, keyboard nav works, selected label renders for a preset `value`.

### T4 — i18n, a11y, integration & full verify (checkpoint)
- `src/locales/es.json`: add under `donations`: `searchDonor` ("Buscar donante…"), `noDonorsFound` ("No se encontraron donantes"). Keep `selectDonor`/`clearDonor`. (`reports.searchDonor`/`reports.noDonorsFound` already exist — mirror wording, don't share across namespaces.)
- Rewrite `donor-picker.test.tsx` for combobox semantics (old `aria-haspopup="dialog"` assertions no longer apply).
- Confirm `donation-form` / donation create+edit page tests still pass (component API unchanged).
- **Verify (full suite):** `pnpm typecheck` && `pnpm test` && `pnpm check`. Then `pnpm dev` and manually: open a donation form, type in the donor field, confirm debounced results, select, clear, and edit-an-existing-donation preselect. 🚧 **CHECKPOINT** before commit.

## Files touched
- `package.json` (T0)
- `src/features/donors/use-donors.ts`, `src/lib/api.ts`, `src/test/msw-handlers.ts` (T1)
- `src/lib/use-debounced-value.ts` (+ test) (T2)
- `src/features/donors/donor-picker.tsx` (T3)
- `src/locales/es.json`, `src/features/donors/donor-picker.test.tsx`, `src/features/donors/use-donors.test.tsx` (T1/T4)

## Out of scope
- Reports-page donor Autocomplete (separate client-side component, issue #122).
- Backend changes (already shipped).

## Task list

- [ ] **T0** Bump `@jorgetroya80/donations-api-client` to the `search`-capable version; `pnpm install`; verify regenerated types expose `search?`; `pnpm typecheck`. 🚧 checkpoint.
- [ ] **T1** Add `search` to `useDonors` params + queryKey + `listDonors` query; extend `pageableQuerySerializer`; make msw `/donors` honor `search`; test param round-trip.
- [ ] **T2** Add `useDebouncedValue` hook + test.
- [ ] **T3** Rewrite DonorPicker as plain-HTML combobox (debounced server search, keyboard nav, a11y, selected-label via `useDonor`), keeping `{ value, onChange }` API and `id="donorId"`.
- [ ] **T4** Add `donations.searchDonor`/`donations.noDonorsFound`; rewrite picker tests; confirm donation-form tests pass; full `typecheck` + `test` + `check`; manual dev verify. 🚧 checkpoint.
