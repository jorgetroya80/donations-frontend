# Plan: Migrate error handling to RFC 9457 ProblemDetail (issue #153)

## Context

API PR jorgetroya80/donations-api#45 (merged 2026-07-16, ADR-004) changed **every** 4xx/5xx response body from the custom `ErrorResponse` shape to RFC 9457 Problem Details (`application/problem+json`): `message`→`detail`, `error`→`title`, `timestamp` dropped, new `type`/`instance` fields. `status`, the `fields` validation map, and the `code: "PASSWORD_CHANGE_REQUIRED"` discriminator are **unchanged**. api-client **2.0.0** is already published to GitHub Packages. New server behavior: blank/whitespace login credentials return **400 with `fields`** instead of 401 (and no longer count toward lockout).

Exploration findings (why the change surface is small):

- No production code reads `.message`, `.error`, or `.timestamp` from an API error. Generic mutation alerts render hardcoded translated strings.
- [src/lib/api.ts:29-36](src/lib/api.ts:29) `isPasswordChangeRequired` reads only `body.code` — **unchanged on the wire, no logic change needed**.
- [src/lib/parse-api-field-errors.ts](src/lib/parse-api-field-errors.ts) validates only `{ fields }` — **still works as-is**.
- The generated client (checked at 1.10.0) exports no error types; errors are read ad hoc. After upgrading, check whether 2.0.0 exports a ProblemDetail type — if not, no new type is needed (nothing reads `detail`/`title` in production; per simplicity-first, don't add one).
- **Real gap**: [login-page.tsx:40](src/features/auth/login-page.tsx:40) only branches on 401. The browser `required` attribute accepts whitespace-only input, which the server now rejects with 400 → currently falls into the misleading "connection error" branch.
- Test fixtures use the old shape and must move to ProblemDetail so mocks match the real API.

## Tasks (vertical slices)

### Task 1 — Upgrade api-client to 2.0.0
- Bump `@jorgetroya80/donations-api-client` to `2.0.0` in `package.json`, `pnpm install`.
- Check `node_modules/@jorgetroya80/donations-api-client/dist/generated/types.gen.d.ts` for a ProblemDetail export (informational only).
- **Verify:** `pnpm run build` and `pnpm run test` — success DTOs unchanged per API PR, so both should stay green. Any type errors here mean unexpected client changes; surface them before continuing.

**Checkpoint 1:** build + existing tests green on 2.0.0.

### Task 2 — Migrate error fixtures/mocks to ProblemDetail shape
Swap `{ message, error, timestamp, status, ... }` fixtures for `{ type: "about:blank", title, status, detail, instance, ...extensions }` (keep `code` / `fields` extensions at top level):
- [src/lib/api.test.ts](src/lib/api.test.ts) — 403 rotation bodies (lines ~25-30, 48-53, 68-69, 117-121, 152-155).
- [src/lib/parse-api-field-errors.test.ts](src/lib/parse-api-field-errors.test.ts) — `fields` fixture and the no-fields fixture (`{ message: ... }` → `{ detail: ... }`).
- [src/features/donors/donor-form.test.tsx:118](src/features/donors/donor-form.test.tsx:118) — server `fields` rejection fixture.
- [src/features/settings/change-password-page.test.tsx:183](src/features/settings/change-password-page.test.tsx:183) — 403 body.
- [src/test/msw-handlers.ts](src/test/msw-handlers.ts) — give the bare login 401 and change-password 400 real `application/problem+json` bodies matching the new API.
- **No production-code changes expected in this task** — `isPasswordChangeRequired` and `parseApiFieldErrors` already only read unchanged fields. If a test fails after fixture migration, that's a real regression to fix.
- **Verify:** `pnpm run test` green; specifically the forced-rotation redirect tests and donor-form per-field error tests.

**Checkpoint 2:** full suite green with new-shape fixtures — proves rotation redirect and per-field display survive the wire change.

### Task 3 — Login: handle 400 for blank/whitespace credentials
- [src/features/auth/login-page.tsx](src/features/auth/login-page.tsx) `handleSubmit`: add a `response?.status === 400` branch before the generic error fallback → show the existing invalid-credentials message (no lockout counter increment — server no longer counts these). No new UI; reuse existing error rendering.
- Add MSW handler case: login with blank/whitespace credentials → 400 problem+json with `fields`.
- Add a test in [login-page.test.tsx](src/features/auth/login-page.test.tsx): whitespace-only submit shows invalid-credentials message, does not show connection error, does not advance lockout hint.
- **Verify:** `pnpm run test` green.

**Checkpoint 3 (end-to-end):** with the local fullstack env (docker-compose, API image tag `main` — must include PR #45), manually verify: bad password → invalid-credentials message; whitespace login → same (not "connection error"); expired-password user → redirect to `/settings/password`; donor form with invalid DNI → per-field server error under the field. Then `pnpm run check`.

## Files touched
`package.json`, `pnpm-lock.yaml`, `src/features/auth/login-page.tsx`, plus tests: `src/lib/api.test.ts`, `src/lib/parse-api-field-errors.test.ts`, `src/features/donors/donor-form.test.tsx`, `src/features/settings/change-password-page.test.tsx`, `src/features/auth/login-page.test.tsx`, `src/test/msw-handlers.ts`.

Explicitly **not** touched: `src/lib/api.ts`, `src/lib/parse-api-field-errors.ts` (both already compatible), other forms (`donation-form` etc. never had server-field wiring — out of scope per issue).

## Plan location
Saved in the repo at `docs/plans/problem-detail-errors.md` (per user request).
