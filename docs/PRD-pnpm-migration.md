# PRD: Migrate Package Manager from npm to pnpm

GitHub Issue: https://github.com/jorgetroya80/donations-frontend/issues/95

## Problem Statement

The project currently uses npm as its package manager. This creates several friction points for developers and CI/CD:

- npm's `^`/`~` version ranges in `package.json` allow dependency drift between installs on different machines or at different times, even with a lockfile.
- npm's Docker layer caching strategy (`npm ci`) re-downloads all dependencies whenever `package.json` changes, even if the actual resolved versions haven't changed.
- There is no enforced convention preventing contributors from accidentally running `npm install` and introducing floating version ranges for new dependencies.
- npm's content-addressable store is less efficient than pnpm's, leading to longer install times in CI.

## Solution

Migrate from npm to pnpm 11.1.1 as the sole package manager. Alongside the migration:

- Pin all 46 direct dependencies to exact resolved versions (sourced from the current `package-lock.json` before deletion).
- Add `.npmrc` with `save-exact=true` to enforce exact pinning for all future dependency additions.
- Add `"packageManager": "pnpm@11.1.1"` to `package.json` to enable corepack enforcement.
- Optimize the Dockerfile using `pnpm fetch` + offline install for better layer caching.
- Update CI workflows, README, and CLAUDE.md to reflect the new package manager.
- Delete `package-lock.json` and add it to `.gitignore` to prevent accidental regeneration.

## User Stories

1. As a developer, I want to install project dependencies with `pnpm install`, so that I use the project's officially supported package manager.
2. As a developer, I want all dependencies pinned to exact versions in `package.json`, so that I know exactly what I'm running without having to inspect the lockfile.
3. As a developer, I want `pnpm add <pkg>` to default to exact versions, so that I cannot accidentally introduce floating ranges.
4. As a developer, I want corepack to validate the pnpm version I'm using, so that version mismatches between contributors are caught immediately.
5. As a developer, I want `pnpm install --frozen-lockfile` to succeed without network access after a fetch, so that offline installs are possible.
6. As a developer, I want `pnpm run build`, `pnpm run test`, and `pnpm run check` to work identically to their npm equivalents, so that my local workflow is uninterrupted.
7. As a developer, I want `package-lock.json` ignored by git, so that an accidental `npm install` doesn't pollute my working tree with a tracked file.
8. As a CI engineer, I want the CI pipeline to cache the pnpm store across runs, so that subsequent installs are faster.
9. As a CI engineer, I want CI to use `pnpm install --frozen-lockfile`, so that no dependency drift can occur in automated builds.
10. As a CI engineer, I want the type check, test, and build jobs to use `pnpm run` commands, so that they match the local developer workflow.
11. As a Docker builder, I want the Dockerfile to use `pnpm fetch` with a mounted cache, so that dependency downloads are not repeated when only source files change.
12. As a Docker builder, I want the Dockerfile to run `pnpm install --frozen-lockfile --offline` after fetching, so that the install step never makes network calls.
13. As a Docker builder, I want the pnpm version pinned in the Dockerfile via corepack, so that Docker builds are reproducible independently of the host environment.
14. As a new contributor, I want the README to list pnpm as a prerequisite with the required version, so that I know what to install before cloning.
15. As a new contributor, I want the README installation instructions to use `pnpm install`, so that I don't accidentally bootstrap with the wrong package manager.
16. As a Claude Code user, I want CLAUDE.md to reference `pnpm run X` commands, so that AI-assisted workflows use the correct package manager.

## Implementation Decisions

### Package manager setup
- pnpm version: **11.1.1** (exact patch, via `"packageManager": "pnpm@11.1.1"` in `package.json`)
- corepack used to activate and validate pnpm version

### Dependency pinning strategy
- All 23 `dependencies` and 23 `devDependencies` pinned to exact resolved versions
- Resolved versions sourced from current `package-lock.json` (lockfileVersion 3) before it is deleted — this captures what is actually installed, not just the semver range floor
- `.npmrc` created with `save-exact=true` to enforce exact pinning for all future `pnpm add` calls

### Lockfile migration
- `package-lock.json` deleted and added to `.gitignore`
- `pnpm-lock.yaml` generated via `pnpm install` after package.json updates

### Docker strategy (pnpm-optimized)
- `corepack enable && corepack prepare pnpm@11.1.1 --activate` added to build stage
- `pnpm fetch` run against the lockfile only (before source is copied) with a mounted pnpm store cache — separates the network layer from source
- `pnpm install --frozen-lockfile --offline` installs from the virtual store without network
- nginx production stage unchanged

### CI changes (`.github/workflows/ci.yml`)
- `pnpm/action-setup@v4` added before `actions/setup-node@v6` in all three jobs (`lint`, `test`, `build`)
- `cache: npm` → `cache: pnpm` in setup-node
- `npm ci` → `pnpm install --frozen-lockfile`
- All `npm run X` → `pnpm run X`

### Documentation
- `README.md`: prerequisites updated (remove npm ≥ 11, add pnpm ≥ 11.1.1), install and script commands updated
- `CLAUDE.md`: all 8 command references updated from `npm run X` to `pnpm run X`

## Testing Decisions

A good test for this migration verifies observable behavior — that the project installs, builds, lints, and tests correctly — not the internal mechanics of pnpm.

**Verification checklist:**
- `pnpm install --frozen-lockfile` exits 0
- `pnpm run typecheck` exits 0
- `pnpm run test` exits 0
- `pnpm run build` exits 0 and produces `dist/`
- `pnpm run check` exits 0
- `docker build` succeeds and produces a runnable nginx image
- `package-lock.json` absent from working tree and confirmed in `.gitignore`
- `pnpm-lock.yaml` present and committed

No new unit tests are introduced — the migration is a tooling change, not a behavior change. Existing test suite serves as the regression baseline.

## Out of Scope

- Monorepo / pnpm workspace setup — this is a single-package repo
- Migrating to a different Node.js version
- Enabling pnpm's `shamefully-hoist` or custom `node-linker` settings
- Updating any dependency versions beyond what is already resolved in the current lockfile
- Adding pnpm-specific features (patches, catalogs, overrides)
- Changing any CI job logic beyond the package manager commands

## Further Notes

- pnpm 11.x requires Node.js ≥ 20. This repo already pins Node 24, so no Node version change is needed.
- The `pnpm fetch` optimization in Docker means that changing source files (but not the lockfile) will reuse the cached dependency layer, significantly reducing rebuild times in iterative development.
- Contributors who accidentally run `npm install` will regenerate `package-lock.json`, but since that file is now gitignored it won't appear as a tracked change — the accidental lockfile will simply be ignored.
