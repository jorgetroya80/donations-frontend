# Donations Frontend

Web app that helps small churches manage their finances — track tithes, offerings, and expenses, manage donor records, and view financial reports with charts and summaries. Supports role-based access so administrators, treasurers, and other staff see only what they need.

## Prerequisites

- Node.js >= 24
- npm >= 11

## Getting Started

```bash
npm install
npm run dev
```

App runs at http://localhost:3000

## Scripts

| Command                 | Description             |
| ----------------------- | ----------------------- |
| `npm run dev`           | Start dev server        |
| `npm run build`         | Production build        |
| `npm run test`          | Run tests               |
| `npm run test:coverage` | Run tests with coverage |
| `npm run check`         | Biome lint + format     |
| `npm run typecheck`     | TypeScript type check   |

## Running Locally (Full Stack)

**Prerequisites:** Docker

1. Copy environment file:

   ```bash
   cp .env.example .env
   ```

   Defaults work out of the box — no edits needed for local development.

2. Start API and frontend:

   ```bash
   docker compose up --build
   ```

App runs at http://localhost:8080

| Command | Effect |
|---|---|
| `docker compose up --build` | Start + rebuild frontend image |
| `docker compose down` | Stop (data persists) |
| `docker compose down -v` | Stop + wipe database |
| `docker compose pull` | Pull latest API image |

## Docker (frontend only)

Requires the API already running on port 8081.

```bash
docker build -t donations-frontend .
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
