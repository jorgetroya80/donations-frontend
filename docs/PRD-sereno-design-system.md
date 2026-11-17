# PRD: Sereno design system

Status: proposed, not implemented. Owner: @jorgetroya80.
Design reference (canvas with tokens, components and screens): https://claude.ai/code/artifact/533bcba1-9427-4c7f-9d29-b63ee03ab22a

## Problem Statement

The app uses the default neutral token set: every surface, control and status is black, white or gray. There is no brand color, the primary action and the "active" status badge are both solid black, and field borders (`--input`) measure about 1.3:1 against the background, below the 3:1 that WCAG 2.2 SC 1.4.11 asks for the boundary of a form control.

A design direction called Sereno was chosen on the canvas above. It keeps the current structure (same token names, Geist, 10 px radius, 32 px controls) and changes only values: cool-tinted neutrals, a blue primary, darker field borders, and a chart palette validated for color-vision deficiency.

## Solution

Ship Sereno in two phases. Each phase is a separate PR and can stop there.

1. **Tokens.** Change values in `src/index.css`, including a blue focus ring. No component changes. The ring needs a narrow change to the quality bar first (see "Quality bar change for the ring").
2. **Components.** Small adjustments that the new values make necessary or that the canvas specifies.

Three defects found during the review do not depend on the palette. They moved to issue #218 and ship first.

## User Stories

1. As a treasurer, I want the primary action on each screen to stand out in color, so that I find it without reading every button.
2. As a user with low vision, I want field borders that reach 3:1 against the page, so that I can see where a field starts and ends.
3. As a user with a color-vision deficiency, I want chart colors that stay distinguishable, so that I can read the dashboard.
4. As a user in dark mode, I want the same hierarchy as in light mode, so that the app is equally usable at night.
5. As a developer, I want the change contained in token values first, so that it can be reviewed and reverted on its own.

## Implementation Decisions

### Phase 1: token values

Replace the values below. Names, the `@theme inline` block and `--radius` stay as they are. Keep the `oklch()` format already used in the file.

`:root`

| Token                                                       | Current                      | New                             | Hex equivalent |
| ----------------------------------------------------------- | ---------------------------- | ------------------------------- | -------------- |
| `--background`                                              | `oklch(1 0 0)`               | unchanged                       | `#FFFFFF`      |
| `--foreground`, `--card-foreground`, `--popover-foreground` | `oklch(0.145 0 0)`           | `oklch(0.21 0.032 264.66)`      | `#111827`      |
| `--card`, `--popover`                                       | `oklch(1 0 0)`               | unchanged                       | `#FFFFFF`      |
| `--primary`                                                 | `oklch(0.205 0 0)`           | `oklch(0.47 0.204 264.25)`      | `#1C4BCB`      |
| `--primary-foreground`                                      | `oklch(0.985 0 0)`           | `oklch(1 0 0)`                  | `#FFFFFF`      |
| `--secondary`, `--muted`, `--accent`                        | `oklch(0.97 0 0)`            | `oklch(0.97 0.006 264.53)`      | `#F3F5F9`      |
| `--secondary-foreground`, `--accent-foreground`             | `oklch(0.205 0 0)`           | `oklch(0.21 0.032 264.66)`      | `#111827`      |
| `--muted-foreground`                                        | `oklch(0.556 0 0)`           | `oklch(0.502 0.029 263.18)`     | `#5B6475`      |
| `--destructive`                                             | `oklch(0.577 0.245 27.325)`  | `oklch(0.505 0.19 27.52)`       | `#B91C1C`      |
| `--success`                                                 | `oklch(0.627 0.194 149.214)` | `oklch(0.448 0.108 151.33)`     | `#166534`      |
| `--border`                                                  | `oklch(0.922 0 0)`           | `oklch(0.911 0.012 259.82)`     | `#DDE2EA`      |
| `--input`                                                   | `oklch(0.922 0 0)`           | `oklch(0.631 0.03 262.28)`      | `#808A9C`      |
| `--ring`                                                    | `oklch(0.45 0 0)`            | `oklch(0.491 0.216 264.52)`     | `#1F4FD8`      |
| `--chart-1`                                                 | `oklch(0.65 0.18 230)`       | `oklch(0.491 0.216 264.52)`     | `#1F4FD8`      |
| `--chart-2`                                                 | `oklch(0.65 0.18 142)`       | `oklch(0.619 0.176 40.69)`      | `#D9571F`      |
| `--chart-3`                                                 | `oklch(0.65 0.2 60)`         | `oklch(0.578 0.116 166.91)`     | `#0E8F6B`      |
| `--chart-4`                                                 | `oklch(0.65 0.18 300)`       | `oklch(0.555 0.214 301.16)`     | `#8B46D9`      |
| `--chart-5`                                                 | `oklch(0.65 0.2 25)`         | `oklch(0.562 0.186 355.21)`     | `#C2367A`      |

