# PLAN: Deploy donations-frontend to Render

Spec: [docs/PRD-deploy-render.md](../PRD-deploy-render.md) · Issue [#146](https://github.com/jorgetroya80/donations-frontend/issues/146)

## Context

Deploy the SPA to Render as a Docker web service that proxies `/api/` same-origin to the API (preserves strict CSP, `SameSite=Lax` cookie, API CORS-disabled). Current `nginx.conf` hardcodes upstream `http://api:8081` and `listen 80`; the same image is reused by `docker-compose.yml` for local dev. Make config provider-agnostic via env vars + the nginx image's built-in template entrypoint, then add `render.yaml`. API deploys first (donations-api#42).

## Dependency graph

```
default.conf.template ──▶ Dockerfile (COPY template + ENV defaults)
                              │
                              ▼
                    docker-compose build ──▶ [CHECKPOINT: local verify]
                              │
                              ▼
                         render.yaml ──▶ [CHECKPOINT: Render verify]
```
- `render.yaml` is an independent file but only meaningful once the image behaves correctly → ordered after local verify.

## Tasks (vertical slices)

### Task 1 — Env-driven nginx proxy (complete local path)
Files: `nginx.conf` → `default.conf.template`, `Dockerfile`.
- Rename `nginx.conf` to `default.conf.template`; parameterize `listen ${PORT};`, `proxy_pass ${API_UPSTREAM};`, `proxy_set_header Host ${API_HOST};`; add `proxy_ssl_server_name on;`. Leave all other directives (CSP, headers, gzip, `try_files`, cache, runtime `$` vars) untouched.
- Dockerfile final stage: replace `COPY nginx.conf /etc/nginx/conf.d/default.conf` with `COPY default.conf.template /etc/nginx/templates/default.conf.template`; add `ENV PORT=80 API_UPSTREAM=http://api:8081 API_HOST=api`. No CMD/ENTRYPOINT/HEALTHCHECK change.

Acceptance:
- `docker compose up --build` boots; frontend healthy.
- SPA loads at `http://localhost:8080`; login works; `/api/v1/...` same-origin 200, session cookie set; no CSP/CORS errors; deep-link refresh ≠ 404.
- `docker compose exec frontend cat /etc/nginx/conf.d/default.conf` → `listen 80;`, `proxy_pass http://api:8081;`, `Host api`; runtime vars (`$remote_addr`, `$uri`, …) intact.

Verify: commands above.

### Task 2 — Render service declaration
File: `render.yaml` (new).
- type web / runtime docker / `dockerfilePath: ./Dockerfile` / plan free / `region: frankfurt` / `autoDeploy: true` / `healthCheckPath: /`.
- `envVars`: `API_UPSTREAM=https://<CONFIRM>.onrender.com`, `API_HOST=<CONFIRM>.onrender.com`. Do **not** set `PORT` (Render injects it).

Acceptance:
- `render.yaml` valid YAML, fields per spec.
- (Deferred to deploy) `<CONFIRM>` replaced with API host from donations-api#42.

Verify: YAML lint / `docker compose config` unaffected.

## Checkpoints
- **CP1 (gate before Render):** Task 1 local verification fully green. Block Task 2 deploy if any acceptance item fails.
- **CP2 (Render, after API live):** deploy API first; set real `API_UPSTREAM`/`API_HOST`; open `https://donations-frontend.onrender.com` → SPA loads (`$PORT` auto-detect), login/network checks pass. Fallback: add `proxy_cookie_domain ${API_HOST} $host;` if cookie scope blocks login.

## Out of scope
API changes, CORS, CSP relaxation, Static Site approach.
