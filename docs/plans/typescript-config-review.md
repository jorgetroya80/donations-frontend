# Plan: TypeScript configuration review — align with TypeScript 6.0.3

## Context

The request was to "review TypeScript configuration against the current version of TypeScript in this project." The project runs **TypeScript 6.0.3**, but the tsconfig files predate it and were never revisited. Reviewing against the installed compiler (not from memory) found four real gaps:

1. **`strict` is not enabled in any tsconfig.** The codebase is nonetheless already strict-clean — `tsc --strict` produces **0 errors**, and there is not a single `any`, `@ts-ignore`, or `@ts-expect-error` in `src/`. That safety is maintained by discipline alone, with no compiler guardrail. Any future PR can silently introduce implicit `any` or null-unsafe code.
2. **CI type-checks only one of the two projects.** `pnpm run typecheck` is `tsc --noEmit -p tsconfig.app.json`, so `tsconfig.node.json` (i.e. `vite.config.ts`) is never checked in CI. `vitest.config.ts` belongs to **no project at all** and is unchecked everywhere.
3. **`ignoreDeprecations: "6.0"` is masking a TS 7.0 blocker** in both `tsconfig.json` and `tsconfig.app.json`. TS 6.0 deprecates `target: es3/es5`, `module: none/amd/system/umd`, `moduleResolution: node/node10/classic`, `import ... assert {}` syntax — **and `baseUrl`**, which this project sets. Removing `ignoreDeprecations` surfaces `TS5101: Option 'baseUrl' is deprecated and will stop functioning in TypeScript 7.0`.

   > **Correction (found during implementation).** This item originally claimed `ignoreDeprecations` was dead config silencing nothing. That was wrong. The initial review checked for a declarative `deprecatedInVersion` marker on each option definition and found none; but TS 6.0 enforces the `baseUrl` deprecation *imperatively* inside its options validator, so that check was a false negative. The option was doing real work. See Task 1.2 for the resolution.
4. ~~**`lib` omits `DOM.Iterable`**, so iterating DOM collections (`NodeList`, `FormData`, `URLSearchParams`) doesn't type-check.~~ **Retracted — not a real gap.**

   > **Correction (found during implementation).** This was true through TS 5.x but is false for the TS 6.0.3 this project runs. TS 6 ships an empty `lib.dom.iterable.d.ts` — *"This file's contents are now included in the main types file"* — with the iterator declarations already in `lib.dom.d.ts`, making the option a no-op. Verified: a file iterating `NodeList`, `URLSearchParams` and `FormData` type-checks identically with and without it. The option was added in Task 1.3 and removed again once measured; `lib` ends unchanged from `main`. The mistake was asserting from general TypeScript knowledge instead of testing against the installed compiler — the same error that produced the `baseUrl` miss above, in the opposite direction.

**Intended outcome:** the compiler enforces the strictness the code already meets, CI checks every TypeScript file in the repo, and the config contains nothing untrue.

**User decisions (locked):**

- Strictness scope: **`strict` + `noUncheckedIndexedAccess`**. `exactOptionalPropertyTypes` (44 errors) is explicitly **out of scope**.
- Config hygiene (CI coverage, dead options, missing lib) is **in scope**.

## Measured baseline

Error counts from running the installed compiler against `tsconfig.app.json` with each flag:

| Flag                           | Errors | Verdict                 |
| ------------------------------ | ------ | ----------------------- |
| current config                 | 0      | —                       |
| `--strict`                     | **0**  | free win                |
| `--noImplicitAny`              | 0      | subsumed by strict      |
| `--strictNullChecks`           | 0      | subsumed by strict      |
| `--noUncheckedIndexedAccess`   | 11     | 9 in tests, 2 in source |
| `--exactOptionalPropertyTypes` | 44     | out of scope            |

`tsc --build` already exits 0, so the project references work as-is.

## Commands

- Typecheck: `pnpm run typecheck`
- Test: `pnpm run test` (watch: `pnpm run test:watch`)
- Lint/format: `pnpm run check` (CI: `pnpm run check:ci`)
- Build: `pnpm run build`

---

## Phase 1 — Enable `strict` and close the config gaps

Config-only. Zero code changes expected, and the build must stay green throughout.

### Task 1.1 — Add `strict: true` to both projects

Files: `tsconfig.app.json`, `tsconfig.node.json`

Add `"strict": true` to `compilerOptions` in each, inside the existing `/* Linting */` block alongside `noUnusedLocals`. Do not add the individual sub-flags (`noImplicitAny`, `strictNullChecks`, …) — `strict` covers them and listing them is noise.

- **Acceptance:** `pnpm run typecheck` passes with no new errors.
- **Verify:** `npx tsc --build --force` exits 0.

### Task 1.2 — Remove the dead `ignoreDeprecations`

Files: `tsconfig.json`, `tsconfig.app.json`

Delete the `"ignoreDeprecations": "6.0"` line from both. This surfaces `TS5101` on `baseUrl`, so **also delete `"baseUrl": "."` from both** — fixing the deprecation at the source rather than re-hiding it.

Removing `baseUrl` is safe here because the `paths` values are already config-relative (`"@/*": ["./src/*"]`), which is exactly the form TS 6 resolves against the tsconfig's own directory when no `baseUrl` is set. The bundler is unaffected either way: Vite and Vitest resolve the `@` alias independently via `resolve.alias` in `vite.config.ts` and `vitest.config.ts`.

- **Acceptance:** no `TS5101`/`TS5107` deprecation errors appear; `@/…` imports still resolve.
- **Verify:** `npx tsc --build --force` exits 0. Prove alias resolution is real rather than silently degraded with a negative control — a file importing both a valid `@/lib/utils` and a bogus `@/lib/does-not-exist` must error on *only* the bogus one (`TS2307`).

