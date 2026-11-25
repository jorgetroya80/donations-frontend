# Plan: Motion pass (sidebar, drawer, popups, toast)

> Source: `/animate` review of `src/components/ui/` and `src/layouts/sidebar.tsx`. Bar: Emil Kowalski animation rules (`.claude/skills/animate`).

## Overview

Add motion only where it has a named purpose, and fix the motion that already exists so it uses strong curves and named properties. Six tasks in three phases. CSS and Tailwind only, no new dependency.

## Architecture decisions

- **Easing tokens live in Tailwind `@theme`.** Override the built-in `--ease-out` and `--ease-in-out` and add `--ease-drawer`. The `ease-out` utility sets `--tw-ease`, and `tw-animate-css` reads `--tw-ease` for `animate-in`/`animate-out`. So one class on each popup changes its curve. No parallel token system.
  - `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`
  - `--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)`
  - `--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1)`
- **The mobile drawer stays mounted.** Today `{mobileOpen && …}` unmounts it at once, so it can't animate out. When closed it gets `inert`, `aria-hidden="true"` and `invisible`, plus `-translate-x-full` on the panel and `opacity-0` on the backdrop. `visibility` changes as a discrete transition (to visible at the start of opening, to hidden at the end of closing), so the close animation plays and the drawer can't be focused afterwards. Existing tests count `complementary` roles, and `aria-hidden` keeps those counts the same.
- **CSS transitions, not keyframes, for the drawer.** Users can open and close it quickly, and a transition picks up from wherever it currently is.
- **Sidebar labels fade in with `tw-animate-css` keyframes** (`animate-in fade-in-0`), not `@starting-style`. `@starting-style` is not yet Baseline Widely available (see AGENTS.md, Browser support). The keyframes ship already.
- **Width transition on the sidebar stays.** This is the only use of `width`: content beside the sidebar has to reflow, and `transform` can't do that. It happens a few times a day.
- **Not animated, on purpose:** the tab underline (moved with arrow keys, so keyboard-driven), nav link, table row, input and badge state (used dozens of times a day, or showing data), and button press (already `translate-y-px`).

## Dependency graph

```
T1 easing tokens
 ├── T2 mobile drawer   (uses --ease-drawer)
 ├── T3 sidebar collapse (uses ease-out)
 ├── T4 toast            (uses ease-out)
 └── T5 popups           (uses ease-out)
        └── T6 reduced motion (needs every motion in place to check)
```

T2–T5 are independent of each other once T1 is done.

---

## Phase 1: Foundation and highest risk

### Task 1: Easing tokens ✅

**Description:** Add the three curves to the `@theme` block in `src/index.css`. This overrides Tailwind's weak default `ease-out` and `ease-in-out` across the app.

**Acceptance criteria:**

- [x] `ease-out`, `ease-in-out` and `ease-drawer` utilities produce the curves above in the built CSS
- [x] Existing `ease-*` utility users (grep `ease-`) still look correct

**Verification:**

- [x] `pnpm build` then grep `dist/assets/*.css` for `cubic-bezier(.23,1,.32,1)`
- [x] `pnpm run check:fast`

**Dependencies:** None
**Files:** `src/index.css`
**Scope:** XS

### Task 2: Mobile drawer slides in and out ✅

**Description:** Keep the drawer mounted in `src/layouts/app-layout.tsx`. The panel slides with `translate-x` (`-100%` to `0`) and the backdrop fades with `opacity`, both `duration-300 ease-drawer`. Closed state: `inert`, `aria-hidden`, `invisible`. Name each transition property (`transition-[translate,visibility]`, `transition-[opacity,visibility]`), never `transition-all`.

**Acceptance criteria:**

- [x] Opening slides the panel from the left and fades the backdrop in; closing (Escape, backdrop click, nav click) reverses it
- [x] When closed, nothing in the drawer can be focused with Tab or seen by a screen reader
- [x] Existing tests in `app-layout.test.tsx` pass unchanged; new test asserts the closed drawer is `inert`

**Verification:**

- [x] `pnpm test -- app-layout`
- [x] Manual: `pnpm dev` at 375px width, open and close 3 ways. Watch at 5× slow-down in the DevTools Animations panel. Tab after closing must not land in the drawer.
- [x] `pnpm run check:task` (bundle budget included): passes under exception E2 (`--max 48000`, expires 2027-02-23)

**Dependencies:** T1
**Files:** `src/layouts/app-layout.tsx`, `src/layouts/app-layout.test.tsx`
**Scope:** S

**Notes:** Closed state is styled with `[&[inert]]:` on the wrapper (self only) and `inert:` on children. The visibility transition applies only on close; on open the drawer must be visible at once or `focus()` is ignored. Static class strings, no `cn()`: React Compiler cache slots cost ~200 B gzip.

### Checkpoint A (after T1–T2)

- [ ] `pnpm run check:task` green
- [ ] Drawer feel-checked on a real phone or device emulation
- [ ] Human review before Phase 2

---

## Phase 2: Sidebar collapse and existing motion fixes

### Task 3: Sidebar collapse without text squeeze ✅

**Description:** In `src/layouts/sidebar.tsx`: add `overflow-hidden` and `ease-out` to the `<aside>`. Add `whitespace-nowrap` and `animate-in fade-in-0 duration-200 ease-out` to the app name and nav labels. Replace the two chevrons with one `ChevronLeft` that rotates (`rotate-180` when collapsed, `transition-transform duration-200 ease-out`). Keep the current `aria-label`s.

**Acceptance criteria:**

