# Implementation Plan: Bundle size + React Compiler

## Overview

A `/webperf` audit (Quick mode — no Lighthouse/CrUX/trace, so all _user-facing_ impact is potential; the byte counts are measured from the committed `dist/`) found the app structurally healthy with one real payload problem and one documentation defect.

`/` is the dashboard, the landing route for every authenticated user. Its critical path measures ≈ **303 KB gzip / ~1.0 MB raw** before the first chart pixel:

| Chunk                   | Raw      | Gzip         | Contents                                                             |
| ----------------------- | -------- | ------------ | -------------------------------------------------------------------- |
| `index-*.js` (entry)    | 409.5 KB | 129.3 KB     | react-dom, react-router, TanStack Query, i18next + inlined `es.json` |
| `dashboard-page-*.js`   | 351.9 KB | **102.8 KB** | recharts 3 (+ its internal redux/immer store)                        |
| `useRenderElement-*.js` | 91.5 KB  | 31.4 KB      | base-ui core + lucide icons                                          |
| `formatters-*.js`       | 91.1 KB  | 27.8 KB      | react-day-picker + Calendar + Popover + dayjs                        |
| `index-*.css`           | 65.3 KB  | 11.6 KB      | Tailwind + `@font-face`                                              |

Route-level splitting already works (16 `lazy()` wrappers in `src/app-routes.tsx`) — it just puts recharts on the one route everyone lands on, fetched _in series_ after the entry chunk evaluates and resolves the lazy import.

Goal: take recharts off the landing render path, make the React Compiler claim in `CLAUDE.md` true, and install a size budget so the next 100 KB regression is caught at build time.

## Architecture Decisions

**Split _below_ the route boundary, not at it.** The route split already exists; adding a second `lazy()` inside `financial-overview.tsx` lets the page shell, stat cards, and date picker paint while recharts streams in.

**Do not rewrite the recharts namespace import.** `src/components/ui/chart.tsx:3` uses `import * as RechartsPrimitive`, but every access is a static member access, which Rollup already tree-shakes. Empirical proof: `comparison-bar-chart.tsx:2` _already_ uses named imports and the chunk is still 351.9 KB. The weight is intrinsic to recharts 3 — an internal redux/immer store plus the d3 scale/shape/array family, shared by `ResponsiveContainer`/`Tooltip`/`Legend`/`BarChart`. Rewriting saves ~0 bytes.

**Do not add `manualChunks`.** Rollup's automatic chunking already derived correct shared chunks. The usual `{ vendor: ['react', 'recharts', ...] }` recipe would hoist recharts into a chunk `/login` must download, undoing the splitting that works, and hand-written chunk groups risk cross-chunk circular-init `undefined` errors that surface at runtime rather than build.

**No `useEffect` work is in scope, because there is nothing to fix.** Only 5 effect sites exist in all of `src/`, zero `useLayoutEffect`. Every one has exhaustive primitive deps and proper cleanup, and **not one fetches data** — all server state goes through TanStack Query with correct `enabled` gating. No derived-state-from-props effects, no unstable deps. The one genuine defect found nearby is an a11y bug, deferred to Task 6.

**React Compiler is a docs-correctness change, not a perf win.** `vite.config.ts:10` is `plugins: [react({}), tailwindcss()]`; `@vitejs/plugin-react` v6 does not enable the compiler implicitly, and `compiler-runtime` appears 0 times in the built chunks. `babel-plugin-react-compiler@1.0.0` is installed but unreferenced. Enabling it _adds_ the `react/compiler-runtime` import. We do it so the "no manual memoization needed" guidance in `CLAUDE.md` becomes safe — and we report the byte delta honestly rather than claiming a win.

## Task List

### Phase 1: Baseline

#### Task 1: Capture the pre-change build baseline

**Description:** Record raw and gzip sizes per chunk from a clean `pnpm run build`, so every later claim is a measured delta rather than an estimate. Confirm `compiler-runtime` is currently absent.

**Acceptance criteria:**

- [ ] Per-chunk raw + gzip table captured for the current `main`
- [ ] `grep -c compiler-runtime dist/assets/index-*.js` returns 0 (documents the pre-state)

**Verification:**

- [ ] `pnpm run build` succeeds
- [ ] Numbers recorded in the session for the final report

**Dependencies:** None
**Files touched:** none (read-only measurement)
**Scope:** XS

---

### Phase 2: The payload fix

#### Task 2: Lazy-load `ComparisonBarChart` with a CLS-safe fallback