`.dark`

| Token                                                                                                        | Current                      | New                             | Hex equivalent |
| ------------------------------------------------------------------------------------------------------------ | ---------------------------- | ------------------------------- | -------------- |
| `--background`                                                                                               | `oklch(0.145 0 0)`           | `oklch(0.192 0.026 266.62)`     | `#0F1420`      |
| `--foreground`, `--card-foreground`, `--popover-foreground`, `--secondary-foreground`, `--accent-foreground` | `oklch(0.985 0 0)`           | `oklch(0.966 0.007 260.73)`     | `#F1F4F9`      |
| `--card`, `--popover`                                                                                        | `oklch(0.205 0 0)`           | `oklch(0.244 0.033 263.67)`     | `#182030`      |
| `--primary`                                                                                                  | `oklch(0.922 0 0)`           | `oklch(0.726 0.141 267.25)`     | `#7FA2FF`      |
| `--primary-foreground`                                                                                       | `oklch(0.205 0 0)`           | `oklch(0.204 0.056 266.29)`     | `#0B1530`      |
| `--secondary`, `--muted`, `--accent`                                                                         | `oklch(0.269 0 0)`           | `oklch(0.293 0.038 262.83)`     | `#222C3F`      |
| `--muted-foreground`                                                                                         | `oklch(0.708 0 0)`           | `oklch(0.719 0.03 261.45)`      | `#9AA5B8`      |
| `--destructive`                                                                                              | `oklch(0.704 0.191 22.216)`  | `oklch(0.759 0.144 26.08)`      | `#FF8A80`      |
| `--success`                                                                                                  | `oklch(0.792 0.209 151.711)` | `oklch(0.84 0.149 155.5)`       | `#6EE7A0`      |
| `--border`                                                                                                   | `oklch(1 0 0 / 10%)`         | `oklch(0.324 0.035 261.97)`     | `#2A3446`      |
| `--input`                                                                                                    | `oklch(1 0 0 / 15%)`         | `oklch(0.571 0.04 262.67)`      | `#6B7890`      |
| `--ring`                                                                                                     | `oklch(0.85 0 0)`            | `oklch(0.726 0.141 267.25)`     | `#7FA2FF`      |
| `--chart-1`                                                                                                  | `oklch(0.72 0.18 230)`       | `oklch(0.656 0.157 262.93)`     | `#5C8DF0`      |
| `--chart-2`                                                                                                  | `oklch(0.72 0.18 142)`       | `oklch(0.641 0.16 43.94)`       | `#D9662E`      |
| `--chart-3`                                                                                                  | `oklch(0.72 0.2 60)`         | `oklch(0.621 0.128 163.11)`     | `#199E70`      |
| `--chart-4`                                                                                                  | `oklch(0.72 0.18 300)`       | `oklch(0.67 0.145 286.83)`      | `#9085E9`      |
| `--chart-5`                                                                                                  | `oklch(0.72 0.2 25)`         | `oklch(0.622 0.171 0.84)`       | `#D55181`      |

The ring follows the canvas primary (`#1F4FD8`), not the phase 1 stopgap `#1C4BCB`, so it does not change again in phase 2. Update the two ring comments in `src/index.css`: light becomes `6.63:1 on --background, 6.07:1 on --muted`, dark becomes `6.61:1 on --card, 7.46:1 on --background`. The same numbers replace the comments above the two assertions in `tests/focus-ring.test.ts`.

### Constraints for phase 1

