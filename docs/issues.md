# Phase 1: Foundation + Auth

## Issues encountered

### 1. shadcn/ui init failed — no import alias

shadcn requires `@/*` path alias. Added `baseUrl` + `paths` to `tsconfig.app.json` and `tsconfig.json`, plus `resolve.alias` in `vite.config.ts`.

### 2. TypeScript 6 deprecates `baseUrl`

TS 6.0.3 treats `baseUrl` as deprecated. Fixed by adding `"ignoreDeprecations": "6.0"` to both tsconfig files.

### 3. Biome fails on Tailwind CSS directives

shadcn/ui init rewrites `index.css` with `@custom-variant`, `@theme`, and `@apply` directives. Biome 2.4 doesn't parse these by default. Fixed by adding `"css": { "parser": { "tailwindDirectives": true } }` to `biome.json`.

### 4. Biome check script glob not expanding

`'src/**/*.{ts,tsx}'` in npm script wasn't expanding on some shells. Changed to `src/` which lets biome handle file discovery using its own config.

### 5. ESLint react-refresh errors on non-component exports

`buttonVariants` (shadcn) and `useAuth` hook triggered `react-refresh/only-export-components` error. Changed rule to `warn` with `allowConstantExport: true` in `eslint.config.js`.
