# React Best Practices Review — Commit c4f8a18

**Branch**: `feat-security-hardening`
**Scope**: Forced password rotation flow (issue #129)
**Reviewer**: react-best-practices skill (40+ rule guide)
**Mode**: Report only — no changes applied yet

**Project context that shapes the verdicts**

- React 19 + `babel-plugin-react-compiler` is on (`CLAUDE.md`). Manual memoization (`useCallback`/`useMemo`) is redundant — the compiler stabilises function/object identity automatically. Existing `useCallback`s aren't bugs, they're noise.
- Vite SPA — no RSC, no streaming, no `Promise.all` server waterfalls to chase. Most of the guide's CRITICAL section (waterfalls, RSC boundaries) doesn't apply.
- Tailwind v4 + base-ui + shadcn-style components are pre-existing.

Verdicts use:

- ✅ Good as-is
- 🟡 Nit / polish only — safe to ignore
- 🟠 Real concern, worth fixing
- 🔴 Bug / regression risk

---

## File-by-file findings

### `src/features/auth/auth-context.tsx`

| Level | Finding |
|-------|---------|
| 🟡 | `useCallback` on `login`/`logout`/`clearMustChangePassword` is redundant under React Compiler. Removing yields no behavioural change but cleans the file. Keep them only if there's a project-wide convention to keep manual memoization. |
| 🟡 | The context value object `{ user, login, logout, clearMustChangePassword }` is recreated each render. Under React Compiler the object identity is stable when inputs are; without it, every consumer re-renders on any provider re-render. Currently fine. If the compiler ever gets disabled, splitting into `AuthStateContext` + `AuthActionsContext` would narrow subscriptions. Not worth doing pre-emptively. |
| ✅ | `useState(getStoredUser)` uses lazy initialization — matches the guide's "lazy state initialization" rule. |
| ✅ | Functional updater inside `clearMustChangePassword` (`setUser(prev => ...)`) avoids stale closure pitfalls. |

### `src/features/auth/login-page.tsx`

| Level | Finding |
|-------|---------|
| ✅ | `useRef(0)` for `failedAttempts` is the right primitive — counter is ephemeral and must not trigger re-renders. Matches the guide's "store event handlers in refs" pattern. |
| 🟡 | `const LOCKOUT_THRESHOLD = 5` is hoisted to module scope — good. |
| 🟠 | The lockout counter resets on every page reload (it's a ref, not persisted). That's documented as acceptable in the plan, but worth a one-line code comment so future maintainers don't try to "fix" it. Not a perf concern. |
| 🟡 | `data.username ?? ''` allows an empty username to land in AuthContext. Unlikely from the backend, but downstream code may assume non-empty. Defensive only. |
| 🟡 | Pre-existing barrel: `import { login as sdkLogin } from '@jorgetroya80/donations-api-client'`. Modern bundlers tree-shake hey-api output well; not introduced by this commit. |

### `src/features/auth/protected-route.tsx`

| Level | Finding |
|-------|---------|
| ✅ | Module-level `const CHANGE_PASSWORD_PATH` — matches "hoist static values outside components." |
| ✅ | Cheap, declarative, two early returns. No re-render hot path. Nothing to do. |

### `src/features/settings/change-password-page.tsx`

| Level | Finding |
|-------|---------|
| ✅ | `forced` is captured at the start of `onSubmit` — closure correctly uses the pre-mutation value. Order of `clearMustChangePassword()` then `navigate('/')` is correct: clearing first means the destination route doesn't bounce us back through `ProtectedRoute`. |
| 🟡 | `useState` is used twice (`success`, `apiError`). They are mutually exclusive — could be one discriminated union (`'idle' \| 'success' \| { error: string }`) but the current shape is readable. UX-level polish. |
| ✅ | React-hook-form usage and aria-* wiring are unchanged from baseline. |
| 🟡 | `(err as { status?: number })` type-cast survives from the existing implementation. Not new; ignore. |

### `src/features/users/users-page.tsx`

| Level | Finding |
|-------|---------|
| 🟡 | `(data.content ?? [])` is evaluated three times in the render (length check, length check, `.map`). Hoisting `const rows = data?.content ?? []` once would shave a couple of allocations and read better. Micro. |
| ✅ | Stable `key={u.id}` and `key={role}`. |
| ✅ | The new pending-rotation badge is a plain conditional — no perf surface. |
| 🟡 | `buttonVariants({...})` called on each row render. Pre-existing; React Compiler memoizes the call site. |

### `src/layouts/sidebar.tsx`

| Level | Finding |
|-------|---------|
| 🟠 | `if (user?.mustChangePassword) return null` is checked **inside `navItems.map`**, once per item. Should be hoisted before the `.map(...)` and short-circuit the whole nav:<br>`if (user?.mustChangePassword) return [] ` (or wrap the `<nav>` body in a conditional). Same behaviour, clearer intent, fewer iterations. |
| ✅ | `navItems` is module-scoped — matches "hoist static JSX elements." Icon `ReactElement`s are created once at module init. |
| 🟡 | Pre-existing: each `NavLink`'s `className` is an inline arrow `({ isActive }) => cn(...)`, recreated per render. With React Compiler this is fine; without it, `NavLink` would re-compute on every parent render. Not a regression. |

### `src/lib/api.ts`

| Level | Finding |
|-------|---------|
| 🔴 | **State desync**: when a 403 PASSWORD_CHANGE_REQUIRED lands and the user is **already on `/settings/password`**, `flagStoredUserForRotation()` flips the localStorage flag to `true`, but the in-memory `AuthContext.user.mustChangePassword` is not updated. The change-password page then renders with `forced = false`, the forced-rotation banner doesn't show, and `clearMustChangePassword()` on success has nothing to clear in state (only in storage). Fix candidates:<br>• Dispatch a `storage` event the AuthProvider listens for, or<br>• Trigger a full reload even on the same path, or<br>• Expose a setter from AuthContext and call it from the hook (would require coupling api.ts to AuthContext via a registered handler). |
| 🟡 | `await response.clone().json()` runs on every 403 — fine because 403 is the cold path. Guard via `Content-Type: application/json` check if the backend ever returns non-JSON 403s. |
| ✅ | `flagStoredUserForRotation` and `isPasswordChangeRequired` are pure helpers, top-level. Matches "early return" and "hoist helpers." |
| 🟡 | Two `window.location.href = ...` redirects cause full page reloads, throwing away the React tree. Consistent with the existing 401 behaviour, so not a new debt. If the project ever moves to in-app navigation for auth events, this hook is the place to refactor. |
| 🟡 | `(await isPasswordChangeRequired(response))` is `await`ed inside the 403 condition. Short-circuit order is fine because the cheaper checks (status, URL filter) run first — matches "early return." |

---

## Cross-cutting observations

**Bundle size**
- Lucide imports (`import { ... } from 'lucide-react'`) remain barrel-style — pre-existing across the codebase. The performance guide flags this CRITICAL, but Vite + lucide-react's ESM exports tree-shake unused icons cleanly in production builds. A repo-wide refactor to deep imports (`'lucide-react/dist/esm/icons/check'`) would shave initial JS, but it's out of scope for this PR.
- `@jorgetroya80/donations-api-client` is a generated client; `login`/`changeOwnPassword` are imported directly. Tree-shakeable, no regression.

**Waterfalls**
- None introduced. All async happens inside event handlers (`onSubmit`) and the ky hook — there are no chained `await`s that could be parallelized with `Promise.all`.

**Re-render hot paths**
- No new `useEffect` or list rendering touched. React Compiler covers the inline lambdas added in `LoginPage`, `ChangePasswordPage`, and `Sidebar`. Profiling not warranted.

---

## Recommended actions (priority order)

1. 🔴 **`src/lib/api.ts` — fix the state-desync on same-path 403.** Pick one of:
   - Wire AuthProvider to a `window.storage` event so localStorage changes propagate to React state.
   - In the 403 handler, always do `window.location.href = '/settings/password'` (even when already there) — simplest, mirrors 401 behaviour.
   - Expose a global setter callback registered by AuthProvider that the hook calls.
2. 🟠 **`src/layouts/sidebar.tsx` — hoist the `mustChangePassword` short-circuit out of `.map`.** Clarity + a couple of saved iterations.
3. 🟡 **`src/features/users/users-page.tsx` — extract `const rows = data?.content ?? []` once.** Micro polish.
4. 🟡 **`src/features/auth/login-page.tsx` — one-line comment on the lockout counter** ("ref-only; resets on reload, mirrors backend's 15-min lock"). Prevents misguided "persistence" PRs.

The remaining 🟡 items are subjective polish and the AuthContext `useCallback`s are intentional compatibility — leave them.

---

## Bottom line

Functionally correct, all 298 tests + build pass. One real bug worth fixing before merge (the state-desync in the 403 hook), one small refactor in `Sidebar`, and a handful of micro-polishes. No performance regressions, no waterfalls introduced, no bundle-size hot spots created by this change.
