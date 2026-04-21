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

# Phase 3: Dashboard Home

## Issues encountered

### 1. shadcn `add` overwrites button.tsx on every install

Running `npx shadcn@latest add calendar --overwrite` reverts `button.tsx` to the Base UI version, undoing our plain `<button>` fix. Must restore the fix after every `shadcn add` that touches button.tsx. Consider pinning the file or adding a post-install check.

### 2. Bundle size grows significantly with Recharts

Adding recharts (via shadcn charts) pushed the main bundle to ~985KB. Expected for charting libraries. Will code-split with lazy routes in a later phase.

### 3. ADMIN role gets 403 on `/api/v1/reports/*` endpoints

ADMIN role lacks backend permission for report endpoints (balance, donation summary, expense summary). Dashboard was showing financial charts for all users, causing 403 errors for ADMIN-only users. Fixed by refactoring the dashboard into role-based widgets:

- **FinancialOverview** (TREASURER, PASTOR) — balance cards + charts + date range picker
- **UserStats** (ADMIN) — total registered users + link to manage users
- **QuickActions** (OPERATOR, TREASURER, ADMIN) — New Donation, New Expense, View Donors buttons
- Multi-role users see all applicable widgets merged

Created `src/lib/permissions.ts` with `canViewReports`, `canManageUsers`, `canRecordData` helpers. Dashboard page now composes widgets conditionally based on user roles.

# Phase 3.5: Testing Setup + Backfill

## Issues encountered

### 1. ky relative prefix fails in jsdom/Node

ky's `prefix: '/api/v1'` constructs a `new Request('/api/v1/login')` internally. In jsdom, Node's native `fetch`/`Request` can't resolve relative URLs (no implicit base URL like a browser). Error: `TypeError: Failed to parse URL from /api/v1/login`. Fixed by making the prefix absolute: `${window.location.origin}/api/v1`. Works in both browser (resolves to current origin) and test env (jsdom sets `window.location.origin` to `http://localhost:3000` via `environmentOptions.jsdom.url`).

### 2. msw handlers need wildcard prefix for jsdom

msw in Node intercepts full URLs. Since ky builds `http://localhost:3000/api/v1/...`, handlers using `/api/v1/...` didn't match. Fixed by using glob prefix `*/api/v1` in handler paths.

### 3. Test files with JSX must use .tsx extension

Vite's oxc transform rejects JSX in `.ts` files. Hook tests using `<QueryClientProvider>` in wrapper functions need `.test.tsx` extension, not `.test.ts`. Error: `Expected '>' but found 'Identifier'`.

### 4. Currency formatting varies across Node/ICU versions

`Intl.NumberFormat('es-ES', { currency: 'EUR' })` may produce different thousands separators depending on Node's ICU data (full vs small-icu). Tests use flexible regex `5[.\s]?000` instead of exact `5.000,00` to avoid CI failures across environments.
