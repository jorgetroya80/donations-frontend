# PRD-3: Role-Based Sidebar and Route Access

## Problem Statement

Currently, the sidebar displays all navigation items to all authenticated users regardless of their role. Only the "Users" item is hidden for non-admins. This means a PASTOR can see Donations, Donors, and Expenses links even though they shouldn't access those features. Similarly, an ADMIN can see Donations, Expenses, and Reports even though their role is limited to user management. There is also no route-level enforcement — users can navigate directly via URL to features their role doesn't permit.

## Solution

Filter sidebar navigation items based on the authenticated user's role using the existing permission functions in `permissions.ts`. Additionally, enforce access at the route level so that direct URL navigation to unauthorized features redirects the user to the dashboard. Users with multiple roles see the union of all permitted features.

### Role-to-Feature Mapping

| Feature | ADMIN | TREASURER | PASTOR | OPERATOR |
|---|---|---|---|---|
| Dashboard | Yes | Yes | Yes | Yes |
| Donations (list, create, edit) | No | Yes | No | Yes |
| Donors (list, create, edit) | No | Yes | No | Yes |
| Expenses (list, create, edit) | No | Yes | No | Yes |
| Reports | No | Yes | Yes | No |
| Users (list, create, edit) | Yes | No | No | No |
| Settings / Change Password | Yes | Yes | Yes | Yes |

## User Stories

1. As an ADMIN, I want to see only Dashboard and Users in the sidebar, so that I'm not distracted by features I can't access.
2. As a TREASURER, I want to see Dashboard, Donations, Donors, Expenses, and Reports in the sidebar, so that I can access all financial features.
3. As a PASTOR, I want to see only Dashboard and Reports in the sidebar, so that I can review financial summaries without accessing raw data entry.
4. As an OPERATOR, I want to see Dashboard, Donations, Donors, and Expenses in the sidebar, so that I can enter financial data without accessing reports or user management.
5. As a user with multiple roles (e.g., ADMIN + TREASURER), I want to see the union of all nav items my roles grant, so that I have full access to everything my combined roles allow.
6. As an ADMIN, I want to be redirected to the dashboard if I navigate to /donations via URL, so that unauthorized access is blocked at the route level.
7. As a PASTOR, I want to be redirected to the dashboard if I navigate to /expenses via URL, so that I cannot bypass sidebar restrictions.
8. As an OPERATOR, I want to be redirected to the dashboard if I navigate to /reports via URL, so that I cannot access reports I'm not authorized to view.
9. As an ADMIN, I want to be redirected to the dashboard if I navigate to /reports via URL, so that route-level access matches my role permissions.
10. As any authenticated user, I want to always see the Dashboard and Settings/Change Password, so that basic navigation and account management are always available.
11. As a user whose role changes, I want the sidebar to reflect my updated permissions on next login, so that access stays current.

## Implementation Decisions

- **Permission functions as single source of truth**: The existing `canRecordData`, `canViewReports`, and `canManageUsers` functions in `permissions.ts` drive both sidebar visibility and route guards. No separate role mapping needed.
- **Update `canRecordData`**: Remove ADMIN from `canRecordData` — ADMIN role is restricted to user management only.
- **Sidebar `NavItem` interface change**: Replace `adminOnly?: boolean` with `visible?: (user) => boolean`. When `visible` is undefined, the item is shown to all roles. When defined, the function is called with the current user to determine visibility.
- **Generic `RoleRoute` component**: Create a single reusable route guard component that accepts a permission check function (`check` prop). This replaces the existing `AdminRoute` pattern. `AdminRoute` can be refactored to use `RoleRoute` or replaced entirely.
- **Route wrapping in `App.tsx`**: Wrap donation/donor/expense routes with `RoleRoute check={canRecordData}`, reports routes with `RoleRoute check={canViewReports}`, and user routes with `RoleRoute check={canManageUsers}`.
- **Redirect behavior**: Unauthorized route access redirects to `/` (dashboard) using `<Navigate to="/" replace />`, consistent with existing `AdminRoute` behavior.
- **Multi-role support**: Permission functions already use `hasRole` with `includes()`, which naturally supports users with multiple roles (union of permissions).
- **Features hidden, not read-only**: If a role can't access a feature, the sidebar item is completely hidden — no read-only mode.

## Testing Decisions

- **Good tests**: Test external behavior (what the user sees/where they're redirected), not implementation details (which function was called).
- **Sidebar tests**: Render the sidebar with different user roles via localStorage (`auth_user`), assert which nav items are present/absent. Cover all 4 roles and one multi-role combination.
- **RoleRoute tests**: Follow existing `AdminRoute` test pattern — render with route, assert child renders for authorized roles and redirects for unauthorized roles. Test with `canRecordData`, `canViewReports`, and `canManageUsers`.
- **Prior art**: `src/features/users/admin-route.test.tsx` and `src/features/auth/protected-route.test.tsx` — use `renderWithProviders` from `src/test/test-utils.ts`, set roles via localStorage, assert DOM content.

## Out of Scope

- Backend role enforcement (API-level authorization) — assumed already handled by the backend.
- Dynamic role changes during a session (roles update on next login only).
- Permission management UI (creating/editing roles).
- Granular per-action permissions within features (e.g., can view donations but not delete).
- Dashboard content customization per role (dashboard always shown to all roles).

## Further Notes

- The Settings / Change Password route is available to all authenticated users and doesn't appear in the sidebar (accessed via user menu), so it's unaffected by this change.
- If new features are added in the future, they should define a `visible` function on their nav item and wrap their routes with the appropriate `RoleRoute` guard.
