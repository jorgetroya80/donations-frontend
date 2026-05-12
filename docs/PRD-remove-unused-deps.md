## Problem Statement

Two packages are listed as direct dependencies in `package.json` but are never imported in source code or referenced in build configuration. These dead dependencies add noise to the dependency tree, increase install time, and create false audit surface for security scanning.

- `date-fns` (dependency) — installed alongside `react-day-picker` under the assumption that v9 required it as a peer dependency (v8 did). `react-day-picker` v9 dropped that requirement. All date formatting in the project uses `dayjs`.
- `@rolldown/plugin-babel` (devDependency) — installed experimentally to explore Rolldown build mode. Never wired into `vite.config.ts`. All Babel transforms are handled by `@vitejs/plugin-react`.

## Solution

Remove both unused packages from `package.json` and regenerate the lockfile. Verify that build, tests, and lint all pass after removal.

## User Stories

1. As a developer, I want the dependency list to only contain packages that are actually used, so that I can quickly understand what the project depends on.
2. As a developer, I want to reduce unnecessary packages, so that `pnpm install` is faster in CI and local environments.
3. As a developer, I want fewer packages in the dependency tree, so that security audits (`pnpm audit`) report on a smaller, more relevant surface.
4. As a developer, I want to remove `date-fns` from dependencies, so that there is no confusion about which date library the project uses (`dayjs`).
5. As a developer, I want to remove `@rolldown/plugin-babel` from devDependencies, so that the build config accurately reflects what Vite plugins are in use.
6. As a future contributor, I want a clean `package.json`, so that I don't accidentally import a package that appears available but serves no purpose.

## Implementation Decisions

- Remove `date-fns` from `dependencies` in `package.json` using `pnpm remove date-fns`.
- Remove `@rolldown/plugin-babel` from `devDependencies` in `package.json` using `pnpm remove -D @rolldown/plugin-babel`.
- `pnpm-lock.yaml` will be regenerated automatically.
- No source file changes required — neither package is imported anywhere.
- No config file changes required — `vite.config.ts` does not reference `@rolldown/plugin-babel`.
- Date formatting continues to use `dayjs` exclusively.
- Babel transforms continue to be handled by `@vitejs/plugin-react` with `babel-plugin-react-compiler`.

## Testing Decisions

- Good tests verify external behavior, not implementation details.
- No new tests needed — this change removes dead packages, not behavior.
- Verification: `pnpm run build` must pass (no missing module errors), `pnpm run test` must pass (no broken imports in test setup), `pnpm run check` must pass (Biome lint + format clean).

## Out of Scope

- Adding security scanning or `pnpm audit` to CI (separate initiative).
- Evaluating whether `dayjs` should be replaced by `date-fns` or vice versa.
- Removing `prettier` from dependencies (it is a devDependency-class tool but its placement is a separate discussion).
- Evaluating Rolldown build mode for the project.

## Further Notes

- `date-fns` was added in commit `2b7ebaa` (Apr 21 2026, "Phase 3 — dashboard home with balance cards and charts") but never imported in the source files introduced by that commit.
- `react-day-picker` v9's `peerDependencies` only lists `react` — confirmed `date-fns` is not required.
- `@rolldown/plugin-babel` is only relevant if explicitly opting into Rolldown build mode via `builder: 'rolldown'` in `vite.config.ts`, which this project does not do.
