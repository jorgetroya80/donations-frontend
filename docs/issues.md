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

# Phase 2: Layout + Navigation

## Issues encountered

### 1. shadcn add prompts for overwrite on existing files

`npx shadcn@latest add` prompts interactively when `button.tsx` already exists. Fixed by using `--overwrite` flag.

### 2. Chunk size warning on build

After adding shadcn components (dropdown-menu, sheet, tooltip, separator) + react-i18next + react-router, the main bundle exceeds 500KB. Not blocking — will code-split with lazy routes in later phases.

### 3. No issues with i18n setup

react-i18next configured with static import of `es.json` (no HTTP backend needed for single-language). All hardcoded Spanish strings in login page and dashboard replaced with `t()` calls.

# Login bug fixes

## Issues encountered

### 1. Base UI Button overrides `type="submit"`

shadcn's latest Button uses `@base-ui/react` Button, which hardcodes `type="button"` internally via `useButton` hook. The merge order in `useRenderElement` makes Base UI's `type` override the consumer's `type="submit"`. Form `onSubmit` never fired — no network request at all. Fixed by replacing `@base-ui/react` Button with a plain `<button>` element in `src/components/ui/button.tsx`.

### 2. ky v2 renamed `prefixUrl` to `prefix`

ky v2 throws immediately if `prefixUrl` is used (renamed to `prefix`). The error was caught by the generic catch block showing "Error de conexión" with no network request visible. Fixed by changing `prefixUrl` to `prefix` in `src/lib/api.ts`.

### 3. CORS 403 — Vite proxy forwards `Origin` header

Vite proxy's `changeOrigin: true` only changes `Host`, not `Origin`. Spring Boot rejected requests with `Origin: http://localhost:3000` as invalid CORS. Fixed by adding `configure` callback to strip the `Origin` header from proxied requests in `vite.config.ts`.

### 4. ky v2 `afterResponse` hook signature changed

ky v2 hooks receive a single object `{ request, options, response, retryCount }` instead of positional args `(request, options, response)`. The old signature caused the hook to crash on every response (including 200), caught as "Error de conexión". Fixed by destructuring the object in `src/lib/api.ts`.