### ~~Task 1.3 — Add `DOM.Iterable` to the app `lib`~~ (dropped)

File: `tsconfig.app.json` — **no change; `lib` stays `["ES2023", "DOM"]`.**

This task was executed as planned, then reverted once measured. `DOM.Iterable` is inert in TS 6.0 (see the retraction on gap 4 in Context). Verify the option is genuinely unnecessary rather than trusting either claim: type-check a file that iterates `NodeList`, `URLSearchParams` and `FormData` under `--lib ES2023,DOM` — it must report zero errors.

### Task 1.4 — Bring `vitest.config.ts` into the node project

File: `tsconfig.node.json`

Change `"include": ["vite.config.ts"]` to `["vite.config.ts", "vitest.config.ts"]`.

- **Acceptance:** `npx tsc --showConfig -p tsconfig.node.json` lists both files under `files`.
- **Verify:** `npx tsc --noEmit -p tsconfig.node.json` exits 0.

### Task 1.5 — Make `typecheck` cover both projects

File: `package.json`

Change the `typecheck` script from `tsc --noEmit -p tsconfig.app.json` to `tsc --build --force`. `--build` walks the references in `tsconfig.json`, so both projects are checked; `--force` stops a stale `.tsbuildinfo` from masking errors in CI. Both projects already set `noEmit`, so nothing is written.

- **Acceptance:** `pnpm run typecheck` checks app **and** node projects.
- **Verify:** `pnpm run typecheck` exits 0. Confirm the coverage is real by temporarily introducing a type error in `vite.config.ts` and checking that the script now fails — then revert it.

### ✅ Checkpoint 1

```bash
pnpm run typecheck && pnpm run check:ci && pnpm run test && pnpm run build
```

All four must pass. Commit before starting Phase 2 — this phase is independently valuable and independently revertable.

---

## Phase 2 — Enable `noUncheckedIndexedAccess`

Unlike Phase 1, this phase **requires code changes**. The errors only appear once the flag is on, so the order is: enable the flag, then drive the error list to zero.

### Task 2.1 — Turn the flag on and capture the error list

File: `tsconfig.app.json` — add `"noUncheckedIndexedAccess": true` next to `strict`.

Do **not** add it to `tsconfig.node.json`; the config files don't index into arrays and the flag would be inert there.

- **Verify:** `npx tsc --noEmit -p tsconfig.app.json` reports the 11 known errors and no others. If the count differs, reconcile before continuing.

### Task 2.2 — Fix the two source-level sites

The only two in production code. Both index provably in range, so the fix is to express that — not to add runtime error handling for an impossible state (per `CLAUDE.md` §2).

**`src/lib/use-sort.ts:47`** — `isValidSort` destructures `value.split(',')`. `String.prototype.split` always returns at least one element, so `field` is never actually `undefined`. Give the destructure a default:

```ts
const [field = '', dir] = value.split(',');
```

The same `sort.split(',')` destructure appears three more times in this file (lines 10, 32, 38), but those bind `currentField`/`currentDir`, which are only ever compared with `===`. They do not error and **must not be touched**.

**`src/components/ui/tabs.tsx:27`** — `tabs[next]`, where `next` is a modulo-bounded index. Bind and narrow once:

```ts
const nextTab = tabs[next];
if (!nextTab) return;
onChange(nextTab.key);
document.getElementById(`tab-${nextTab.key}`)?.focus();
```

- **Acceptance:** both files clear; existing keyboard-navigation behaviour unchanged.
- **Verify:** `pnpm run test` — tabs and sorting behaviour are covered by the existing suite.

### Task 2.3 — Fix the nine test-file sites

Files: `src/features/donations/donation-create-page.test.tsx` (25, 32), `src/features/donations/use-donations.test.tsx` (91), `src/features/donors/use-donors.test.tsx` (32, 43), `src/features/expenses/use-expenses.test.tsx` (32), `src/features/users/use-users.test.tsx` (27), `src/layouts/app-layout.test.tsx` (44, 46)

All are `getAllBy*(...)[0]`-style indexing, or array access on captured request/mock lists. In a test an out-of-range index _should_ fail loudly, so a non-null assertion is the right tool — append `!` to the indexed access (e.g. `rows[0]!`).

Biome permits this: `biome.json` enables `noExtraNonNullAssertion` and `noNonNullAssertedOptionalChain` but **not** `noNonNullAssertion`.

- **Acceptance:** `npx tsc --noEmit -p tsconfig.app.json` reports 0 errors.
- **Verify:** `pnpm run test` — all tests still pass, with no assertion behaviour changed.

### ✅ Checkpoint 2

```bash
pnpm run typecheck && pnpm run check:ci && pnpm run test && pnpm run build
```

Plus a smoke check of the two touched components via the dev server: tab keyboard navigation (arrow keys / Home / End) and column sorting on a list page.

---

## Out of scope (noted, not actioned)

- **`exactOptionalPropertyTypes`** — 44 errors. Frequently conflicts with third-party React prop types; worth a separate evaluation.
- **Node version drift** — `.nvmrc` pins `22.21.1` but `.github/workflows/ci.yml` uses `node-version: 24`. Unrelated to TypeScript config, but worth reconciling.
- **`types: ["vitest/globals"]` in the app project** leaks test globals (`describe`, `it`) into application source, so a stray `it(...)` in a component would type-check. Fixing this properly means a third tsconfig for tests — a larger restructure than this review warrants.

## Final verification

```bash
pnpm run typecheck && pnpm run check:ci && pnpm run test:coverage && pnpm run build
```

Then confirm the guardrail actually bites: temporarily add `const x: any = 1` to any file in `src/` and verify `pnpm run typecheck` now fails, then revert. That single check proves Phase 1 achieved its purpose.
