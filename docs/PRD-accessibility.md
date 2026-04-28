# PRD: Accessibility Fixes

## Problem Statement

The application has multiple WCAG 2.1 AA failures that make it inaccessible to keyboard-only users and screen reader users. Form validation errors are not programmatically associated with their fields. Edit action buttons have no accessible names. Sortable table headers cannot be activated by keyboard. The date range picker trigger is a non-interactive `<span>`. The `Alert` component misuses `role="alert"` on loading and success states, causing screen readers to announce them urgently. Navigation landmarks lack labels. The Reports tab panel structure is missing required ARIA associations. Animations are not suppressed for users with `prefers-reduced-motion` enabled.

## Solution

Wire ARIA attributes (`aria-invalid`, `aria-describedby`) on all form fields and their error messages. Replace `<Link><Button>` nesting with a single `<Link>` styled via `buttonVariants`, each with a descriptive `aria-label`. Add keyboard event handlers and `aria-sort` to sortable table headers. Change the `DateRangePicker` trigger from a `<span>` to a `<button>`. Change the `Alert` component's default `role` to `"status"` (polite) and require callers to opt in to `role="alert"` for errors. Add `aria-label` to sidebar `<aside>` and `<nav>` elements. Add `aria-controls`, `role="tabpanel"`, and `aria-labelledby` to the Reports tab structure. Add a global `prefers-reduced-motion` CSS override.

## User Stories

1. As a screen reader user filling out a donation form, I want validation error messages announced and associated with their fields, so that I know exactly which field has an error without navigating the entire form.
2. As a screen reader user filling out a donor form, I want the error for each field read when I focus the field, so that I can correct mistakes efficiently.
3. As a screen reader user filling out the change password form, I want password mismatch errors linked to the confirm password field, so that I understand what to fix.
4. As a keyboard user on a list page, I want to activate column sort by pressing Enter or Space on the column header, so that I can sort data without a mouse.
5. As a screen reader user on a list page, I want each sortable column header to announce its sort direction (`ascending`, `descending`, or `none`), so that I understand the current table order.
6. As a screen reader user on a donations list, I want each edit button to announce which donation it edits (e.g., "Edit donation from 01/05/2025"), so that I can act on the right record.
7. As a keyboard user, I want to open the date range picker by pressing Enter on its trigger, so that I can filter date ranges without a mouse.
8. As a screen reader user, I want loading states announced politely and not urgently, so that the word "Loading…" does not interrupt my current reading flow.
9. As a screen reader user, I want success confirmation messages announced politely, so that task completion does not trigger the same urgency signal as an error.
10. As a screen reader user, I want error alerts announced urgently, so that I am immediately aware when something goes wrong.
11. As a screen reader user navigating by landmarks, I want the sidebar navigation landmark labeled "Main navigation", so that I can jump to it directly.
12. As a screen reader user navigating by landmarks, I want multiple `<nav>` elements on the page to have distinct labels, so that I can distinguish between them.
13. As a screen reader user on the Reports page, I want each tab panel associated with its tab button, so that I can navigate between tab content correctly.
14. As a keyboard user on the Reports page, I want to Tab into a tab panel after activating a tab, so that I can read the panel content without extra keystrokes.
15. As a user with a vestibular disorder, I want all UI animations suppressed when I have `prefers-reduced-motion` enabled in my OS, so that I do not experience motion sickness while using the application.
16. As a developer, I want form field accessibility wiring covered by unit tests, so that ARIA attribute regressions are caught before they reach production.
17. As a developer, I want table sort keyboard behavior covered by unit tests, so that keyboard accessibility of sort controls does not regress.

## Implementation Decisions

### Form field ARIA wiring
- All form field groups (label + input + error) follow a consistent pattern: the input has `aria-invalid={!!error}` and `aria-describedby` pointing to the error element's `id` when an error exists.
- Error paragraphs receive a stable `id` derived from the field name (e.g., `fullName-error`).
- Error paragraphs use `role="alert"` (appropriate here — it is a time-sensitive correction triggered by user action).
- Apply to: donor form, donation form, expense form, user form, change password form.

