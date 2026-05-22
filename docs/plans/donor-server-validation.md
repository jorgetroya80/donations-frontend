# Plan: Donor Server-Side Field Validation Errors

> Source PRD: [docs/PRD-donor-server-validation.md](../PRD-donor-server-validation.md) · [GitHub Issue #110](https://github.com/jorgetroya80/donations-frontend/issues/110)

## Architectural decisions

- **No route changes** — all work is within existing donor create/edit routes
- **Error response shape**: `{ status, error, message, fields: Record<string, string>, timestamp }` — field keys match react-hook-form field names exactly (camelCase), no mapping needed
- **Error source**: Ky `HTTPError` — response body parsed once at the page level, never in the form component
- **Display strategy**: server errors injected into react-hook-form via `setError`, reusing existing field error UI — no new error display components
- **Fallback**: generic alert shown only when mutation fails with no parseable field errors (network failures, 500s)

---

## Phase 1: End-to-end error display on donor create

**User stories**: 1, 2, 3, 4, 5, 9, 10

### What to build

A complete vertical slice: server returns a 400 with field errors → page catches and parses them → form displays each error inline under the correct input.

Add a typed `ApiValidationError` interface that mirrors the server's error response shape. Build a standalone `parseApiFieldErrors` utility that extracts the `fields` map from a Ky `HTTPError` and returns an empty object for anything else.

Extend `DonorForm` with an optional `serverErrors` prop. When the prop changes, the form sets each entry as a field error using react-hook-form's `setError`, feeding into the existing inline error display. No new UI needed.

Wire up the donor create page: wrap the mutation call in try/catch, parse any error with the utility, store the result in state, pass it to the form. Keep the generic alert but show it only when there are no field-level errors.

### Acceptance criteria

- [ ] Submitting the create form with an invalid national ID shows the server's error message inline under the National ID input
- [ ] Submitting with multiple invalid fields shows each server error under its respective input
- [ ] Inline server errors look identical to client-side Zod validation errors
- [ ] After a server error, correcting and re-submitting clears the inline messages on success
- [ ] A 500 or network error (no `fields` in response) still shows the generic alert
- [ ] `parseApiFieldErrors` has unit tests: returns `fields` from a 400 HTTPError, returns `{}` for non-HTTPError, returns `{}` when body is not valid JSON
- [ ] `DonorForm` has a test: rendering with `serverErrors` prop shows the message in the DOM

---

## Phase 2: Edit flow + nationalId bug fix

**User stories**: 6, 7, 8

### What to build

Fix the existing bug where the national ID value is not correctly read when building the update request, causing edits to that field to be silently dropped.

Apply the same server error pattern to the edit flow. The edit page has a confirmation dialog before saving — on API error, the dialog closes and the form displays inline field errors, returning the user to an editable state with the problems highlighted.

Reuses the utility and form prop introduced in Phase 1 — no new infrastructure needed.

### Acceptance criteria

- [ ] Editing a donor's national ID and saving correctly persists the new value to the server
- [ ] Submitting an invalid national ID in the edit flow shows the server's error message inline under the field
- [ ] After a server validation error in the edit flow, the confirmation dialog is closed and the user is back on the form
- [ ] All other edit-form server errors (name, email) display inline under their respective inputs
- [ ] A 500 in the edit flow still shows the generic alert
