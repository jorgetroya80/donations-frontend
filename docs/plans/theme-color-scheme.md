# Implementation Plan: Theme follows the system and drives `color-scheme`

Source: modern-web-guidance `legacy-scan` finding F1 (`dark-mode-toggle`, `index.html:14`). Report: `/private/tmp/claude-501/-Users-jorge-code-donations-frontend/40a133d9-7ddf-4149-916a-1daaadcf94b1/scratchpad/modernization-report.md`.

## Overview

The header toggle sets `.dark` on `<html>` and saves the result in `localStorage`. There are three problems:

1. **Bug.** `ThemeProvider` writes `theme` to `localStorage` on the first mount (`src/features/theme/theme-context.tsx:35-38`). The first visit therefore pins whatever the OS scheme was at that moment, and the app stops following the system after that.
2. **Native UI is always light.** `color-scheme` is not set anywhere. In dark mode, scrollbars, `<select>` popups, date inputs and autofill render light.
3. **No live sync.** An OS scheme change while the app is open is ignored, and so is a toggle made in another tab.

Target behaviour, from the guide's two-state model:

- No stored value means follow the system. This is the default.
- Toggling picks the opposite of the scheme currently on screen. The choice is stored only when it differs from the system preference. If it matches, the key is removed.
- A stored value is never cleared just because the OS later switches to match it.

## Decisions (agreed 2026-11-17)

- **Bug-pinned users: option C, smart migration.** The key stays `theme`. A marker key, `theme-migrated`, records that a stored value is a deliberate override. On load, a `theme` value without the marker is handled once:
  - It equals the current OS scheme: drop it. It is most likely the bug, and dropping it causes no visible change.
  - It differs from the current OS scheme: keep it as the override, since it is most likely a deliberate choice.
  - Then set the marker. The toggle also sets the marker whenever it stores an override.

  The migration is about 5 lines in `theme-context.tsx` and is marked for removal after 2027-05-17.

  _Changed 2026-11-17 during T2:_ the first version renamed the key to `color-scheme`. That changed an existing assertion on `theme`, which the floor guard counts as a removed assertion, with no exception route. Keeping the key avoids that, and also leaves `index.html` and the CSP hash untouched in T2.

- **Browser support policy: Baseline Widely available.** Some users are on locked-down (managed) devices that may run browsers older than current. The policy goes in `AGENTS.md` (T1).
- **`color-scheme` set inline on `<html>` by JS** (the "optional extra"). This works on any browser that supports `color-scheme`, with no reliance on `:has()`. Consequence: the guide's CSS rule `:root:has(meta[content=…])` would never apply when JS runs, and without JS the meta default `light dark` already covers it. **So there is no `:has()` mapping and no change to `src/index.css`.** Verified: no dependency (Tailwind preflight, tw-animate-css, base-ui) declares `color-scheme`.
- **`<meta name="color-scheme">` is kept** and stays in sync with the inline style. It provides the no-JS default (`light dark`), follows the guide's model, and clears the scanner rule.
- **Two-state toggle, kept in the header.** There is no settings page, and the guide accepts two states for a toggle in the page chrome.
- **Keep the `.dark` class.** Tailwind `@custom-variant dark` and the `.dark` token block depend on it. One `applyScheme()` helper sets `.dark`, the meta content and `style.colorScheme` together.
- **Keep the `getInitialTheme` export and its tests** (the floor guard forbids removed assertions). Add new tests rather than rewriting old ones.
- **The inline `<script>` stays classic,** without `type=module` or `defer`, and as small as possible. Its `catch` must not be empty (floor guard). Editing it changes its hash, so update `script-src` in `security-headers.conf` (`tests/csp-inline-script.test.ts` catches drift).
- **No new dependencies, and no `useMemo` or `useCallback`** (React Compiler).

## Dependency Graph

```
AGENTS.md browser policy (T1)                independent, docs only
key migration + store-only-overrides (T2)    theme-context only; index.html unchanged
    └── color-scheme meta + inline style (T3)      applyScheme() writes from the resolved scheme T2 produces
            └── live OS + cross-tab sync (T4)       sync calls applyScheme()
                    └── manual check, rescan, PR (T5)
```

