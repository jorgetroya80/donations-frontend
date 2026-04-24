# Plan: CI/CD Pipeline with GitHub Actions, Release-Please, and Docker

> Source PRD: docs/PRD-2.md (GitHub issue #2)

## Architectural decisions

- **CI platform**: GitHub Actions
- **Actions versions**: `actions/checkout@v6`
- **Node version**: 24 (CI and Docker)
- **Branching**: Trunk-based, all PRs target `main`
- **Merge strategy**: Squash merge (PR title = commit message for release-please)
- **Versioning**: Semver via release-please, starting `0.1.0`
- **Conventional commits**: Enforced via PR title validation in CI
- **Docker registry**: Docker Hub (`docker.io/jorgetroya80/donations-frontend`)
- **Docker strategy**: Multi-stage (Node 24 alpine build → Nginx alpine serve)
- **Secrets**: `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` (already configured)

---

## Phase 1: Foundation + PR CI Workflow

**User stories**: 1, 2, 3, 4, 5, 6, 7, 8, 9, 20

### What to build

PR CI workflow with four parallel jobs. On every PR targeting `main`, run all checks concurrently with npm dependency caching (`actions/setup-node` with `cache: 'npm'`) for fast `npm ci`. PR blocked unless all four jobs pass.

### Acceptance criteria

- [x] `package.json` has `"build": "vite build"` script
- [x] `.github/workflows/ci.yml` exists, triggers on PRs to `main`
- [x] **validate-title job**: PR title validated against conventional commit pattern (`feat:`, `fix:`, `chore:`, `docs:`, `style:`, `refactor:`, `perf:`, `test:`, `build:`, `ci:`, `revert:`) — CI fails if invalid
- [x] **lint job**: `npm ci` → `npm run check:ci` (Biome) + `npm run lint` (ESLint) + `tsc --noEmit` — fails on lint or type errors
- [x] **test job**: `npm ci` → `npm run test` + `npm run test:coverage` — fails on test failures, reports coverage
- [x] **build job**: `npm ci` → `vite build` — fails on build errors
- [x] All four jobs run parallel (no dependencies)
- [x] npm cache shared across jobs via `actions/setup-node` with `cache: 'npm'`
- [x] All check results visible as separate jobs in GitHub PR UI

---

## Phase 2: Release-Please Workflow

**User stories**: 10, 11, 12, 13

### What to build

Release-please workflow on every push to `main`. Uses `googleapis/release-please-action` configured for Node package starting at `0.1.0`. When conventional commits land on `main`, release-please auto-creates/updates Release PR with version bump in `package.json`, generated `CHANGELOG.md`, and release notes. Merging Release PR creates GitHub Release with git tag.

### Acceptance criteria

- [x] `.github/workflows/release-please.yml` exists, triggers on push to `main`
- [x] release-please config: `node` package type, `0.1.0` starting version
- [x] After merging PR with `feat:` or `fix:` title, release-please creates/updates Release PR
- [x] Release PR contains updated `package.json` version
- [x] Release PR contains generated CHANGELOG.md
- [x] Merging Release PR creates GitHub Release with `v*` tag
- [x] Semver bumps: `fix:` → patch, `feat:` → minor

---

## Phase 3: Dockerfile + Docker Publish Workflow

**User stories**: 14, 15, 16, 17, 18, 19

### What to build

Multi-stage Dockerfile + Docker publish workflow. Dockerfile uses Node 24 alpine for deps + build, copies `dist/` into Nginx alpine with custom SPA routing config (`try_files` fallback to `index.html`). Publish workflow triggers on GitHub Release published (from release-please), builds image, tags with release version (stripped `v` prefix) + `latest`, pushes to Docker Hub.

### Acceptance criteria

- [x] `Dockerfile` at repo root, two stages (build + serve)
- [x] Build stage: `node:24-alpine`, runs `npm ci` and `vite build`
- [x] Serve stage: `nginx:alpine`, copies `dist/` to Nginx html root
- [x] Custom Nginx config handles SPA routing with `try_files $uri $uri/ /index.html`
- [x] `.dockerignore` excludes `node_modules`, `.git`, etc.
- [x] Docker image builds locally (`docker build -t test .`)
- [x] Container serves app correctly (`docker run -p 8080:80 test`)
- [x] `.github/workflows/docker-publish.yml` triggers on GitHub Release published
- [x] Image pushed to `docker.io/[username]/donations-frontend`
- [x] Image tagged with version (e.g., `0.1.0`) and `latest`
- [x] Workflow uses `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` secrets