- **The ring change goes through the quality bar.** `tests/focus-ring.test.ts:43,45` pin `--ring: oklch(0.45 0 0)` and `--ring: oklch(0.85 0 0)`. Updating them removes two lines containing `expect(`, which `scripts/floor-guard.mjs` flags as `assertion-removed`, and `CONSTRAINTS.md` has no route for that today. See "Quality bar change for the ring" below.
- **The primary is `#1C4BCB`, not the `#1F4FD8` shown on the canvas.** Buttons use `hover:bg-primary/80`. With `#1F4FD8`, white text on the 80% mix measures 4.38:1; with `#1C4BCB` it measures 4.65:1. `--chart-1` keeps `#1F4FD8`, which is the value the chart palette was validated with.
- **Do not add new tokens in this phase.** `--warning`, `-soft` and `-hover` tokens exist on the canvas but nothing in the code reads them yet. They belong to phase 2.

### Quality bar change for the ring

Owner decision, 2026-11-17: the ring turns blue in phase 1, and the floor bullet gets a narrow route for replacing an assertion. Lands as the first commit of the phase 1 PR, before the token commit.

1. **Reword the floor bullet** in `CONSTRAINTS.md`. Current text:

   > No skipped or deleted tests: no new `.skip`, `.todo` or `xit`, no deleted test files, no removed assertions. The floor guard blocks each one. There is no exception route for a single test.

   New text:

   > No skipped or deleted tests: no new `.skip`, `.todo` or `xit`, no deleted test files, no removed assertions. The floor guard blocks each one. One route exists, for an assertion whose expected value must change: replace it in the same commit with one that checks at least as much, and add the trailer `Assertion: <test file path>`. The floor guard then accepts removed assertions in that file only when the commit adds at least as many. A reviewer other than the author approves it.

   The commit carries `Floor: <old bullet text>` as `CONSTRAINTS.md` requires.
2. **Teach the guard the new trailer.** In `scripts/floor-guard.mjs`, collect `Assertion: <path>` trailers from branch commit messages, like `Exception:` and `Floor:`. For an approved path, skip `assertion-removed` when that file's added assertions are at least its removed ones. Anything else still fails.
3. **Token commit.** Change the two `--ring` values and their comments, and replace the two pinned strings in `tests/focus-ring.test.ts` with the new values. The commit carries `Assertion: tests/focus-ring.test.ts`.

Approval: both trailers are approval records. The author does not write them for themself; a second reviewer approves them on the PR (Open Question 1). Until then, phase 1 cannot merge.

### Calculated contrast (phase 1 values)

Ratios are computed from the token values with the WCAG formula. They are not measured in a browser. Hover ratios assume the browser composites the 80% primary over `--background` in sRGB. Recomputed on 2026-11-17 by script; every hex equivalent and ratio below matched. Where background and card differ, the lower ratio is shown.

| Pair                                                    | Light  | Dark    |
| ------------------------------------------------------- | ------ | ------- |
| `foreground` on `background`                            | 17.7:1 | 16.7:1  |
| `muted-foreground` on `background` / `card`             | 5.95:1 | 6.55:1  |
| `muted-foreground` on `muted`                           | 5.46:1 | 5.62:1  |
| `primary-foreground` on `primary`                       | 7.21:1 | 7.31:1  |
| `primary-foreground` on `primary` at 80% (button hover) | 4.65:1 | 5.08:1  |
| `destructive` on `background` / `card`                  | 6.48:1 | 7.12:1  |
| `success` on `background` / `card`                      | 7.13:1 | 10.56:1 |
| `input` (field border) on `background`                  | 3.49:1 | 4.14:1  |
| `input` (field border) on `muted`                       | 3.20:1 | 3.15:1  |
| `input` (field border) on `card`                        | 3.49:1 | 3.66:1  |
| `ring` on `background`                                  | 6.63:1 | 7.46:1  |
| `ring` on `muted`                                       | 6.07:1 | 5.68:1  |
| `ring` on `card`                                        | 6.63:1 | 6.61:1  |

### Known side effects of phase 1

These follow from `--input` becoming a solid mid-gray and `--primary` turning blue. They are expected, not regressions, and phase 2 removes all three (items 1, 5 and 6).

