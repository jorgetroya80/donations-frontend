# Plan: Local Full-Stack Environment

> Source PRD: https://github.com/jorgetroya80/donations-frontend/issues/76

## Architectural decisions

- **Service topology**: Two services — `frontend` (local production build via nginx) + `api` (published Docker image)
- **API image**: `jorgetroya/donations-api:latest`, always pulled fresh via `pull_policy: always`
- **Port**: Host `8080` → container `80` (nginx). No root required.
- **API proxy**: nginx inside frontend container proxies `/api/` to `api:8080` over internal Docker network
- **Network**: Isolated `app` bridge network. API port not exposed to host.
- **Health check**: API uses `/actuator/health` (Spring Boot Actuator)
- **Dependency**: Frontend waits for API `service_healthy` before starting
- **No env vars**: API requires none currently; `.env` support can be added later

---

## Phase 1: Single-command full-stack setup

**User stories**: 1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12

### What to build

Update `docker-compose.yml` so `docker compose up --build` starts both services end-to-end:

- Frontend exposed on host port `8080`, served as a production nginx build from local source
- API pulled fresh from published image on every `up`, health-checked via `/actuator/health`
- Frontend depends on API being healthy before it starts
- Both services on isolated bridge network; API not exposed to host

Add a "Running Locally (Full Stack)" section to `README.md` covering:

- Prerequisites (Docker)
- Single command to start
- URL to access the app
- How to stop and rebuild

### Acceptance criteria

- [ ] `docker compose up --build` starts both services with a single command
- [ ] App is accessible at `http://localhost:8080`
- [ ] `docker compose ps` shows both services as healthy
- [ ] Frontend starts only after API reports healthy
- [ ] API requests from the frontend return 200 (verify via browser network tab)
- [ ] `docker compose up` (without `--build`) pulls latest API image automatically
- [ ] README includes prerequisites, start command, access URL, stop/rebuild instructions
