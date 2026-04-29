# Plan: Docker Improvements

> Source PRD: [docs/PRD-docker.md](../PRD-docker.md) · [GitHub Issue #53](https://github.com/jorgetroya80/donations-frontend/issues/53)

## Architectural decisions

- **Serving**: nginx:1.27-alpine serves static Vite build; no Node runtime in production image
- **API routing**: nginx proxies `/api/` → `http://api:8080/` (trailing slash strips prefix); frontend uses relative paths, no CORS needed
- **Environment config**: VITE_ vars baked at build time via Docker `ARG`; no runtime injection
- **Local orchestration**: docker-compose only (no Swarm/Kubernetes)
- **Platform**: linux/amd64 only
- **CI trigger**: GitHub release published → docker-publish.yml fires → Docker Hub push

---

## Phase 1: Dockerfile hardening

**User stories**: 3, 4, 5, 6, 16

### What to build

Improve the existing multi-stage Dockerfile so that:
- The nginx base image is pinned to a specific version (not floating `nginx:alpine`)
- npm dependency install uses a BuildKit cache mount so repeat builds skip re-downloading packages
- A `VITE_API_URL` build arg is declared before the Vite build step so it can be injected at image build time
- A `HEALTHCHECK` runs against the nginx root so orchestrators can detect readiness
- OCI standard labels are applied for traceability

No changes to nginx config, compose, or CI in this phase.

### Acceptance criteria

- [ ] `docker build .` succeeds with no errors
- [ ] `docker build . && docker build .` — second build uses cached npm layer (no re-download output)
- [ ] `docker build --build-arg VITE_API_URL=http://example.com .` succeeds without error
- [ ] `docker inspect <image>` shows `Healthcheck` configured
- [ ] `docker inspect <image>` shows OCI labels `org.opencontainers.image.title` and `org.opencontainers.image.source`
- [ ] Image base is `nginx:1.27-alpine`, not `nginx:alpine`

---

## Phase 2: Local full-stack dev (docker-compose + nginx)

**User stories**: 1, 2, 10, 11, 12, 13, 14, 15

### What to build

Add `docker-compose.yml` so developers can start the full stack (frontend + API) with one command. The frontend service builds from the local Dockerfile; the API service pulls `jorgetroya/donations-api:latest`. Both share a named bridge network.

Update `nginx.conf` to:
- Proxy `/api/` requests to the API container with HTTP/1.1 keep-alive (avoids a new TCP connection per proxied request)
- Enable gzip compression for JS/CSS/JSON/SVG responses
- Add security headers: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`

### Acceptance criteria

- [ ] `docker compose up --build` starts both services with no errors
- [ ] `curl http://localhost/api/health` (or any `/api/` path) receives a response from the API container (not a 502)
- [ ] `curl -I http://localhost` response includes `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] `curl -I --compressed http://localhost/assets/<any>.js` response includes `Content-Encoding: gzip`
- [ ] API container is NOT accessible directly from host (no host port mapping on API service)
- [ ] Both services restart automatically if killed (`restart: unless-stopped`)
- [ ] `docker inspect <frontend-container>` shows health status `healthy` after start period

---

## Phase 3: CI publish hardening

**User stories**: 7, 8, 9

### What to build

Update `.github/workflows/docker-publish.yml` to add BuildKit support and GitHub Actions layer caching, making CI image builds significantly faster after the first run. Add explicit platform targeting and least-privilege workflow permissions.

No changes to application code or local dev setup in this phase.

### Acceptance criteria

- [ ] Workflow runs successfully on a published GitHub release
- [ ] Docker Hub shows new image tagged with release version and `latest`
- [ ] Second workflow run (same or new release) completes faster than first (GHA cache hit visible in build logs)
- [ ] Workflow YAML has `permissions: contents: read` at top level
- [ ] `platforms: linux/amd64` is explicitly set in the build step
- [ ] `docker/setup-buildx-action@v3` step present before login
