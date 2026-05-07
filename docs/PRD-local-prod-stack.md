# PRD: Local Prod Full-Stack Stack with Postgres

## Problem Statement

Developers cannot run the complete donations stack locally using production Docker images. The current `docker-compose.yml` includes the frontend and API services but omits the Postgres database, so the API container fails to start. There is no mechanism to supply database credentials safely, and the API runs with the `dev` Spring profile instead of `prod`, causing behavioral differences between local runs and production.

## Solution

Extend `docker-compose.yml` to include a Postgres service wired to the API container via a shared Docker network. Load all credentials from a gitignored `.env` file. Set the API to run with `SPRING_PROFILES_ACTIVE=prod`. Persist Postgres data across restarts using a named Docker volume. Expose Postgres on port 5432 so developers can inspect data with local tooling. Provide a committed `.env.example` template so new contributors know what variables are required.

## User Stories

1. As a developer, I want to run `docker compose up` and have the full stack (frontend, API, Postgres) start automatically, so that I can test end-to-end flows without manual setup.
2. As a developer, I want the API to use the `prod` Spring profile locally, so that my local environment behaves like production and I can catch environment-specific bugs early.
3. As a developer, I want database credentials loaded from a `.env` file, so that secrets are never committed to the repository.
4. As a new contributor, I want a `.env.example` file committed to the repo, so that I know exactly which environment variables are required to run the stack.
5. As a developer, I want Postgres data to persist across `docker compose down` / `docker compose up` cycles, so that I don't lose seed data or test records on every restart.
6. As a developer, I want Postgres accessible on host port 5432, so that I can inspect and query the database using tools like psql, DBeaver, or pgAdmin.
7. As a developer, I want the API container to wait for Postgres to be healthy before starting, so that the API doesn't crash on startup due to a missing database connection.
8. As a developer, I want the API container to use the pre-built Docker Hub image (`jorgetroya/donations-api:main`), so that I run the same artifact that CI/CD ships to production.
9. As a developer, I want the frontend container to wait for the API to be healthy before starting, so that the UI doesn't load with a broken backend.
10. As a developer, I want a single `docker compose up --build` command to rebuild the frontend and start all services, so that local iteration is fast and predictable.
11. As a developer, I want to tear down the stack without losing Postgres data using `docker compose down`, so that I can stop services temporarily and resume later.
12. As a developer, I want to fully reset the stack including the database using `docker compose down -v`, so that I can start from a clean state when needed.
13. As a developer, I want nginx to continue proxying `/api/` requests to the API container, so that there are no CORS issues and the local setup mirrors production routing.
14. As a developer, I want the Postgres volume name to include a `-prod` suffix, so that it is clearly distinct from any future dev or test volumes.
15. As a developer, I want all services to `restart: unless-stopped`, so that containers recover automatically if they crash during a long local session.

## Implementation Decisions

### docker-compose.yml
- Add `postgres` service using `postgres:18.3-bookworm` image, matching the version used in the API repo's own compose file.
- Postgres environment variables (`POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`) sourced from `.env` via Docker Compose variable substitution.
- Postgres ports: `5432:5432` (exposed to host for tooling access).
- Postgres named volume: `postgres-data-prod` mounted at `/var/lib/postgresql/data`.
- Postgres healthcheck: `pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}`, interval 5s, timeout 5s, 5 retries.
- `api` service retains `image: jorgetroya/donations-api:main` and `pull_policy: always`.
- `api` service gains environment variables: `SPRING_DATASOURCE_URL` (pointing to `postgres` service via Docker DNS), `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`, `SPRING_PROFILES_ACTIVE: prod`.
- `api` service gains `depends_on: postgres: condition: service_healthy`.
- `api` service keeps `expose: ['8081']` (not `ports`) so the API is only reachable via the nginx proxy.
- `frontend` service unchanged except dependency chain now flows: postgres → api → frontend.
- Add top-level `volumes:` block declaring `postgres-data-prod`.
- All services remain on the `app` bridge network.

### .env file (gitignored)
- Variables: `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`.
- File is gitignored so credentials are never committed.
- Default values for local use: all three set to `donations`.

### .env.example (committed)
- Committed template with the same variables as `.env` and their default local values.
- Documents required variables for new contributors.

### .gitignore
- Add `.env` entry. Currently only `.env.local` and `.env.*.local` variants are ignored; plain `.env` is not.

### nginx.conf
- No changes required. Already proxies `/api/` to `api:8081` and sets security headers.

### Dockerfile
- No changes required. `VITE_API_URL` build arg defaults to empty, which is correct — all API calls go through the nginx proxy at `/api/`.

## Testing Decisions

No automated tests for Docker/compose infrastructure. Manual verification:

1. `docker compose up --build` → all three services reach `healthy` state (`docker compose ps`).
2. `curl http://localhost:8080/api/actuator/health` → `{"status":"UP"}` (API alive via nginx proxy).
3. `open http://localhost:8080` → frontend loads and can communicate with the API.
4. `psql -h localhost -U donations -d donations` → connects to Postgres from host.
5. `docker compose down && docker compose up` → Postgres data from previous run persists.
6. `docker compose down -v` → named volume removed, clean slate on next `docker compose up`.
7. Verify API container log shows Spring `prod` profile active on startup.

## Out of Scope

- Building the API from local source (this PRD uses the Docker Hub image only).
- Non-local environments (staging, production deployment).
- Database migrations or seed data automation.
- SSL/TLS termination in the local stack.
- Multi-architecture (arm64) builds.
- Separate dev vs prod compose file variants.

## Further Notes

- The `api` service uses `expose` not `ports`, so the API is not directly reachable on the host. Use `curl http://localhost:8080/api/...` to reach it through nginx.
- If the API's `prod` Spring profile requires additional environment variables (e.g. secrets, feature flags), add them to `.env` and reference them in the `api` service `environment` block.
- To temporarily connect to the API directly (e.g. for debugging), add `ports: - "8081:8081"` to the `api` service. Remove when done.
- `docker compose down` without `-v` leaves the `postgres-data-prod` volume intact. Always use `-v` for a full reset.
