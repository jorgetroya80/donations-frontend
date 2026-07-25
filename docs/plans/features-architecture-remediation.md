# Features Architecture Remediation

## Context

An architecture review of `src/features` graded the layer **B+ — clean where it
counts** (single shared API client, real hook/schema/presentation separation,
disciplined state model). The gap to an "A" is four concrete, localized
boundary issues. This plan remediates them. It does **not** restructure the
feature layout — the conventions are good and stay as-is.

Two findings changed shape once the actual code was read (noted per task): the
`DonorPicker` "move to components" idea would create a _new_ inversion, and the
dashboard/reports "cache overlap" is in fact byte-identical duplicated hooks.

**Success criterion for the whole plan:** no shared/foundation module imports
from a feature, every cross-feature dependency is intentional and explicit, no
duplicated data hooks, and no single feature component over ~250 lines — with
`pnpm run check`, `pnpm run test`, and `pnpm run build` all green.

---

## Dependency graph & ordering

The four tasks are independent (no shared files), so they can land in any order
or in parallel PRs. Recommended sequencing puts the highest-value, lowest-risk
boundary fixes first and the pure refactor last:

```
Phase 1 — Boundary & dependency fixes (behavior-preserving, small diffs)
  T1  Layer inversion: FORCE_ROTATION_EVENT → src/lib      (independent)
  T2  DonorPicker public API                                (independent)
  T3  Dedup dashboard/reports summary hooks                 (independent)
        ── CHECKPOINT A ──
Phase 2 — Component decomposition (pure refactor)
  T4  Split financial-overview.tsx and reports-page.tsx     (independent)
        ── CHECKPOINT B ──
```

Each task is a vertical slice: code change + tests updated/passing + verified in
the running app for the affected flow.

---

## Phase 1 — Boundary & dependency fixes

### T1 — Remove the layer inversion (`lib/api` → `features/auth`)

**Problem.** `src/lib/api.ts:3` imports `FORCE_ROTATION_EVENT` from
`@/features/auth/auth-context`. The foundation layer depends upward on a
feature; `auth-context` also depends on `lib/api`, so this is a latent cycle.

**Change.**

- Create `src/lib/auth-events.ts` exporting
  `export const FORCE_ROTATION_EVENT = 'auth:force-rotation'`.
- `src/lib/api.ts` — import it from `./auth-events` (line 3).
- `src/features/auth/auth-context.tsx` — delete the local declaration
  (`auth-context.tsx:12`) and re-export or import from `@/lib/auth-events`.
  It's consumed there in the `useEffect` listener (`auth-context.tsx:95`).
- Update any other importers of the constant (grep first).

**Acceptance criteria.**

- No file under `src/lib` imports from `src/features` (`grep -rn "@/features" src/lib` → empty).
- The 403 `PASSWORD_CHANGE_REQUIRED` flow still forces rotation and syncs the
  in-memory `mustChangePassword` flag.

**Verify.**

- `grep -rn "@/features" src/lib` returns nothing.
- `pnpm run test` — auth-context + api tests pass.
- Manual/e2e: trigger a 403 password-change-required response → user is routed
  to `/settings/password` and the flag persists on reload.

---

### T2 — Give `DonorPicker` an explicit, intentional public API

**Problem.** `donor-picker.tsx` (owned by `donors`) is imported by
`donations/donation-form.tsx:15` and `reports/reports-page.tsx:21`. Two features
reach into a third's internals with no declared boundary.

**Important nuance (from reading the code).** `DonorPicker` imports
`./use-donors` (`donor-picker.tsx:10`) — it is a _donor-domain_ component, not
generic UI. **Do not move it to `src/components`**: that would make the generic
UI layer depend on the `donors` feature — a worse inversion than the one we're
fixing. Feature-sliced architecture allows one feature to consume another's
**public** surface; the fix is to make that surface explicit, not to relocate
domain logic.

**Change (recommended — minimal, low risk).**

- Add `src/features/donors/index.ts` exporting the feature's public API:
  `export { DonorPicker } from './donor-picker'`.
- Update the two consumers to import from `@/features/donors` (the barrel)
  instead of the deep path `@/features/donors/donor-picker`.
- Treat the barrel as the contract: cross-feature imports go through it; deep
  paths stay feature-internal.

**Acceptance criteria.**

- `donations/donation-form.tsx` and `reports/reports-page.tsx` import
  `DonorPicker` from `@/features/donors` (not the deep file path).
- No new dependency from `src/components` on any feature.

**Verify.**

- `grep -rn "features/donors/donor-picker" src` → only the barrel (or nothing).
- `pnpm run test` and `pnpm run build` green.
- Manual: donor autocomplete still works in the donation form and in the
  reports "donor statement" tab.

---

### T3 — De-duplicate the dashboard/reports summary hooks

**Problem (worse than "cache overlap").** `dashboard/use-dashboard-data.ts` and
`reports/use-reports.ts` define **byte-identical** `useDonationSummary` /
`useExpenseSummary` (same `donationSummary`/`expenseSummary` SDK calls, same
`['reports', 'donations'|'expenses', from, to]` query keys). Two owners for the
same cache entries; a change in one silently diverges from the other.
`dashboard/use-user-stats.ts` also calls `listUsers` directly, reaching into the
`users` domain.

