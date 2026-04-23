# PRD: CI/CD Pipeline with GitHub Actions, Release-Please, and Docker

## Problem Statement

The project has no CI/CD pipeline. Code quality checks (linting, formatting, type checking, tests) are only enforced locally via lint-staged pre-commit hooks. There is no automated gate on pull requests, no build verification, and no containerization strategy for running the application. A developer can bypass local hooks and merge broken or poorly formatted code into `main`.

## Solution

Set up three GitHub Actions workflows and a Dockerfile:

1. **PR CI workflow** — runs on every pull request targeting `main`, validating PR title format (conventional commits) and executing all quality checks and build verification
2. **Release-please workflow** — runs on push to `main`, automatically creates/updates a Release PR with version bump, CHANGELOG, and `package.json` version sync
3. **Docker publish workflow** — triggers on GitHub Release published (by release-please), builds a multi-stage Docker image and pushes to Docker Hub
4. **Dockerfile** — multi-stage build (Node 24 build stage, Nginx serve stage) producing a minimal production image

## User Stories

1. As a developer, I want automated Biome checks on my PR, so that formatting and lint issues are caught before review
2. As a developer, I want automated ESLint checks on my PR, so that React-specific rules (hooks, refresh) are enforced
3. As a developer, I want TypeScript type checking on my PR, so that type errors are caught before merge
4. As a developer, I want unit tests to run on my PR, so that regressions are caught automatically
5. As a developer, I want test coverage reports on my PR, so that I can track coverage trends
6. As a developer, I want build verification on my PR, so that I know the app compiles successfully
7. As a developer, I want CI results visible in the GitHub PR UI, so that I can see pass/fail without leaving the review
8. As a developer, I want my PR title validated against conventional commit format, so that release-please can correctly determine version bumps
9. As a developer, I want PRs that don't follow conventional commit format to fail CI, so that they cannot be merged
10. As a developer, I want release-please to automatically create a Release PR when conventional commits land on `main`, so that I don't have to manually track versions
11. As a developer, I want the Release PR to include a generated CHANGELOG, so that release notes are automatic
12. As a developer, I want `package.json` version bumped automatically in the Release PR, so that it stays in sync with releases
13. As a developer, I want to control release timing by choosing when to merge the Release PR, so that releases are intentional
14. As a release manager, I want Docker images built automatically when a GitHub Release is published, so that no manual Docker build is needed
15. As a release manager, I want Docker images tagged with the semver version, so that I can pin deployments to specific versions
16. As a release manager, I want a `latest` tag updated on each release, so that there is a convenience tag for non-pinned environments
17. As an ops engineer, I want a minimal Docker image using Nginx alpine, so that the production container has a small attack surface
18. As an ops engineer, I want the Docker image to only contain built static files, so that source code and devDependencies are not shipped
19. As a developer, I want CI to use Node 24, so that it matches the modern toolchain (TypeScript 6, Vite 8, React 19)
20. As a developer, I want CI to use `npm ci` for installs, so that builds are reproducible from the lockfile

## Implementation Decisions

### Workflows

- **CI platform**: GitHub Actions
- **Actions versions**: `actions/checkout@v6` (required for Node 24 compatibility)
- **Node version**: 24 (CI and Docker build stage)

### PR CI Workflow (`ci.yml`)

- **Trigger**: Pull requests targeting `main` only
- **Caching**: `actions/setup-node` with `cache: 'npm'` to cache npm dependencies across jobs
- **Parallel jobs**:
  - **validate-title**: Check PR title matches conventional commit pattern (`feat:`, `fix:`, `chore:`, `docs:`, `style:`, `refactor:`, `perf:`, `test:`, `build:`, `ci:`, `revert:`) — if invalid, workflow fails and PR cannot merge
  - **lint**: `npm ci` → `npm run lint` (Biome) + `tsc --noEmit` (TypeScript type check)
  - **test**: `npm ci` → `npm run test` (Vitest) + `npm run test:coverage` (Vitest + coverage)
  - **build**: `npm ci` → `vite build` (build verification)
- All four jobs run in parallel. PR cannot merge unless all pass

### Release-Please Workflow (`release-please.yml`)

- **Trigger**: Push to `main`
- **Tool**: `googleapis/release-please-action`
- **Package type**: `node`
- **Starting version**: `0.1.0`
- **Behavior**: Creates/updates a Release PR with version bump in `package.json`, generated CHANGELOG.md, and release notes. Merging the Release PR creates a GitHub Release + git tag automatically

### Docker Publish Workflow (`docker-publish.yml`)

- **Trigger**: GitHub Release published event (created by release-please)
- **Registry**: Docker Hub (`docker.io/[username]/donations-frontend`)
- **Image tags**: `<version>` (stripped `v` prefix) + `latest`
- **Secrets required**: `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` (already configured as repo secrets)
- **Build**: Uses the multi-stage Dockerfile in repo root

### Dockerfile

- **Stage 1 (build)**: `node:24-alpine` — copies source, runs `npm ci`, runs `vite build`, produces `dist/` folder
- **Stage 2 (serve)**: `nginx:alpine` — copies `dist/` from build stage to Nginx html root, includes custom nginx config for SPA routing
- **Nginx config**: `try_files $uri $uri/ /index.html` for client-side routing fallback
- **Exposed port**: 80

### Package.json Changes

- Add `"build": "vite build"` script (does not exist yet, needed for CI and Dockerfile)

### Branching Strategy

- Trunk-based development: all PRs merge to `main`
- Conventional commit format enforced via PR title validation in CI
- Squash merge recommended so PR title becomes the commit message on `main`

### Semantic Versioning

- Managed entirely by release-please based on conventional commits
- `feat:` → minor bump, `fix:` → patch bump, `BREAKING CHANGE` → major bump
- Starting at `0.1.0`

## Testing Decisions

- CI pipeline itself is tested by opening a PR and verifying all checks pass
- No unit tests for CI config files (YAML workflows, Dockerfile, nginx.conf)
- Docker image should be verified locally with `docker build -t test . && docker run -p 8080:80 test` before merging
- Existing unit tests (`npm run test`) are the gate — CI runs them automatically
- PR title validation can be tested by creating a PR with an invalid title and confirming CI fails

## Out of Scope

- Deployment to any external hosting provider (Vercel, Netlify, AWS, etc.)
- Docker build on PRs (only on release)
- Push-to-main CI trigger (only PRs)
- E2E tests in CI
- Docker layer caching (can be added later)
- Branch protection rules (separate GitHub repo settings)
- Commit message linting on individual commits (only PR title is validated)
- Monorepo support
- Multiple environment builds (staging, production)
- Container orchestration (Kubernetes, Docker Compose for production)

## Further Notes

- A `build` script must be added to `package.json` as it does not currently exist
- Nginx config must handle SPA client-side routing with `try_files $uri $uri/ /index.html`
- The `v` prefix is stripped from GitHub Release tags for Docker image tagging (e.g., release `v0.1.0` → image tag `0.1.0`)
- Squash merge should be configured as the default (or only) merge strategy in GitHub repo settings to ensure PR titles become commit messages — this is critical for release-please to work correctly
- Docker Hub secrets (`DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`) are already configured in the repository
