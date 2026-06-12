# Code Review — Forced Password Rotation Flow

**Branch**: `feat-security-hardening` (4 commits ahead of `main`)
**Commits**:

- `5481b49` chore(deps): bump donations-api-client to 1.7.1
- `c4f8a18` feat(auth): forced password rotation flow (closes #129)
- `90d756e` refactor(auth): address react-best-practices review findings
- `de33eac` test(auth): cover edge cases and end-to-end forced rotation flow

**Scope**: 21 files, +946/-45 lines. 306 tests passing (+24 new). Typecheck + build clean.
**Reviewer mode**: report only, no code changes.

---

## Verdict

**Request changes.** 1 Critical (broken indentation that hides a structural smell), 4 Important (mostly DRY violations across the new event bridge + a type-safety hole). Once those are addressed the change is ready. Architecture, security and perf are healthy.

---

## Critical

### C1. Sidebar `nav` block has broken indentation (`src/layouts/sidebar.tsx:108–163`)

After hoisting the `mustChangePassword` guard into a ternary, the `.map` body wasn't re-indented. The closing `})}` ends up aligned with the body, which makes the JSX structure hard to scan and will trip up the next person trying to add a nav item.

```tsx
{user?.mustChangePassword
  ? null
  : navItems.map((item) => {
      if (item.visible && !item.visible(user)) return null

  const link = (        // ← jumps back to column 11
    <NavLink ...
```

Biome accepts it (syntactically valid) but biome's formatter clearly didn't re-format the body. Fix: re-run `pnpm run check` on the file or hand-fix the indent so the `.map` body sits two levels deeper than the `:` of the ternary.

---

## Important

### I1. `'auth:force-rotation'` event name is duplicated (`src/lib/api.ts:6` vs `src/features/auth/auth-context.tsx:12`)

`auth-context.tsx` exports `FORCE_ROTATION_EVENT = 'auth:force-rotation'`, but `api.ts:6` redefines the same string as a local const. The whole point of the event bridge is that both sides agree on the channel name — duplicating the literal means a rename in one file silently breaks the handshake with no compiler error.

**Fix**: import `FORCE_ROTATION_EVENT` from `@/features/auth/auth-context` in `api.ts:53`, or extract both `AUTH_STORAGE_KEY` and `FORCE_ROTATION_EVENT` into `src/features/auth/auth-storage.ts` and import from both files.

### I2. `getStoredUser` trusts unverified shapes (`src/features/auth/auth-context.tsx:33–41`)

```ts
const parsed = JSON.parse(raw) as Partial<AuthUser> & {
  username: string
  roles: string[]
}
```

The type assertion *claims* `username` and `roles` are present, but `JSON.parse` returns `unknown`. If a malicious extension (or a developer in DevTools) writes `{"foo": "bar"}` to `auth_user`, `parsed.username` is `undefined` and the returned `AuthUser` violates its own type. `ProtectedRoute` then treats `user` as authenticated (it's not null), `Sidebar` renders without role checks, and we end up rendering `Bienvenido, undefined`.

**Fix**: validate at the boundary — at minimum a runtime guard:

```ts
if (
  typeof parsed.username !== 'string' ||
  !Array.isArray(parsed.roles)
) {
  localStorage.removeItem(AUTH_STORAGE_KEY)
  return null
}
```

Or run the payload through a `zod` schema (zod is already a dep).

### I3. URL exclusion checks use `String.includes` (`src/lib/api.ts:42, 49`)

```ts
if (response.status === 401 && !request.url.includes('/login')) { ... }
if (response.status === 403 && !request.url.includes('/users/me/password') && ...) { ... }
```

`includes` matches any substring. If the backend later adds endpoints like `/api/v1/audit/logins` or `/api/v1/users/me/password-history`, the auth hook will silently skip the redirect for those too. Subtle, hard to trace when it breaks.

**Fix**: parse the path once and compare exactly, e.g.:

```ts
const pathname = new URL(request.url).pathname
if (response.status === 401 && pathname !== '/api/v1/login') { ... }
if (response.status === 403 && pathname !== '/api/v1/users/me/password' && ...) { ... }
```

### I4. `data.username ?? ''` lets an empty user reach `AuthContext` (`src/features/auth/login-page.tsx:52`)

```ts
login({
  username: data.username ?? '',
  roles: data.roles ?? [],
  mustChangePassword,
})
```

If the backend ever returns `200 { mustChangePassword: true }` without `username`, we store an empty-string user, redirect to `/settings/password`, and the dashboard greeting (`dashboard.welcome` template) renders `Bienvenido, `. Pre-existing pattern in this file, but the new `mustChangePassword` branch makes the empty-username path reachable on a successful login. Worth surfacing now.

**Fix**: treat missing username/roles as a connection error:

```ts
if (!data.username || !data.roles) {
  setError(t('auth.errorConnection'))
  return
}
```

---

## Suggestion

### S1. Plan called out `/logout` exclusion that wasn't implemented (`src/lib/api.ts:47–57`)

The plan in `docs/plans/forced-password-rotation.md` step 3 lists `/logout` alongside `/users/me/password` as paths that must remain reachable on a 403. The issue notes `Logout's empty 200 no longer has a Content-Type: application/json header — only matters if the client parses the logout body`, so a 403 on logout shouldn't happen in practice. Low risk, but adding `pathname !== '/api/v1/logout'` to the 403 check makes the code match the plan and protects future contributors from surprises.

### S2. `clearMustChangePassword` writes to localStorage every voluntary password change (`src/features/settings/change-password-page.tsx:48`)

On the voluntary-rotation path the user wasn't flagged, so `clearMustChangePassword()` is a no-op semantically but still calls `localStorage.setItem`. Trivial cost, but the simpler intent is `if (forced) clearMustChangePassword()`. Same wording also makes the test gap from S5 below explicit.

### S3. `AUTH_STORAGE_KEY` and `CHANGE_PASSWORD_PATH` duplicated across modules

`AUTH_STORAGE_KEY` lives in both `auth-context.tsx:10` and `api.ts:4` (pre-existing pattern this PR keeps). `CHANGE_PASSWORD_PATH` is duplicated between `api.ts:5` and `protected-route.tsx:4` (new). If I1 lands and we add an `auth-storage.ts` (or `auth-constants.ts`) module, fold these into it too.

### S4. Lockout hint partially undoes the backend's enumeration defence (`src/features/auth/login-page.tsx:40–44`, `src/locales/es.json` `auth.errorLockoutHint`)

The backend returns generic `401` for lockouts deliberately. The client-side counter shows "La cuenta puede estar bloqueada por unos 15 minutos" after the 5th failed try, which confirms to a brute-forcer that lockout exists. Distributed credential-stuffing wouldn't trigger this (counter is per-tab), so the practical risk is low. Acceptable trade-off, but the rationale belongs as a code comment so a future security review doesn't re-litigate it. The existing comment on `failedAttempts` (lines 21–22) covers the "why a ref"; one more line on "why we tell the user" would close the loop.

### S5. Tests don't cover the `/users/me/password` no-dispatch invariant (`src/lib/api.test.ts`)

The existing test `ignores 403 from /users/me/password (avoid loop)` only asserts that the localStorage flag is unchanged. It doesn't verify that the `auth:force-rotation` event is **not** dispatched — which is the part that matters for the forced rotation page not re-flipping its own state during a wrong-current-password submission. One extra `vi.fn()` listener assertion would lock the invariant.

### S6. `useCallback` is redundant under React Compiler (`src/features/auth/auth-context.tsx:51, 56, 61`)

React Compiler memoizes inline functions automatically. The three `useCallback` wrappers are no-ops. Leaving them isn't a bug, but if the project is settling on "no manual memo," dropping them keeps the file smaller. (Already flagged in the earlier `react-best-practices` report — surfacing again only for completeness.)

---

## Five-axis summary

| Axis | Findings | Notes |
|---|---|---|
| **Correctness** | I2, I4, S1, S5 | Type-safety hole in `getStoredUser` + empty-username path are the real ones. Tests are otherwise thorough. |
| **Readability** | C1, I1, S3 | C1 must land. I1 + S3 are about pulling shared identifiers out of two duplicate sites. |
| **Architecture** | I1 | The window-event bridge itself is fine — pragmatic, justified — but the shared-name discipline matters. No layer violations, no circular imports, AuthContext stays as the source of truth for in-memory auth state. |
| **Security** | I3, S4 | URL-substring matching is a latent footgun; lockout-hint disclosure is a justified UX trade-off, just needs documenting. localStorage handling, prototype-pollution surface, redirect target are all clean. |
| **Performance** | — | No regressions. The hoisted `mustChangePassword` guard and the extracted `rows` are small wins. `useEffect` listener is single, idempotent, with proper cleanup. No N+1, no unbounded ops, no new bundle weight beyond the (necessary) API client bump. |

---

## Verification story (per the checklist)

- ✅ `pnpm test` — 306 passed, 0 failures
- ✅ `pnpm typecheck` — clean
- ✅ `pnpm build` — succeeds (the pre-existing 500 kB chunk-size warning is unrelated)
- ⚠️ Manual browser verification against a live API with `must_change_password=true` for the seed admin is **not done** — flag this on the PR. The integration test in `change-password-page.test.tsx` exercises the cross-module event handshake, but jsdom can't validate the actual `window.location.href` redirect, so a quick smoke test in the dev stack is still warranted before merging.

---

## Recommended actions, in order

1. **C1** — fix the sidebar indentation (run biome on `src/layouts/sidebar.tsx` or hand-format).
2. **I1** — single source of truth for `FORCE_ROTATION_EVENT` (import in `api.ts` from `auth-context.tsx`, or create `auth-storage.ts`).
3. **I2** — runtime-validate `getStoredUser`'s parsed payload (zod schema or manual guard).
4. **I3** — switch the URL exclusion checks to exact `pathname` comparisons.
5. **I4** — treat missing `data.username`/`data.roles` as connection errors instead of storing empty values.
6. Suggestions S1–S6 are nice-to-haves — handle them at author discretion or defer to a follow-up.
