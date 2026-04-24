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

## Docker

```bash
docker build -t donations-frontend .
docker run -p 8080:80 donations-frontend
```

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
