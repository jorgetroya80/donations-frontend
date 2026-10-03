# Show `requestId` on 5xx errors

Follow-up to [api-client-2.2.0.md](./api-client-2.2.0.md) (Phase 2).

## Context

Since API 2.1.0, every ProblemDetail the API returns carries a `requestId` extension property.
It is the correlation id that `RequestIdFilter` puts in MDC, and it is the single value needed to
find every log event for a failed request (ADR-005 in `donations-api`). Today the frontend
ignores it.

**Requirement (Jorge, 2026-10-03):** show the `requestId` to the user when the error is a
**5xx**. Do **not** show it for the login lockout (too many failed attempts).

The first version also showed it on a **400**. The browser check (task 4) changed this in two
steps. First, a 400 with `fields` stopped showing it. Then the rule became 5xx only, and a 400
with `fields` no longer shows the page-level "Validation failed" alert at all, because the
field errors already appear under each input.

### How errors reach the UI today

- **`getProblemMessage(err, fallback)`** (`src/lib/get-problem-message.ts`) is the single place
  that turns a ProblemDetail into text. It has 20 call sites across 15 pages (list/edit/create
  pages, dashboard, reports, donor picker). Each renders the result inside an `Alert`.
- Mutations use `throwOnError: true`, so the thrown `err` *is* the parsed ProblemDetail body.
  Spring serializes `status`, so `err.status` is available. `change-password-page.tsx:57`
  already relies on that.
- **Form 400s** go through two paths at once. `parseApiFieldErrors` maps `fields` onto inputs,
  and the page's `Alert` shows `getProblemMessage(mutation.error, …)`. The id belongs in the
  `Alert`, not under each field.
- **Login** (`login-page.tsx`) does not use `getProblemMessage`. It calls `sdkLogin` without
  `throwOnError` and maps the status itself:
  - 401: invalid credentials, or the lockout hint after `LOCKOUT_THRESHOLD`.
  - 400: blank credentials.
  - anything else: `auth.errorConnection`.
- **Change password** (`change-password-page.tsx`) also maps its own messages: 400 means the
  current password is wrong, and anything else is `settings.errorChanging`.

### Which statuses the API returns

| Status | Source in the API                                                                            | Shows id? |
| ------ | -------------------------------------------------------------------------------------------- | --------- |
| 400    | Validation with `fields` (`MethodArgumentNotValid`, `ConstraintViolation`). The alert is hidden as well | no        |
| 400    | Malformed body, `IllegalArgument` (no `fields`)                                              | no        |
| 401    | Unauthenticated, bad credentials, **lockout** (`LockedException` is an `AuthenticationException`) | no        |
| 403    | `AccessDeniedException`                                                                      | no        |
| 404    | Not found                                                                                    | no        |
| 409    | `IllegalStateException` (conflict, for example duplicate DNI)                                 | no        |
| 500    | Unhandled exception                                                                          | **yes**   |
| 502/503/504 | Render/nginx proxy, not the API, so no ProblemDetail and no `requestId`                 | n/a       |

The lockout is a **401**, so the "5xx only" rule already excludes it. No special case is
needed for it.

## Decisions

- **Implement it in `getProblemMessage` and leave the 20 call sites unchanged.** The function
  appends the reference when `requestId` is present and `status >= 500`.
  Every page that already shows a ProblemDetail gets it automatically, and the CLAUDE.md rule
  "no new parsing" still holds because this extends the existing parser.
- **Read the label from i18n inside the function.** It imports the `i18n` instance from
  `src/lib/i18n.ts` and calls `i18n.t('errors.withReference', { message, requestId })`. The
  signature stays `(err, fallback) => string`. The alternative, a hook or a `t` parameter,
  would mean editing all 20 call sites to gain nothing.
- **Copy:** `"errors.withReference": "{{message}} (Ref.: {{requestId}})"`. Show the full UUID,
  because a shortened id cannot be searched in the logs.
- **Show the id only when the API sent one.** Proxy 5xx responses and network errors keep
  today's fallback text unchanged.
- **Leave login alone.** The lockout is a 401 and is out of scope by definition. Login's 400
  (blank credentials) does not go through `getProblemMessage` either, and it does not show the
  id (resolved question 1).
- **Leave change password alone.** Its 400 is "wrong current password", a credential error
  like the lockout, so it does not show the id (resolved question 2).
- **Hide the alert on a 400 with field errors.** A new helper, `hasApiFieldErrors(err)` in
  `parse-api-field-errors.ts`, reuses `parseApiFieldErrors`. The 8 create/edit pages for
  donors, donations, expenses and users render the `Alert` only when it is false.

## Files

| File                                  | Change                                                           |
| ------------------------------------- | ---------------------------------------------------------------- |
| `src/lib/get-problem-message.ts`      | add `status` and `requestId` to the schema, append the reference  |
| `src/lib/get-problem-message.test.ts` | cases for 500/503 with an id, 400/401/404/409 with an id, and no id |
| `src/lib/parse-api-field-errors.ts` (+ test) | `hasApiFieldErrors`                                    |
| 8 `*-create-page.tsx` / `*-edit-page.tsx` | hide the `Alert` when `hasApiFieldErrors(mutation.error)` |
| `src/features/donors/donor-create-page.test.tsx` | a 400 with `fields` shows the field error and no alert |
| `src/locales/es.json`                 | `errors.withReference`                                           |
| `src/features/donations/donation-create-page.test.tsx` (or the closest existing page test) | one integration case: a 500 with `requestId` shows the reference in the `Alert` |

No new component and no new dependency.

## Dependency graph

```
es.json key ── getProblemMessage (+ unit tests) ── page integration test ── browser check
```

This is one vertical slice and one PR.

## Risks

| Risk                                                                   | Impact | Mitigation                                                                                           |
| ---------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------- |
| A form 400 shows "Validation failed (Ref.: …)" in the `Alert` next to the field errors | Resolved | The browser check showed it. Jorge decided (2026-10-03) on 5xx only (`a89c27e`) and on hiding the alert when there are `fields` (`0c71335`). |
| An API field name that matches no form input leaves the error invisible once the alert is hidden | Low    | The API's field names come from the same DTOs the forms are built from. If it ever happens, show unmapped fields in the alert. |
| `getProblemMessage` imports the `i18n` singleton, so it is no longer a pure function | Low    | `i18n.ts` initializes synchronously with bundled `es.json`. The unit tests import it as-is.          |
| `err.status` is missing on some error shape                            | Low    | Without a status the reference is not shown, so it fails safe.                                       |
| The detail text is English ("Validation failed", "Internal server error") | n/a    | This already happens today and is out of scope. Noted only.                                          |

## Resolved questions (Jorge, 2026-10-03)

1. **Login 400 (blank credentials):** no id. It is user input that the form already prevents
   (`required`), it is a credential flow like the lockout, and the page uses its own Spanish
   messages, not ProblemDetail.
2. **Change password 400 (wrong current password):** no id, for the same reason. It is a
   credential error and the message is clear on its own.

Both pages stay untouched. They do not call `getProblemMessage`, so the change cannot reach
them.
