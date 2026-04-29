# PRD: Docker Improvements

**GitHub Issue:** https://github.com/jorgetroya80/donations-frontend/issues/53

## Problem Statement

The donations-frontend Docker setup works but lacks production best practices. Developers have no single-command way to run the full stack (frontend + API) locally. The CI Docker publish workflow is slow due to missing BuildKit and layer caching. The nginx config is missing performance and security improvements.

## Solution

Improve the existing Dockerfile and nginx config, introduce a docker-compose.yml for local full-stack development, and harden the CI Docker publish workflow with BuildKit, GHA layer caching, and least-privilege permissions.

## User Stories

1. As a developer, I want to run `docker compose up --build` and have both the frontend and API running, so that I can test the full stack locally without manual setup.
2. As a developer, I want the frontend nginx to proxy `/api/` requests to the API container, so that I avoid CORS issues and don't need to configure separate origins.
3. As a developer, I want the Docker build to use npm cache mounts, so that repeated builds are faster and don't re-download packages unnecessarily.
4. As a developer, I want the nginx base image version pinned, so that builds are reproducible and don't silently pull a different nginx version.
5. As a developer, I want VITE_ build-time environment variables injected as Docker build args, so that I can build images for different environments without changing code.
6. As a developer, I want the frontend container to have a health check, so that orchestration tools and docker-compose know when the service is ready.
7. As a CI/CD maintainer, I want the Docker publish workflow to use BuildKit and GitHub Actions layer caching, so that image builds in CI are fast after the first run.
8. As a CI/CD maintainer, I want the Docker publish workflow to explicitly specify the target platform (linux/amd64), so that builds are deterministic and don't accidentally produce multi-arch images.
9. As a security-conscious developer, I want the CI workflow to use least-privilege permissions (`contents: read`), so that the workflow cannot make unintended changes to the repository.
10. As a developer, I want the nginx config to enable gzip compression, so that JS/CSS/JSON assets are served smaller and pages load faster.
11. As a security-conscious developer, I want nginx to send security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy), so that the app is protected against common browser-based attacks.
12. As a developer, I want nginx to use HTTP/1.1 with keep-alive when proxying to the API, so that proxy connections are reused and latency is reduced.
13. As a developer, I want the docker-compose API service to auto-restart on crash, so that I don't have to manually restart containers during development.
14. As a developer, I want the API container to use `expose` instead of `ports`, so that the API is only accessible via the nginx proxy and not directly from the host (keeps the local setup close to production).
15. As a developer, I want the docker-compose services to share a named bridge network, so that service discovery works reliably and the network topology is explicit.
16. As a maintainer, I want the Docker image to have OCI standard labels (title, source), so that image metadata is searchable and traceable to the source repository.

## Implementation Decisions

### Dockerfile
- Multi-stage build: Node 24 Alpine for build, nginx 1.27 Alpine for serving (pinned version, not floating `nginx:alpine`)
- `--mount=type=cache,target=/root/.npm` on `npm ci` for layer-level npm cache
- `ARG VITE_API_URL` + `ENV VITE_API_URL=$VITE_API_URL` declared before `npm run build` so Vite can inline the value
- `HEALTHCHECK` using `wget -qO-` (available in alpine) hitting `http://localhost/`
- OCI labels: `org.opencontainers.image.title` and `org.opencontainers.image.source`
- nginx master process runs as root to bind port 80; worker processes use the built-in `nginx` user (default nginx:alpine behavior — no additional hardening needed)

### nginx.conf
- New `location /api/` block: `proxy_pass http://api:8080/` — trailing slash strips the `/api/` prefix before forwarding to upstream
- `proxy_http_version 1.1` + `proxy_set_header Connection ""` — enables HTTP keep-alive to the API container (prevents a new TCP connection per request)
- `gzip on` for `text/plain text/css application/javascript application/json image/svg+xml` with `gzip_min_length 1024`
- Security headers added at server block level: `X-Frame-Options SAMEORIGIN`, `X-Content-Type-Options nosniff`, `Referrer-Policy strict-origin-when-cross-origin`
- Static asset caching (1y + immutable) retained from original

### docker-compose.yml (new file)
- `frontend` service: `build: .`, ports `80:80`, `restart: unless-stopped`, network `app`
- `api` service: `image: jorgetroya/donations-api:latest`, `expose: ["8080"]` (no host port mapping — accessible only via nginx proxy), `restart: unless-stopped`, network `app`
- `depends_on: api` on frontend (service_started condition — API image is external, no healthcheck available)
- Named network `app` with `driver: bridge`
- API port is 8080 inside container; update if the actual API image uses a different port

### docker-publish.yml
- Add `docker/setup-buildx-action@v3` before login (required for BuildKit features including cache mounts and GHA cache)
- Add `cache-from: type=gha` and `cache-to: type=gha,mode=max` to `build-push-action`
- Add `platforms: linux/amd64` (explicit; avoids accidental multi-arch if buildx defaults change)
- Add top-level `permissions: contents: read` (least-privilege — workflow only reads the repo to build)
- Trigger remains `release: types: [published]` (release-please creates the GitHub release, which fires this workflow)

## Testing Decisions

No automated tests for Docker/nginx config changes (infrastructure-level). Manual verification:

1. `docker compose up --build` → frontend at http://localhost, API reachable via nginx proxy
2. `curl http://localhost/api/health` → proxied to API container (verify 200 or expected API response)
3. `curl -I http://localhost` → verify security headers present in response
4. `curl -I --compressed http://localhost/assets/*.js` → verify `Content-Encoding: gzip`
5. `docker inspect <frontend-container> | grep -A5 Health` → verify `healthy` status
6. On release: check Docker Hub for new image tag matching release version

## Out of Scope

- Multi-architecture builds (arm64) — amd64 only for now
- Runtime environment variable injection (window.__ENV__ pattern) — VITE_ vars baked at build time
- Non-root nginx user for port 80 binding — requires port change or Linux capabilities
- Database containerization
- Kubernetes / ECS deployment config
- Staging or production docker-compose variants

## Further Notes

- The `api` service in docker-compose uses `expose` not `ports`. If direct host access to the API is needed during debugging, temporarily add `ports: - "8080:8080"` to the `api` service.
- The API port (8080) must match what `jorgetroya/donations-api:latest` actually listens on. Verify before running `docker compose up`.
- `VITE_API_URL` build arg is available but not strictly needed if the frontend always uses the nginx proxy path (`/api/`). It can be used for other environment-specific values.
- `docker/setup-buildx-action@v3` is required for the `--mount=type=cache` in the Dockerfile to work in CI. Without it, the cache mount is silently ignored.
