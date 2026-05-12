# Plan: Migrate npm → pnpm

> Source PRD: [PRD-pnpm-migration.md](../PRD-pnpm-migration.md) · [Issue #95](https://github.com/jorgetroya80/donations-frontend/issues/95)

## Architectural decisions

- **Package manager**: pnpm 11.1.1 (exact), enforced via `"packageManager"` field + corepack
- **Dependency pinning**: exact versions sourced from `package-lock.json` resolved values before deletion; `.npmrc` `save-exact=true` enforces pinning going forward
- **Lockfile**: `pnpm-lock.yaml` replaces `package-lock.json`; latter added to `.gitignore`
- **Docker strategy**: `pnpm fetch` (lockfile-only network layer) + `pnpm install --frozen-lockfile --offline` (no-network install layer)
- **CI install command**: `pnpm install --frozen-lockfile` in all jobs

---

## Phase 1: Core manifest + lockfile

**User stories**: 1, 2, 3, 4, 5, 6, 7

### What to build

Replace npm as the active package manager locally. Add `"packageManager": "pnpm@11.1.1"` to `package.json`. Pin all 46 direct dependencies to exact resolved versions taken from the current `package-lock.json`. Create `.npmrc` with `save-exact=true`. Add `package-lock.json` to `.gitignore`. Delete `package-lock.json` and run `pnpm install` to generate `pnpm-lock.yaml`. All local scripts (`install`, `build`, `test`, `check`) must work via pnpm.

### Acceptance criteria

- [ ] `package.json` has `"packageManager": "pnpm@11.1.1"`
- [ ] All `dependencies` and `devDependencies` use exact version strings (no `^` or `~`)
- [ ] `.npmrc` exists with `save-exact=true`
- [ ] `package-lock.json` is absent and listed in `.gitignore`
- [ ] `pnpm-lock.yaml` is present and committed
- [ ] `pnpm install --frozen-lockfile` exits 0
- [ ] `pnpm run test` exits 0
- [ ] `pnpm run build` exits 0 and produces `dist/`
- [ ] `pnpm run check` exits 0

---

## Phase 2: Docker

**User stories**: 11, 12, 13

### What to build

Update the Dockerfile build stage to use pnpm. Enable corepack and activate pnpm 11.1.1. Use `pnpm fetch` with a mounted pnpm store cache to download dependencies using the lockfile alone, before source files are copied. Then copy `package.json` and run `pnpm install --frozen-lockfile --offline`. The nginx production stage is unchanged.

### Acceptance criteria

- [ ] `docker build` succeeds
- [ ] Changing only source files (not `pnpm-lock.yaml`) reuses the cached dependency layer
- [ ] Built image serves the app correctly via nginx
- [ ] No `npm` references remain in the Dockerfile

---

## Phase 3: CI

**User stories**: 8, 9, 10

### What to build

Update `.github/workflows/ci.yml` for all three jobs (`lint`, `test`, `build`). Add `pnpm/action-setup@v4` with version `11.1.1` before `actions/setup-node`. Change `cache: npm` to `cache: pnpm` in setup-node. Replace `npm ci` with `pnpm install --frozen-lockfile`. Replace all `npm run X` invocations with `pnpm run X`.

### Acceptance criteria

- [ ] All three CI jobs pass on a PR
- [ ] No `npm` references remain in `ci.yml`
- [ ] pnpm store is cached between runs (setup-node cache: pnpm)
- [ ] `pnpm install --frozen-lockfile` used in every job

---

## Phase 4: Documentation

**User stories**: 14, 15, 16

### What to build

Update `README.md`: remove `npm >= 11` from prerequisites, add `pnpm >= 11.1.1`, update installation command and scripts table. Update `CLAUDE.md` commands section: replace all `npm run X` with `pnpm run X`.

### Acceptance criteria

- [ ] README prerequisites list pnpm ≥ 11.1.1, not npm
- [ ] README installation and script examples use `pnpm`
- [ ] CLAUDE.md commands section uses `pnpm run X` throughout
- [ ] No `npm` references remain in either doc (except historical/explanatory context)
