# PRD: Fix Collapsed Sidebar Icon Layout

## Problem Statement

When the dashboard sidebar is collapsed, navigation icons wrap horizontally and display in a grid-like layout instead of a single vertical column. This makes the collapsed sidebar visually broken and unusable — users expect a narrow strip of stacked icons, but instead see icons arranged across multiple columns.

## Solution

Fix the collapsed sidebar so icons always render in a single centered vertical column. Two structural changes are needed:

1. Replace margin-based vertical spacing (`space-y-1`) on the nav container with an explicit flex column layout (`flex flex-col gap-1`) so children always stack vertically regardless of their intrinsic display type.
2. Use base-ui's render prop on `TooltipTrigger` so the trigger renders as the `NavLink` directly — eliminating the wrapping `<button>` element whose `display: inline-block` default causes icons to flow horizontally. This also removes invalid HTML nesting (`<button><a>`).

## User Stories

1. As a dashboard user, I want the collapsed sidebar to show a single vertical column of icons, so that the layout looks correct and I can navigate without confusion.
2. As a dashboard user, I want each navigation icon to be horizontally centered within the collapsed sidebar, so that the UI feels intentional and polished.
3. As a dashboard user, I want tooltip labels to still appear on hover when the sidebar is collapsed, so that I know what each icon represents without expanding the sidebar.
4. As a dashboard user, I want the active navigation item to be visually highlighted in the collapsed state, so that I always know which section I am currently in.
5. As a dashboard user, I want hover states to work correctly on collapsed nav items, so that the sidebar feels interactive and responsive.
6. As a keyboard user, I want to navigate collapsed sidebar icons with the keyboard and see tooltips on focus, so that the sidebar is accessible without a mouse.
7. As a screen reader user, I want the collapsed nav links to be focusable and labeled, so that I can navigate the app without relying on visible text.
8. As a developer, I want no invalid HTML nesting in the sidebar (no `<button>` wrapping `<a>`), so that the DOM structure is semantically correct and browser-compatible.

## Implementation Decisions

- **Nav container layout**: Replace `space-y-1` with `flex flex-col gap-1` on the `<nav>` element. This is a Tailwind v4 idiomatic approach — explicit flex column guarantees vertical stacking for all children regardless of their display type, unlike margin-based spacing which relies on block-level children.
- **TooltipTrigger render prop**: Use base-ui's render prop API to make `TooltipTrigger` render as the `NavLink` directly instead of wrapping it in a `<button>`. This eliminates the inline-block button that causes horizontal flow and removes the `<button><a>` invalid HTML nesting.
- **Collapsed nav item classes**: Collapsed items use `flex w-full items-center justify-center rounded-md py-2` — full-width ensures the item spans the sidebar, `justify-center` centers the icon, no horizontal padding needed in collapsed state.
- **Expanded state unchanged**: The `link` variable rendered in expanded state is not modified. Only the collapsed tooltip branch is refactored.
- **No asChild**: base-ui ignores `asChild`; render prop is the correct API for this component library.

## Testing Decisions

Good tests verify external behavior visible to the user, not implementation details like class names or DOM structure.

- **What makes a good test**: Assert that nav links are present and navigable in both collapsed and expanded states. Assert tooltip content appears on hover/focus when collapsed. Assert active state is reflected. Do NOT assert specific CSS classes.
- **Modules to test**: `Sidebar` component — specifically the collapsed state rendering.
- **New tests to add**:
  - Collapsed sidebar renders nav links (not buttons) for each visible nav item
  - Collapsed sidebar shows tooltip content on trigger hover/focus
  - Collapsed sidebar nav items do not nest an anchor inside a button
- **Prior art**: Existing `sidebar.test.tsx` uses `renderWithProviders` + `@testing-library/react` + vitest. Tests query by role (`getByRole('link')`, `getByRole('navigation')`) and assert text content or ARIA attributes. New tests should follow the same pattern.

## Out of Scope

- Changing the sidebar's expanded state layout or styling.
- Adding new navigation items or changing role-based visibility logic.
- Animating the collapse/expand transition.
- Changing the sidebar width or breakpoints.
- Accessibility improvements beyond fixing the invalid HTML nesting.

## Further Notes

The root cause is a combination of a base-ui component rendering as an inline element and the absence of an explicit flex column layout on the nav container. Both issues compound: fixing only the flex column would prevent visible wrapping but preserve invalid HTML; fixing only the render prop would fix HTML validity but still relies on the nav's stacking behavior. Both changes together produce a robust, semantically correct fix.

GitHub issue: https://github.com/jorgetroya80/donations-frontend/issues/102