- Disabled fields use `disabled:bg-input/50` and `dark:disabled:bg-input/80` (`input.tsx`, `textarea.tsx`; `select.tsx` has neither). Their background becomes a visibly darker gray, about `#C0C4CE` in light mode.
- In dark mode, `input.tsx`, `textarea.tsx`, `select.tsx` and the outline variant of `button.tsx` use `dark:bg-input/30` (and `dark:hover:bg-input/50` on select and outline button), so they read as filled boxes instead of outlined ones.
- `Badge` default (`bg-primary`) turns blue. It is the "Activo" status in the donors and users tables.

### Phase 2: component adjustments

1. **Disabled field background.** In `input.tsx` and `textarea.tsx`, replace `disabled:bg-input/50` with `disabled:bg-muted` and remove `dark:disabled:bg-input/80` (`--muted` already has a dark value). `select.tsx` sets no disabled background and stays as is. Reason: `--input` is now a border color, too dark to double as a fill.
2. **Hover token for the primary button.** Add `--primary-hover` (`#1A43B8` light, `#9DB8FF` dark) with its `--color-primary-hover` mapping, and use `hover:bg-primary-hover` instead of `hover:bg-primary/80` in `button.tsx` (default variant) and `[a]:hover:bg-primary/80` in `badge.tsx` (default variant, when rendered as a link). This removes the dependency between the primary value and the hover contrast. In the same PR, move `--primary` (light) to `#1F4FD8` (`oklch(0.491 0.216 264.52)`), the canvas value. Token values: `--primary-hover` is `oklch(0.437 0.19 264.58)` light and `oklch(0.789 0.106 267.95)` dark. Contrast: white on `#1F4FD8` 6.63:1, white on `#1A43B8` 8.27:1, `#0B1530` on `#9DB8FF` 9.22:1.
3. **Warning status.** Add `--warning` (`#92400E` light, `#FBBF24` dark) and `--warning-soft` (`#FEF3C7` light, `#3D2E0A` dark) only when a component needs them. Today none does; skip this item if that is still true.
4. **Amount columns right-aligned.** In `expenses-page.tsx` and `donations-page.tsx`, the amount `TableCell` gets `text-right`, with `tabular-nums` already applied on `body`. The amount header is a `SortableTh`, whose label sits in a `flex` button, so `text-right` on the `<th>` does not move it. Add an alignment option to `sortable-th.tsx` (default unchanged) that also right-aligns the button. Reason: figures are compared by column.
5. **Outlined fields in both themes.** Inputs, selects, textareas and outline buttons get a transparent background in both themes:
   - Remove `dark:bg-input/30` from `input.tsx`, `textarea.tsx`, `select.tsx` and the outline variant of `button.tsx`. The outline button's `bg-background` becomes `bg-transparent`.
   - Field border is `--input` alone: 4.13:1 on the dark page, 3.66:1 on dark cards.
   - Field hover: no background change. Remove `dark:hover:bg-input/50` from `select.tsx`. Focus is signalled by the ring.
   - Outline button hover and `aria-expanded`: `bg-muted` in both themes. Remove `dark:hover:bg-input/50`. The dark border measures 3.14:1 against `--muted`.
   - Disabled: `bg-muted`, as in item 1.
6. **Soft green status badge.** Add `--success-soft` (`#E7F6EC`, `oklch(0.959 0.021 156.82)` light; `#123524`, `oklch(0.298 0.051 159.7)` dark) and its `--color-success-soft` mapping. Add a `success` variant to `badge.tsx`: `bg-success-soft text-success` (6.38:1 light, 8.72:1 dark). Use it for "Activo" in `donors-page.tsx` and `users-page.tsx`. Inactive states use `secondary`. That changes "Inactivo" in `users-page.tsx`, which is `destructive` today. The solid `default` pill stays in the component, but no status uses it.

Not in the code today and specified only on the canvas (build on demand, not as part of this PRD): `Stat` with link, `Ranking`, `Combobox`, `CheckboxGroup`. The existing `StatCard`, `CategoryRanking` and `DonorPicker` already cover those roles.

## Testing Decisions

