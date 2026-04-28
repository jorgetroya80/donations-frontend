# Plan: Accessibility Fixes

> Source PRD: docs/PRD-accessibility.md

## Architectural decisions

- **No new routes or schema changes** — all fixes are UI-layer only
- **Alert component** defaults to `role="status"`; callers opt in to `role="alert"` for destructive/error cases
- **Error IDs** derived from field name (e.g., `fieldName-error`) — stable, no runtime generation needed
- **buttonVariants** (already exported from the Button component) used to style `<Link>` as a ghost icon button — no new component needed
- **i18n** — any new ARIA labels use existing translation keys or new keys added to the translation files
- **Tests** use the existing Vitest + Testing Library setup already present in the project

---

## Phase 1: Foundation — Single-component, highest ROI

**User stories**: 7, 8, 9, 10, 15

### What to build

Three independent, low-risk changes that each fix a high-impact problem with minimal blast radius:

1. **`prefers-reduced-motion` CSS override** — add a global media query to `index.css` that sets animation and transition duration to near-zero for users who have enabled reduced motion in their OS. This covers all current and future animation utilities in one place.

2. **`Alert` component role fix** — change the component's hardcoded `role="alert"` to a default of `role="status"` (polite, non-interrupting). Accept an optional `role` prop so callers that render destructive or error alerts can explicitly pass `role="alert"`. Update all existing destructive-variant call sites to pass the explicit override.

3. **`DateRangePicker` trigger fix** — replace the styled `<span>` inside `PopoverTrigger` with a `<button type="button">` carrying the same visual styles plus explicit `focus-visible` ring styles. No logic or API changes. This restores keyboard accessibility across all six pages that use this component.

### Acceptance criteria

- [ ] With `prefers-reduced-motion: reduce` enabled in OS, no animations or transitions play in the app (verified in browser DevTools)
- [ ] `<Alert>` renders with `role="status"` by default; renders with `role="alert"` when the prop is passed explicitly
- [ ] All destructive/error `<Alert>` call sites pass `role="alert"` explicitly; loading and success call sites use the default
- [ ] The `DateRangePicker` trigger is reachable and activatable by keyboard (Tab to focus, Enter to open)
- [ ] The `DateRangePicker` trigger shows a visible focus ring when focused
- [ ] Unit test: `<Alert>` with no role prop → `role="status"` in DOM
- [ ] Unit test: `<Alert role="alert">` → `role="alert"` in DOM

---

## Phase 2: Form ARIA wiring

**User stories**: 1, 2, 3, 16

### What to build

Wire accessibility attributes on every form field across all five forms (donation, donor, expense, user, change password). Each field group follows the same pattern:

- The input receives `aria-invalid={!!error}` and `aria-describedby` pointing to the error element's `id` when an error exists, absent when there is no error
- The error paragraph receives a stable `id` derived from the field name and `role="alert"` (appropriate because it is a time-sensitive correction triggered by user action)
- When the form has no errors, `aria-invalid` is false/absent and `aria-describedby` is absent

This pattern applies uniformly to text inputs, date inputs, number inputs, and select fields across all five forms.

### Acceptance criteria

- [ ] Submitting any form with invalid data sets `aria-invalid="true"` on each invalid input
- [ ] Each invalid input's `aria-describedby` matches the `id` of the rendered error paragraph for that field
- [ ] Each error paragraph has `role="alert"`
- [ ] When a field has no error, `aria-invalid` is absent or `"false"` and `aria-describedby` is absent
- [ ] Unit tests for donation form: submit invalid → assert `aria-invalid`, `aria-describedby`, error `id` association
- [ ] Unit tests for donor form: same assertions
- [ ] Unit tests for expense form: same assertions
- [ ] Unit tests for user form: same assertions
- [ ] Unit tests for change password form: same assertions
- [ ] Tests also verify the no-error state (attributes absent)

---

## Phase 3: List page fixes — Tables and edit links

**User stories**: 4, 5, 6, 17

### What to build

Two related fixes applied to all four list pages (donations, donors, expenses, users):

**Edit link fix** — replace every `<Link><Button icon /></Link>` with a single `<Link>` styled using `buttonVariants` as a ghost icon button. Each link receives a descriptive `aria-label` that includes the record context (e.g., "Edit donation from 01/05/2025", "Edit donor João Silva") so screen reader users know which record they are acting on. The icon inside receives `aria-hidden="true"`.

**Sortable table header keyboard support** — each clickable `<TableHead>` receives:
- `tabIndex={0}` to make it focusable
- `onKeyDown` handler that fires the sort toggle on `Enter` or `Space` (with `preventDefault` on `Space` to prevent page scroll)
- `aria-sort` set to `"ascending"`, `"descending"`, or `"none"` based on current sort state
- The sort indicator character wrapped in `<span aria-hidden="true">` so it is not read aloud as part of the column name

### Acceptance criteria

- [ ] Edit links on all four list pages are single focusable elements (no nested interactive elements)
- [ ] Each edit link has an `aria-label` that includes identifying record context
- [ ] The icon inside each edit link has `aria-hidden="true"`
- [ ] Sortable column headers are reachable by Tab
- [ ] Pressing Enter on a sortable header toggles sort — same behavior as clicking
- [ ] Pressing Space on a sortable header toggles sort and does not scroll the page
- [ ] `aria-sort` on the active sort column reflects current direction (`"ascending"` or `"descending"`)
- [ ] `aria-sort` on non-active sortable columns is `"none"`
- [ ] Unit tests: press Enter on sort header → sort state changes, `aria-sort` updates
- [ ] Unit tests: press Space on sort header → sort state changes, no scroll (`preventDefault` called)
- [ ] Unit tests: `aria-label` on edit links contains record-identifying text

---

## Phase 4: Navigation and page structure

**User stories**: 11, 12, 13, 14

### What to build

**Sidebar landmark labels** — add `aria-label` with the translated "Main navigation" string to both the `<aside>` element and the `<nav>` element inside it. This allows screen reader users navigating by landmarks to identify and jump to the sidebar navigation region.

**Reports tab ARIA** — complete the ARIA tabs pattern on the Reports page:
- Each tab button receives `id={tab-${key}}` and `aria-controls={panel-${key}}`
- Each rendered tab panel is wrapped in a `<div>` with `role="tabpanel"`, `id={panel-${key}}`, `aria-labelledby={tab-${key}}`, and `tabIndex={0}` so keyboard users can Tab into the panel content after activating a tab
- Conditional rendering (unmounting inactive panels) is kept as-is; no change to mounting strategy

### Acceptance criteria

- [ ] The sidebar `<aside>` has an `aria-label` identifying it as the main navigation region
- [ ] The sidebar `<nav>` has an `aria-label` matching the aside label
- [ ] Screen reader landmark navigation lists the sidebar as a named navigation landmark
- [ ] Each Reports tab button has an `id` and `aria-controls` pointing to its panel
- [ ] The active Reports tab panel is wrapped in an element with `role="tabpanel"`, correct `id`, `aria-labelledby`, and `tabIndex={0}`
- [ ] Keyboard user can Tab from a tab button into the tab panel content
- [ ] No regression in tab switching behavior (clicking / keyboard activation still changes the active tab)
