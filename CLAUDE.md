# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Commands

- `npm run dev` / `npm start` — Start dev server (port 3000)
- `npm run check` — Biome lint + format with auto-fix (`src/**/*.{ts,tsx}`)
- `npm run lint` — ESLint check (`src/**/*.{ts,tsx}`)
- `npm run preview` — Preview production build

## Architecture

React 19 + TypeScript + Vite 8 SPA for a donations frontend.

- **React Compiler** enabled via `babel-plugin-react-compiler` (no manual memoization needed)
- **Tailwind CSS v4** via `@tailwindcss/vite` plugin
- **Dual linting**: Biome (primary, handles format + lint + import organizing) and ESLint (react-hooks, react-refresh rules)
- **lint-staged**: Biome runs on staged files for formatting (all files) and linting (ts/tsx)

## Code Style

- Single quotes, no semicolons, trailing commas (ES5), spaces (2)
- `const` over `let`, no `var`, no `any`
- Target: ES2023, module resolution: bundler
