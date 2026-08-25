# CLAUDE.md

React 19 + TypeScript + Vite 8 SPA. Manage church donations, expenses, reports.
Full structure: `docs/ARCHITECTURE.md`. Coding discipline: skill `karpathy-guidelines`.

## Commands

- `pnpm run dev` / `pnpm start` — dev server (port 3000)
- `pnpm run build` — build
- `pnpm run preview` — preview production build (port 4173)
- `pnpm run typecheck` — `tsc --build --force`
- `pnpm run check` — Biome lint + format + import organizing, auto-fix (`src/`)
- `pnpm run test` — unit tests · `test:watch` · `test:coverage`

## Conventions

**Feature slices.** One folder per domain in `src/features/<domain>/`:
`<domain>s-page.tsx`, `<domain>-form.tsx`, `<domain>-schema.ts` (Zod), `use-<domain>s.ts`
(React Query), `index.ts` barrel. Tests colocated as `*.test.tsx` next to file.
File names kebab-case, always.

**Server data.** Only via `@jorgetroya80/donations-api-client`, pass `client` from
`src/lib/api.ts` with `throwOnError: true` and `signal`. Never call `fetch`/`ky` from
feature. Reference pattern: `src/features/donors/use-donors.ts`.

**API errors.** Reuse `src/lib/parse-api-field-errors.ts` (field errors to form) and
`src/lib/get-problem-message.ts` (ProblemDetail to message). No new parsing.

**i18n.** Every user-visible string live in `src/locales/es.json`. No literals in JSX.

**UI.** Plain HTML + Tailwind v4. No new wrappers around `@base-ui/react`; when
use base-ui, pass `render` prop (`asChild` ignored). Reuse `src/components/`
(`empty-state`, `skeleton`, `page-header`, `sortable-th`) and `src/lib/use-sort.ts`,
`use-page-param.ts`, `use-debounced-value.ts`, `formatters.ts`, `permissions.ts`.

**React Compiler** enabled — no manual `useMemo` / `useCallback`.

**Tests.** Use `src/test/test-utils.tsx` to render, `src/test/msw-handlers.ts` for API
mocks. Never assert against real network.

## Workflow

- Never commit to `main` (`pre-push` blocks it). Branch, then PR.
- Commit messages via `/caveman-commit` — Conventional Commits, imperative, subject ≤50
  chars. Subject must read on own as `CHANGELOG.md` line. No AI attribution.
- Deep pre-merge review: `code-reviewer`.