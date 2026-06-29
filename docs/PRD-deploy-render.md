# PRD: Deploy frontend to Render (Docker web service, same-origin /api proxy)

**GitHub Issue:** https://github.com/jorgetroya80/donations-frontend/issues/146

## Problem Statement

The frontend must deploy to Render alongside the API. The SPA calls the API at **same-origin `/api/`** through the nginx reverse proxy, and that property is load-bearing:

- CSP is strict `connect-src 'self'` (`nginx.conf`) → the browser blocks cross-origin calls to the API.
- The session cookie is `SameSite=Lax; Secure` → it does not travel to a different domain.
- The API `prod` profile has CORS **disabled**.

Today the proxy upstream is hardcoded to the docker-compose service (`proxy_pass http://api:8081;`), which does not exist on Render. The listen port is hardcoded to `80`, while Render injects `$PORT`. The same image and `nginx.conf` are reused by `docker-compose.yml` for local full-stack dev, so any host-specific value baked into the image breaks local development.

## Solution

Ship one provider-agnostic Docker image: serve the built SPA via nginx and reverse-proxy `/api/` to a **configurable upstream** on a **configurable port**, with all environment-specific values injected via env vars at container start (`envsubst` + entrypoint). The same image then runs unchanged on local docker-compose, Render, or any future host — only env vars differ. Add a `render.yaml` to declare the web service. The API must be deployed first (donations-api#42) since the proxy needs it live.

## User Stories

1. As an operator, I want the nginx upstream and listen port configurable via env vars, so the same image runs on local compose and Render without code changes.
2. As an operator, I want to move to another hosting provider by only changing env vars, so the image is not coupled to Render.
3. As a developer, I want `docker compose up` to keep working with no config edits, so local full-stack dev is unaffected (defaults reproduce current behavior).
4. As a security-conscious developer, I want CSP strict and the API same-origin preserved, so cookies/CSP/CORS keep working without touching the API.
5. As an operator, I want a `render.yaml` declaring a Docker web service with health check and region, so deploys are reproducible.

## Implementation Decisions

### nginx config (template, processed by the nginx image's built-in entrypoint)
The `nginx:1.27-alpine` image ships `20-envsubst-on-templates.sh`, which auto-runs `envsubst` on every `*.template` in `/etc/nginx/templates/` and writes the result to `/etc/nginx/conf.d/` at container start. No custom entrypoint needed.

Rename `nginx.conf` → `default.conf.template` (copied to `/etc/nginx/templates/`). Parameterize exactly three values; leave all else intact:
- `listen ${PORT};`
- `proxy_pass ${API_UPSTREAM};`
- `proxy_set_header Host ${API_HOST};` (upstream hostname; for the local http upstream the API ignores Host, so any value works)
- Add `proxy_ssl_server_name on;` (harmless for an http upstream, required for https/SNI on Render).
- No allow-list needed: the built-in script substitutes **only env vars that are actually defined**, so nginx runtime vars (`$remote_addr`, `$proxy_add_x_forwarded_for`, `$uri`, cache vars) are left intact automatically (they are not env vars).

### Dockerfile (final stage only)
- `COPY default.conf.template /etc/nginx/templates/default.conf.template` (replaces the old `COPY nginx.conf /etc/nginx/conf.d/default.conf`).
- Add `ENV PORT=80 API_UPSTREAM=http://api:8081 API_HOST=api` — defaults that reproduce current compose behavior. Render overrides `PORT` (auto-injected) and `API_UPSTREAM`/`API_HOST`.
- Keep `EXPOSE 80` (informational) and the existing `HEALTHCHECK`/`CMD` — no entrypoint changes.
- Build stage unchanged; no `VITE_*` runtime config needed (SPA calls `/api` relative).

### `render.yaml` (new)
```yaml
services:
  - type: web
    name: donations-frontend
    runtime: docker
    dockerfilePath: ./Dockerfile
    plan: free
    region: frankfurt        # match API region for low proxy latency
    autoDeploy: true
    healthCheckPath: /
    envVars:
      - key: API_UPSTREAM
        value: https://<CONFIRM>.onrender.com   # exact API host from donations-api#42
      - key: API_HOST
        value: <CONFIRM>.onrender.com
```
- `PORT` is injected by Render automatically — do not set it.
- Exact API hostname is a `<CONFIRM>` placeholder pending donations-api#42.

### `docker-compose.yml`
- No change required: defaults reproduce current behavior. Optionally set `API_UPSTREAM`/`API_HOST` explicitly for clarity.

## Testing Strategy

Local (before deploy):
1. `docker compose up --build` → SPA loads at `http://localhost:8080`.
2. Log in → DevTools Network: `/api/v1/...` same-origin, 200, session cookie set; no CSP/CORS errors; deep-link refresh does not 404.
3. `docker compose exec frontend cat /etc/nginx/conf.d/default.conf` → runtime `$` vars intact, upstream/port substituted.

Render (after API live):
4. Set `API_UPSTREAM`/`API_HOST` to confirmed API host; deploy.
5. Open `https://donations-frontend.onrender.com` → SPA loads (`$PORT` auto-detect works).
6. Repeat login/network checks from step 2.
7. If login fails on cookie scope: add `proxy_cookie_domain ${API_HOST} $host;` to the `/api/` block.

## Boundaries

- **Always:** preserve same-origin `/api/` proxy and strict CSP; keep config env-driven (no host names baked into the image).
- **Ask first:** changing CSP/security headers; touching the API or its CORS; switching from Docker web service to Static Site.
- **Never:** hardcode the Render API URL into `nginx.conf`/image; break local compose defaults; commit secrets.

## Execution Order
1. Rename `nginx.conf` → `default.conf.template`, parameterize the three values.
2. Edit `Dockerfile` final stage (template copy path + `ENV` defaults).
3. Add `render.yaml`.
4. Run local verification (Testing Strategy steps 1–3).
5. Deploy API first (donations-api#42), then Render deploy + verify (steps 4–7).
