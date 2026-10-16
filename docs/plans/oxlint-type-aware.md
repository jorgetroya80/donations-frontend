# Plan: Enable oxlint type-aware rules

> Follow-up to [`oxc-tooling.md`](./oxc-tooling.md) (PR #197) and the `correctness` category
> (PR #198). Branch: `chore/oxlint-type-aware`.

## Context

`.oxlintrc.json` already enables the `correctness` category, but 15 of its rules are
type-aware and only run with `--type-aware`, which needs the `oxlint-tsgolint` package
(a native `tsgo`-based binary). Today they are silently skipped.

Type-aware rules in `correctness` (from `oxlint --type-aware --print-config`):

`await-thenable`, `no-array-delete`, `no-base-to-string`, `no-duplicate-type-constituents`,
`no-floating-promises`, `no-for-in-array`, `no-implied-eval`, `no-meaningless-void-operator`,
`no-misused-spread`, `no-redundant-type-constituents`, `no-unsafe-declaration-merging`,
`no-unsafe-unary-minus`, `require-array-sort-compare`, `restrict-template-expressions`,
`unbound-method`.

## Measurement (2026-10-16)

Scratchpad run with oxlint `1.87.0` + oxlint-tsgolint `7.0.2004` against `src/`, current
`.oxlintrc.json`, no config changes. Runtime: ~0.8 s wall for all of `src/`.

**30 findings, 2 rules, 4 root causes, 0 confirmed defects.**

| Rule                            | Count | Root cause                                                                                                                                   | Defect?                                                                         |
| ------------------------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `no-floating-promises`          | 14    | `navigate(...)` (react-router 8 returns `Promise<void> \| void`) in event handlers and mutation callbacks                                    | No. Fire-and-forget navigation is intended                                      |
| `no-floating-promises`          | 8     | `queryClient.invalidateQueries(...)` in `onSuccess` of `use-{donors,donations,expenses,users}.ts`                                            | No. The mutation resolves before the refetch, which is the current, accepted UX |
| `no-floating-promises`          | 5     | `act(() => vi.advanceTimersByTime(n))` in `use-debounced-value.test.ts`. The callback returns a value, so the async `act` overload is picked | No. Timers are sync; the test passes                                            |
| `no-floating-promises`          | 1     | `i18n.use(...).init({...})` in `src/lib/i18n.ts`                                                                                             | No. Resources are bundled inline, init is effectively sync                      |
| `restrict-template-expressions` | 3     | `` `${nameKey ?? item.dataKey ?? 'value'}` `` in vendored `src/components/ui/chart.tsx`; recharts types `dataKey` as possibly a function     | No. The app never passes a function `dataKey`                                   |

Fix cost: no new utilities or abstractions. Every finding is fixed at the call site with
`void`, a block-bodied arrow, or `String(...)`.

Running cost: one new devDependency (`oxlint-tsgolint`, ~21 MB of platform binaries), and
`oxlint` in CI, `lint-staged` and the agent hook gets slower by under a second.

Note: `.oxlintrc.json` already supports `"options": { "typeAware": true }`, so turning it on
needs no command changes.

### Out of scope, measured for reference

Not in `correctness`, so `--type-aware` alone does not turn them on:

- `no-misused-promises`: 29 findings, almost all `onSubmit={form.handleSubmit(...)}` and
  async `onClick` handlers. Noise for React; not proposed.
- `no-deprecated`: 5 findings. One is real maintenance debt: `z.string().email()` in
  `src/features/donors/donor-schema.ts` (Zod says use `z.email()`). The others are in tests
  and vendored `calendar.tsx`. Fix the Zod one separately if wanted; enabling the rule is not
  proposed.
- `no-unnecessary-type-assertion`: 4 findings. Not reviewed.

## Decision gate

The measurement found **no defects**. The value is preventive: the next unawaited
`mutateAsync`, `refetch` or async call in a handler gets flagged. Following the rule of judging
strictness by defects caught, this plan is only worth executing if that future protection is
worth one native dependency and ~30 `void`s.

- **Option A — adopt (this plan).** Free of new abstractions, cheap at runtime. Ceremony:
  `void navigate(...)` becomes the house style.
- **Option B — skip.** Record the measurement here and close. Revisit if a floating-promise bug
  ever ships.
- **Option C — adopt but turn off `no-floating-promises`.** Keeps 14 near-silent rules
  (only 3 findings in `chart.tsx`). Low value for the dependency cost; not recommended.

**Recommendation: A**, because no new abstraction is needed and floating promises are the
class of bug `tsc` cannot catch. Choose B if `void navigate(...)` reads as noise.

**Decision:** Option A (Jorge, 2026-10-16), then changed to **Option C** after review the same
day: Jorge does not want `void` at call sites, so `typescript/no-floating-promises` is turned
off and the 27 `void` / `act` edits were reverted. Only the 3 `chart.tsx` fixes remain.

## Decisions (if A)

- **Keep current behavior.** `invalidateQueries` gets `void`, not `return`. Returning it would
  keep mutations pending until the refetch finishes, which changes UX and is a separate
  decision.
- **`void` over `.catch()`** for `navigate`. Navigation does not reject in practice; a catch
  handler would be dead code.
- **No per-file disables.** `chart.tsx` is vendored but already edited in this repo, so fix it
  in place.
- **Same scope as today.** `src/` for scripts and CI, same `lint-staged` globs.
- **Version pinned and capped by `minimumReleaseAge`.** No `minimumReleaseAgeExclude` entry.
  Use the newest mature `oxlint-tsgolint` at install time.
- **Turn on in config, not CLI.** oxlint `1.87.0` supports `"options": { "typeAware": true }`
  in `.oxlintrc.json` (equivalent to `--type-aware`). One place covers the scripts,
  `lint-staged`, the agent hook and CI; no command changes.

## Dependency graph

```
Task 1 install + fix findings ── Task 2 enable in config ── Task 3 verify entry points + CI
```

Each task is one commit (Task 3 may have none if nothing needs changing).

## Tasks

### Task 1: Add `oxlint-tsgolint` and fix the 30 findings

`minimumReleaseAge` capped `oxlint-tsgolint` at `7.0.2003` (7.0.2004 too new).

- Add `oxlint-tsgolint` as an exact-pinned devDependency.
- ~~`void` the 14 `navigate(...)` calls, the 8 `invalidateQueries(...)` calls and `i18n.init`.~~
- ~~`use-debounced-value.test.ts`: `act(() => { vi.advanceTimersByTime(n) })`.~~
- Superseded by Option C: `"typescript/no-floating-promises": "off"` in `.oxlintrc.json`.
- `chart.tsx`: replace the 3 template literals with `String(...)`.

Acceptance:

- [x] `pnpm exec oxlint --type-aware src/` exits 0 (was 30 problems)
- [x] `typecheck` and `test` (434/434) pass; no behavior change

### Task 2: Enable type-aware in `.oxlintrc.json`

Add `"options": { "typeAware": true }`.

Acceptance:

- [x] `pnpm exec oxlint src/` (no flag) reports type-aware rules: a scratch bare
      `navigate('/x')` in an `onClick` is flagged
- [x] `pnpm run check` and `pnpm run check:ci` exit 0

### Task 3: Verify every entry point, then CI

No command edits expected; the config covers them.

Acceptance:

- [x] `lint-staged` blocks a staged file with a bare `navigate('/x')`
- [x] `.claude/hooks/format-file.sh` still runs in under ~2 s (0.47 s) on one `src/*.tsx` file
- [x] CI `Lint` step (`oxlint --format github src/`) emits `::error file=…` for the scratch
      violation locally
- [ ] `Lint & Type Check` job passes on the PR

### Checkpoint: Complete

- [x] `pnpm install --frozen-lockfile`, `check:ci`, `typecheck`, `test`, `build` pass
- [ ] CI green
- [x] Update `docs/ARCHITECTURE.md` / `CLAUDE.md` only if they describe the lint command (not needed: commands unchanged)

## Risks

| Risk                                                                                                      | Impact | Mitigation                                                                            |
| --------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------- |
| `oxlint-tsgolint` is young (7.0.x, frequent releases) and uses `tsgo`, not the project's TypeScript 6.0.3 | Medium | Exact pin. `tsc` stays the source of truth for types; tsgolint only feeds lint rules  |
| Native binary missing for a platform (CI runner, Docker build)                                            | Low    | Linux x64 and darwin arm64 packages exist. Docker image does not lint                 |
| `void` everywhere hides a future real rejection                                                           | Low    | Only used where rejection is impossible or already handled by React Query's `onError` |
| `lint-staged` / hook latency grows as the program grows                                                   | Low    | Measured ~0.8 s for all of `src/`. Re-measure if it passes 3 s                        |
