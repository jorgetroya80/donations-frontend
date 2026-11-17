# Implementation Plan: Sereno design system

Spec: `docs/PRD-sereno-design-system.md` (reviewed against the code and approved 2026-11-17, designer decisions folded in).
Design reference: https://claude.ai/code/artifact/533bcba1-9427-4c7f-9d29-b63ee03ab22a
Related, separate: issue #218 (Spanish calendar, toolbar wrap, donor search clear button). It ships on its own, before this plan, and is not tracked here.

## Overview

Two PRs. PR 1 changes token values, including a blue focus ring, which first needs a narrow, approved change to the floor rule for replaced assertions. PR 2 adjusts the components the new values affect: outlined fields, a hover token with the final primary `#1F4FD8`, a soft green status badge, and right-aligned amounts.

## Architecture Decisions

- **Quality bar change first, in its own commit.** The ring assertions in `tests/focus-ring.test.ts:43,45` can only change after `CONSTRAINTS.md` and `scripts/floor-guard.mjs` accept an `Assertion: <path>` trailer. Keeping that commit separate lets the reviewer approve the rule on its own.
- **Trailers wait for approval.** `Floor:` and `Assertion:` are approval records. They go on the commits only after the reviewer (not the author) approves. Until then `check:task` fails on the floor guard, which is expected.
- **Ring uses the final blue now.** `#1F4FD8` / `#7FA2FF`, not the `#1C4BCB` stopgap, so the ring and its pinned test do not change again in PR 2.
- **Primary moves to `#1F4FD8` together with `--primary-hover`.** Never before: `hover:bg-primary/80` on `#1F4FD8` gives 4.37:1.
- **Fill fixes grouped by file.** Disabled background (PRD 2.1) and outlined fields (PRD 2.5) touch the same class strings in the same four files, so they are one task.
- **No `--warning` tokens.** Nothing reads them (PRD 2.3 skipped).

## Dependency graph

```
Task 1 quality bar (CONSTRAINTS.md + floor-guard.mjs)
   └── Task 2 tokens + ring + test pins            → PR 1
          ├── Task 3 outlined fields                ┐
          ├── Task 4 primary-hover + #1F4FD8        ├ PR 2
          │      └── Task 5 success badge (same files: index.css, badge.tsx)
          └── Task 6 amount columns (independent)  ┘
```

## Task List

### Phase 1: Tokens (PR 1, branch `style/sereno-tokens`)

- [x] Task 1: Add the `Assertion:` route to the floor rule and guard
- [x] Task 2: Apply Sereno token values, blue ring included

### Checkpoint 1

- [ ] `pnpm run check:task` passes with both trailers on the branch, real result reported
- [ ] Floor guard fails with the `Assertion:` trailer removed (shown in the PR)
- [ ] Manual check, light and dark: login, dashboard, donors list, new-donation form
- [ ] Reviewer (not the author) approved both trailers
- [ ] PR opened: `style(ui): apply Sereno token values`

### Phase 2: Components (PR 2, branch `style/sereno-controls`, after PR 1 merges)

- [x] Task 3: Outlined fields and muted disabled background
- [x] Task 4: `--primary-hover` and final primary `#1F4FD8`
- [x] Task 5: Soft green status badge
- [ ] Task 6: Right-align amount columns

### Checkpoint 2

- [ ] `pnpm run check:task` passes
- [ ] Manual check, both themes: field hover/focus/disabled, primary button hover, outline button hover, status badges, amount columns
- [ ] PR opened: `style(ui): adjust controls for Sereno tokens`

## Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| No second reviewer available | High: PR 1 cannot merge | Open Question 1 in the PRD. PR 2 work can start on a branch from PR 1 meanwhile. |
| `floor-guard.mjs` exempts its own edits (`isSelf`) | Med: a guard bug weakens the bar unnoticed | Keep the change small. Prove both directions (pass with trailer, fail without) in the PR body. |
| New route used to weaken an assertion | Med | Guard requires added ≥ removed assertions in the file; reviewer checks that each replacement checks at least as much. |
| Contrast ratios computed, not measured | Med | Manual check in both themes at each checkpoint. Playwright + axe stays deferred per `CONSTRAINTS.md`. |
| "Inactivo" on users page turns from red to gray | Low: visible change | Designer decision; call it out in the PR body. |

## Open Questions

1. Who reviews and approves the `Floor:` and `Assertion:` trailers? (PRD Open Question 1.) Blocks the PR 1 merge, not the work.

## Tasks

### Task 1: Add the `Assertion:` route to the floor rule and guard

**Description:** Reword the "No skipped or deleted tests" floor bullet in `CONSTRAINTS.md` to the text in the PRD section "Quality bar change for the ring". In `scripts/floor-guard.mjs`, collect `^Assertion: (.+)$` trailers from branch commit messages, like `Exception:` and `Floor:`. For a removed assertion in an approved path, skip `assertion-removed` when that file's added assertion lines are at least its removed ones. Commit without trailers; add `Floor: <old bullet text>` once the reviewer approves.

**Acceptance criteria:**
- [ ] Bullet text matches the PRD wording
- [ ] Removed assertion in a file with a matching `Assertion:` trailer and equal or more added assertions: not flagged
- [ ] Removed assertion with no trailer, or with fewer added than removed: still flagged

**Verification:**
- [ ] Throwaway branch: change one `expect(` value in a test, run `node scripts/floor-guard.mjs` with and without the trailer, record both outputs for the PR body
- [ ] `pnpm run check:task` passes once the `Floor:` trailer is on the branch

**Dependencies:** None

**Files likely touched:** `CONSTRAINTS.md`, `scripts/floor-guard.mjs`

**Estimated scope:** S

