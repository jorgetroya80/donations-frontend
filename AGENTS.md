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
- `pnpm check:fast`: typecheck, oxlint, gitleaks. Seconds. Run after edits.
- `pnpm check:task`: `check:fast` + coverage + changed-line coverage + floor guard. Under 90 s.
- `pnpm check:full`: `check:task` + Semgrep + osv-scanner. Needs network.

Tools for `check:fast` and `check:full`: `brew install gitleaks osv-scanner semgrep`.

`pnpm install` needs `NODE_AUTH_TOKEN` with `read:packages` to pull `@jorgetroya80/donations-api-client` from GitHub Packages.

Run `pnpm run check:task` before reporting a change as done, and report its real result. Quality bar: `CONSTRAINTS.md`.

Dependency CVE: pin the fixed version under `overrides` in `pnpm-workspace.yaml`. Do not fork or vendor the dependency.

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
- Types: `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `revert`. CI rejects a PR title outside this list. `feat`, `fix` and `perf` reach `CHANGELOG.md` through release-please.
- Scope is optional: `type(scope): subject`. Use a lowercase kebab-case area, such as the feature folder (`donors`, `reports`), a cross-cutting area (`a11y`, `deps`, `ui`, `docker`) or the tool (`lint`, `pre-commit`). Do not use file names.
- `chore(main):` is reserved for release-please. Do not write it.
- Breaking change: `!` after the type or scope, and a `BREAKING CHANGE:` footer in the body.
- PR body: What / Why / Test plan.
- Deep pre-merge review: use the `code-reviewer` agent.

## Exceptions

A rule can be broken in one path only with an approved exception. Rules and process: `CONSTRAINTS.md`, section Exceptions.

- Add a row to the Exceptions table in `CONSTRAINTS.md`. Use the next ID: `W<n>` or `E<n>`.
- Commit the row with a trailer on its own line, after a blank line:

  ```
  Exception: W1
  ```

- The trailer is the approval record. `check:task` rejects a new row with no matching trailer in the branch's commits.
- Do not write the trailer for an exception you did not get approved. The reviewer must not be the author.
- `check:task` also fails when a row's Expires date has passed. Fix the code, or renew with a new row, ID and trailer.
- Rewording or removing a floor bullet in `CONSTRAINTS.md` needs `Floor: <old bullet text>` on a commit. Same approval rule: the reviewer is not the author.
