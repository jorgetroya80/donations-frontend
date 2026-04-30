# PRD: Automatic Releases on PR Merge

## Problem Statement

Every time a feature or fix is merged to main, the release process requires a second manual step: a "Release PR" is automatically opened by release-please (titled `chore(main): release donations-frontend <version>`), and a maintainer must separately review and merge it before the GitHub release, git tag, and Docker image are created. This two-step flow adds friction, delays delivery, and creates an orphaned PR that exists only as a release mechanism — not as a code review artifact.

## Solution

Configure release-please to skip creating the Release PR entirely. When a qualifying PR is merged to main, release-please immediately creates the GitHub release and git tag, commits the version bump and CHANGELOG update directly to main, and triggers the existing Docker publish pipeline. The release is fully automated from the moment code lands on main — no second merge required.

## User Stories

1. As a maintainer, I want a GitHub release created automatically when a `feat:` PR is merged to main, so that I don't have to merge a second release PR to ship the feature.
2. As a maintainer, I want a GitHub release created automatically when a `fix:` PR is merged to main, so that bug fixes reach users without manual intervention.
3. As a maintainer, I want a GitHub release created automatically when a `perf:` PR is merged to main, so that performance improvements are shipped immediately.
4. As a maintainer, I want `chore:`, `docs:`, `ci:`, `refactor:`, `test:`, `build:`, and `style:` PRs to NOT trigger a release, so that internal changes don't produce unnecessary Docker images or GitHub releases.
5. As a maintainer, I want breaking changes (commits with `!` or `BREAKING CHANGE` footer) to bump the major version automatically, so that semantic versioning is preserved without manual intervention.
6. As a maintainer, I want `feat:` commits to bump the minor version automatically, so that new features are versioned correctly.
7. As a maintainer, I want `fix:` and `perf:` commits to bump the patch version automatically, so that fixes and optimizations are versioned correctly.
8. As a maintainer, I want `CHANGELOG.md` updated automatically with each release, so that the release history remains accurate without manual editing.
9. As a maintainer, I want `package.json` version bumped automatically on each release, so that the version in the codebase always matches the latest git tag.
10. As a maintainer, I want the bot commit (version bump + CHANGELOG) to land on main without triggering a PR review cycle, so that the automated flow is not blocked by branch protection rules.
11. As a maintainer, I want the existing Docker publish pipeline to continue working unchanged, so that each GitHub release still produces a tagged Docker image on Docker Hub.
12. As a maintainer, I want the release-please configuration stored in versioned config files, so that release behavior is auditable and easy to adjust in the future.
13. As a maintainer, I want the release-please manifest seeded with the current version (`0.1.20`), so that the automated system picks up from the correct baseline and does not attempt to recalculate history.
14. As a maintainer, I want the `github-actions[bot]` added to the branch protection bypass list, so that the bot commit to main is not rejected by branch protection rules.

## Implementation Decisions

### Modules to create or modify

- **`.release-please-config.json`** — new file. Configures release-please: `release-type: node`, `skip-github-pull-request: true`, and defines which commit types trigger a release and which do not.
- **`.release-please-manifest.json`** — new file. Tracks the last released version per package. Seeded with `{ ".": "0.1.20" }` to match the current latest tag.
- **`.github/workflows/release-please.yml`** — modified. Points the action to the config and manifest files via `config-file` and `manifest-file` inputs.

### Architecture decisions

- `skip-github-pull-request: true` is set in the release-please config, not inline in the workflow YAML, to keep the workflow file minimal and centralize release configuration.
- Release type is `node`, which updates `package.json` version and generates a standard Node.js CHANGELOG.
- Commit types that trigger a release: `feat` (minor bump), `fix` and `perf` (patch bump), breaking changes (major bump).
- Commit types that do NOT trigger a release: `chore`, `docs`, `ci`, `refactor`, `test`, `build`, `style`, `revert`.
- The bot direct-commits the version bump and CHANGELOG to main. Branch protection bypass for `github-actions[bot]` is required and must be configured manually in GitHub repository settings (Settings → Branches → main → Edit → Bypass list).
- `docker-publish.yml` is unchanged — it triggers on `workflow_run` completion of the Release Please workflow and checks for a release tag on the commit. This behavior is compatible with the new direct-release flow.

### Manual setup required

- Add `github-actions[bot]` to the branch protection bypass list for main. This is a one-time action in GitHub repository settings and cannot be automated via workflow files.

## Testing Decisions

CI/CD configuration changes are not unit-testable. Validation is done via:

- Dry-run: merge a `fix:` PR and confirm release-please creates a GitHub release + tag directly without opening a Release PR.
- Verify bot commit lands on main with version bump in `package.json` and updated `CHANGELOG.md`.
- Verify Docker publish pipeline triggers and produces a correctly tagged image.
- Merge a `chore:` PR and confirm no release is created.

## Out of Scope

- Manual release triggers (workflow_dispatch for on-demand releases).
- Pre-release versions (alpha, beta, rc channels).
- Monorepo / multi-package release configuration.
- Changing the Docker publish pipeline or image tagging strategy.
- Modifying the existing CI workflow (PR title validation, lint, test, build).
- Automating the branch protection bypass configuration (GitHub API/Terraform for branch rules).

## Further Notes

- The `required_approving_review_count` on main is currently `0`, meaning PRs are required but no approvals are needed. The bot commit bypass is still necessary because `required_pull_request_reviews` blocks all direct pushes regardless of approval count.
- `enforce_admins` is `false`, so repository admins can push directly to main as a fallback if the bot commit ever fails.
- The transition from the current flow to the new flow should be seamless: existing open Release PRs (if any) can be closed manually before enabling the new config.
