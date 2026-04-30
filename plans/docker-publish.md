# Plan: Fix Docker Publish Workflow

> Source PRD: [GitHub Issue #58](https://github.com/jorgetroya80/donations-frontend/issues/58) · [docs/plans/docker-publish.md](../docs/plans/docker-publish.md)

## Architectural decisions

- **Trigger**: `workflow_run` on "Release Please" completing — not `release: published`. GITHUB_TOKEN-created releases do not fire downstream `release` events.
- **Release detection**: `git tag --points-at <head_sha>` — single step handles both skip logic and version extraction.
- **Version source**: git tag derived from the triggering commit SHA, not `GITHUB_REF_NAME` (which resolves to `main` in `workflow_run` context).
- **Checkout target**: `ref: github.event.workflow_run.head_sha` with `fetch-depth: 0` to access all tags.

---

## Phase 1: Fix trigger, version extraction, and skip logic

**User stories**: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10

### What to build

Replace the broken `release: published` trigger with `workflow_run` on "Release Please". Add a single step that fetches tags and checks whether a release tag points at the triggering commit SHA — if none found, the workflow exits cleanly without pushing an image. If a tag is found, extract the semantic version and proceed to build and push the Docker image tagged with both the version and `latest`.

The end-to-end behavior:
- Release PR merged → release-please creates release → docker-publish triggers → image pushed with correct version tag + `latest`
- Regular commit merged → release-please updates release PR → docker-publish triggers → skip-check finds no tag → exits cleanly, nothing pushed
- Release-please fails → docker-publish job does not run (job-level guard)

### Acceptance criteria

- [ ] Merging a release PR causes docker-publish workflow to trigger automatically
- [ ] Docker image pushed to Docker Hub with correct semantic version tag (e.g. `1.2.3`)
- [ ] Docker image also pushed with `latest` tag on every release
- [ ] Pushing a regular commit to `main` triggers docker-publish but exits without pushing an image
- [ ] Workflow run history shows clean skip (no error) on non-release runs
- [ ] docker-publish job does not run when release-please workflow fails
- [ ] Image is built from the exact commit SHA that release-please tagged
