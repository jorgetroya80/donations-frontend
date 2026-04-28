# Plan: UX Polish

> Source PRD: docs/PRD-ux-polish.md

## Architectural decisions

- **No new routes or schema changes** — all fixes are UI-layer only
- **Skeleton component** — new reusable component, `aria-hidden="true"`, no semantic content
- **EmptyState component** — new reusable component accepting icon, message, and optional CTA props
- **Cancel button** — added as `onCancel` prop to all form components; rendered adjacent to Submit inside the form
- **Auto-navigate** — removed entirely; navigate immediately on success with no timeout
- **SelectTrigger width** — `w-full` passed at call site in forms, not changed globally in the component default
- **Header title** — derived from route location using a route-to-title map; no new router dependency
- **i18n** — any new strings use existing translation keys or new keys added to translation files

---

## Phase 1: Quick wins — Trivial, zero-risk fixes

**User stories**: 12, 13, 14

### What to build

Three independent single-file changes that fix visual inconsistencies with no risk of regression:

1. **SelectTrigger width in forms** — add `className="w-full"` to every `SelectTrigger` used inside form field groups across all forms (donation, donor, expense, user). This makes select fields stretch to the full column width, matching adjacent text inputs in the two-column grid.

2. **Change Password page heading** — remove the `<Card>` and `<CardTitle>` wrapper from the Change Password page. Keep the `<h1>` page heading. Style the form directly with spacing utilities, no card container.

### Acceptance criteria

- [ ] All Select fields in donation, donor, expense, and user forms fill the full width of their column
- [ ] Select fields align with adjacent Input fields in the two-column form grid
- [ ] Change Password page renders a single `<h1>` heading, no card title
- [ ] Change Password form is functional and visually clean without the card wrapper
- [ ] No visual regression in any other page that uses SelectTrigger outside forms

---

## Phase 2: Skeleton and EmptyState components

**User stories**: 1, 2, 3, 4, 5, 6, 7

### What to build

Two new reusable components that replace the current plain-text loading and empty states on all four list pages (donations, donors, expenses, users):

**Skeleton component** — a single `<div>` with `animate-pulse`, `rounded-md`, and `bg-muted` styles. Renders `aria-hidden="true"` since it is a visual placeholder with no semantic content. Each list page replaces its loading `<Alert>` with a container carrying `aria-busy="true"` and `aria-label` (translated loading string), wrapping five `Skeleton` rows that approximate table row height. The `animate-pulse` animation is automatically suppressed by the global `prefers-reduced-motion` override from the Accessibility PRD.

**EmptyState component** — accepts an icon element, a message string, and an optional CTA object (`{ label, onClick }`). Renders a centered column: icon at muted/50% opacity, message in muted foreground, optional `Button` below. Each list page replaces its current empty-state paragraph with `EmptyState` configured with the relevant icon and a CTA that navigates to the create route.

### Acceptance criteria

- [ ] Loading state on donations, donors, expenses, and users list pages renders 5 skeleton rows, not a text Alert
- [ ] Skeleton rows approximate table row height and fill the table width
- [ ] Skeleton container has `aria-busy="true"` and a translated `aria-label`
- [ ] Skeleton animation is suppressed when `prefers-reduced-motion` is enabled
- [ ] Empty state on each list page shows an icon, an explanatory message, and a button to create the first record
- [ ] CTA button on the empty state navigates to the correct create route for each entity
- [ ] Empty state renders correctly with no CTA when the prop is omitted (component is flexible)
- [ ] Unit test: `Skeleton` renders `aria-hidden="true"`
- [ ] Unit test: `EmptyState` renders icon, message, and CTA button when all props provided
- [ ] Unit test: `EmptyState` renders without CTA when prop is omitted
- [ ] Unit test: `EmptyState` CTA `onClick` is called when button is clicked

---

## Phase 3: Form workflow — Cancel button and auto-navigate

**User stories**: 8, 9, 10, 11

### What to build

Two workflow changes that together remove friction from the create/edit flow:

**Cancel button relocation** — add an `onCancel` callback prop to all form components (DonationForm, DonorForm, ExpenseForm, UserForm). Inside each form, render Cancel adjacent to Submit in the same button row: `[Save] [Cancel]`. The Cancel button has `type="button"` to prevent accidental form submission. The standalone Back button rendered outside the form on each create/edit page is removed. Each page passes `onCancel` as a handler that navigates back to the list.

**Auto-navigate removal** — remove all `setTimeout(() => navigate(...), 1500)` calls from create and edit pages. On successful create or edit, navigate to the list page immediately. The success Alert shown before the timeout is also removed, since the list page (showing the new or updated record) serves as implicit confirmation.

### Acceptance criteria

- [ ] Cancel button appears next to Save in the form button row on all create pages (donations, donors, expenses, users)
- [ ] Cancel button appears next to Save in the form button row on all edit pages
- [ ] Cancel button has `type="button"` and does not submit the form
- [ ] Clicking Cancel navigates back to the appropriate list page
- [ ] No standalone Back button exists outside the form on any create or edit page
- [ ] After successful record creation, the app navigates to the list immediately (no 1.5s delay)
- [ ] After successful record edit, the app navigates to the list immediately
- [ ] The new or updated record is visible in the list after navigation
- [ ] Unit test: clicking Cancel in a form calls `onCancel`
- [ ] Unit test: Cancel button has `type="button"`

---

## Phase 4: Header page title

**User stories**: 15, 16

### What to build

Add a page title to the left side of the header bar. Derive the current section name from the active route using a route-to-title map (path pattern → translation key). Render the title as a text element in the header's left slot. On detail and edit routes (e.g., `/donations/3/edit`), show the section name only (e.g., "Donations"), not the record identifier. When the sidebar is collapsed, the header title is the only visible indicator of the user's location in the app.

### Acceptance criteria

- [ ] Header bar shows the current section name on the left side on all main routes
- [ ] Section name is correct for: Dashboard, Donations, Donors, Expenses, Reports, Users, Settings
- [ ] On edit and create routes, the section name matches the parent list (e.g., `/donations/3/edit` → "Donations")
- [ ] Title is visible when the sidebar is expanded and when it is collapsed
- [ ] Title updates when navigating between sections without page reload
- [ ] No regression in the user dropdown on the right side of the header
