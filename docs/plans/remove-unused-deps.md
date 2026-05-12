# Plan: Remove Unused Dependencies

> Source PRD: docs/PRD-remove-unused-deps.md

## Architectural decisions

- **No routes changed** — frontend routing unaffected.
- **No schema changes** — data models unaffected.
- **Date library**: `dayjs` remains the sole date utility. `date-fns` is not a replacement candidate.
- **Babel pipeline**: `@vitejs/plugin-react` owns all Babel transforms. `@rolldown/plugin-babel` is not part of the build.

---

## Phase 1: Remove both unused packages

**User stories**: 1, 2, 3, 4, 5, 6

### What to build

Remove `date-fns` from `dependencies` and `@rolldown/plugin-babel` from `devDependencies`. Neither package is imported in source code or referenced in build config, so no source changes are required. The lockfile regenerates automatically.

### Acceptance criteria

- [ ] `date-fns` absent from `package.json` dependencies
- [ ] `@rolldown/plugin-babel` absent from `package.json` devDependencies
- [ ] `pnpm run build` passes with no missing module errors
- [ ] `pnpm run test` passes with no broken imports
- [ ] `pnpm run check` passes (Biome lint + format clean)
- [ ] `pnpm-lock.yaml` updated and committed
