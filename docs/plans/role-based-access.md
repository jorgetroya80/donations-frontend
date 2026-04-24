# Plan: Role-Based Sidebar and Route Access

> Source PRD: docs/PRD-3.md (GitHub issue #8)

## Architectural decisions

- **Roles**: `ADMIN | TREASURER | PASTOR | OPERATOR` (unchanged)
- **Permission functions** (`permissions.ts`): Single source of truth for access control — `canRecordData`, `canViewReports`, `canManageUsers`
- **Route guard pattern**: Generic `RoleRoute` component accepting a `check: (user) => boolean` prop, redirects to `/` on failure
- **Sidebar pattern**: `NavItem.visible?: (user) => boolean` — undefined means visible to all
- **Multi-role**: Union of permissions (already supported by `hasRole` using `includes()`)
- **Unauthorized access**: Redirect to `/` (dashboard) with `replace`

### Role-to-Feature Matrix

| Feature | ADMIN | TREASURER | PASTOR | OPERATOR |
|---|---|---|---|---|
| Dashboard | Yes | Yes | Yes | Yes |
| Donations | No | Yes | No | Yes |
| Donors | No | Yes | No | Yes |
| Expenses | No | Yes | No | Yes |
| Reports | No | Yes | Yes | No |
| Users | Yes | No | No | No |
| Settings | Yes | Yes | Yes | Yes |

---

## Phase 1: Permissions Update + Route Guards

**User stories**: 6, 7, 8, 9, 10

### What to build

Update `canRecordData` to exclude ADMIN. Create a generic `RoleRoute` component that accepts a permission check function and redirects unauthorized users to the dashboard. Replace the existing `AdminRoute` with `RoleRoute`. Wrap donation/donor/expense routes with `canRecordData`, reports routes with `canViewReports`, and user routes with `canManageUsers` in the route tree.

### Acceptance criteria

- [ ] `canRecordData` returns `false` for ADMIN-only users
- [ ] `RoleRoute` component created, accepts `check` prop
- [ ] `AdminRoute` replaced by `RoleRoute` with `canManageUsers`
- [ ] `/donations`, `/donations/new`, `/donations/:id/edit` guarded by `canRecordData`
- [ ] `/donors`, `/donors/new`, `/donors/:id/edit` guarded by `canRecordData`
- [ ] `/expenses`, `/expenses/new`, `/expenses/:id/edit` guarded by `canRecordData`
- [ ] `/reports` guarded by `canViewReports`
- [ ] `/users`, `/users/new`, `/users/:id/edit` guarded by `canManageUsers`
- [ ] Dashboard (`/`) and Settings (`/settings/password`) accessible to all authenticated users
- [ ] Unauthorized route access redirects to `/`
- [ ] Multi-role users (e.g., ADMIN + TREASURER) can access union of permitted routes
- [ ] `RoleRoute` tests: authorized renders child, unauthorized redirects — for each permission function
- [ ] Existing `AdminRoute` tests migrated or replaced
- [ ] All existing tests pass

---

## Phase 2: Sidebar Role Filtering + Tests

**User stories**: 1, 2, 3, 4, 5, 11

### What to build

Update the sidebar `NavItem` interface to replace `adminOnly` with a `visible` callback. Add `visible` functions to nav items using the permission functions. Update the sidebar filter logic to use the new `visible` prop. Write tests verifying each role sees the correct nav items.

### Acceptance criteria

- [ ] `NavItem` interface uses `visible?: (user) => boolean` instead of `adminOnly?: boolean`
- [ ] Dashboard nav item has no `visible` (always shown)
- [ ] Donations, Donors, Expenses nav items use `canRecordData`
- [ ] Reports nav item uses `canViewReports`
- [ ] Users nav item uses `canManageUsers`
- [ ] Sidebar filter logic uses `item.visible?.(user)` pattern
- [ ] ADMIN sees: Dashboard, Users
- [ ] TREASURER sees: Dashboard, Donations, Donors, Expenses, Reports
- [ ] PASTOR sees: Dashboard, Reports
- [ ] OPERATOR sees: Dashboard, Donations, Donors, Expenses
- [ ] ADMIN + TREASURER sees: Dashboard, Donations, Donors, Expenses, Reports, Users
- [ ] Sidebar tests cover all 4 roles and one multi-role combination
- [ ] All existing tests pass
