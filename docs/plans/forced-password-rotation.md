# Forced Password Rotation Flow (Issue #129)

## Context

API repo `donations-api` shipped security hardening (PR #31, `security-lows`). Backend now:

- Returns `mustChangePassword: boolean` on `POST /api/v1/login` and on `UserResponse`.
- Returns `403 PASSWORD_CHANGE_REQUIRED` from any business endpoint if user must rotate but hasn't.
- Locks accounts after 5 failed logins for 15 min, but masks with generic `401` (anti-enumeration).

Frontend must let flagged users (seed admin, admin-provisioned, admin-reset accounts) reach only the change-password screen + logout, then resume the app on success. Without this, those users hit infinite 403 loops on every page.

**Scope**: Required items 1–3 from the issue + Recommended UX (lockout hint, admin badge).

**Blocker**: `@jorgetroya80/donations-api-client@1.7.0` has neither `mustChangePassword` on `LoginResponse` nor on `UserResponse`. Bump the client first; this plan assumes a new published version (call it `1.8.0`) is in place before implementation.

## Approach

### 0. Pre-req: bump API client
- Publish `@jorgetroya80/donations-api-client` with updated `LoginResponse` + `UserResponse` (both gain `mustChangePassword?: boolean`).
- `pnpm update @jorgetroya80/donations-api-client` in this repo.

### 1. AuthContext: track `mustChangePassword`
File: `src/features/auth/auth-context.tsx`

- Extend `AuthUser`: add `mustChangePassword: boolean`.
- Bump storage key to `auth_user_v2` (or migrate-on-read) so old shape from `auth_user` is discarded — avoids stale flag on returning users.
- Add `clearMustChangePassword()` setter on context so the change-password success path can flip the flag without forcing re-login.
- Update `auth-context.test.tsx` to cover the new field + clear action.

### 2. Login flow: branch on flag
File: `src/features/auth/login-page.tsx`

- After `sdkLogin` success: `login({ username, roles, mustChangePassword: data.mustChangePassword ?? false })`.
- If `mustChangePassword` → `navigate('/settings/password', { replace: true })`, else `navigate('/', { replace: true })`.
- Add 5-failed-login client counter: on `401` increment a ref or `useState` counter (reset on success). After 5th consecutive fail, show translated `auth.errorLockoutHint` ("too many attempts — try again in ~15 minutes") instead of generic invalid-credentials. Counter persists across re-renders but not across page reload (acceptable; this is a hint not a security control).
- Update `login-page.test.tsx` with: mustChangePassword=true → redirect to `/settings/password`; 5 consecutive 401s → lockout text.

### 3. Global 403 PASSWORD_CHANGE_REQUIRED handler
File: `src/lib/api.ts`

- In `afterResponse` hook, add a branch alongside the existing 401:
  - On `403`, clone response, parse JSON, check `code === 'PASSWORD_CHANGE_REQUIRED'`.
  - If so and current path ≠ `/settings/password`: update stored `auth_user_v2` to flip `mustChangePassword: true`, then `window.location.href = '/settings/password'`.
  - Exclude `/users/me/password` and `/logout` from this redirect (those endpoints must remain reachable).
- Avoid infinite redirect: skip when `window.location.pathname === '/settings/password'`.

### 4. ProtectedRoute: enforce rotation
File: `src/features/auth/protected-route.tsx`

- After auth check, if `user.mustChangePassword && location.pathname !== '/settings/password'` → `<Navigate to="/settings/password" replace />`.
- Belt-and-braces with the 403 hook: hook covers in-flight requests; route guard covers direct URL nav and tab restores.
- Update `protected-route.test.tsx` for redirect when flag is set.

### 5. Change-password page: clear flag on success
File: `src/features/settings/change-password-page.tsx`

- On `mutateAsync` success: call `clearMustChangePassword()` from AuthContext.
- If user came in via forced flow (`user.mustChangePassword` was true before submit), redirect to `/` after success toast. Otherwise keep current "show success, stay on page" behavior for normal voluntary change.
- Show a translated banner above the form when in forced mode explaining why they're here (`settings.forcedRotationNotice`).
- Reuse existing `change-password-schema.ts` and `use-change-password.ts` — no changes.
- Update `change-password-page.test.tsx`: forced mode → banner shown + redirect to `/` on success; voluntary mode → existing assertions still pass.

### 6. AppLayout/sidebar: hide nav under forced mode
File: `src/layouts/app-layout.tsx` (verify path during impl)

- If `user.mustChangePassword`, render the change-password screen without sidebar nav OR disable nav links — prevents the user trying to click around and getting 403'd. Keep logout reachable.

### 7. Users admin: pending-rotation badge
File: `src/features/users/users-page.tsx`

- After active/inactive badge, add a `<Badge variant="outline">` with translated `users.pendingRotation` when `u.mustChangePassword` is true.
- Update `use-users` types if needed (should flow through from API client bump).
- Optional: surface `mustChangePassword: true` in the "user created/reset" success toast in `user-form.tsx` so the admin knows the password is provisional. Confirm during impl.

### 8. MSW handlers + i18n
File: `src/test/msw-handlers.ts`

- Add `mustChangePassword: false` to login + users list mocks by default.
- Add a test-only username path (e.g. `must-rotate`) whose login returns `mustChangePassword: true`.
- Add a handler variant exporting a 403 PASSWORD_CHANGE_REQUIRED body for tests of the global hook.

File: `src/lib/i18n` (locale files)

- New keys: `auth.errorLockoutHint`, `settings.forcedRotationNotice`, `users.pendingRotation`. Add to all existing locales.

## Files to Modify

- `src/features/auth/auth-context.tsx` + test
- `src/features/auth/login-page.tsx` + test
- `src/features/auth/protected-route.tsx` + test
- `src/lib/api.ts`
- `src/features/settings/change-password-page.tsx` + test
- `src/layouts/app-layout.tsx`
- `src/features/users/users-page.tsx` (+ optional `user-form.tsx`)
- `src/test/msw-handlers.ts`
- i18n locale files

## Reuse (do not rewrite)

- `useChangePassword` hook — already does PUT `/api/v1/users/me/password` and propagates `status` on error.
- `changePasswordSchema` — already enforces min 8 chars + confirm match.
- Form a11y pattern (`aria-invalid` + `aria-describedby`) — copy as is.
- `Badge` component for the admin pending-rotation marker.

## Verification

1. **Unit**: `pnpm run test` — auth-context, login-page, protected-route, change-password-page tests must pass; new assertions cover forced flow + lockout hint + admin badge.
2. **Lint/format**: `pnpm run check`.
3. **Build**: `pnpm run build`.
4. **Manual (dev)**: `pnpm run dev` against API in `must_change_password=true` state for seed admin.
   - Log in as seed admin → land on `/settings/password` with forced banner; sidebar hidden/disabled.
   - Try navigating to `/donations` via URL bar → bounced back to `/settings/password`.
   - Submit valid new password → toast + redirected to `/`; sidebar back; subsequent API calls return 200.
   - Log in as normal user → land on `/` as today, no banner.
   - Force a 403 PASSWORD_CHANGE_REQUIRED mid-session (e.g. admin resets via second tab) → next API call triggers redirect to `/settings/password`.
   - 5 wrong passwords on login → lockout hint replaces generic error on 5th attempt.
   - As admin, visit `/users` → user flagged `must_change_password=true` shows pending-rotation badge.
