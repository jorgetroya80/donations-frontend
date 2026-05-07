# PRD: Dark Mode

## Problem Statement

The dashboard has no dark mode support. Users working in low-light environments (evening church services, night office work) are exposed to a bright white interface with no way to reduce eye strain. The app also ignores the user's system-level dark mode preference, creating an inconsistent experience compared to every other app on their device.

## Solution

Add a dark mode toggle to the dashboard header. The app automatically detects the user's system preference on first visit and applies the matching theme without any flash. Users can manually override the theme at any time, and their preference is remembered across sessions.

## User Stories

1. As a user, I want the app to automatically apply dark mode when my operating system is set to dark mode, so that I don't have to manually change it after logging in.
2. As a user, I want to see a theme toggle button in the header, so that I can switch between light and dark mode with one click.
3. As a user, I want the Sun icon shown when I'm in dark mode and the Moon icon when I'm in light mode, so that I know what clicking the button will do.
4. As a user, I want my theme preference saved across sessions, so that I don't have to toggle it every time I log in.
5. As a user, I want the app to open in my preferred theme immediately, so that I don't see a flash of the wrong theme before it corrects itself.
6. As a user, I want all UI elements — cards, forms, buttons, inputs, modals, tables — to respect dark mode, so that nothing looks broken or unreadable in dark mode.
7. As a user, I want financial charts and graphs to be legible in dark mode, so that I can read the dashboard data in any lighting condition.
8. As a user, I want income and expense indicator icons to remain visually distinct and readable in dark mode, so that I can quickly identify positive and negative financial data.
9. As a user, I want modal overlays and sheet overlays to be visible in dark mode, so that dialogs feel properly layered.
10. As a user with accessibility needs, I want the theme toggle to have a descriptive aria-label, so that screen readers can announce what the button does.

## Implementation Decisions

- **Toggle placement**: Standalone icon button in the header, to the left of the user dropdown. Visible at all times, one click to switch — no menu required.
- **Theme detection order**: On first visit, read saved localStorage preference → fall back to `prefers-color-scheme` media query → fall back to light. On subsequent visits, saved preference always wins.
- **Persistence**: Theme stored in `localStorage` under key `theme` with values `"light"` or `"dark"`.
- **Theme application**: `.dark` class toggled on `<html>` (`document.documentElement`). All color tokens switch automatically via CSS custom properties defined in the global stylesheet.
- **Flash prevention**: Inline `<script>` injected before React mounts in `index.html`. Reads localStorage/system preference and applies `.dark` synchronously before any paint.
- **Theme context**: React context (`ThemeProvider` + `useTheme` hook) manages theme state and exposes a `toggleTheme` function. Pattern mirrors existing auth context.
- **Provider placement**: `ThemeProvider` wraps the entire app as the outermost provider.
- **Icons**: `Sun` (shown in dark mode, indicates "switch to light") and `Moon` (shown in light mode, indicates "switch to dark") from `lucide-react`.
- **Hardcoded color fixes**: Audit of all components found three cases where hardcoded colors don't respond to dark mode. Income arrow icon: add `dark:` variant for lighter green. Expense arrow icon: replace with semantic `destructive` token. Dialog and sheet overlays: add `dark:` variant with higher opacity so the overlay is visible on dark backgrounds.
- **CSS foundation**: Already complete — the global stylesheet defines a full `.dark` class with OKLCH color tokens for all design primitives (background, foreground, card, popover, sidebar, charts, borders, inputs, rings). No new CSS tokens needed.

## Testing Decisions

Good tests verify external behavior, not implementation details. They assert what the user sees and experiences — not which React state variables changed or which CSS class was added.

**Modules to test:**

- **Theme context (`ThemeProvider` + `useTheme`)**: Test that the initial theme is correctly derived from localStorage and `prefers-color-scheme`. Test that `toggleTheme` flips the theme, updates localStorage, and reflects in the context value. Mock `window.matchMedia` and `localStorage` at the boundary.
- **Flash prevention script**: Verify that the inline script sets the correct class on `<html>` given different combinations of localStorage value and `prefers-color-scheme`. Test as a pure function extracted from the script tag.

**Out of scope for tests:** Visual regression (dark color correctness), the toggle button itself (covered by the context tests), and the hardcoded color fixes (CSS-only changes).

## Out of Scope

- Per-route or per-component theme overrides.
- A "system" third option that tracks OS preference dynamically after the app loads (current behavior: system pref is read once on first visit, then manual toggle takes over).
- Custom color themes beyond light and dark.
- Dark mode for the login page (not part of the authenticated dashboard).
- Animations or transitions when switching theme.

## Further Notes

- The CSS dark mode token set was already present in the codebase before this feature. This PRD covers only the toggle mechanism and color correctness fixes.
- The `prefers-color-scheme` media query is read once at app load, not tracked reactively. If the user changes their OS theme while the app is open, the app will not update automatically — a page refresh is required.