**Description:** Move recharts off the dashboard's initial payload by splitting the chart below the route boundary.

**The CLS trap — this is the whole difficulty of the task.** `financial-overview.tsx` renders `ComparisonBarChart` **three times at three different heights**: `max-h-20` (:150, tithe), `max-h-45` (:160, other donations), `max-h-75` (:185, expenses). Worse, `ChartContainer` (`chart.tsx:66`) sizes itself with `flex aspect-video justify-center` _plus_ the caller's `max-h-*` — so rendered height is `min(width / 1.777, max-h)`, not a fixed value. A fallback that isn't `aspect-video` **and** doesn't carry the same `max-h-*` will shift layout, converting this fix into a CLS regression.

Note the existing `Skeleton` (`src/components/skeleton.tsx:4`) hardcodes `h-10`. Because `h-*` and `max-h-*` are different CSS properties, `cn()` will **not** strip it — `<Skeleton className="max-h-20" />` renders 2.5rem tall, not the chart's height. Do not reuse `Skeleton` here; build the fallback as a plain div mirroring `ChartContainer`'s box:

```tsx
<div
  aria-hidden="true"
  className={cn('bg-muted aspect-video animate-pulse rounded-md', className)}
/>
```

Create `src/features/dashboard/comparison-bar-chart.lazy.tsx` exporting a wrapper with the **identical props signature** to `ComparisonBarChart` (`comparison-bar-chart.tsx:20-27`):

- `const Chart = lazy(() => import('./comparison-bar-chart').then(m => ({ default: m.ComparisonBarChart })))` at **module scope** — a `lazy()` call inside a render body creates a new component type each render and remounts the chart every time.
- Render `<Suspense fallback={...}><Chart {...props} /></Suspense>`, passing the caller's `className` into both.

Then swap the import at `financial-overview.tsx:13`. The three call sites stay byte-identical.

**Acceptance criteria:**

- [ ] A separate chart chunk appears in `dist/`; `dashboard-page-*` drops by roughly the recharts mass
- [ ] All three charts still render with correct data, tooltips, and the legend on the two `showLegend` instances
- [ ] No visible layout shift at any of the three heights as the chart swaps in
- [ ] The `EmptyState` branches (`:165`, `:188`) are unaffected — no chunk fetched when there is no data

**Verification:**

- [ ] `pnpm run typecheck` and `pnpm run test` clean
- [ ] `pnpm run build` — new chunk present, `dashboard-page-*` gzip reduced
- [ ] Browser preview: throttle the network, watch all three charts swap in; compare screenshots before/after swap

**Dependencies:** Task 1
**Files touched:** `src/features/dashboard/comparison-bar-chart.lazy.tsx` (new), `src/features/dashboard/financial-overview.tsx`
**Scope:** S

---

### Checkpoint: Payload fix

- [ ] Build clean, tests pass
- [ ] Measured `dashboard-page-*` gzip reduction recorded
- [ ] Dashboard verified visually in the browser preview with no layout shift

---

### Phase 3: Build configuration

#### Task 3: Enable React Compiler in the Vite build

**Description:** Wire `babel-plugin-react-compiler` into `vite.config.ts:10` so the build actually runs it. Use either `react({ babel: { plugins: [['babel-plugin-react-compiler', { target: '19' }]] } })` or `@vitejs/plugin-react`'s exported `reactCompilerPreset` — check the installed v6 types before choosing.

`babel-plugin-react-compiler` stays in `devDependencies` (correct for a build-time plugin); confirm it isn't pruned before `vite build` runs in the Docker build stage.

**Do not** remove the existing manual memoization (`auth-context.tsx:70/75/80`, `chart.tsx:147`) in this task — that's a separate cleanup once the compiler is verified working.

**Stop condition:** if the compiler produces build errors or test failures on any component, **stop and report** rather than working around it. The approved fallback is to correct `CLAUDE.md` to say the compiler is off and drop the unused dependency.

**Acceptance criteria:**

- [ ] `compiler-runtime` present in the built output
- [ ] `CLAUDE.md`'s React Compiler claim is now accurate
- [ ] Entry-chunk gzip delta reported honestly, including if it grew

**Verification:**

- [ ] `pnpm run typecheck` and `pnpm run test` clean
- [ ] `pnpm run build` succeeds; `grep -c compiler-runtime dist/assets/*.js` > 0
- [ ] Browser preview: dashboard **and** `/login` behave identically to before

