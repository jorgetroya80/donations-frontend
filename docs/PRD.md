# PRD: Church Donations Dashboard

## Problem Statement

A church needs a web-based admin dashboard to manage its financial operations — donations, expenses, donors, and users. The backend API (Spring Boot, OpenAPI 3.1) already exists and runs on `localhost:8081`. There is no frontend consuming it. Church staff (admins, treasurers, pastors, operators) need a visual interface to perform CRUD operations, view financial reports, and manage their accounts.

## Solution

A single-page application (React 19 + Vite) that consumes the existing Church Donations API. The dashboard provides:

- Login and session management
- CRUD for donations, expenses, donors, and users
- Financial reports with charts (balance, donation summary, expense summary, donor statement)
- Role-based UI visibility (ADMIN-only user management)
- Change password and logout functionality

## User Stories

1. As a church staff member, I want to log in with my username and password, so that I can access the dashboard securely.
2. As a logged-in user, I want to see a home dashboard with balance summary cards (income, expenses, net balance) for the current month, so that I get a quick financial overview.
3. As a logged-in user, I want to change the dashboard date range, so that I can see financial summaries for different periods.
4. As a logged-in user, I want to see charts showing donations by type and expenses by category, so that I can understand financial distribution visually.
5. As a logged-in user, I want to navigate using a collapsible sidebar, so that I can access all sections while maximizing table space.
6. As a logged-in user, I want to view a paginated list of donations with sortable columns, so that I can browse donation records efficiently.
7. As a logged-in user, I want to filter donations by date range, so that I can find records for a specific period.
8. As a logged-in user, I want to create a new donation on a separate page, so that I can record incoming contributions.
9. As a logged-in user, I want to see a duplicate warning when creating a donation that may already exist, so that I avoid accidental double entries.
10. As a logged-in user, I want to confirm and save a flagged duplicate donation, so that I can override the warning when the donation is intentional.
11. As a logged-in user, I want to edit an existing donation on a separate page, so that I can correct mistakes.
12. As a logged-in user, I want to see a confirmation modal before submitting edits, so that I don't accidentally modify records.
13. As a logged-in user, I want to delete a donation with a confirmation modal, so that I don't accidentally remove records.
14. As a logged-in user, I want to view a paginated list of expenses with sortable columns and date filtering, so that I can browse expense records.
15. As a logged-in user, I want to create a new expense on a separate page, so that I can record church spending.
16. As a logged-in user, I want to edit an existing expense on a separate page with edit confirmation, so that I can correct expense records.
17. As a logged-in user, I want to delete an expense with a confirmation modal, so that I don't accidentally remove records.
18. As a logged-in user, I want to view a paginated list of donors with sortable columns, so that I can manage donor information.
19. As a logged-in user, I want to create a new donor on a separate page, so that I can register new contributors.
20. As a logged-in user, I want to edit a donor on a separate page with edit confirmation, so that I can update donor details.
21. As a logged-in user, I want to view a donation summary report (totals by type) for a selected date range, so that I can analyze income sources.
22. As a logged-in user, I want to view an expense summary report (totals by category) for a selected date range, so that I can analyze spending.
23. As a logged-in user, I want to view a donor statement for a specific donor and date range, so that I can see individual contribution history.
24. As a logged-in user, I want to change my password, so that I can keep my account secure.
25. As a logged-in user, I want to log out from a user dropdown menu, so that I can end my session.
26. As an admin, I want to view a paginated list of users, so that I can manage system access.
27. As an admin, I want to create new users with username, password, and role assignments, so that I can grant system access.
28. As an admin, I want to edit users (change roles, activate/deactivate), so that I can manage permissions.
29. As a logged-in user, I want to see inline alert messages (success, error, warning) within pages, so that I know the result of my actions.
30. As a logged-in user, I want the interface in Spanish, so that I can use it in my native language.
31. As a logged-in user, I want my session to persist across page refreshes, so that I don't have to log in repeatedly.
32. As a logged-in user, I want to be redirected to login when my session expires (401), so that I know I need to re-authenticate.
33. As a logged-in user, I want quick action buttons on the home dashboard (New Donation, New Expense), so that I can perform common tasks fast.

## Implementation Decisions

### Architecture & Stack

