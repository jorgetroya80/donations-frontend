# Plan: Automatic Releases on PR Merge

> Source PRD: docs/PRD-auto-release.md

## Architectural decisions

- **Release tool**: release-please v5 with `skip-github-pull-request: true`
- **Release type**: `node` — updates `package.json` version, generates CHANGELOG
- **Version baseline**: `0.1.20` seeded in manifest
- **Trigger commits**: `feat` → minor, `fix`/`perf` → patch, breaking → major
- **No-release commits**: `chore`, `docs`, `ci`, `refactor`, `test`, `build`, `style`, `revert`
- **Bot commit bypass**: `github-actions[bot]` added to branch protection bypass list (manual, one-time)
- **Docker pipeline**: unchanged — `docker-publish.yml` already handles tag detection via `workflow_run`

---

## Phase 1: Manual prerequisite — branch protection bypass

**User stories**: 10, 14

### What to build

Before any config lands on main, add `github-actions[bot]` to the branch protection bypass list so the bot's version-bump commit is not rejected when it pushes directly to main.

This is a one-time manual action in GitHub repository settings — it cannot be automated via workflow files.

### Acceptance criteria

- [ ] Navigate to repo Settings → Branches → main → Edit
- [ ] Under "Bypass list", add `github-actions[bot]`
- [ ] Save. Confirm the actor appears in the bypass list.
- [ ] Direct push by `github-actions[bot]` to main is no longer blocked by branch protection.

---

## Phase 2: Config files and workflow update

**User stories**: 1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13

### What to build

Create two new root-level config files that centralize release-please behavior, and update the existing workflow to reference them. No inline config in the workflow YAML — all release logic lives in the config file.

**`.release-please-config.json`** defines:
- Release type: `node`
- `skip-github-pull-request: true`
- Which commit types bump which version component
- Which commit types produce no release

**`.release-please-manifest.json`** seeds the current version at `0.1.20` so release-please does not recalculate from scratch.

**`.github/workflows/release-please.yml`** gains two inputs pointing to the config and manifest files. Everything else in the workflow stays the same.

### Acceptance criteria

- [ ] `.release-please-config.json` exists at repo root with `release-type: node` and `skip-github-pull-request: true`
- [ ] `feat` is configured as a minor bump trigger
- [ ] `fix` and `perf` are configured as patch bump triggers
- [ ] `chore`, `docs`, `ci`, `refactor`, `test`, `build`, `style` produce no release
- [ ] `.release-please-manifest.json` exists at repo root with `{ ".": "0.1.20" }`
- [ ] `release-please.yml` references the config and manifest files via `config-file` and `manifest-file` inputs
- [ ] PR passes CI (lint, type check, tests, build)

---

## Phase 3: End-to-end verification

**User stories**: 1, 2, 3, 4, 8, 9, 11

### What to build

Validate the full release flow by merging two test PRs: one that should trigger a release and one that should not.

### Acceptance criteria

- [ ] Merge a `fix:` or `feat:` PR to main — release-please workflow runs and creates a GitHub release + git tag directly, with **no Release PR opened**
- [ ] Bot commit lands on main with bumped version in `package.json` and updated `CHANGELOG.md`
- [ ] `docker-publish` workflow triggers after release-please, detects the tag, and pushes a correctly versioned Docker image to Docker Hub
- [ ] Merge a `chore:` PR to main — release-please workflow runs but creates **no release, no tag, no bot commit**
- [ ] No orphaned Release PRs exist in the repository after either merge
