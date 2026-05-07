# Plan: Local Prod Full-Stack Stack with Postgres

> Source PRD: docs/PRD-local-prod-stack.md

## Architectural decisions

- **Compose structure**: Single `docker-compose.yml` in the frontend repo — postgres, api, frontend on a shared `app` bridge network.
- **API image**: Docker Hub only (`jorgetroya/donations-api:main`, `pull_policy: always`). No local source build.
- **Spring profile**: `SPRING_PROFILES_ACTIVE: prod` injected via compose environment.
- **Credentials**: Loaded from `.env` (gitignored). `.env.example` committed as template.
- **Volume naming**: `postgres-data-prod` (explicit `-prod` suffix to distinguish from future dev/test volumes).
- **API exposure**: `expose` not `ports` — API reachable only via nginx proxy at `/api/`. Port 8081 not mapped to host.
- **Postgres exposure**: Port `5432:5432` mapped to host for local tooling (psql, DBeaver).
- **Service ordering**: postgres → api (healthcheck gate) → frontend (healthcheck gate).

---

## Phase 1: Credentials + Postgres service

**User stories**: 3, 4, 6, 7, 11, 12, 14, 15

### What to build

Establish secret management and bring up Postgres as a healthy, persistent service:

- Add `.env` to `.gitignore` (currently only `.env.local` and `.env.*.local` are ignored).
- Create `.env` (gitignored) with `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` set to `donations`.
- Create `.env.example` (committed) with the same variables as documentation for new contributors.
- Add `postgres` service to `docker-compose.yml`: `postgres:18.3-bookworm`, env vars from `.env`, port `5432:5432`, named volume `postgres-data-prod`, healthcheck via `pg_isready`, `restart: unless-stopped`, `app` network.
- Declare `postgres-data-prod` in the top-level `volumes:` block.

### Acceptance criteria

- [ ] `docker compose config` resolves all `${POSTGRES_*}` variables without error.
- [ ] `docker compose up postgres` starts and reaches `healthy` state.
- [ ] `psql -h localhost -U donations -d donations` connects from host.
- [ ] `docker compose down && docker compose up postgres` — data from previous run persists in the named volume.
- [ ] `docker compose down -v` removes `postgres-data-prod` volume; next `up` starts with empty DB.
- [ ] `.env` is not tracked by git (`git status` shows it untracked/ignored).
- [ ] `.env.example` is tracked by git.

---

## Phase 2: API prod wiring + full-stack verification

**User stories**: 1, 2, 7, 8, 9, 10, 13, 15

### What to build

Wire the API container to Postgres with production configuration and verify the complete stack:

- Add environment block to `api` service: `SPRING_DATASOURCE_URL` (pointing to `postgres` via Docker DNS), `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD` (all from `.env`), `SPRING_PROFILES_ACTIVE: prod`.
- Add `depends_on: postgres: condition: service_healthy` to `api` service.
- Run `docker compose up --build` and confirm all three services reach `healthy`.

### Acceptance criteria

- [ ] `docker compose up --build` → all three services (`postgres`, `api`, `frontend`) reach `healthy` (`docker compose ps`).
- [ ] API log on startup shows Spring `prod` profile active.
- [ ] `curl http://localhost:8080/api/actuator/health` → `{"status":"UP"}` (routed via nginx proxy).
- [ ] Frontend loads at `http://localhost:8080` and can communicate with the API.
- [ ] API container is not directly reachable on host port 8081 (only via nginx).
- [ ] `docker compose down && docker compose up` → stack recovers, Postgres data intact.
