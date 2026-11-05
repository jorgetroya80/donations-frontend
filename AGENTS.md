# AGENTS.md

React 19 + TypeScript + Vite SPA for managing church donations, expenses and reports.
Full architecture: `docs/ARCHITECTURE.md`. Setup and env: `README.md`.
Quality bar: read `CONSTRAINTS.md` before writing code. Never weaken it to make a change pass.

## Commands

- `pnpm dev` / `pnpm start`: dev server (port 3000)
- `pnpm build`: production build
- `pnpm preview`: serve the production build (port 4173)
- `pnpm typecheck`: `tsc --build --force`
- `pnpm check`: oxlint + oxfmt, auto-fix (`src/`)
- `pnpm check:ci`: same checks, no writes (use before pushing)
- `pnpm test`: unit tests. `pnpm test:watch`, `pnpm test:coverage` for variants

Run `pnpm typecheck`, `pnpm check:ci` and `pnpm test` before reporting a change as done.

## Conventions

**Feature slices.** One folder per domain in `src/features/<domain>/`:
`<domain>s-page.tsx`, `<domain>-form.tsx`, `<domain>-schema.ts` (Zod),
`use-<domain>s.ts` (React Query), `index.ts` barrel. Tests colocated as
`*.test.tsx` next to the file. File names are kebab-case.

**Server data.** Only through `@jorgetroya80/donations-api-client`. Pass `client`
from `src/lib/api.ts` with `throwOnError: true` and `signal`. Never call `fetch`
or `ky` from a feature. Reference: `src/features/donors/use-donors.ts`.
Do not hand-write API types; import them from the client package.

**API errors.** Reuse `src/lib/parse-api-field-errors.ts` (field errors into the
form) and `src/lib/get-problem-message.ts` (ProblemDetail into a message). Do not
add new error parsing.

**i18n.** Every user-visible string lives in `src/locales/es.json`. No string
literals in JSX.

**UI.** Plain HTML + Tailwind v4. Do not add new wrappers around
`@base-ui/react`. When using a base-ui component, pass the `render` prop;
`asChild` is ignored. Reuse `src/components/` (`empty-state`, `skeleton`,
`page-header`, `sortable-th`) and `src/lib/` (`use-sort.ts`, `use-page-param.ts`,
`use-debounced-value.ts`, `formatters.ts`, `permissions.ts`).

**React Compiler** is enabled. Do not add manual `useMemo` or `useCallback`.

**Tests.** Render with `src/test/test-utils.tsx`. Mock API calls in
`src/test/msw-handlers.ts`. Never hit the real network in tests.

## Workflow

- Never commit to `main`. The `pre-push` hook blocks it. Branch, then open a PR.
- Commit messages: Conventional Commits, imperative mood, subject 50 characters
  or fewer. The subject must read correctly as a `CHANGELOG.md` line.
- PR body: What / Why / Test plan.
- Deep pre-merge review: use the `code-reviewer` agent.