## Task List

### Phase 1: Policy and core bug fix

- [x] T1: Document browser support policy in `AGENTS.md`
- [x] T2: Store theme only as an override, migrate the old key

### Phase 2: Native UI

- [x] T3: Drive `color-scheme` from JS (meta and inline style)

### Checkpoint A (after T1 to T3)

- [x] `pnpm run check:task` is green, entry bundle within budget
- [x] Fresh profile: nothing stored until the toggle is clicked
- [x] Dark mode: scrollbar, select, date picker and autofill render dark (visual check moved to T5; computed values verified)
- [x] Human review before T4

### Phase 3: Sync and ship

- [x] T4: Follow OS changes and other tabs live
- [ ] T5: Manual verification, legacy-scan rerun, PR

### Checkpoint: Complete

- [ ] All acceptance criteria met
- [x] `legacy-scan .` reports 0 for `dark-mode-toggle`
- [ ] PR open with What / Why / Test plan

## Risks and Mitigations

| Risk                                                                               | Impact | Mitigation                                                                                                                        |
| ---------------------------------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------- |
| The migration guesses wrong (the user's OS scheme changed since their first visit) | Low    | At worst the user clicks the toggle once. Tests cover both branches.                                                              |
| The migration code lingers forever                                                 | Low    | Comment with a removal date (for example 2027-05).                                                                                |
| `.dark`, the meta and the inline style drift apart                                 | Med    | Only `applyScheme()` writes them. Tests assert all three after each transition.                                                   |
| FOUC if the inline script and React disagree                                       | Med    | The script and `getInitialTheme` use the same keys and rules, with a "keep in sync" comment. Hard reload checked in both schemes. |
| Locked-down browser lacks `color-scheme` support                                   | Low    | The property is ignored. Native controls stay light and colours still follow `.dark`. Nothing breaks.                             |
| `matchMedia` and `storage` listeners leak                                          | Low    | Removed in cleanup. Tested on unmount.                                                                                            |
| Changed-line coverage on `index.html`                                              | Low    | It is not instrumented. The TS logic carries the coverage.                                                                        |

## Open Questions

- **Version floor for the locked-down devices** (for example "Chrome 120, Firefox ESR 128"). It is unknown for now. The policy says "Baseline Widely available" without a version. Add one when known.

## Tasks

Branch first (for example `fix/theme-color-scheme`). `main` is blocked by pre-push.

### Task 1: Document browser support policy in `AGENTS.md`

**Description:** Add a **Browser support** entry under Conventions:

> **Browser support.** Target Baseline Widely available. Some users run locked-down devices with older browsers. A newer feature is allowed only behind feature detection with graceful degradation, a fallback of ≤ 20 lines and no new runtime dependency or polyfill.

**Acceptance criteria:**

- [x] The entry exists under Conventions and has 3 lines or fewer
- [x] It states the target, the reason (locked-down devices) and the rule for newer features

**Verification:**

- [x] `pnpm run check:fast` is green

**Dependencies:** None
**Files likely touched:** `AGENTS.md`
**Estimated scope:** XS

### Task 2: Store theme only as an override, migrate the old key

**Description:** Keep the storage key `theme`, but treat it as an override only: no stored value means follow the system. Remove the unconditional write on mount. `toggleTheme` sets the target to the opposite of the resolved scheme: if the target equals the OS preference, remove the key; otherwise store it and set the marker `theme-migrated`. Run a one-time migration on load: a `theme` value without the marker that equals the OS scheme is dropped, one that differs is kept, and the marker is set. Add a removal-date comment.

**Acceptance criteria:**

- [x] First mount with no stored value writes nothing
- [x] Toggling away from the OS scheme stores it; toggling back removes it; a stored value is kept after the OS changes to match it
- [x] Migration: an unmarked value equal to the OS is dropped, one that differs is kept, and the marker is set afterwards

**Verification:**

- [x] New tests in `src/features/theme/theme-context.test.ts` for each criterion; no existing assertion removed
- [x] `pnpm run check:task` is green
- [x] Manual check: a fresh profile has no key after reload; a profile with `theme=dark` and OS dark has no `theme` key afterwards and still renders dark (checked in Chrome via DevTools during T3)

**Dependencies:** None
**Files likely touched:** `src/features/theme/theme-context.tsx`, `src/features/theme/theme-context.test.ts`
**Estimated scope:** S

### Task 3: Drive `color-scheme` from JS (meta and inline style)

**Description:** Add `<meta name="color-scheme" content="light dark">` to `index.html`, placed before the inline script. The script sets the meta content to the stored value or `light dark`, sets `document.documentElement.style.colorScheme` to the same value, and adds `.dark` when resolved dark. The `localStorage` read goes inside a try/catch whose `catch` is not empty. In `theme-context.tsx`, a single `applyScheme(theme)` helper writes `.dark`, the meta content and `style.colorScheme`, reading the override from storage. Update the script hash in `security-headers.conf`. Do not change `src/index.css` and do not add a `:has()` mapping (see the plan's decisions).

**Acceptance criteria:**

- [x] With no override: meta `light dark`, `style.colorScheme` `light dark`, `.dark` matches the OS
- [x] With an override: meta and `style.colorScheme` equal the override, and `.dark` matches it
- [x] Without JS the page still follows the OS scheme (meta default)

**Verification:**

- [x] Tests assert the meta content, the inline style and the class after mount and after each toggle
- [x] `pnpm run check:task` is green, entry bundle ≤ 46,816 B gzip (46,712 B)
- [x] Manual check (`pnpm preview`): dark override with OS light shows a dark scrollbar, `<select>` and date picker; a hard reload in both schemes shows no flash. Partly done: Chrome computed `color-scheme` matches the override and the system default, and the console is clean. The visual check of native controls and flash is still open (moved to T5).

**Dependencies:** T2
**Files likely touched:** `index.html`, `security-headers.conf`, `src/features/theme/theme-context.tsx`, `src/features/theme/theme-context.test.ts`
**Estimated scope:** S

### Checkpoint A: After T1 to T3

- [x] `pnpm run check:task` is green
- [x] Core flow works: system mode, override, back to system, migration
- [x] Human review before T4

### Task 4: Follow OS changes and other tabs live

**Description:** Subscribe to the `matchMedia('(prefers-color-scheme: dark)')` `change` event, so that with no override the UI re-resolves. Listen for the `window` `storage` event (any key; filtering by key cost the last bytes of the bundle budget, and an unrelated write only re-applies the same theme), so a toggle in one tab applies to the others. Both call `applyScheme()`. Clean up on unmount. Prefer `useSyncExternalStore` if it keeps the code smaller.

**Acceptance criteria:**

- [x] With no override, an OS change updates `theme`, `.dark`, the meta and the inline style without a reload
- [x] With an override, an OS change does nothing
- [x] A `storage` event from another tab applies the new value or the removal

**Verification:**

- [x] Tests fire a mocked `matchMedia` change and a `StorageEvent`, and assert that listeners are removed on unmount
- [x] `pnpm run check:task` is green
- [x] Manual check (moved to T5): two tabs, toggle in one and the other follows; switching the OS appearance changes the app when not overridden

**Dependencies:** T3
**Files likely touched:** `src/features/theme/theme-context.tsx`, `src/features/theme/theme-context.test.ts`, possibly `src/test/setup.ts`
**Estimated scope:** S

### Task 5: Manual verification, legacy-scan rerun, PR

**Description:** Run the end-to-end check in a real browser, rerun the scanner and open the PR.

**Acceptance criteria:**

- [x] `npx -y modern-web-guidance@latest legacy-scan . --json` reports no `dark-mode-toggle` finding
- [x] The guide's 4-step scenario behaves as specified (OS light, toggle, OS dark, OS light, toggle)
- [ ] PR opened with a What / Why / Test plan body and a `fix(theme): …` title

**Verification:**

- [ ] `pnpm run check:task` result pasted in the PR
- [ ] `code-reviewer` agent pass before merge

**Dependencies:** T4
**Files likely touched:** none (PR only)
**Estimated scope:** XS

### Checkpoint: Complete

- [ ] All acceptance criteria above are checked
- [ ] Ready for human review and merge
