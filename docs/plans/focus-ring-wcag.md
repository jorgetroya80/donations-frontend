# Plan: Focus Ring WCAG 2.2 AA Remediation

> Scope: the focus indicator only. Related but separate from `docs/plans/accessibility.md`, which covers ARIA wiring, landmarks and reduced motion.

## Problem

The focus indicator fails WCAG 2.2 SC 1.4.11 (Non-text Contrast, AA) everywhere it is drawn. The ring is painted as `focus-visible:ring-ring/50` — the `--ring` token at 50% alpha.

Measured contrast of the composited ring against the surface behind it:

| Situation                                                       | Contrast   | Required |
| --------------------------------------------------------------- | ---------- | -------- |
| `ring-ring/50` on `background` (light)                          | **1.54:1** | 3:1      |
| `ring-ring/50` on `muted` (light)                               | **1.49:1** | 3:1      |
| `ring-ring/50` on `card` (dark)                                 | **1.87:1** | 3:1      |
| `focus-visible:ring-destructive/20` (destructive button, light) | **1.44:1** | 3:1      |
| `focus-visible:ring-destructive/40` (destructive button, dark)  | **1.98:1** | 3:1      |

Two facts drive the task ordering below:

1. **Removing the alpha alone is not enough.** At full opacity the current light token `oklch(0.708 0 0)` still measures only **2.59:1**.
2. **Darkening the token alone is not enough.** With `--ring: oklch(0.45 0 0)` but the `/50` alpha left in place, the ring measures **2.32:1** on white and **2.26:1** on `muted`. Even `oklch(0.35 0 0)` at 50% reaches only 2.72:1.

Therefore the token change and the alpha removal must land in the same commit. Either one shipped alone leaves the app non-compliant.

## Proposed values

| Token          | Current            | Proposed          | Contrast (proposed, full opacity)          |
| -------------- | ------------------ | ----------------- | ------------------------------------------ |
| `:root --ring` | `oklch(0.708 0 0)` | `oklch(0.45 0 0)` | 7.44:1 on `background`, 6.82:1 on `muted`  |
| `.dark --ring` | `oklch(0.556 0 0)` | `oklch(0.85 0 0)` | 11.33:1 on `card`, 12.52:1 on `background` |

Both are neutral greys with zero chroma, consistent with the rest of the palette in `src/index.css`.

## Explicitly out of scope

- **`--destructive` contrast.** An earlier reading of 4.0:1 was wrong. `oklch(0.577 0.245 27.325)` on white measures **4.76:1**, and the `Alert` description renders it at `/90`, which is **4.52:1**. Both clear the 4.5:1 bar for SC 1.4.3. No change required. The `destructive/20` and `destructive/40` values in this plan are _focus rings_, not text.
- **AAA criteria.** SC 2.5.5 (44px targets) and SC 1.4.6 (7:1 text) are not part of the AA target agreed for this work.
- **Control heights.** The 32px control height passes SC 2.5.8 (24px minimum). The 36/40px heights explored in the design canvas are a visual preference, not a compliance requirement.

## Architectural decisions

- **Token first, then call sites, in one commit.** The two changes are not independently shippable (see Problem, point 2). Phase 1 is deliberately larger than the usual task size for this reason.
- **`ring-3` stays as `ring-3` in Phases 1–2.** Migrating from Tailwind's `ring-*` (a `box-shadow`) to `outline` + `outline-offset` is a separate, riskier change with different clipping behaviour. It is isolated in Phase 3 behind an investigation step so Phase 1 can ship the compliance fix without it.
- **`focus-visible:border-ring` is left untouched.** The border change accompanies the ring; it is not the indicator being measured.
- **No new tokens.** `--ring` already exists and is already referenced by every call site. Adding a `--ring-offset` or similar would widen the blast radius without improving compliance.
- **No visual redesign.** Every change here is a colour or alpha value on an existing focus treatment.

---

## Phase 1: Token + alpha removal

**Description:** Darken `--ring` in both themes and remove the alpha from every place the ring is painted, so the focus indicator clears 3:1 across the application. This is the change that delivers compliance.

**Files touched:**

