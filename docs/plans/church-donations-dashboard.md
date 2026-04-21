# Plan: Church Donations Dashboard

## Architectural decisions

Durable decisions that apply across all phases:

- **Routes**:
  - `/login` — public
  - `/` — dashboard home (balance + charts)
  - `/donations` — list
  - `/donations/new` — create
  - `/donations/:id/edit` — edit
  - `/donors` — list
  - `/donors/new` — create
  - `/donors/:id/edit` — edit
  - `/expenses` — list
  - `/expenses/new` — create
  - `/expenses/:id/edit` — edit
  - `/users` — list (ADMIN only)
  - `/users/new` — create (ADMIN only)
  - `/users/:id/edit` — edit (ADMIN only)
  - `/reports` — tabbed (donation summary, expense summary, donor statement)
  - `/settings/password` — change password
- **Auth**: Session cookies, `credentials: 'include'`, user context + localStorage persistence, 401 → redirect to login
- **Key models**: Donation, Donor, Expense, User, Balance, DonationSummary, ExpenseSummary, DonorStatement
- **API base**: `/api` proxied to backend (Vite dev proxy, reverse proxy in prod)
- **i18n**: Single `es.json` translation file, react-i18next
- **UI pattern**: shadcn/ui primitives, feature-based folder structure, inline alerts (no toasts), confirmation modals for destructive actions
- **Data fetching**: TanStack Query for all server state, ky as HTTP client
- **Forms**: React Hook Form + Zod, validation mirrors API constraints
- **Tables**: Server-side pagination + sorting via Pageable params
- **Testing**: Vitest + jsdom + React Testing Library + msw (Mock Service Worker)
  - Test files colocated: `component.tsx` → `component.test.tsx`
  - Coverage: 70% for Phases 1–3 backfill, 90% for Phase 4+
  - Test all layers: components, hooks, utils, permissions
  - API mocking via msw at network level (no manual vi.mock on ky)
  - Scripts: `npm test` (single run), `npm run test:watch` (dev), `npm run test:coverage`

---

## Phase 1: Foundation + Auth ✅

**User stories**: 1, 31, 32

### What to build

Thinnest end-to-end slice: login page → POST `/api/v1/login` → store session in context + localStorage → redirect to a protected placeholder page → on 401 response, clear state and redirect back to login. Includes: ky instance configured with `credentials: 'include'` and 401 interceptor, AuthContext provider, protected route wrapper, React Router setup, Vite proxy config.

### Acceptance criteria

- [ ] Login page with username/password form and inline error alert on failure
- [ ] Successful login stores `{ username, roles }` in context and localStorage
- [ ] Protected routes redirect unauthenticated users to `/login`
- [ ] On page refresh, session rehydrates from localStorage
- [ ] Any API 401 response clears auth state and redirects to `/login`
- [ ] Vite proxy forwards `/api` requests to `localhost:8081`

---

## Phase 2: Layout + Navigation ✅

**User stories**: 5, 30

### What to build

App shell with collapsible sidebar, header with user dropdown menu, and i18n wiring. Sidebar shows navigation links (Dashboard, Donations, Donors, Expenses, Reports, Users — last one visible only if user has ADMIN role). User dropdown in header shows username, with placeholder actions for "Change password" and "Logout". All visible text pulled from `es.json`.

### Acceptance criteria

- [ ] Collapsible sidebar with navigation links to all sections
- [ ] Users link only visible when `roles.includes('ADMIN')`
- [ ] Sidebar collapse state persists (context or localStorage)
- [ ] Header shows logged-in username with dropdown menu
- [ ] react-i18next configured, all UI strings in `es.json`
- [ ] Layout wraps all protected routes

---

## Phase 3: Dashboard Home ✅

**User stories**: 2, 3, 4, 33

### What to build

Home page at `/` with role-based widget composition. ADMIN role lacks backend permission for `/api/v1/reports/*`, so dashboard shows different widgets per role:

- **FinancialOverview** (TREASURER, PASTOR) — balance cards + charts + date range picker. Fetches from `/api/v1/reports/balance`, `/api/v1/reports/donations`, `/api/v1/reports/expenses`.
- **UserStats** (ADMIN) — total registered users card + link to manage users. Fetches from `GET /api/v1/users?page=0&size=1`.
- **QuickActions** (OPERATOR, TREASURER, ADMIN) — New Donation, New Expense, View Donors buttons.
- Multi-role users see all applicable widgets merged.

