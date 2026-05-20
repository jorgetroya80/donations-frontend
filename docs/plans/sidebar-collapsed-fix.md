# Plan: Fix Collapsed Sidebar Icon Layout

> Source PRD: docs/PRD-sidebar-collapsed-fix.md · GitHub issue #102

## Architectural decisions

- **Component scope**: Single component — Sidebar. No route, schema, or API changes.
- **Tooltip library**: base-ui `@base-ui/react/tooltip` — render prop API, not `asChild`.
- **Tailwind version**: v4 — prefer `flex flex-col gap-*` over `space-y-*` for explicit stacking.
- **Expanded state**: Untouched. Only collapsed rendering branch is modified.

---

## Phase 1: Fix collapsed layout and HTML structure

**User stories**: 1, 2, 3, 4, 5, 8

### What to build

Replace margin-based vertical spacing on the nav container with an explicit flex column so children stack vertically regardless of their display type. Refactor the collapsed tooltip branch to use base-ui's render prop — the trigger renders as the NavLink directly, removing the wrapping button element and the invalid `<button><a>` nesting. Collapsed icons become centered, full-width flex links in a single vertical column. Tooltips and active/hover states remain functional.

### Acceptance criteria

- [ ] Collapsed sidebar shows a single vertical column of icons — no horizontal wrapping
- [ ] Each icon is horizontally centered within the sidebar width
- [ ] Hovering a collapsed nav item shows a tooltip label on the right
- [ ] Active nav item is visually highlighted in collapsed state
- [ ] Hover styles apply correctly on collapsed items
- [ ] DOM contains no `<button>` wrapping `<a>` in collapsed state
- [ ] Expanded sidebar is visually unchanged

---

## Phase 2: Test coverage for collapsed state

**User stories**: 6, 7

### What to build

Add tests to `sidebar.test.tsx` that render the Sidebar in collapsed state and assert DOM structure and roles. Tests follow existing patterns: `renderWithProviders`, role queries, no CSS class assertions.

### Acceptance criteria

- [ ] Test: collapsed sidebar renders a nav link (role `link`) for each visible nav item per role
- [ ] Test: collapsed nav items are not wrapped in a button element
- [ ] Test: tooltip content element exists in the DOM for each collapsed nav item
- [ ] All existing sidebar tests continue to pass