- [x] Expanding: labels fade in on one line and never wrap while the width grows
- [x] Collapsing: no text overflow visible during the width transition
- [x] The toggle chevron rotates instead of being swapped; existing sidebar tests pass

**Verification:**

- [x] `pnpm test -- sidebar`
- [x] Manual: toggle at 5× slow-down; check the expanded state looks the same as before
- [x] `pnpm run check:fast` (bundle 46,932 B, +12 B; budget handled after T5)

**Dependencies:** T1
**Files:** `src/layouts/sidebar.tsx`
**Scope:** XS

### Task 4: Toast uses named properties ✅

**Description:** In `src/components/ui/toast.tsx:25`, replace `transition-all` with `transition-[translate,opacity]` and add `ease-out`. Keep `duration-200`. It enters and exits through the bottom.

**Acceptance criteria:**

- [x] No `transition-all` left in `src/` (grep)
- [x] Toast enters from and exits toward the bottom; `toast.test.tsx` passes

**Verification:**

- [x] `pnpm test -- toast`
- [ ] (pending: needs a real save, which creates data) Manual: trigger a save toast; fire two quickly and check the second one picks up mid-animation

**Dependencies:** T1
**Files:** `src/components/ui/toast.tsx`
**Scope:** XS

**Notes:** No unit test: class-only change, jsdom computes no transitions. Verified the compiled rule is `transition-property: translate, opacity` with `--tw-ease` from `ease-out`.

### Task 5: Popups use the strong ease-out ✅

**Description:** Add `ease-out` to popup classes in `dialog.tsx` (overlay and content), `popover.tsx`, `tooltip.tsx`, `dropdown-menu.tsx` (content and sub-content) and `select.tsx`. Raise `dropdown-menu` and `select` from `duration-100` to `duration-150`. Dialog, popover and tooltip keep `duration-100`. Leave `origin-(--transform-origin)` and dialog centering alone.

**Acceptance criteria:**

- [x] Every `animate-in` popup in `src/components/ui/` also has `ease-out`
- [x] Dropdown and select open in 150ms; others stay 100ms
- [x] Popups still scale from their trigger; dialog still scales from the center

**Verification:**

- [x] `pnpm test`
- [x] (dropdown, tooltip, popover verified in Chrome; select opens over its trigger, so `data-[align-trigger=true]:animate-none` turns its animation off on purpose; dialog has no consumers in the app) Manual: open each (donor dialog, calendar popover, row dropdown, select, collapsed sidebar tooltip) at 5× slow-down
- [x] `pnpm run check:fast`

**Dependencies:** T1
**Files:** `src/components/ui/{dialog,popover,tooltip,dropdown-menu,select}.tsx`
**Scope:** S (5 files, one-class edits)

**Notes:** Tooltip has no explicit duration; it uses the `tw-animate-css` default of 150ms, which is inside the 125–200ms range, so it was left as is.

### Checkpoint B (after T3–T5)

- [x] `pnpm run check:task` green, bundle 46,932 B within E2 limit of 48,000 B
- [ ] Light and dark theme spot-check
- [ ] Human review before Phase 3

---

## Phase 3: Reduced motion

### Task 6: Gentler reduced motion instead of none

**Description:** The global rule in `src/index.css:137` currently cuts every animation and transition to 0.01ms. Replace it with: no movement (`translate`, `scale` and `rotate` don't animate), but opacity fades stay. Approach: under `prefers-reduced-motion: reduce`, reset the `tw-animate-css` enter/exit translate and scale variables, and set `transition-property` to `opacity, visibility, color, background-color, border-color` on the elements T2–T5 touch. The drawer then fades in place instead of sliding.

**Acceptance criteria:**

- [x] With reduced motion on, nothing slides, scales or rotates, but popups, toast and drawer still fade
- [ ] Animations still end in the right state (drawer fully hidden, popups gone)
- [x] Rule is 20 lines or fewer, with no JS

**Verification:**

- [ ] Manual: DevTools Rendering panel, emulate `prefers-reduced-motion: reduce`, repeat the T2–T5 manual checks
- [x] `pnpm run check:task` (bundle 46,927 B, max 48,000 B)

**Dependencies:** T2, T3, T4, T5
**Files:** `src/index.css`
**Scope:** XS

**Status:** code and guard test (`tests/reduced-motion.test.ts`) committed. `check:task` green. Pending: browser check with reduced motion emulated.

### Checkpoint C (complete)

- [ ] All acceptance criteria met
- [ ] `pnpm run check:task` green
- [ ] Deep review with the `code-reviewer` agent
- [ ] PR (What / Why / Test plan)

---

## Risks and mitigations

| Risk                                                      | Impact                       | Mitigation                                                                                                       |
| --------------------------------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `inert` on an older device ignored                        | Med: closed drawer focusable | `inert` is Baseline Widely available as of 2025; `invisible` (visibility hidden) also blocks focus as a fallback |
| Overriding Tailwind `--ease-out` changes curves elsewhere | Low                          | T1 greps current `ease-` users and checks them                                                                   |
| Always-mounted mobile drawer renders a second `Sidebar`   | Low: one extra hidden nav    | Wrapper is `md:hidden`; measure with the bundle budget and React Profiler if needed                              |
| Feel can't be judged in jsdom                             | Med                          | Each task has a 5× slow-down manual check; feel-check again the next day                                         |
| T6 reset misses a `tw-animate-css` variable               | Low                          | Emulate reduced motion and open every popup                                                                      |

## Open questions

- T6: keep the current "no motion at all" rule instead? It's simpler and already passes WCAG 2.3.3. The gentler version follows the skill but adds CSS.
- Branch name: `feat-motion`?
