# Plan: Dark Mode

> Source PRD: docs/PRD-dark-mode.md

## Architectural decisions

- **Theme storage**: `localStorage` key `theme`, values `"light"` | `"dark"`
- **Theme application**: `.dark` class on `<html>` (`document.documentElement`); CSS custom properties handle all token switching
- **Detection order**: saved localStorage pref → `prefers-color-scheme` media query → light
- **Flash prevention**: inline `<script>` in `index.html` runs before React mounts
- **State management**: React context (`ThemeProvider` + `useTheme`) — no external library
- **Provider placement**: outermost provider, wraps entire app
- **Icons**: `Sun` / `Moon` from `lucide-react`

---

## Phase 1: Full dark mode — infrastructure, toggle, color correctness

**User stories**: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10

### What to build

Wire up the complete dark mode feature end-to-end in a single slice:

- **Theme context** — manages theme state, reads initial value from localStorage / system preference, exposes a toggle function that flips the theme, persists to localStorage, and updates the `<html>` class.
- **Flash prevention** — inline script in `index.html` applies `.dark` to `<html>` before React mounts, so the correct theme is shown on first paint.
- **Provider** — `ThemeProvider` wraps the entire app.
- **Header toggle** — standalone Sun/Moon icon button in the header, left of the user dropdown. Sun shown in dark mode (switch to light), Moon shown in light mode (switch to dark). Button has a descriptive `aria-label`.
- **Color correctness** — audit all components for hardcoded colors that don't respond to `.dark`. Fix: income arrow icon gets a dark-mode-aware green variant; expense arrow icon replaced with semantic destructive token; dialog and sheet overlays get a higher-opacity dark variant so they remain visible on dark backgrounds.

### Issues found (pre-fix review)

**🔴 High**
- `window.matchMedia` unavailable in jsdom — needs global mock in `vitest.setup.ts` before any theme test runs

**🟡 Medium**
- Side effects (`localStorage.setItem` + `classList.toggle`) inside `setState` updater — React Strict Mode double-invokes updaters; breaks `toHaveBeenCalledTimes` assertions and risks double-writing localStorage. Move both to `useEffect` reacting to `theme`.
- `getInitialTheme` not exported — three branches (saved dark, saved light, no saved + OS pref) only testable by mounting full provider. Export to enable isolated unit tests.
- `localStorage` not cleared between tests — missing `beforeEach(() => localStorage.clear())` causes order-dependent failures.
- App.tsx indentation broken — `ThemeProvider` and `AuthProvider` at same visual indent but are nested. Fails Biome CI on `npm run check`.

**🟢 Low**
- `useCallback` on `toggleTheme` redundant — React Compiler handles memoization; remove it.
- `var` in inline flash script — use `const`/`let` to match codebase ES2023 style.
- Flash script duplicates `getInitialTheme` logic — inherent constraint; add comment warning devs to keep in sync.
- `getInitialTheme` not SSR-safe — add `typeof window !== 'undefined'` guard (low urgency for SPA).
- `useTheme` outside-provider error path untested — add `expect(() => renderHook(useTheme)).toThrow(...)`.

---

### Acceptance criteria

- [ ] App opens in dark mode when OS is set to dark and no saved preference exists
- [ ] App opens in light mode when OS is set to light and no saved preference exists
- [ ] Sun/Moon toggle button visible in header, left of user dropdown
- [ ] Clicking toggle switches theme immediately — all colors update
- [ ] Theme persists after page refresh
- [ ] Saved preference overrides system preference
- [ ] No flash of wrong theme on load (light flash before dark applies)
- [ ] Income arrow icon readable in dark mode (lighter green)
- [ ] Expense arrow icon readable in dark mode (uses destructive token)
- [ ] Dialog and sheet overlays visible in dark mode
- [ ] Toggle button announces intent to screen readers via `aria-label`
- [ ] `npm run typecheck` passes
