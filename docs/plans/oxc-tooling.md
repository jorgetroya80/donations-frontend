# Plan: Replace Biome with oxlint + oxfmt

> PR [#197](https://github.com/jorgetroya80/donations-frontend/pull/197) · branch `chore/oxc-tooling`

## Context

Swap Biome for the Oxc toolchain: `oxlint` for linting, `oxfmt` for formatting and import
sorting. The formatting style and the lint rule set stay identical to the old `biome.json`.
Every entry point keeps working: the `pnpm` scripts, the `lint-staged` pre-commit hook, the
Claude `format-file.sh` hook, and CI.

**Requirement (Jorge, 2026-10-15):** keep the same formatting rules. For lint, use the native
oxlint rules that match the Biome configuration.

Before planning, a scratchpad check with oxlint 1.88.0 and oxfmt 0.73.0 found:

- Every Biome rule active for `*.ts`/`*.tsx` has a native oxlint equivalent.
- `oxfmt --migrate=biome` produces a matching formatter config, apart from `overrides`, which
  it cannot migrate. In Biome those only held lint rules and globals.

## Decisions

- **Exact rule parity, not oxlint defaults.** `.oxlintrc.json` turns every category off and
  lists the rules one by one. oxlint's default `correctness` category turns on rules Biome
  never ran, and a tool swap should not change behavior.
- **53 oxlint rules for Biome's 54.** `noUnusedImports` and `noUnusedVariables` both map to
  `no-unused-vars`. Mappings whose names differ:
  `noSwitchDeclarations`→`no-case-declarations`, `noPrecisionLoss`→`no-loss-of-precision`,
  `noCatchAssign`→`no-ex-assign`, `noArguments`→`prefer-rest-params`,
  `useArrayLiterals`→`no-array-constructor`, `noCommonJs`→`import/no-commonjs`,
  `noMisleadingInstantiator`→`typescript/no-misused-new`,
  `noUselessTypeConstraint`→`typescript/no-unnecessary-type-constraint`,
  `useHookAtTopLevel`→`react/rules-of-hooks`,
  `useExhaustiveDependencies`→`react/exhaustive-deps` (warn).
- **Formatter config from `oxfmt --migrate=biome`**, with these additions:
  - an `overrides` entry for `*.css` with `singleQuote: false`, because Biome kept double quotes
    in CSS;
  - `endOfLine: "lf"`, matching Biome's `lineEnding`;
  - `sortImports: true`, replacing Biome's `assist.organizeImports`;
  - `sortPackageJson: false`, because oxfmt sorts `package.json` keys by default and Biome did
    not.
- **Versions pinned by `minimumReleaseAge`.** pnpm rejects releases only a few days old, so the
  newest mature versions are oxlint `1.87.0` and oxfmt `0.71.0`, not the ones used in the
  scratchpad. No `minimumReleaseAgeExclude` entry was added.
- **No `--deny-warnings` in CI.** `exhaustive-deps` stays a warning, just as Biome warnings
  never failed CI.
- **Scope unchanged:** `src/` for the scripts and CI, and the same globs in `lint-staged`.
  `lint-staged` now also formats and sorts imports in `ts`/`tsx` files, which Biome did not do.
- Historical docs (`docs/plans/*`, `docs/PRD-*`, `CHANGELOG.md`) are not edited.

## Dependency graph

```
Task 1 oxfmt config ── Task 2 oxfmt wiring ──┐
                                             ├── Task 4 oxlint wiring ── Task 5 CI ── Task 6 remove Biome
Task 3 oxlint config ────────────────────────┘
```

Each task is one commit on the branch.

## Phase 1: Formatter

### Task 1: oxfmt formats `src/` with Biome's style — `f151a95`

Added `oxfmt` and `.oxfmtrc.json`, and reformatted `src/`.

- [x] `oxfmt --check src/` exits 0
- [x] The diff was reviewed: 124 files, almost all of it a blank line between import groups,
  plus 2 `it.each` tests whose lines break differently (Prettier style, not configurable)
- [x] `src/index.css` keeps double quotes
- [x] `typecheck` and `test` pass

### Task 2: oxfmt in scripts, pre-commit and the agent hook — `9e33403`

Added the `format` / `format:check` scripts. `check`, `lint-staged` and `format-file.sh` run
oxfmt, while Biome only lints until Task 4.

- [x] `lint-staged` formats and sorts the imports of a staged, badly formatted file
- [x] The agent hook formats a `src/*.tsx` file
- [x] `check:ci` exits 0

Found during this task: when Task 1 was committed, `lint-staged`'s `biome lint --write` put
Biome's formatting back on the 2 `it.each` tests. They were reformatted again in this commit,
and oxfmt now runs after the linter in `lint-staged`.

### Checkpoint: Formatter

- [x] `oxfmt --check src/` clean
- [x] `typecheck` and `test` (434/434) pass

## Phase 2: Linter

### Task 3: oxlint enforces Biome's rules on `src/` — `d81742d`

Added `oxlint` and `.oxlintrc.json`: every category off, the `typescript`, `react` and `import`
plugins, and 53 explicit rules.

- [x] `oxlint src/` exits 0 with no fixes needed
- [x] Parity proof: on a scratch file with one violation per rule, Biome reports 53 distinct
  rules and oxlint reports the same ones. The exception is `no-nonoctal-decimal-escape`:
  `'\8'` is already a parse error in TS modules
- [x] `oxlint --print-config` shows exactly 53 enabled rules

### Task 4: oxlint in scripts, pre-commit and the agent hook — `e91d42d`

`lint` = `oxlint --fix src/`, `check` = `oxlint --fix src/ && oxfmt src/`, and
`check:ci` = `oxlint src/ && oxfmt --check src/`. `lint-staged` and `format-file.sh` run
`oxlint --fix` and then `oxfmt`.

- [x] `check` and `check:ci` exit 0
- [x] `lint-staged` blocks an unused variable, and auto-fixes `let` → `const` plus formatting
- [x] The agent hook makes the same fix

### Checkpoint: Linter

- [x] `check:ci` clean
- [x] Parity proof recorded in the PR

## Phase 3: CI and cleanup

### Task 5: CI runs oxlint + oxfmt — `5329f4f`

The `Lint & Type Check` job drops `biomejs/setup-biome` and `biome ci`. After `pnpm install`
it runs `oxlint --format github src/` and `oxfmt --check src/`.

- [x] Both steps pass locally
- [x] `--format github` prints `::error file=…` annotations
- [x] The job passes on the PR

### Task 6: Remove Biome and update docs — `cd2004e`

Deleted `biome.json` and `@biomejs/biome`, and updated `CLAUDE.md`, `README.md` and
`docs/ARCHITECTURE.md`. `.claude/settings.local.json` is untracked, so dropping
`Bash(npx biome *)` from it stays local.

- [x] `grep -ri biome` only finds historical docs
- [x] `pnpm install --frozen-lockfile`, `check:ci`, `typecheck`, `test` and `build` pass

### Checkpoint: Complete

- [x] CI green on #197 (lint, test, build, PR title)
- [ ] Approved and merged

## Risks

| Risk | Impact | Mitigation |
| ---- | ------ | ---------- |
| `sortImports` orders imports differently from Biome, causing a large diff | Resolved | 124 files, almost all blank lines between groups. Accepted (Jorge, 2026-10-15) |
| A mapped rule behaves differently | Resolved | Parity file in Task 3 |
| oxfmt is pre-1.0, so its output can change between versions | Low | Exact versions pinned. Review the reformat diff on each bump |
| The formatter reverts a file on commit | Resolved | `lint-staged` runs oxfmt last (Task 2) |

## Resolved questions (Jorge, 2026-10-15)

1. **Import order:** accept oxfmt's order, as a single reformat commit.
2. **oxlint's extra `correctness` rules:** out of scope here, they go in a separate PR.
