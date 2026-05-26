# Donations Frontend

Web app that helps small churches manage their finances — track tithes, offerings, and expenses, manage donor records, and view financial reports with charts and summaries. Supports role-based access so administrators, treasurers, and other staff see only what they need.

## Running the App (End Users)

**Prerequisite:** [Docker](https://www.docker.com/get-started)

**First-time setup — run this once:**

```bash
curl -fsSL https://raw.githubusercontent.com/jorgetroya80/donations-frontend/main/scripts/setup.sh | bash
```

> Verify the URL matches the [official repository](https://github.com/jorgetroya80/donations-frontend) before running.

This downloads the app, creates your settings file, and pulls the Docker images into `~/donations/`.

**Start the app:**

```bash
cd ~/donations && ./scripts/start.sh
```

Open **http://localhost:8080** in your browser.

| Script                | What it does                  |
| --------------------- | ----------------------------- |
| `./scripts/start.sh`  | Start the app                 |
| `./scripts/stop.sh`   | Stop the app (data is kept)   |
| `./scripts/update.sh` | Update to the latest version  |
| `./scripts/reset.sh`  | Wipe database and start fresh |

---

## Prerequisites

- Node.js >= 24
- pnpm >= 11.1.1

## Getting Started

```bash
pnpm install
pnpm run dev
```

App runs at http://localhost:3000

## Scripts

| Command                  | Description             |
| ------------------------ | ----------------------- |
| `pnpm run dev`           | Start dev server        |
| `pnpm run build`         | Production build        |
| `pnpm run test`          | Run tests               |
| `pnpm run test:coverage` | Run tests with coverage |
| `pnpm run check`         | Biome lint + format     |
| `pnpm run typecheck`     | TypeScript type check   |

## Running Locally (Full Stack)

**Prerequisites:** Docker

1. Copy environment file:

   ```bash
   cp .env.example .env
   ```

   Export `NODE_AUTH_TOKEN` (a GitHub Personal Access Token with **`read:packages`** scope) in your shell profile so it's available to Docker Compose during the build:

   ```bash
   # Add once to ~/.zshrc or ~/.bashrc
   export NODE_AUTH_TOKEN=ghp_yourtoken
   ```

2. Start API and frontend:

   ```bash
   docker compose up --build
   ```

App runs at http://localhost:8080

| Command                     | Effect                         |
| --------------------------- | ------------------------------ |
| `docker compose up --build` | Start + rebuild frontend image |
| `docker compose down`       | Stop (data persists)           |
| `docker compose down -v`    | Stop + wipe database           |
| `docker compose pull`       | Pull latest API image          |

## Docker (frontend only)

Requires the API already running on port 8081. Requires a GitHub PAT with `read:packages` scope exported as `NODE_AUTH_TOKEN`.

```bash
export NODE_AUTH_TOKEN=your_token
docker build --secret id=NODE_AUTH_TOKEN,env=NODE_AUTH_TOKEN -t donations-frontend .
docker run --name donations-frontend --rm -p 8080:80 --add-host=api:host-gateway donations-frontend
```

`--add-host=api:host-gateway` maps the `api` hostname inside the container to your host machine, so nginx can proxy `/api/` to the running API.

## Architecture

```
src/
├── assets/          # Static images and media
├── components/      # Reusable UI components
├── features/        # Feature modules (auth, donations, donors, expenses, reports, settings, users, dashboard)
├── layouts/         # Layout wrappers
├── lib/             # Shared utilities (API client, types, permissions)
├── locales/         # i18n translations
└── test/            # Test utilities and setup
```

- **Routing**: React Router with nested routes and role-based guards
- **Server state**: TanStack Query
- **API**: Ky HTTP client
- **Forms**: React Hook Form + Zod validation
- **i18n**: i18next (Spanish)

## Tech Stack

- React 19.2
- TypeScript 6.0
- Vite 8.0
- Tailwind CSS 4.2
- TanStack Query 5.x
- Biome 2.4
- Vitest 4.x