- `src/index.css:62` — `:root --ring`
- `src/index.css:90` — `.dark --ring`
- `src/index.css:100` — base layer `* { @apply … outline-ring/50 }` → `outline-ring`
- `src/components/ui/button.tsx:7` — `focus-visible:ring-ring/50`
- `src/components/ui/input.tsx:9`
- `src/components/ui/textarea.tsx:10`
- `src/components/ui/select.tsx:43`
- `src/components/ui/badge.tsx:8`
- `src/components/ui/toast.tsx:37`
- `src/components/ui/tabs.tsx:51`
- `src/components/sortable-th.tsx:24`
- `src/components/date-range-picker.tsx:47`
- `src/features/users/user-form.tsx:154`, `:175`
- `src/components/ui/calendar.tsx:219` — `group-data-[focused=true]/day:ring-ring/50` (not `focus-visible:`-prefixed; same fix)

That is 12 occurrences of `ring-ring/50` across 11 files, plus the base-layer rule and the two token declarations.

**Acceptance criteria:**

- [ ] `grep -rn 'ring-ring/50' src` returns no matches
- [ ] `grep -rn 'outline-ring/50' src` returns no matches
- [ ] `--ring` is `oklch(0.45 0 0)` under `:root` and `oklch(0.85 0 0)` under `.dark`
- [ ] The focus ring on a text input, a primary button and a tab measures at least 3:1 against the surface behind it, in both themes

**Verification:**

- [ ] `pnpm run test`
- [ ] `pnpm run typecheck`
- [ ] `pnpm run check:ci`
- [ ] `pnpm run build`
- [ ] Manual: tab through the login page and the donation form in both light and dark; every stop shows a clearly visible ring
- [ ] Manual: sample the rendered ring colour in DevTools and confirm the measured ratio against the adjacent surface

**Dependencies:** None
**Estimated scope:** Large (14 files) — atomic by necessity, but each edit is a single-token string replacement

---

## Phase 2: Destructive-variant focus rings

**Description:** The destructive button and the `aria-invalid` state paint their focus ring from `--destructive` at 20% (light) and 40% (dark) alpha, measuring 1.44:1 and 1.98:1. Raise these to a value that clears 3:1 against the surface.

Note that `aria-invalid:ring-destructive/20` also appears on inputs. Decide during implementation whether the invalid-state ring is a focus indicator (must clear 3:1) or a decorative tint layered under a border that already carries the meaning. If the latter, leave the tint and confirm the border alone clears 3:1.

**Files touched:**

- `src/components/ui/button.tsx:7`, `:19`
- `src/components/ui/badge.tsx:8`, `:16`
- `src/components/ui/input.tsx:9`
- `src/components/ui/textarea.tsx:10`
- `src/components/ui/select.tsx:43`

**Acceptance criteria:**

- [ ] The destructive button's focus ring measures at least 3:1 against the surface behind it, in both themes
- [ ] A field in the `aria-invalid` state has at least one indicator (ring or border) clearing 3:1
- [ ] The destructive variants remain visually distinguishable from the default variants

**Verification:**

- [ ] `pnpm run test`
- [ ] `pnpm run check:ci`
- [ ] Manual: focus the delete-confirmation button in a dialog; focus a field after submitting an invalid form

**Dependencies:** Phase 1
**Estimated scope:** Medium (5 files)

---

## Phase 3: Controls with no focus style at all

**Description:** Some interactive elements paint no focus indicator, which fails SC 2.4.7 outright rather than failing on contrast. The known case is the password reveal button in `Input`, which is keyboard-reachable but invisible when focused. Audit for others before fixing.

**Files touched:**

- `src/components/ui/input.tsx` — the reveal `<button>` has `hover:text-foreground` but no `focus-visible:` class
- Any further cases the audit surfaces

**Acceptance criteria:**

- [ ] The password reveal button shows a visible focus ring matching the app's treatment
- [ ] Every `<button>` and `<a>` under `src/` either carries a `focus-visible:` treatment or inherits the base-layer `outline-ring`, with the exceptions listed and justified
- [ ] The reveal button also carries `aria-pressed` reflecting its state

**Verification:**

- [ ] `pnpm run test` — extend `src/components/ui/input.test.tsx` with a keyboard-focus assertion on the reveal button
- [ ] Manual: tab into the password field, then once more; the reveal button is visibly focused

**Dependencies:** Phase 1
**Estimated scope:** Small (1–2 files)

---

### Checkpoint: AA compliance

