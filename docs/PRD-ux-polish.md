# PRD: UX Polish

## Problem Statement

Several interaction patterns create friction or confusion throughout the application. Data loading states show a plain text string inside a styled box with no spatial reservation, causing layout shift when data arrives. Empty list states offer no guidance or action to the user. The Cancel/Back button on create and edit pages sits outside the form in document order, forcing keyboard users to tab through the entire form to reach it. After successful record creation or editing, the page auto-navigates after 1.5 seconds with no way for the user to stop or extend that window. Select inputs inside forms do not stretch to full column width, breaking alignment in two-column form grids. The Change Password page duplicates its heading in both the page title and a card title. The header bar is empty on its left side, giving users no persistent location signal — especially noticeable when the sidebar is collapsed.

## Solution

Replace loading Alert components with skeleton placeholder rows that approximate the content shape and reserve layout space. Upgrade empty states with an icon, message, and a call-to-action button. Move the Cancel button inside each form's button row, adjacent to the Submit button. Remove the auto-navigate timeout and navigate immediately on success (or introduce a persistent toast). Fix SelectTrigger width to stretch to full column width when used inside forms. Remove the redundant CardTitle from the Change Password page. Add a breadcrumb or page title to the left side of the header derived from the active route.

## User Stories

1. As a user on a slow connection, I want to see skeleton placeholder rows in the donations table while data loads, so that the layout does not shift and I understand content is coming.
2. As a user on a slow connection, I want skeleton placeholders to approximate the shape of the real content, so that I can orient myself before data arrives.
3. As a user with `prefers-reduced-motion` enabled, I want skeleton animations to be suppressed, so that the loading state does not trigger motion discomfort.
4. As a new user who opens an empty donations list, I want to see an icon, an explanatory message, and a button to add my first donation, so that I know immediately what to do.
5. As a new user who opens an empty donors list, I want a call-to-action in the empty state, so that I can add a donor without hunting for a button.
6. As a new user who opens an empty expenses list, I want a call-to-action in the empty state, so that I can log an expense immediately.
7. As a new user who opens an empty users list, I want a call-to-action in the empty state, so that I can invite a user without searching for the entry point.
8. As a keyboard user on a create form, I want the Cancel button next to the Save button in tab order, so that I do not have to tab through the entire form to cancel.
9. As a keyboard user on an edit form, I want the Cancel button grouped with the Save button, so that I can abandon edits without excessive tabbing.
10. As a user who just created a donation, I want to stay on the page long enough to read the confirmation, or choose to navigate away immediately, so that I feel in control of the workflow.
11. As a user who just saved an edit, I want to see confirmation of the save without being forced away on a timer, so that I can verify the change before leaving.
12. As a user filling out a donation form, I want the Donation Type select to be the same width as the Amount input in the same row, so that the form looks consistent and aligned.
13. As a user filling out an expense form, I want the Category select to match the width of adjacent inputs, so that the form grid looks polished.
14. As a user on the Change Password page, I want a single clear heading, so that the page feels clean and uncluttered.
15. As a user with the sidebar collapsed, I want to see the current page name in the header, so that I always know where I am in the application.
16. As a user navigating between pages, I want a breadcrumb or page title in the header, so that I can orient myself without relying on the sidebar highlight alone.

## Implementation Decisions

### Skeleton loading component
- Create a reusable `Skeleton` component with `animate-pulse`, `rounded-md`, and `bg-muted` styling.
- The component renders a `<div aria-hidden="true">` (decorative placeholder; the `aria-busy` / `aria-label` context lives on the container).
- Each list page wraps its loading state in a container with `aria-busy="true"` and `aria-label` pointing to a translation string (e.g., "Loading donations…").
- List pages render 5 skeleton rows that approximate table row height.
- Detail/create/edit pages render skeleton blocks that approximate form field shapes.
- The skeleton's `animate-pulse` class is suppressed by the global `prefers-reduced-motion` override (handled in the Accessibility PRD).

### Empty state component
- Create a reusable `EmptyState` component that accepts: an icon element, a message string, and an optional CTA button label + onClick/href.
- Used on all four list pages (donations, donors, expenses, users).
- Default layout: centered column, icon at 40px muted/50% opacity, message in `text-muted-foreground`, optional Button below.

### Cancel button relocation
- All form components (DonationForm, DonorForm, ExpenseForm, UserForm) add an `onCancel` callback prop.
- The form renders a button row with Submit and Cancel adjacent: `[Save] [Cancel]`.
- The Cancel button has `type="button"` to prevent accidental form submission.
- The standalone Back button rendered outside the form on create/edit pages is removed.
- The `onCancel` prop on page components calls `navigate(-1)` or a fixed route.

### Auto-navigate removal
- Remove all `setTimeout(() => navigate(...), 1500)` calls from create and edit pages.
- On successful create: navigate immediately to the list page. The list will show the new record as confirmation.
- On successful edit: navigate immediately back to the list page.
- The success Alert shown before navigation is removed. If a success signal is needed across the navigation boundary, use a lightweight toast library (e.g., `sonner`) or a URL search param flag read by the list page.

### SelectTrigger width in forms
- Add `className="w-full"` to every `SelectTrigger` used inside form field groups.
- Do not change the `SelectTrigger` base default (other usages like the donor statement selector benefit from content-width sizing).

### Change Password page heading
- Remove the `<Card>` / `<CardTitle>` wrapper from `ChangePasswordPage`.
- Keep the `<h1>` page heading.
- Style the form with `max-w-md` and `space-y-4` directly, without a card container.

### Header breadcrumb / page title
- Derive the current page title from the active route using the router's location or a title-map keyed on route path patterns.
- Render the title as a `<span>` or `<p>` in the left slot of the header bar.
- On routes with a record context (e.g., edit pages), show the section name only (not the record ID), e.g., "Donations".
- No interactive breadcrumb trail required — a single page name is sufficient for this application's depth.

## Testing Decisions

Good tests assert observable behavior: what renders in the DOM, what changes after interaction. They do not assert component internals or prop names.

### Modules to test

**Skeleton component**
- Renders with `aria-hidden="true"`.
- Accepts a `className` prop and applies it.

**EmptyState component**
- Renders icon, message, and CTA button when all props provided.
- Renders without CTA button when the prop is omitted.
- CTA button's `onClick` is called when clicked.

**Cancel button in forms**
- Render a form page, click Cancel — assert `onCancel` was called.
- Assert the Cancel button has `type="button"` so it does not submit the form.

**Prior art**: use existing form render patterns in `src/features` for component setup.

## Out of Scope

- The edit-confirmation dialog (deliberate design choice, kept as-is).
- Adding a full toast/notification system (if immediate navigation is chosen, no toast is needed; if a toast system is added, that is a separate setup task).
- Animated page transitions.
- Breadcrumb with multiple levels / clickable segments (current app depth does not require it).
- Mobile-specific navigation patterns.

## Further Notes

The Cancel button relocation and the auto-navigate removal are the changes most likely to affect user workflow perception. They should be tested with real users if possible before shipping.

The EmptyState component is reused across four list pages — design it generically enough to accept any Lucide icon, any message string, and any CTA configuration.

Skeleton rows should match the real table's column count and approximate row height to minimize perceived layout shift on load.
