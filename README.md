# Donations Frontend

[![CI](https://github.com/jorgetroya80/donations-frontend/actions/workflows/ci.yml/badge.svg)](https://github.com/jorgetroya80/donations-frontend/actions/workflows/ci.yml)
[![Version](https://img.shields.io/github/package-json/v/jorgetroya80/donations-frontend?label=version)](https://github.com/jorgetroya80/donations-frontend/releases/latest)
[![API client](https://img.shields.io/github/package-json/dependency-version/jorgetroya80/donations-frontend/@jorgetroya80/donations-api-client?label=api-client)](https://github.com/users/jorgetroya80/packages/npm/package/donations-api-client)

A financial management web app for small churches. Treasurers record tithes, offerings and
expenses, keep donor records, and read reports with charts and summaries. Each role
(administrator, treasurer, other staff) sees only the screens and actions it is allowed to use.

This repository is the React single-page app. It talks to a separate Donations API through a
typed client generated from the API's OpenAPI spec.

## Features

- **Donations:** create, edit and list tithes and offerings, with duplicate detection.
- **Donors:** sortable, paginated donor records, plus a searchable donor picker in forms and
  reports.
- **Expenses:** categorized expense tracking.
- **Reports and dashboard:** income vs. expense summaries, category rankings and charts
  (Recharts). Dashboard content changes with the user's role.
- **Users and roles:** admin user management, role-based route guards and navigation,
  forced password rotation.
- **Dark mode:** follows the system preference, with no light flash on first paint.
- **Accessibility:** labelled forms, `aria-sort` on sortable tables, visible focus rings,
  keyboard navigation.

## Tech stack

| Concern      | Tools                                     |
| ------------ | ----------------------------------------- |
| UI           | React 19, Tailwind CSS 4, Base UI, Lucide |
| Language     | TypeScript 6 (strict)                     |
| Build        | Vite 8, React Compiler                    |
| Routing      | React Router                              |
| Server state | TanStack Query, generated OpenAPI client  |
| Forms        | React Hook Form + Zod                     |
| Charts       | Recharts                                  |
| i18n         | i18next                                   |
| Quality      | Biome, Vitest, React Testing Library, MSW |
| Delivery     | Docker, nginx, GitHub Actions, Render     |

## Engineering highlights

- **Type-safe API layer.** Server data goes only through `@jorgetroya80/donations-api-client`,
  generated from OpenAPI, so an API contract change shows up as a compile error. TanStack Query
  handles caching. In-flight requests are cancelled with `AbortSignal` when the user navigates
  away.
- **Consistent error handling.** RFC 9457 `ProblemDetail` responses are turned into user
  messages, and API validation errors are mapped back onto individual form fields.
- **Feature-sliced structure.** One folder per domain holds its page, form, Zod schema, query
  hooks and colocated tests.
- **URL as state.** Pagination, sort, the active report tab and the selected donor live in
  search params, so those views can be shared or bookmarked.
- **Security-minded delivery.** nginx serves the app with a strict Content-Security-Policy
  (`connect-src 'self'`, hashed inline script) and proxies `/api` same-origin. A test fails if
  the CSP hash drifts from the inline script.
- **Testing.** Vitest + React Testing Library, with MSW mocking the API. Tests never touch the
  real network.
- **Automated delivery.** GitHub Actions validates PR titles (Conventional Commits) and runs
  Biome, typecheck, tests with coverage, and the build. release-please generates the changelog
  and versions, Docker images are published to Docker Hub, and Dependabot keeps dependencies
  current.
- **Spanish UI.** Every user-visible string goes through i18next. JSX contains no hard-coded
  text.

## Architecture

```
src/
├── features/     # One slice per domain: auth, dashboard, donations, donors,
│                 # expenses, reports, settings, theme, users
├── components/   # Shared UI (empty state, skeletons, page header, sortable headers)
├── layouts/      # App shell: sidebar, header, error boundary, suspense
├── lib/          # API client, permissions, formatters, error parsing, URL-state hooks
├── locales/      # Translations (es)
└── test/         # Render helpers, MSW server and handlers
```

Every route is lazy-loaded behind role-based guards. See
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full breakdown.

## Getting started

**Prerequisites:** Node.js >= 24, pnpm >= 11.1.1, and a GitHub token with `read:packages`
scope (the API client is published to GitHub Packages).

```bash
export NODE_AUTH_TOKEN=ghp_yourtoken
pnpm install
pnpm run dev
```

The app runs at `http://localhost:3000`.

| Command                  | Description                       |
| ------------------------ | --------------------------------- |
| `pnpm run dev`           | Start dev server                  |
| `pnpm run build`         | Production build                  |
| `pnpm run preview`       | Preview production build (:4173)  |
| `pnpm run test`          | Run tests                         |
| `pnpm run test:coverage` | Run tests with coverage           |
| `pnpm run check`         | Biome lint + format + import sort |
| `pnpm run typecheck`     | TypeScript type check             |

## Running the full stack locally

Requires Docker and `NODE_AUTH_TOKEN` exported as shown above.

```bash
cp .env.example .env
docker compose up --build
```

The app runs at `http://localhost:8080`, with the API and Postgres in containers.

| Command                     | Effect                         |
| --------------------------- | ------------------------------ |
| `docker compose up --build` | Start + rebuild frontend image |
| `docker compose down`       | Stop (data persists)           |
| `docker compose down -v`    | Stop + wipe database           |
| `docker compose pull`       | Pull latest API image          |

### Frontend container only

This needs the API already running on port 8081.

```bash
docker build --secret id=NODE_AUTH_TOKEN,env=NODE_AUTH_TOKEN -t donations-frontend .
docker run --name donations-frontend --rm -p 8080:80 --add-host=api:host-gateway donations-frontend
```

`--add-host=api:host-gateway` points the `api` hostname inside the container at your host
machine, so nginx can proxy `/api/` to the running API.

## Installing for end users

End users only need [Docker](https://www.docker.com/get-started). One-time setup:

```bash
curl -fsSL https://raw.githubusercontent.com/jorgetroya80/donations-frontend/main/scripts/setup.sh | bash
```

> Check that the URL matches the [official repository](https://github.com/jorgetroya80/donations-frontend) before running it.

The script downloads the app, creates a settings file and pulls the Docker images into
`~/donations/`. Start the app with `cd ~/donations && ./scripts/start.sh`, then open
`http://localhost:8080`.

| Script                | What it does                  |
| --------------------- | ----------------------------- |
| `./scripts/start.sh`  | Start the app                 |
| `./scripts/stop.sh`   | Stop the app (data is kept)   |
| `./scripts/update.sh` | Update to the latest version  |
| `./scripts/reset.sh`  | Wipe database and start fresh |

## AI-assisted development

AI agents work on this repo under the same quality bar as a human contributor. The Claude Code
harness in `.claude/` enforces it:

- **Written conventions.** `CLAUDE.md` holds the project rules (feature slices, API access,
  error handling, i18n, testing) that agents follow.
- **Automatic guardrails.** Hooks format every edited file. Before a turn ends they run
  typecheck plus the tests related to the change, and a failure sends the errors back to the
  agent to fix.
- **Measured behavior.** `bash scripts/run-evals.sh` runs eval cases against the harness in
  throwaway git worktrees, so changes to the setup are checked, not assumed.

**Setup:** install `jq` (`brew install jq`), then run
`/plugin marketplace add addyosmani/agent-skills` in an interactive `claude` session. Personal
overrides go in `.claude/settings.local.json` (not versioned). Hooks load at session start.