- [ ] Phases 1–3 merged; tests, typecheck, lint and build all green
- [ ] Keyboard walkthrough of login, donations list, donation form, users, reports and settings in both themes with no invisible focus stop
- [ ] Lighthouse accessibility run shows no focus-contrast findings (note: `pnpm run lighthouse` can only reach `/login` unauthenticated — see `MEMORY.md`)
- [ ] Review before proceeding to Phase 4

At this checkpoint the application meets SC 1.4.11 and SC 2.4.7 for the focus indicator. Phase 4 is a robustness improvement, not a compliance requirement.

---

## Phase 4: `ring` → `outline` migration (investigate first)

**Description:** Tailwind's `ring-*` renders as a `box-shadow`, which is clipped by any ancestor with `overflow-hidden`. `Card` carries `overflow-hidden` (`src/components/ui/card.tsx`), so a focused control flush against a card edge can have its ring cut. An `outline` with `outline-offset` is not clipped.

Start with an investigation step — this may be a theoretical problem rather than an observed one, since `CardContent` has `px-4` padding that keeps a 3px ring clear of the edge in the common case. Do not migrate if no real clipping is found.

**Investigation:**

- [ ] Identify controls that render flush against an `overflow-hidden` ancestor — check `CardFooter`, `Table` rows and the toast close button
- [ ] Screenshot the focused state of each; confirm whether the ring is clipped
- [ ] If nothing clips, close this phase and record the finding

**If migration proceeds — acceptance criteria:**

- [ ] Focus indicators use `outline: 2px solid` with `outline-offset: 2px` in the shared component base classes
- [ ] No focus ring is clipped by an `overflow-hidden` ancestor anywhere in the app
- [ ] The indicator still clears 3:1 against both the control and the surface it offsets onto
- [ ] No layout shift is introduced (`outline` does not affect layout; confirm no `ring-offset-*` compensation is left behind)

**Verification:**

- [ ] `pnpm run test`
- [ ] `pnpm run build`
- [ ] Manual: focused states screenshotted before and after for button, input, select, tab, table header and toast close

**Dependencies:** Phase 1
**Estimated scope:** Medium if migration proceeds; XS if the investigation closes it

---

## Phase 5: Regression guard

**Description:** Keep the alpha from coming back. The failure mode being fixed is a class string that looks reasonable and reads as intentional, so a lint rule is worth more than a test here.

**Acceptance criteria:**

- [ ] A check fails CI when `ring-ring/`, `outline-ring/` or `focus-visible:ring-destructive/` with an alpha suffix is reintroduced under `src/`
- [ ] The check is wired into the existing CI workflow
- [ ] The rationale (the contrast numbers) is recorded next to the `--ring` declarations in `src/index.css`

**Verification:**

- [ ] Introduce `ring-ring/50` on a scratch branch and confirm the check fails
- [ ] Remove it and confirm the check passes

**Dependencies:** Phase 1
**Estimated scope:** Small (1–2 files)

---

## Risks and mitigations

| Risk                                                                                | Impact | Mitigation                                                                                                                                                          |
| ----------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A 14-file Phase 1 is hard to review                                                 | Medium | Every edit is a one-token string replacement; the two `grep` acceptance criteria make completeness mechanically checkable                                           |
| The darker ring reads as heavy against the app's light neutral palette              | Medium | `oklch(0.45 0 0)` is a neutral grey at zero chroma. If it reads too strong, reduce ring _width_, never restore the alpha — width does not affect the contrast ratio |
| `calendar.tsx` uses the ring on a `data-focused` state rather than `:focus-visible` | Low    | Same token, same fix; verify keyboard day-navigation visually since the state is driven by `react-day-picker`, not the browser                                      |
| Dark-theme ring at `oklch(0.85 0 0)` may glare on the near-black background         | Low    | 12.5:1 leaves headroom; drop toward `oklch(0.75 0 0)` (still 8:1 on `card`) if it proves harsh                                                                      |
| Phase 4 migration changes focus geometry app-wide                                   | Medium | Gated behind an investigation step that can close the phase with no code change                                                                                     |

## Open questions

- Is the `aria-invalid` ring intended as a focus indicator or as a decorative tint? Determines whether Phase 2 raises it or leaves it (see Phase 2 note).
- Should the ring width stay at `ring-3` (3px)? It is not a compliance factor at AA — SC 2.4.13 (Focus Appearance, AAA) sets a minimum area, but AAA is out of scope.
