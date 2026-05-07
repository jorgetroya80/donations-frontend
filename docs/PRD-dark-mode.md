# PRD: Dark Mode

## Problem Statement

Dashboard has no dark mode. Users in low-light environments (evening church, night office) stuck with bright white UI, no eye strain relief. App ignores system-level dark mode pref — inconsistent vs every other app on device.

## Solution

Add dark mode toggle to dashboard header. App auto-detects system pref on first visit, applies matching theme without flash. Users can override manually; pref persists across sessions.

## User Stories

1. As user, I want app to auto-apply dark mode when OS set to dark, so I don't manually change after login.
2. As user, I want theme toggle in header, so I can switch light/dark in one click.
3. As user, I want Sun icon in dark mode and Moon icon in light mode, so I know what clicking does.
4. As user, I want theme pref saved across sessions, so I don't toggle every login.
5. As user, I want app to open in preferred theme immediately, no flash of wrong theme before correction.
6. As user, I want all UI elements — cards, forms, buttons, inputs, modals, tables — to respect dark mode, nothing broken or unreadable.
7. As user, I want financial charts/graphs legible in dark mode, so I can read dashboard data in any lighting.
8. As user, I want income/expense indicator icons visually distinct in dark mode, so I can identify positive/negative data fast.
9. As user, I want modal and sheet overlays visible in dark mode, so dialogs feel properly layered.
10. As user with accessibility needs, I want theme toggle with descriptive `aria-label`, so screen readers announce what button does.

## Implementation Decisions

- **Toggle placement**: Standalone icon button in header, left of user dropdown. Visible always, one click to switch — no menu needed.
- **Theme detection order**: First visit — read saved `localStorage` pref → fall back to `prefers-color-scheme` media query → fall back to light. Subsequent visits, saved pref always wins.
- **Persistence**: Theme stored in `localStorage` under key `theme`, values `"light"` or `"dark"`.
- **Theme application**: `.dark` class toggled on `<html>` (`document.documentElement`). All color tokens switch via CSS custom properties in global stylesheet.
- **Flash prevention**: Inline `<script>` injected before React mounts in `index.html`. Reads `localStorage`/system pref, applies `.dark` synchronously before any paint.
- **Theme context**: React context (`ThemeProvider` + `useTheme` hook) manages theme state, exposes `toggleTheme` function. Pattern mirrors existing auth context.
- **Provider placement**: `ThemeProvider` wraps entire app as outermost provider.
- **Icons**: `Sun` (shown in dark mode, "switch to light") and `Moon` (shown in light mode, "switch to dark") from `lucide-react`.
- **Hardcoded color fixes**: Audit found three cases where hardcoded colors don't respond to dark mode. Income arrow icon: add `dark:` variant for lighter green. Expense arrow icon: replace with semantic `destructive` token. Dialog/sheet overlays: add `dark:` variant with higher opacity so overlay visible on dark backgrounds.
- **CSS foundation**: Already complete — global stylesheet defines full `.dark` class with OKLCH color tokens for all design primitives (background, foreground, card, popover, sidebar, charts, borders, inputs, rings). No new CSS tokens needed.

## Testing Decisions

Good tests verify external behavior, not implementation details. Assert what user sees and experiences — not which React state changed or which CSS class was added.

**Modules to test:**

- **Theme context (`ThemeProvider` + `useTheme`)**: Test initial theme correctly derived from `localStorage` and `prefers-color-scheme`. Test `toggleTheme` flips theme, updates `localStorage`, reflects in context value. Mock `window.matchMedia` and `localStorage` at boundary.
- **Flash prevention script**: Verify inline script sets correct class on `<html>` given different combos of `localStorage` value and `prefers-color-scheme`. Test as pure function extracted from script tag.

**Out of scope for tests:** Visual regression (dark color correctness), toggle button (covered by context tests), hardcoded color fixes (CSS-only changes).

## Out of Scope

- Per-route or per-component theme overrides.
- "System" third option tracking OS pref dynamically after app loads (current: system pref read once on first visit, then manual toggle takes over).
- Custom color themes beyond light and dark.
- Dark mode for login page (not part of authenticated dashboard).
- Animations/transitions when switching theme.

## Further Notes

- CSS dark mode token set existed in codebase before this feature. PRD covers only toggle mechanism and color correctness fixes.
- `prefers-color-scheme` media query read once at app load, not tracked reactively. If user changes OS theme while app open, app won't update — page refresh required.