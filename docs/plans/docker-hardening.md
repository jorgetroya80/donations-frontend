# Plan: Docker Config Hardening + Precise Publish Trigger

> Source: docker-expert review + docker-publish trigger improvement

## Architectural decisions

- **Trigger**: Replace `workflow_run` + tag-check skip logic with `workflow_dispatch` dispatched from `release-please.yml` only when `releases_created == 'true'` — eliminates wasted job runs on non-release pushes to main
- **Version source**: `release-please-action` step output `tag_name` (e.g. `v0.2.2`) → strip `v` prefix for Docker tag
- **SHA source**: `context.sha` from release-please workflow run (the merge commit that release-please tags)
- **Serving**: nginx:1.27-alpine unchanged — master runs as root (port 80), workers drop to nginx user; accepted per existing PRD decision
- **Environment config**: VITE_ vars baked at build time via Docker ARG; docker-compose passes via `args`

---

## Phase 1: Precise publish trigger via workflow_dispatch

**Goal**: docker-publish only fires when release-please actually creates a release — no skip logic, no wasted runs.

### What to build

**`release-please.yml`** gains:
- `actions: write` permission (needed to dispatch workflows)
- An `id: release` on the `googleapis/release-please-action@v5` step to capture outputs
- A conditional dispatch step: `if: steps.release.outputs.releases_created == 'true'` — calls `workflow_dispatch` on `docker-publish.yml` with `version` (tag without `v`) and `sha` (context.sha) inputs

**`docker-publish.yml`** becomes:
- Trigger: `workflow_dispatch` with inputs `version` (string, required) and `sha` (string, required)
- Checkout uses `ref: ${{ inputs.sha }}`
- Tags use `inputs.version`
- Remove all `workflow_run` trigger, job-level `if`, skip-check step, and `skip` guards
- Keep: buildx setup, login, build-push with GHA cache, `platforms: linux/amd64`

### Acceptance criteria

- [ ] Push a non-release commit to main (`chore:`) — `docker-publish` workflow does **not** appear in Actions run list
- [ ] Merge a release PR (`feat:` or `fix:`) — release-please workflow creates a GitHub release, then immediately dispatches `docker-publish`; Docker Hub shows new image tagged with correct version and `latest`
- [ ] `docker-publish.yml` contains no `workflow_run` trigger, no `skip` output checks, no `git fetch --tags`
- [ ] `release-please.yml` has `actions: write` permission and a conditional dispatch step

---

## Phase 2: Docker config hardening

**Goal**: Close gaps found in docker-expert review — compose health checks, .dockerignore coverage, nginx security headers.

### What to build

**`.dockerignore`** — add missing entries:
```
coverage/
plans/
.claude/
*.log
```

**`docker-compose.yml`** — three additions:
1. `build.args: VITE_API_URL: ${VITE_API_URL:-}` on `frontend` service (build arg currently never passed)
2. `healthcheck` on `frontend` service (wires Dockerfile HEALTHCHECK into Compose wait condition)
3. `healthcheck` on `api` service + tighten `depends_on` to `condition: service_healthy`

```yaml
frontend:
  build:
    context: .
    args:
      VITE_API_URL: ${VITE_API_URL:-}
  healthcheck:
    test: ["CMD", "wget", "-qO-", "http://localhost/"]
    interval: 30s
    timeout: 3s
    start_period: 5s
    retries: 3

api:
  healthcheck:
    test: ["CMD", "wget", "-qO-", "http://localhost:8080/health"]
    interval: 10s
    timeout: 5s
    start_period: 10s
    retries: 3
```

> Adjust api health endpoint if `/health` is not the correct path for `jorgetroya/donations-api`.

**`nginx.conf`** — three additions:
- `gzip_vary on;` after `gzip_min_length` line (fixes CDN/proxy cache for compressed responses)
- `add_header X-XSS-Protection "1; mode=block" always;`
- `add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'" always;`

### Acceptance criteria

- [ ] `docker compose up --build` with `VITE_API_URL=http://api:8080` — build arg flows through to Vite build (visible in compiled JS or `docker inspect` build history)
- [ ] `docker compose ps` shows both services as `healthy` after start period
- [ ] `depends_on: api: condition: service_healthy` means frontend container waits for api health before starting
- [ ] `curl -I http://localhost` response includes `X-XSS-Protection` and `Content-Security-Policy` headers
- [ ] `curl -I --compressed http://localhost/assets/<any>.js` response includes `Vary: Accept-Encoding` header
- [ ] `docker build .` excludes `coverage/`, `plans/`, `.claude/` from build context (verify with `docker build --no-cache --progress=plain . 2>&1 | grep -E "coverage|plans|\.claude"` returns nothing)