**Dependencies:** Task 2 (so the two byte deltas stay separable)
**Files touched:** `vite.config.ts`
**Scope:** XS

#### Task 4: Add bundle visualizer and size budget

**Description:** Add `rollup-plugin-visualizer` as a devDependency, gated behind an env flag (e.g. `process.env.ANALYZE`) so normal builds are unaffected, plus an `analyze` script in `package.json`. Set `build.chunkSizeWarningLimit: 300` — deliberately below the current entry chunk, so today's state is visibly non-compliant instead of silently passing under Vite's 500 KB default.

**Acceptance criteria:**

- [ ] `pnpm run build` unaffected when `ANALYZE` is unset (no report emitted, no added build time)
- [ ] `pnpm run analyze` emits a treemap
- [ ] The 300 KB warning fires for chunks over budget

**Verification:**

- [ ] Both build paths run; warning output inspected

**Dependencies:** Task 3
**Files touched:** `vite.config.ts`, `package.json`
**Scope:** XS

#### Task 5: Move `prettier` to devDependencies

**Description:** `package.json` lists `prettier@3.8.3` under prod `dependencies`, while its two plugins are correctly in devDependencies. **Zero bundle impact** — nothing in `src/` imports it and it appears 0 times in the entry chunk. The cost is install time and Docker production image size only. This must not be described as a bundle-size fix in the final report.

**Acceptance criteria:**

- [ ] `prettier` under `devDependencies`; lockfile updated
- [ ] Formatting tooling still runs

**Verification:**

- [ ] `pnpm install` clean; `pnpm run check` still works

**Dependencies:** None
**Files touched:** `package.json`, `pnpm-lock.yaml`
**Scope:** XS

---

### Checkpoint: Complete

- [ ] `pnpm run typecheck`, `pnpm run test`, `pnpm run build` all clean
- [ ] Before/after gzip table produced, with the chart split and the compiler deltas reported _separately_
- [ ] Dashboard and `/login` verified in the browser preview
- [ ] Network panel confirms the chart chunk is a separate, later request than `dashboard-page-*`

---

### Phase 4: Deferred (do not include in this change)

#### Task 6: Fix the calendar day-button focus ref — file separately

**Description:** `src/components/ui/calendar.tsx:198-201` creates `const ref = useRef<HTMLButtonElement>(null)` and calls `ref.current?.focus()` in an effect, but the `<Button>` at :209 never receives `ref={ref}`. `ref.current` is permanently `null`, so arrow-key navigation in the date-range picker doesn't move DOM focus.

This is a **keyboard accessibility bug, not a perf issue**, and it is deliberately out of scope to keep the perf diff clean. It is also not certainly a one-liner: `{...props}` is spread last, so if react-day-picker also passes a `ref` it needs a merged ref rather than a plain assignment.

**Dependencies:** None
**Scope:** S (once scoped)

## Risks and Mitigations

| Risk                                                                        | Impact   | Mitigation                                                                                                                                           |
| --------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Chart fallback height mismatch causes CLS — the fix becomes a regression    | **High** | Mirror `ChartContainer`'s `aspect-video` + caller `max-h-*`; do not reuse `Skeleton` (its `h-10` survives `cn()`); verify all three heights visually |
| `lazy()` accidentally called in a render body → chart remounts every render | Med      | Module-scope the `lazy()` call; watch for chart flicker on date-range change                                                                         |
| React Compiler breaks a component or a test                                 | Med      | Task 3 has an explicit stop-and-report condition and an approved fallback (correct the docs instead)                                                 |
| Compiler runtime grows the entry chunk more than the split saves            | Low      | Tasks 2 and 3 are sequenced separately so the two deltas are attributable; report both                                                               |
| A second Suspense boundary adds a visible loading flash on fast connections | Low      | The fallback is a same-size pulse in the same box; check on an unthrottled load                                                                      |

## Open Questions

None blocking. Three observations noted during the audit, deliberately **not** acted on:

- The `formatters-*` chunk is 91 KB of react-day-picker named after a 20-line utility file — misleading when reading build output.
- The three font subsets in `dist/` (latin, latin-ext, cyrillic) are correctly `unicode-range`-gated, so only latin is ever fetched. Dead weight in the Docker image, not on the wire — not worth optimizing.
- Six duplicated `useState(currentMonthRange)` blocks across pages, and the date range is the only list filter _not_ mirrored into the URL while `page`/`sort` are — so shared report links silently drop the range.