- Every phase: `pnpm run check:task` passes, and its real result is reported. Do not weaken `CONSTRAINTS.md` or any test to get there.
- Phase 1 changes no application TypeScript. Coverage and bundle budget must be unaffected. `tests/focus-ring.test.ts` keeps both ring assertions, pinned to the new values. The floor guard change is verified by running it against the branch: it passes with the `Assertion:` trailer and fails with it removed.
- Phase 2 item 2 touches `button.tsx`: `tests/focus-ring.test.ts` scans `src` for alpha-reduced ring classes, so keep ring classes at full opacity.
- Phase 2 item 6: a test that "Activo" renders with the `success` variant and "Inactivo" with `secondary` (donors and users pages, or `badge.tsx` if the pages' tests don't cover status).
- Color contrast cannot be asserted in jsdom. `CONSTRAINTS.md` lists it as deferred (Playwright + axe against `pnpm preview`). Until that exists, verify contrast by hand in both themes on: login, dashboard, one list page, one form page.

## Success Criteria

Phase 1:

- `git diff main --stat` lists only `src/index.css`, `tests/focus-ring.test.ts`, `CONSTRAINTS.md` and `scripts/floor-guard.mjs`.
- Every token in the two tables has its new value, the ring included.
- `tests/focus-ring.test.ts` has as many assertions as on `main`.
- The floor guard fails if the `Assertion:` trailer is removed from the branch.
- `pnpm run check:task` passes.
- Manual check in light and dark on login, dashboard, one list page and one form page: field borders visible, primary actions blue, no unreadable text.

Phase 2:

- No `bg-input/` class of any kind and no `bg-primary/80` in `src/components/ui/`.
- `--primary` light is `#1F4FD8`; text on `--primary-hover` reaches 4.5:1 in both themes (ratios stated in the PR).
- Fields, selects, textareas and outline buttons are outlined, with no fill, in both themes.
- "Activo" is a soft green pill and "Inactivo" a `secondary` pill on the donors and users lists.
- Amount header and cells align right on the donations and expenses lists; other `SortableTh` columns render as before.
- `pnpm run check:task` passes, including changed-line coverage for `sortable-th.tsx`.

## Boundaries

Commands, structure, code style and test conventions: `AGENTS.md`. Quality bar: `CONSTRAINTS.md`.

- **Always:** keep token names and `oklch()` format; run `pnpm run check:task` and report its real result; one branch and PR per phase.
- **Ask first:** any test or floor change beyond the ring route above; adding a token that no component reads; any design change beyond the Decisions section; anything that grows the entry bundle.
- **Never:** weaken a test, threshold or floor bullet to get to green; add a dependency or a wrapper around `@base-ui/react`.

## Out of Scope

- Changing control height. The app already uses 32 px (`h-8`), which is what Sereno specifies.
- Typography, radius, spacing and layout changes.
- The date range picker and calendar as components, (the locale fix is in #218).
- New components from the canvas that have no current use in the app.

## Decisions

Answered by the designer on 2026-11-17. The canvas was updated to match. Ratios rechecked by script.

1. **Primary.** Target `#1F4FD8`. Phase 1 ships `#1C4BCB` as a stopgap; phase 2 item 2 switches to `#1F4FD8` together with `--primary-hover`.
2. **"Activo" badge.** Soft green `success` variant with `--success-soft`. Inactive uses `secondary`. Solid primary pill is not for statuses. Phase 2 item 6.
3. **Fields.** Outlined, transparent background in both themes. Phase 2 item 5.
4. **Donor search.** Clear button inside the field, password-toggle pattern, focus returns to the input. Tracked in #218.
5. **Focus ring.** Blue, following the canvas primary: `#1F4FD8` light, `#7FA2FF` dark (owner, 2026-11-17). Ships in phase 1 through a narrow floor change; see "Quality bar change for the ring".

## Open Questions

1. **Reviewer for the quality bar change.** Who approves the `Floor:` and `Assertion:` trailers? It must not be the author. Phase 1 cannot merge until this is answered. Owner.

## Further Notes

- A visual check was done once: phase 1 values were applied locally with the dev server running, viewed in light and dark on the dashboard, donors list and new-donation form, then reverted. Nothing was committed. `check:task` was not run.
- Workflow: branch from `main` (the `pre-push` hook blocks pushes to it), Conventional Commits, one PR per phase. Suggested subjects: `style(ui): apply Sereno token values`, `style(ui): adjust controls for Sereno tokens`.
- The chart palette replaces the one from `docs/PRD-design-tokens.md`. Only `--chart-1` is referenced in `src` today (`category-ranking.tsx`).