- **SPA**: React 19 + Vite 8, no SSR (dashboard behind auth, no SEO value)
- **React Compiler**: Enabled via babel-plugin-react-compiler (already configured)
- **Styling**: Tailwind CSS v4 (already configured)
- **Routing**: React Router v7
- **Data fetching**: TanStack Query for server state (caching, pagination, mutations)
- **HTTP client**: ky (lightweight fetch wrapper, `credentials: 'include'` for session cookies)
- **UI components**: shadcn/ui (Radix + Tailwind, copied into project)
- **Forms**: React Hook Form + Zod validation
- **Charts**: shadcn/ui charts (Recharts under the hood)
- **i18n**: react-i18next with single Spanish (`es`) JSON translation file
- **Dates**: dayjs
- **Currency**: EUR, `es-ES` locale formatting
- **Client state**: React Context (auth user, sidebar state)

### Project Structure (feature-based)

```
src/
  features/
    auth/        (login page, auth context, password change)
    dashboard/   (home page, balance cards, charts)
    donations/   (list, create, edit pages)
    donors/      (list, create, edit pages)
    expenses/    (list, create, edit pages)
    reports/     (tabs: donation summary, expense summary, donor statement)
    users/       (list, create, edit — admin only)
  components/ui/ (shadcn/ui primitives)
  lib/           (ky instance, api-types, query keys, utils)
  layouts/       (sidebar layout, auth layout)
  locales/       (es.json)
```

### Auth Strategy

- Session-based (cookie from backend), all requests use `credentials: 'include'`
- After login, store `{ username, roles }` in React Context + localStorage
- On refresh, rehydrate from localStorage; if API returns 401, clear state and redirect to login
- Keep token refresh mechanism in mind for future implementation
- Logout: clear localStorage + context, redirect to `/login`

### API Integration

- TypeScript types generated from OpenAPI spec via `openapi-typescript`
- Sync script: fetches spec from running backend + regenerates types
- Long-term plan: backend generates full JS client (not in scope now)
- Vite dev proxy: `/api` → `http://localhost:8081`
- Production: same domain (reverse proxy)

### Role-Based UI

- All authenticated users see: Dashboard, Donations, Donors, Expenses, Reports
- Only users with `ADMIN` role see: Users section
- Multi-role supported: check `roles.includes('ADMIN')`
- Backend enforces actual authorization; frontend role-gating is UX only

### Table Behavior

- Paginated (server-side via `Pageable` params)
- Sortable columns (via `sort` param)
- Date range filtering for donations and expenses
- No search (API doesn't support it)
- No bulk actions in v1

### Create/Edit UX

- Separate pages: `/donations/new`, `/donations/:id/edit`
- Confirmation modal before edit submission and before delete
- Duplicate donation flow: inline warning alert + "Confirm & Save" button resubmits with `confirmDuplicate: true`

### Notifications

- Inline alerts only (no toasts)
- Success, error, and warning alerts rendered within page content
- Form validation errors shown inline per field (React Hook Form + Zod)

### User Menu

- Dropdown in header/sidebar showing username
- Actions: "Change password" (navigates to `/settings/password`), "Logout"

## Testing Decisions

- Good tests verify external behavior (rendered output, navigation, API calls made) not implementation details (internal state, hook calls)
- Prioritize testing:
  - Auth flow (login, logout, 401 redirect, session persistence)
  - Donation create with duplicate warning flow (multi-step interaction)
  - Form validation (Zod schemas match API constraints)
  - Role-based visibility (ADMIN sees users section, others don't)
- Testing tools: Vitest + React Testing Library
- API mocking: MSW (Mock Service Worker) for intercepting ky requests

## Out of Scope

- Server-side rendering / Next.js migration
- Search/full-text filtering (API doesn't support it)
- Bulk actions (multi-select delete, etc.)
- Email notifications
- PDF export of reports
- Dark mode
- Multi-language beyond Spanish (i18n wired up but only `es.json` provided)
- Token refresh mechanism (kept in mind but not implemented)
- Backend-generated JS client (long-term plan)
- Mobile-specific responsive design (desktop-first admin panel)

## Further Notes

- The backend API is a Spring Boot application that auto-generates the OpenAPI spec
- DNI/NIE fields on donors are Spanish national identification numbers
- Donation types: TITHE, OFFERING, SPECIAL_OFFERING, OTHER
- Expense categories: RENT, UTILITIES, SALARIES, SUPPLIES, MISSIONS, MAINTENANCE, OTHER
- Payment methods: CASH, BANK_TRANSFER
- User roles: ADMIN, TREASURER, PASTOR, OPERATOR (users can have multiple)