### Link/Button nesting fix
- Replace every `<Link><Button icon /></Link>` with `<Link className={buttonVariants({ variant: 'ghost', size: 'icon' })}>` to produce a single focusable, interactive element.
- Each link receives an `aria-label` that includes the record context (e.g., date, name) so screen reader users know what they are editing.
- The icon inside each link receives `aria-hidden="true"` since the label on the parent covers it.
- Apply to: donations list, donors list, expenses list, users list.

### Sortable table header keyboard support
- Sortable `<th>` elements receive `tabIndex={0}`, an `onKeyDown` handler that calls the sort toggle on `Enter` or `Space` (with `preventDefault` on Space to avoid page scroll), and `aria-sort` set to `"ascending"`, `"descending"`, or `"none"` based on current sort state.
- The visible sort indicator character is wrapped in `<span aria-hidden="true">` so it does not pollute the announced column name.
- Apply to: donations list, donors list, expenses list, users list.

### DateRangePicker trigger
- The `PopoverTrigger` child changes from a styled `<span>` to a `<button type="button">` with explicit `focus-visible` ring styles matching the design system.
- No other changes to the component's logic or API.

### Alert component role
- The `Alert` component's default `role` changes from `"alert"` to `"status"`.
- An optional `role` prop allows callers to override to `"alert"` for destructive/error alerts.
- All existing call sites that use `variant="destructive"` are updated to also pass `role="alert"`.
- Loading and success call sites use the new default `role="status"`.

### Sidebar landmark labels
- The `<aside>` element receives `aria-label` with the translated main navigation label.
- The `<nav>` inside the sidebar receives the same label (both landmarks describe the same region; the aside scopes it, the nav labels the list).

### Reports tab ARIA
- Each tab button receives `aria-controls={panel-${key}}` and `id={tab-${key}}`.
- Each tab panel is wrapped in `<div role="tabpanel" id={panel-${key}} aria-labelledby={tab-${key}} tabIndex={0}>`.
- Panels that are not active are not rendered (current conditional render approach is acceptable; no need to use `hidden` attribute).

### prefers-reduced-motion
- A global CSS rule in `index.css` targets `*`, `*::before`, `*::after` under `@media (prefers-reduced-motion: reduce)` and sets `animation-duration: 0.01ms`, `animation-iteration-count: 1`, and `transition-duration: 0.01ms` with `!important`.
- This acts as a safety net for all animation utilities (`animate-pulse`, `animate-in`, `animate-out`, transitions).

## Testing Decisions

Good tests assert observable external behavior, not implementation details. They render a component, interact with it as a user would (type, click, press key), and assert what the DOM exposes (ARIA attributes, roles, announced text). They do not assert which internal function was called.

### Modules to test

**Form field ARIA wiring**
- Render each form with a submitted-but-invalid state (trigger validation errors).
- Assert that the input has `aria-invalid="true"`.
- Assert that `aria-describedby` on the input matches the `id` of the rendered error paragraph.
- Assert the error paragraph has `role="alert"`.
- When no error: assert `aria-invalid` is absent or `"false"` and `aria-describedby` is absent.

**Alert component role**
- Render `<Alert>` with no role prop — assert `role="status"` in DOM.
- Render `<Alert role="alert">` — assert `role="alert"` in DOM.

**Sortable table header keyboard**
- Render a list page with mock data.
- Focus a sortable `<th>` by tabbing to it.
- Press Enter — assert sort state changes.
- Press Space — assert sort state changes and page does not scroll (check `preventDefault` called).
- Assert `aria-sort` attribute updates correctly on each press.

**Prior art**: look at existing form tests in `src/features` for component rendering patterns. Look at existing interaction tests for keyboard event simulation patterns.

## Out of Scope

- Fixing the edit-confirmation dialog UX (deliberate design choice, kept as-is).
- Adding skip-to-content links (future enhancement).
- Full WCAG 2.2 audit beyond the issues identified in the review.
- Screen reader smoke testing (manual QA responsibility, not automated).
- The `Select` controlled value bug (tracked as a separate issue).

## Further Notes

The `DateRangePicker` fix is a single-component change that fixes keyboard accessibility on six pages simultaneously — it should be prioritized as the highest ROI change in this PRD.

The `<Link><Button>` nesting fix also resolves an invalid HTML violation (interactive element inside interactive element) in addition to the accessibility gap. Both concerns are resolved by the same change.

The `prefers-reduced-motion` global override should be added regardless of other changes, as it is a one-line CSS addition with no risk of regression.