**Change.**

- **Single owner for report summaries = the `reports` feature.** Keep
  `useDonationSummary` / `useExpenseSummary` in `reports/use-reports.ts`
  (rename the existing `useDonationReport`/`useExpenseReport` or export shared
  names — pick one, keep keys stable). Have `financial-overview.tsx` import them
  from `@/features/reports` (add to that feature's barrel) instead of the local
  duplicates.
- `balance` is dashboard-specific (reports has no balance view): keep `useBalance`
  in dashboard, but move its query key out of the `reports` namespace into
  `['dashboard', 'balance', ...]` (or `['reports','balance']` stays if reports is
  the intended owner — decide the single owner and document it in the file).
- `use-user-stats.ts`: reuse the `users` feature's list hook
  (`@/features/users` → `useUsers({ page:0, size:1 })`) and read
  `page.totalElements`, rather than calling the SDK `listUsers` directly.

**Acceptance criteria.**

- No duplicated `useDonationSummary`/`useExpenseSummary` definitions across
  features (grep for the SDK calls → one definition each).
- Every `['reports', ...]` query key has exactly one owning feature.
- Dashboard no longer imports SDK operations owned by another domain
  (`listUsers`) — it goes through that feature's hook.

**Verify.**

- `grep -rn "donationSummary\|expenseSummary" src/features` shows one owner.
- `pnpm run test` — dashboard + reports hook tests pass (update tests to point at
  the single owner).
- Manual: dashboard financial overview and the reports tabs both render the same
  numbers; switching between them hits cache (no refetch flash).

**Risk / decision to confirm.** Which feature owns the shared financial-summary
queries — keep them in `reports` (chosen above) or extract to a neutral
`src/lib`/`features/reporting` home? Chosen: `reports`, as the lower-churn option.
Flag if you'd prefer a dedicated shared module.

---

### ── CHECKPOINT A ──

Before Phase 2, confirm: `grep -rn "@/features" src/lib` empty; no duplicated
summary hooks; `pnpm run check && pnpm run test && pnpm run build` all green;
manual smoke of auth-rotation, donor picker, dashboard, and reports flows.

---

## Phase 2 — Component decomposition (pure refactor, no behavior change)

### T4 — Split the two 300+ line components

**Problem.** `dashboard/financial-overview.tsx` (359 lines) and
`reports/reports-page.tsx` (344 lines) mix data derivation, layout, and repeated
chart/table blocks in one file. Concerns are already separated from _data_ (via
hooks); this is readability/cohesion, not a layering fix — so keep it purely
mechanical.

**Change — `financial-overview.tsx`.**

- Extract the pure derivation helpers already in the file (`previousRange`,
  `calcPctChange`, `makeDonationItem`, chart-data shaping) into a colocated
  `financial-overview.utils.ts` with unit tests.
- Extract the repeated `<BarChart>` block into a small local presentational
  component (e.g. `comparison-bar-chart.tsx`) taking `data`/`config`.
- `FinancialOverview` becomes orchestration: call hooks, shape data via utils,
  render the extracted pieces.

**Change — `reports-page.tsx`.**

- Promote the three in-file tab components (`DonationSummaryTab`,
  `ExpenseSummaryTab`, `DonorStatementTab`) into their own files
  (`donation-summary-tab.tsx`, etc.). `ReportsPage` keeps only tab state +
  routing glue.

**Acceptance criteria.**

- No feature component file exceeds ~250 lines.
- Zero behavior change: identical rendered output and query behavior.
- Extracted pure utils have direct unit tests.

**Verify.**

- `pnpm run test` — existing dashboard/reports tests pass unchanged (they assert
  behavior, which is preserved); new util tests added.
- `pnpm run build` green.
- Manual: dashboard and all three report tabs look and behave identically to
  before (charts, empty states, date-range filtering, donor statement).

---

### ── CHECKPOINT B ──

Final gate: `pnpm run check && pnpm run test && pnpm run test:coverage &&
pnpm run build` green; visual diff of dashboard + reports pages shows no change;
re-run the review greps from Phase 1 to confirm no regressions.

---

## Explicitly out of scope

Per the review's "high-value only" bar, these are **not** addressed here:
absence of barrels elsewhere, `.test.ts` vs `.test.tsx` naming, `login-page`
calling SDK `login` directly, and moving `auth`/`theme` contexts to a
`providers/` layer. None affect correctness or coupling materially.

## Task checklist

- [ ] **T1** — `FORCE_ROTATION_EVENT` → `src/lib/auth-events.ts`; `lib/api` no longer imports a feature
- [ ] **T2** — `donors/index.ts` public API; consumers import `@/features/donors`
- [ ] **T3** — single owner for summary hooks; dashboard reuses `users`/`reports` hooks; query-key ownership resolved
- [ ] Checkpoint A
- [ ] **T4** — decompose `financial-overview.tsx` and `reports-page.tsx` (< ~250 lines each)
- [ ] Checkpoint B
