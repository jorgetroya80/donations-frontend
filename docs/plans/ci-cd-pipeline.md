# Plan: CI/CD Pipeline with GitHub Actions, Release-Please, and Docker

> Source PRD: docs/PRD-2.md (GitHub issue #2)

## Architectural decisions

- **CI platform**: GitHub Actions
- **Actions versions**: `actions/checkout@v6`
- **Node version**: 24 (CI and Docker)
- **Branching**: Trunk-based, all PRs target `main`
- **Merge strategy**: Squash merge (PR title becomes commit message for release-please)
- **Versioning**: Semantic versioning via release-please, starting at `0.1.0`
- **Conventional commits**: Enforced via PR title validation in CI
- **Docker registry**: Docker Hub (`docker.io/jorgetroya80/donations-frontend`)
- **Docker strategy**: Multi-stage (Node 24 alpine build → Nginx alpine serve)
- **Secrets**: `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` (already configured)

---

## Phase 1: Foundation + PR CI Workflow

**User stories**: 1, 2, 3, 4, 5, 6, 7, 8, 9, 20

### What to build

Add missing `build` script to `package.json` and create the PR CI workflow with four parallel jobs. On every pull request targeting `main`, the workflow runs all checks concurrently using npm dependency caching (`actions/setup-node` with `cache: 'npm'`) to keep `npm ci` fast across jobs. A PR cannot merge unless all four jobs pass.

### Acceptance criteria

- [ ] `package.json` has `"build": "vite build"` script
- [ ] `.github/workflows/ci.yml` exists and triggers on PRs to `main`
- [ ] **validate-title job**: PR title validated against conventional commit pattern (`feat:`, `fix:`, `chore:`, `docs:`, `style:`, `refactor:`, `perf:`, `test:`, `build:`, `ci:`, `revert:`) — CI fails if invalid
- [ ] **lint job**: `npm ci` → `npm run lint` (Biome) + `tsc --noEmit` — fails CI on lint or type errors
- [ ] **test job**: `npm ci` → `npm run test` + `npm run test:coverage` — fails CI on test failures, reports coverage
- [ ] **build job**: `npm ci` → `vite build` — fails CI on build errors
- [ ] All four jobs run in parallel (no dependencies between them)
- [ ] npm cache shared across jobs via `actions/setup-node` with `cache: 'npm'`
- [ ] All check results visible as separate jobs in GitHub PR UI

---

## Phase 2: Release-Please Workflow

**User stories**: 10, 11, 12, 13

### What to build

Create a release-please workflow that runs on every push to `main`. It uses `googleapis/release-please-action` configured for a Node package starting at version `0.1.0`. When conventional commits land on `main`, release-please automatically creates or updates a Release PR containing a version bump in `package.json`, a generated `CHANGELOG.md`, and release notes. Merging the Release PR creates a GitHub Release with a git tag automatically.

### Acceptance criteria

- [ ] `.github/workflows/release-please.yml` exists and triggers on push to `main`
- [ ] release-please config specifies `node` package type and `0.1.0` starting version
- [ ] After merging a PR with `feat:` or `fix:` title, release-please creates/updates a Release PR
- [ ] Release PR contains updated `package.json` version
- [ ] Release PR contains generated CHANGELOG.md
- [ ] Merging the Release PR creates a GitHub Release with `v*` tag
- [ ] Version bumps follow semver: `fix:` → patch, `feat:` → minor

---

## Phase 3: Dockerfile + Docker Publish Workflow

**User stories**: 14, 15, 16, 17, 18, 19

### What to build

Create a multi-stage Dockerfile and a Docker publish workflow. The Dockerfile uses Node 24 alpine to install dependencies and build the app, then copies the built `dist/` into an Nginx alpine image with a custom config for SPA routing (`try_files` fallback to `index.html`). The publish workflow triggers on GitHub Release published events (created by release-please), builds the Docker image, tags it with the release version (stripped `v` prefix) and `latest`, and pushes to Docker Hub.

### Acceptance criteria

- [ ] `Dockerfile` exists at repo root with two stages (build + serve)
- [ ] Build stage uses `node:24-alpine`, runs `npm ci` and `vite build`
- [ ] Serve stage uses `nginx:alpine`, copies `dist/` to Nginx html root
- [ ] Custom Nginx config handles SPA routing with `try_files $uri $uri/ /index.html`
- [ ] `.dockerignore` exists to exclude `node_modules`, `.git`, etc.
- [ ] Docker image builds successfully locally (`docker build -t test .`)
- [ ] Container serves app correctly (`docker run -p 8080:80 test`)
- [ ] `.github/workflows/docker-publish.yml` triggers on GitHub Release published
- [ ] Image pushed to `docker.io/[username]/donations-frontend`
- [ ] Image tagged with version (e.g., `0.1.0`) and `latest`
- [ ] Workflow uses `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` secrets