Permission helpers in `src/lib/permissions.ts`: `canViewReports`, `canManageUsers`, `canRecordData`.

### Acceptance criteria

- [x] Role-based dashboard composition using permission helpers
- [x] TREASURER/PASTOR: 3 summary cards, date range picker, charts
- [x] ADMIN: user stats card with manage users link
- [x] OPERATOR/TREASURER/ADMIN: quick action buttons
- [x] Multi-role users see merged widgets
- [x] Loading and error states shown as inline alerts

---

## Phase 3.5: Testing Setup + Backfill

**Prerequisite for Phase 4**

### What to build

Install and configure testing infrastructure (Vitest + jsdom + React Testing Library + msw). Backfill tests for critical paths in Phases 1–3. Target: 70% coverage on existing code.

### Setup

- Install: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`, `msw`
- Configure `vitest.config.ts` with jsdom environment, path aliases, setup file
- Create test setup file: RTL cleanup, jest-dom matchers
- Create msw handlers for auth + reports + users endpoints
- Add npm scripts: `test`, `test:watch`, `test:coverage`

### Backfill tests (70% target)

- `src/lib/permissions.ts` — all role check combinations
- `src/features/auth/auth-context.tsx` — login, logout, rehydration, 401 handling
- `src/features/auth/login-page.tsx` — form submission, error display, redirect on success
- `src/features/auth/protected-route.tsx` — redirect when unauthenticated
- `src/features/dashboard/dashboard-page.tsx` — widget composition per role
- `src/features/dashboard/use-dashboard-data.ts` — hooks return correct data from msw
- `src/features/dashboard/use-user-stats.ts` — hook returns total users

### Acceptance criteria

- [ ] Vitest runs with `npm test`, all tests pass
- [ ] msw handlers mock auth, reports, and users endpoints
- [ ] Permission helpers: 100% coverage (pure functions)
- [ ] Auth context: login/logout/rehydration tested
- [ ] Dashboard page: renders correct widgets per role
- [ ] Overall coverage ≥ 70%

---

## Phase 4: Donations CRUD

**User stories**: 6, 7, 8, 9, 10, 11, 12, 13, 29

### What to build

Full donations vertical slice: paginated table at `/donations` with sortable columns and date range filter, create page at `/donations/new` with Zod-validated form (amount, date, type, payment method, donor, notes), duplicate warning flow (inline alert + confirm & save), edit page at `/donations/:id/edit` with confirmation modal, delete with confirmation modal. Inline alerts for success/error feedback.

### Acceptance criteria

- [ ] Paginated table with server-side pagination controls
- [ ] Sortable columns (click header to toggle sort)
- [ ] Date range filter (from/to) filters the list
- [ ] Create form validates required fields (amount >= 0.01, date, type, payment method)
- [ ] Donor field is optional, selectable from existing donors
- [ ] On duplicate warning response: inline alert shown, "Confirm & Save" resubmits with `confirmDuplicate: true`
- [ ] Edit page loads existing donation, confirmation modal before save
- [ ] Delete triggers confirmation modal, removes on confirm
- [ ] Inline success/error alerts after mutations

### Testing (90% coverage for new code)

- [ ] Donations table: renders rows, pagination controls, sort triggers
- [ ] Create form: validation errors, successful submission, duplicate warning flow
- [ ] Edit form: loads existing data, confirmation modal, save
- [ ] Delete: confirmation modal, removes item
- [ ] msw handlers for `GET/POST/PUT/DELETE /api/v1/donations`

---

## Phase 5: Donors CRUD

**User stories**: 18, 19, 20

### What to build

Donors management: paginated table at `/donors` with sortable columns, create page at `/donors/new` (fullName, dniNie required; email, phone, address optional), edit page at `/donors/:id/edit` with confirmation modal. Same patterns established in Phase 4.

### Acceptance criteria

- [ ] Paginated, sortable donors table
- [ ] Create form validates required fields (fullName, dniNie)
- [ ] Edit page with confirmation modal before save
- [ ] Active/inactive status visible and editable
- [ ] Inline alerts for success/error

### Testing (90% coverage for new code)

- [ ] Donors table: renders rows, pagination, sort
- [ ] Create form: validation (fullName, dniNie required), submission
- [ ] Edit form: loads data, confirmation modal, save
- [ ] msw handlers for `GET/POST/PUT /api/v1/donors`

---

## Phase 6: Expenses CRUD

**User stories**: 14, 15, 16, 17

### What to build

Expenses management: paginated table at `/expenses` with sortable columns and date range filter, create page at `/expenses/new` (amount, date, category, description, paymentMethod required; vendor optional), edit page at `/expenses/:id/edit` with confirmation modal, delete with confirmation modal.

### Acceptance criteria

- [ ] Paginated, sortable expenses table with date range filter
- [ ] Create form validates required fields (amount >= 0.01, date, category, description, paymentMethod)
- [ ] Category and paymentMethod are selectable from enum values
- [ ] Edit page with confirmation modal before save
- [ ] Delete with confirmation modal
- [ ] Inline alerts for success/error

### Testing (90% coverage for new code)

- [ ] Expenses table: renders rows, pagination, sort, date filter
- [ ] Create form: validation (amount, date, category, description, paymentMethod), submission
- [ ] Edit form: loads data, confirmation modal, save
- [ ] Delete: confirmation modal, removes item
- [ ] msw handlers for `GET/POST/PUT/DELETE /api/v1/expenses`

---

## Phase 7: Users Management (Admin)

**User stories**: 26, 27, 28

### What to build

Admin-only users section: paginated table at `/users`, create page at `/users/new` (username, password min 8 chars, at least 1 role), edit page at `/users/:id/edit` (change roles, activate/deactivate). Route-level guard redirects non-ADMIN users away.

### Acceptance criteria

- [ ] Route accessible only to users with ADMIN role
- [ ] Non-admin navigating to `/users` gets redirected
- [ ] Paginated, sortable users table showing username, roles, active status
- [ ] Create form validates username, password (min 8), at least one role selected
- [ ] Edit page allows role changes and active/inactive toggle
- [ ] Confirmation modal before save
- [ ] Inline alerts for success/error

### Testing (90% coverage for new code)

- [ ] Route guard: non-ADMIN redirected away
- [ ] Users table: renders rows, pagination, sort
- [ ] Create form: validation (username, password min 8, at least 1 role)
- [ ] Edit form: role changes, active toggle, confirmation modal
- [ ] msw handlers for `GET/POST/PUT /api/v1/users`

---

## Phase 8: Reports

**User stories**: 21, 22, 23

### What to build

Reports page at `/reports` with tabs: Donation Summary (totals by type for date range), Expense Summary (totals by category for date range), Donor Statement (select donor + date range, shows individual donation history with total). Each tab has its own date range picker. Donor statement tab has a donor selector.

### Acceptance criteria

- [ ] Tabbed interface with 3 report types
- [ ] Donation summary shows totals by type (TITHE, OFFERING, etc.) and grand total
- [ ] Expense summary shows totals by category and grand total
- [ ] Donor statement shows donor picker, date range, list of donations, and total
- [ ] All reports support date range filtering
- [ ] Loading and error inline alerts

### Testing (90% coverage for new code)

- [ ] Tab switching renders correct report
- [ ] Donation summary: date range filtering, totals display
- [ ] Expense summary: date range filtering, totals display
- [ ] Donor statement: donor selector, date range, donation list
- [ ] msw handlers for report endpoints

---

## Phase 9: User Account (Password + Logout)

**User stories**: 24, 25

### What to build

Change password page at `/settings/password` (current password + new password min 8 chars, confirm new password). Logout action in user dropdown: clears localStorage, clears auth context, redirects to `/login`.

### Acceptance criteria

- [ ] Change password form with current password and new password fields
- [ ] Client-side validation: new password min 8 characters
- [ ] Inline success/error alert after submission
- [ ] Logout clears all auth state and redirects to `/login`
- [ ] User dropdown links work (Change password navigates, Logout executes)

### Testing (90% coverage for new code)

- [ ] Change password form: validation (min 8 chars, confirm match), submission
- [ ] Logout: clears auth state, redirects to /login
- [ ] msw handlers for `PUT /api/v1/users/me/password`
