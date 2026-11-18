# PRD: Sereno destructive alert

Status: spec reviewed against code 2026-11-18, not implemented. Owner: @jorgetroya80.
Parent spec: `docs/PRD-sereno-design-system.md`. Plan it extends: `docs/plans/sereno-design-system.md`.
Design reference: https://claude.ai/code/artifact/533bcba1-9427-4c7f-9d29-b63ee03ab22a (component "Alert", tone "danger"; screen "Acceso").

## Problem Statement

The Sereno PRD changed token values (#219) and control styles (#220), but it never covered `src/components/ui/alert.tsx`. The destructive alert still has its pre-Sereno shape: card background, the general gray border, and red text for both icon and message. On the canvas, the same alert is a soft red block with no border, a red icon and the message in the normal text color.

The gap is visible on every error state: login, list loading errors, create and edit forms, reports and the dashboard. `Alert variant="destructive"` is used in 25 places, so the fix belongs in the component, not in the pages.

## Solution

Add one token, `--destructive-soft`, and restyle the `destructive` variant of `Alert` to use it. No page changes. The `default` variant is not touched.

## User Stories

1. As a user who submits a form with an error, I want the error message to stand out from the form around it, so that I notice it before I try again.
2. As a user with low vision, I want the message text in a high-contrast color, so that I can read it without effort.
3. As a developer, I want every destructive alert to change from one place, so that error states stay consistent.

## Implementation Decisions

### Token

Add to `src/index.css`, next to `--destructive`, with the `@theme inline` mapping next to `--color-destructive`:

| Token                                           | `:root`                    | `.dark`                    | Hex equivalent        |
| ----------------------------------------------- | -------------------------- | -------------------------- | --------------------- |
| `--destructive-soft`                            | `oklch(0.957 0.018 17.48)` | `oklch(0.298 0.069 22.15)` | `#FDECEC` / `#4A1D1D` |
| `--color-destructive-soft` (in `@theme inline`) | `var(--destructive-soft)`  |                            |                       |

Follow the pattern `--success-soft` already uses (#220).

### Variant

In `alertVariants`, the `destructive` entry changes as follows. Base classes stay as they are.

| Part                    | Today                                                 | New                                               |
| ----------------------- | ----------------------------------------------------- | ------------------------------------------------- |
| Background              | `bg-card`                                             | `bg-destructive-soft`                             |
| Border                  | inherits `border` (gray `--border`)                   | `border-transparent`                              |
| Text color of the alert | `text-destructive`                                    | `text-foreground`                                 |
| `AlertDescription` text | `*:data-[slot=alert-description]:text-destructive/90` | `*:data-[slot=alert-description]:text-foreground` |
| Icon                    | `*:[svg]:text-current`                                | `*:[svg]:text-destructive`                        |

Why the description override is needed: `AlertDescription` sets `text-muted-foreground` on itself, so without an override it would render gray on the soft red fill.

Why the icon class works although the base keeps `*:[svg]:text-current`: `Alert` passes the cva output through `cn()`, and tailwind-merge keeps the last of two `*:[svg]:text-*` classes, so `text-destructive` wins. The same applies to `bg-card` and `text-destructive`, which the new classes replace outright.

Why `border-transparent` and not removing `border` from the base: the `default` variant keeps its border, and a transparent border keeps the height of both variants identical.

### Contrast (calculated with the WCAG formula, not measured in a browser; recomputed in review from the OKLCH values, matches within 0.03)

| Pair                                             | Light   | Dark    |
| ------------------------------------------------ | ------- | ------- |
| Message (`--foreground`) on `--destructive-soft` | 15.53:1 | 12.83:1 |
| Icon (`--destructive`) on `--destructive-soft`   | 5.66:1  | 6.20:1  |

Both pass 4.5:1 for text and 3:1 for the icon.

### Usages to check, not to change

- `src/features/auth/login-page.tsx`: icon plus `AlertDescription`. The fields keep `aria-describedby="login-error"`.
- `src/features/donors/donor-picker.tsx`: passes `className="border-0"`. Still valid; it now also shows the soft fill inside the dropdown. Confirm it reads well there.
- `src/features/donations/donation-create-page.tsx`: `AlertDescription` with a flex layout and extra content. Confirm any link or button inside keeps its own color and stays readable on the fill. In review: the duplicate warning holds a primary `Button`, which sets its own background and text color, so the description override does not reach it.
- `src/features/settings/change-password-page.tsx`: uses `Alert` with the `default` variant in two places (forced rotation notice, success message). They must not change. The same page also has one `destructive` alert for API errors, which does change.

### Constraints

- Do not touch focus ring classes. `tests/focus-ring.test.ts` scans `src` for alpha-reduced ring classes; the variant keeps `focus-visible` handling as it is.
- Do not add `info`, `success` or `warning` alert variants. Nothing uses them.
- No new wrapper around `@base-ui/react` (AGENTS.md). This is a class change in an existing component.

## Testing Decisions

- `pnpm run check:task` passes, and its real result is reported. Do not weaken `CONSTRAINTS.md` or any test.
- There is no `alert.test.tsx` today, and none is needed for coverage: `vitest.config.ts` excludes `src/components/ui/**`, so `scripts/changed-line-coverage.mjs` skips `alert.tsx`, and `index.css` is not executable. Do not add a test that only asserts class strings.
- Contrast cannot be asserted in jsdom (`CONSTRAINTS.md`, Deferred). Check by hand in light and dark on: login with wrong credentials, a list page with the API stopped, the new-donation form with a server error, and the donor picker with a search error.

## Success Criteria

1. `src/index.css` defines `--destructive-soft` in `:root` and `.dark` with the values above, and `--color-destructive-soft` in `@theme inline`.
2. The `destructive` entry of `alertVariants` renders a soft red fill, a transparent border, a red icon and the message in `--foreground`, in both themes.
3. The `default` variant string, the base classes and every page file are unchanged (`git diff --stat` lists only the two files).
4. The four usages above, checked by hand in light and dark, read as described.
5. `pnpm run check:task` passes.

## Boundaries

- Always: change only `src/index.css` and the `destructive` entry in `src/components/ui/alert.tsx`; report the real `check:task` result.
- Ask first: any change to a page, to the `default` variant or to the base classes; any new token beyond `--destructive-soft`.
- Never: weaken `CONSTRAINTS.md` or a test; add alert variants; touch focus ring classes.

## Out of Scope

- The `default` alert variant.
- Alert titles, actions and dismiss buttons: the component already supports them through `AlertTitle` and `AlertAction`.
- Toasts (`toast.tsx`), which have their own styles.
- The two remaining items of issue #218 (toolbar wrap on donations and expenses, donor search clear button inside the field). They ship with that issue.

## Further Notes

- Workflow: branch from `main`, Conventional Commits, one PR. Suggested subject: `style(ui): soft fill for destructive alerts`. PR body: What / Why / Test plan, with before and after screenshots of the login error in both themes.
- Add this as Task 7 to `docs/plans/sereno-design-system.md` if you keep the plan as the single tracker.
