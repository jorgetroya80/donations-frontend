# PRD: Display Server-Side Field Validation Errors in Donor Form

GitHub Issue: https://github.com/jorgetroya80/donations-frontend/issues/110

## Problem Statement

When a donor is submitted with invalid data (e.g. a national ID with an incorrect format), the API returns a structured 400 error response that includes per-field error messages. The frontend currently ignores this field-level detail and only shows a generic "Error saving" alert. The user has no way to know which field failed or what the problem is, forcing them to guess and re-submit.

Additionally, the donor edit form has a bug where the `nationalId` field value is not correctly passed to the API on save, meaning edits to the national ID field are silently dropped.

## Solution

Parse the server's structured validation error response and display each field-level error message inline — directly below the relevant input — consistent with how client-side (Zod) validation errors are already shown. If the server returns no field-level errors (e.g. a 500), fall back to the existing generic alert. Fix the national ID mapping bug in the edit flow at the same time.

## User Stories

1. As a treasurer, I want to see an inline error message under the National ID field when I enter an invalid format, so that I know exactly what to fix without guessing.
2. As a treasurer, I want to see inline error messages for any field the server rejects (name, national ID, email), so that I can correct all problems in a single round-trip.
3. As a treasurer, I want the inline server error message to look the same as a client-side validation error, so that the experience is consistent.
4. As a treasurer, I want the error message to disappear when I correct the field and re-submit, so that I know my fix was accepted.
5. As a treasurer, I want a generic error alert to appear only when the server returns an error with no field details (e.g. a 500), so that I am never left with a silent failure.
6. As a treasurer editing an existing donor, I want changes to the National ID field to be correctly saved to the server, so that donor records remain accurate.
7. As a treasurer editing an existing donor, I want server validation errors to appear inline in the form after I confirm the save dialog, so that I can correct them without losing my other edits.
8. As a treasurer editing an existing donor, I want the confirmation dialog to close when the server returns a validation error, so that I am returned to the form where the errors are shown.
9. As a developer, I want a shared utility that parses the API's structured error response, so that future forms can reuse the same logic without duplication.
10. As a developer, I want the `ApiValidationError` response shape typed in the shared API types file, so that the contract between frontend and backend is explicit and type-safe.

## Implementation Decisions

### Modules

- **`ApiValidationError` type** — added to the shared API types module. Captures the server's 400 error shape: `status`, `error`, `message`, `fields: Record<string, string>`, and `timestamp`.

- **`parseApiFieldErrors` utility** — new standalone function in the shared lib. Accepts an unknown caught error, checks if it is an `HTTPError` from the HTTP client (Ky), parses the response body as `ApiValidationError`, and returns the `fields` map. Returns an empty object for all other error types. Designed to be reused by any page that calls a mutation.

- **`DonorForm` component** — gains a new optional `serverErrors` prop (`Record<string, string>`). Internally, a `useEffect` watches this prop and calls `setError` on the react-hook-form instance for each key, injecting server messages into the same error display pipeline used for client-side errors. No new UI code needed — existing error rendering handles both sources.

- **`DonorCreatePage`** — wraps `mutateAsync` in try/catch. On catch, calls `parseApiFieldErrors` and stores the result in local state, which is passed as `serverErrors` to `DonorForm`. Generic alert shown only when there is a mutation error AND no field-level errors were parsed.

- **`DonorEditPage`** — same try/catch pattern in the confirm-save handler. On error, closes the confirmation dialog and sets `serverErrors` state so the form displays them. Also fixes the bug where `nationalId` was read from the wrong property name when building the update request.

### Technical clarifications

- Server field keys match react-hook-form field names exactly (both use camelCase: `fullName`, `nationalId`, `email`). No key mapping needed.
- The `useEffect` in `DonorForm` re-runs whenever the `serverErrors` reference changes. Pages should pass a new object reference on each failed submission so the effect fires correctly.
- `mutateAsync` (TanStack Query) throws on non-2xx responses; the catch block is the correct intercept point. TanStack Query still sets `mutation.error` even when the error is caught from `mutateAsync`.
- The generic alert condition (`mutation.error && Object.keys(serverErrors).length === 0`) ensures the alert only appears for errors without field detail (network failures, 500s).

## Testing Decisions

**What makes a good test:** tests verify observable UI behavior — what the user sees — not internal implementation. Tests should not assert on state variables, prop names, or which hooks were called. They should render the component and assert on what appears in the DOM.

**Modules to test:**

- **`DonorForm`** — add a test that renders the form with a `serverErrors` prop containing a `nationalId` message and asserts the message appears in the DOM. Prior art: the existing `shows validation errors on empty submit` test in `donor-form.test.tsx` — same pattern, different trigger.

- **`parseApiFieldErrors`** — add unit tests: (1) returns `fields` map from a valid `HTTPError` with a 400 body; (2) returns empty object for a non-`HTTPError`; (3) returns empty object when response body is not valid JSON.

## Out of Scope

- Server error handling for other forms (donations, expenses, users) — those can adopt the shared utility independently.
- Translating server error messages on the client — messages are displayed as returned by the server.
- Showing multiple server errors per field — the server currently returns one message per field.
- Retaining server errors across re-renders without a new submission — errors clear naturally when the user re-submits.

## Further Notes

The `parseApiFieldErrors` utility is intentionally shallow: it does one thing (parse a Ky `HTTPError` body) and returns a plain object. It has no React dependency and can be unit-tested without rendering anything. This design makes it easy to reuse in any future form that needs the same behavior.
