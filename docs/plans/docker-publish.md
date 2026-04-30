# Docker Publish Workflow Fix

> GitHub Issue: https://github.com/jorgetroya80/donations-frontend/issues/58

## Problem Statement

As a developer, when release-please merges a release PR and creates a GitHub Release, the Docker publish workflow never triggers. Docker images are never automatically published to Docker Hub, requiring manual intervention to build and push images after each release.

## Solution

Change the `docker-publish` workflow trigger from `release: published` to `workflow_run` on the "Release Please" workflow completing successfully. Add logic to detect whether a release tag was actually created on the triggering commit — skipping silently when release-please ran but only updated the release PR (no release created). Extract the semantic version from the git tag rather than `GITHUB_REF_NAME`, which resolves to `main` in `workflow_run` context.

## User Stories

1. As a developer, I want Docker images published automatically whenever release-please creates a new release, so that I don't have to manually trigger or monitor the publish workflow.
2. As a developer, I want the docker-publish workflow to trigger reliably after every release-please release, so that every versioned release has a corresponding Docker image on Docker Hub.
3. As a developer, I want the docker-publish workflow to skip silently when release-please runs but only updates the release PR (no release created), so that the workflow run history stays clean and unambiguous.
4. As a developer, I want Docker images tagged with the correct semantic version (e.g. `1.2.3`) derived from the release git tag, so that image versions match release versions exactly.
5. As a developer, I want Docker images also tagged as `latest` on every release, so that consumers pulling `latest` always get the most recent release.
6. As a developer, I want the workflow to build from the exact commit SHA that release-please tagged, so that the image content matches what was released.
7. As a CI/CD maintainer, I want the docker-publish workflow to only run when release-please succeeds (not on failure), so that broken CI does not produce stale images.
8. As a CI/CD maintainer, I want the version detection and skip logic in a single step, so that the workflow is easy to understand and maintain.
9. As a developer, I want Docker Hub credentials kept in repository secrets and never hardcoded, so that credentials are not exposed in workflow logs or source code.
10. As a developer, I want the workflow to use GitHub Actions cache for Docker layer caching, so that repeat builds are fast.

## Implementation Decisions

- **Trigger change**: Replace `on: release: types: [published]` with `on: workflow_run: workflows: ["Release Please"] types: [completed]`. This bypasses the GitHub security restriction that blocks `GITHUB_TOKEN`-created releases from triggering downstream workflows.
- **Job-level guard**: Add `if: github.event.workflow_run.conclusion == 'success'` on the docker job so it only runs when release-please itself succeeded.
- **Checkout**: Use `ref: github.event.workflow_run.head_sha` to ensure the build targets the exact commit release-please tagged. Add `fetch-depth: 0` so all tags are available.
- **Skip-and-version step**: Run `git fetch --tags` then `git tag --points-at <head_sha>`. If no tag found, write `skip=true` to step output and exit early. If tag found, write `skip=false` and `version=<tag without v prefix>` to step output.
- **Conditional docker steps**: All docker steps (buildx setup, login, build-push) run only when `skip == 'false'`.
- **Version source**: Use the git tag extracted in the skip-check step, not `GITHUB_REF_NAME`.

## Testing Decisions

- Good tests verify external behavior, not internal YAML structure.
- The workflow cannot be unit tested; validation is done by observing GitHub Actions run history.
- **Scenario 1 — release created**: Merge a release PR; confirm docker-publish workflow triggers and a new image appears on Docker Hub with correct version tag and `latest`.
- **Scenario 2 — no release created**: Push a non-release commit to `main` (e.g. a regular feature merge); confirm docker-publish workflow triggers, runs the skip-check step, logs "no release tag", and exits cleanly without pushing an image.
- **Scenario 3 — release-please fails**: Simulate a release-please failure; confirm docker-publish job does not run at all (job-level `if` blocks it).

## Out of Scope

- Multi-platform Docker builds (linux/arm64).
- Modifying the release-please workflow configuration.
- Using a Personal Access Token (PAT) instead of GITHUB_TOKEN in release-please.
- Changes to `ci.yml`.
- Docker image signing or attestation.
- Changing Docker Hub repository structure or naming conventions.

## Further Notes

Root cause: GitHub Actions intentionally blocks `release: published` events when the release is created by a workflow using `GITHUB_TOKEN`, to prevent infinite loops. The `workflow_run` trigger is the idiomatic workaround and does not require new secrets.