### Task 2: Apply Sereno token values, blue ring included

**Description:** Replace `:root` and `.dark` values in `src/index.css` with the PRD tables (stopgap `--primary` `#1C4BCB`, ring `oklch(0.491 0.216 264.52)` light and `oklch(0.726 0.141 267.25)` dark). Update both ring comments in `src/index.css` and the two comment lines above the assertions in `tests/focus-ring.test.ts`. Replace the two pinned `--ring` strings with the new values. Commit carries `Assertion: tests/focus-ring.test.ts` once approved.

**Acceptance criteria:**
- [ ] Every token in both PRD tables has its new value; no token added or removed
- [ ] `tests/focus-ring.test.ts` has the same number of assertions as `main`, pinned to the new ring values
- [ ] Ring comments read `6.63:1 on --background, 6.07:1 on --muted` (light) and `6.61:1 on --card, 7.46:1 on --background` (dark)

**Verification:**
- [ ] `pnpm run check:task` passes (focus-ring test, coverage, bundle unaffected)
- [ ] Manual: `pnpm dev`, both themes, on login, dashboard, donors list, new-donation form. Tab through a form: ring is blue and visible

**Dependencies:** Task 1

**Files likely touched:** `src/index.css`, `tests/focus-ring.test.ts`

**Estimated scope:** S

### Task 3: Outlined fields and muted disabled background

**Description:** Inputs, selects, textareas and outline buttons get a transparent background in both themes (PRD 2.1 and 2.5). In `input.tsx` and `textarea.tsx`: `disabled:bg-input/50` → `disabled:bg-muted`, drop `dark:disabled:bg-input/80` and `dark:bg-input/30`. In `select.tsx`: drop `dark:bg-input/30` and `dark:hover:bg-input/50`. Outline variant in `button.tsx`: `bg-background` → `bg-transparent`, drop `dark:bg-input/30` and `dark:hover:bg-input/50`; keep `hover:bg-muted aria-expanded:bg-muted`.

**Acceptance criteria:**
- [ ] `grep -rn "bg-input/" src/components/ui` returns nothing
- [ ] Fields read as outlined, not filled, in dark mode; disabled fields show `--muted`
- [ ] Outline button hover and open state use `--muted` in both themes

**Verification:**
- [ ] `pnpm run check:task` passes
- [ ] Manual: a form with a disabled field and a select, plus an outline button, in both themes, on page and on a card

**Dependencies:** Task 2

**Files likely touched:** `src/components/ui/input.tsx`, `textarea.tsx`, `select.tsx`, `button.tsx`

**Estimated scope:** S

### Task 4: `--primary-hover` and final primary `#1F4FD8`

**Description:** Add `--primary-hover` (`oklch(0.437 0.19 264.58)` light, `oklch(0.789 0.106 267.95)` dark) and `--color-primary-hover: var(--primary-hover)` in `@theme inline`. Use `hover:bg-primary-hover` in the default variant of `button.tsx` and `[a]:hover:bg-primary-hover` in the default variant of `badge.tsx`. Then move light `--primary` to `oklch(0.491 0.216 264.52)`.

**Acceptance criteria:**
- [ ] No `bg-primary/80` in `src/components/ui/`
- [ ] Light `--primary` is `#1F4FD8`
- [ ] Ring classes stay full opacity (`tests/focus-ring.test.ts` scans `src`)

**Verification:**
- [ ] `pnpm run check:task` passes
- [ ] Manual: hover a primary button in both themes. PR body states 6.63:1, 8.27:1 and 9.22:1

**Dependencies:** Task 2

**Files likely touched:** `src/index.css`, `src/components/ui/button.tsx`, `src/components/ui/badge.tsx`

**Estimated scope:** S

### Task 5: Soft green status badge

**Description:** Add `--success-soft` (`oklch(0.959 0.021 156.82)` light, `oklch(0.298 0.051 159.7)` dark) and its `--color-success-soft` mapping. Add a `success` variant to `badge.tsx`: `bg-success-soft text-success`. "Activo" uses `success`, "Inactivo" uses `secondary`, in `donors-page.tsx` and `users-page.tsx` (users "Inactivo" is `destructive` today).

**Acceptance criteria:**
- [ ] "Activo" renders the `success` variant, "Inactivo" the `secondary` variant, on both pages
- [ ] No status uses the `default` badge variant
- [ ] A test asserts the variant per status (page tests, or `badge.tsx` if pages don't cover status)

**Verification:**
- [ ] `pnpm run check:task` passes, changed-line coverage included
- [ ] Manual: donors and users lists in both themes

**Dependencies:** Task 4 (same `index.css` and `badge.tsx` edits)

**Files likely touched:** `src/index.css`, `src/components/ui/badge.tsx`, `src/features/donors/donors-page.tsx`, `src/features/users/users-page.tsx`, a test

**Estimated scope:** M

### Task 6: Right-align amount columns

**Description:** Add an alignment option to `SortableTh` (default unchanged) that puts `text-right` on the `<th>` and right-aligns its inner flex button. Use it for the amount header, and add `text-right` to the amount `TableCell`, in `donations-page.tsx` and `expenses-page.tsx`.

**Acceptance criteria:**
- [ ] Amount header label, sort indicator and cells align right on both pages
- [ ] Other `SortableTh` uses render unchanged
- [ ] A test covers the new option

**Verification:**
- [ ] `pnpm run check:task` passes (changed-line coverage)
- [ ] Manual: donations and expenses lists, sort by amount still works

**Dependencies:** None (ships in PR 2)

**Files likely touched:** `src/components/sortable-th.tsx`, its test, `src/features/donations/donations-page.tsx`, `src/features/expenses/expenses-page.tsx`

**Estimated scope:** M
