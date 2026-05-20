# Plan: Cancel In-Flight GET Requests on Route Change

> Source PRD: `docs/PRD-cancel-inflight-requests.md` / Issue #106

## Architectural decisions

- **No new abstractions**: signal threading is a one-line change per `queryFn` — no wrapper utility needed
- **Cancellation layer**: query hooks only (`src/features/*/use-*.ts`) — components and router untouched
- **Mutations excluded**: POST/PUT hooks unchanged
- **API client unchanged**: `src/lib/api.ts` — ky accepts `signal` per-request, no client-level change needed
- **Error handling**: React Query v5 treats `AbortError` as cancelled (not error) — no UI error state changes needed

---

## Phase 1: Wire AbortSignal to all read queries

**User stories**: 1–9, 11, 12

### What to build

Thread the `signal` from `QueryFunctionContext` into every `useQuery` call across all six feature hook files. When the user navigates away, React Query aborts the signal, ky forwards it to `fetch`, and the browser cancels the in-flight request. No component changes. No router changes. No API client changes.

### Acceptance criteria

- [ ] Navigating away from Donations, Donors, Expenses, Users, Dashboard, Reports while a GET is in flight shows `(cancelled)` in browser Network tab
- [ ] No error toast or error state appears after cancellation
- [ ] Create/update mutations (POST/PUT) complete normally after navigation
- [ ] `pnpm run check` passes

---

## Phase 2: Test coverage

**User stories**: 10 (developer — mutations unaffected), 11 (developer — consistent behavior across routes)

### What to build

Unit tests for each modified query hook verifying: (a) the signal is passed to the HTTP client, and (b) aborting the signal does not produce an error state in the query. Follow existing test patterns in `src/features/*/`.

### Acceptance criteria

- [ ] Each modified hook has a test that aborts the query signal and asserts no error state
- [ ] Each modified hook has a test confirming the HTTP client receives the signal
- [ ] `pnpm run test` passes
