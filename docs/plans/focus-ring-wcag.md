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
- **Control heights.** The 32px control height passes SC 2.5.8 (24px minimum). The 36/40px heights explored in the design canvas are a visual preference, not a compliance requirement. (One control did fail 2.5.8 on *width* — the password reveal button, at 16px. Found and fixed in phase 3.)

## Architectural decisions

- **Token first, then call sites, in one commit.** The two changes are not independently shippable (see Problem, point 2). Phase 1 is deliberately larger than the usual task size for this reason.
- **`ring-3` stays as `ring-3` in Phases 1–2.** Migrating from Tailwind's `ring-*` (a `box-shadow`) to `outline` + `outline-offset` is a separate, riskier change with different clipping behaviour. It was isolated in Phase 4 behind an investigation step so Phase 1 could ship the compliance fix without it — and that investigation closed it: nothing clips, so `ring-3` stays throughout.
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

- [x] `grep -rn 'ring-ring/50' src` returns no matches
- [x] `grep -rn 'outline-ring/50' src` returns no matches
- [x] `--ring` is `oklch(0.45 0 0)` under `:root` and `oklch(0.85 0 0)` under `.dark`
- [x] The focus ring on a text input, a primary button and a tab measures at least 3:1 against the surface behind it, in both themes

**Verification:**

- [x] `pnpm run test`
- [x] `pnpm run typecheck`
- [x] `pnpm run check:ci`
- [x] `pnpm run build`
- [x] Manual: tab through the login page and the donation form in both light and dark; every stop shows a clearly visible ring
- [x] Manual: sample the rendered ring colour in DevTools and confirm the measured ratio against the adjacent surface

**Dependencies:** None
**Estimated scope:** Large (14 files) — atomic by necessity, but each edit is a single-token string replacement

---

## Phase 2: Destructive-variant focus rings

**Description:** The destructive button and the `aria-invalid` state paint their focus ring from `--destructive` at 20% (light) and 40% (dark) alpha, measuring 1.44:1 and 1.98:1. Raise these to a value that clears 3:1 against the surface.

**Resolved:** the invalid-state ring is a state indicator, not a decorative tint. Observed in the browser, an unfocused input carrying `aria-invalid="true"` paints the ring — it does not wait for focus — so SC 1.4.11 applies to it and the 1.44:1 measurement is a failure. Both call sites are in scope.

Raised to full opacity rather than to the `/70` that would just clear 3:1: it carries the most margin (4.76:1 light, 6.19:1 dark), matches what phase 1 did to `--ring`, and lets one regression test cover both tokens. Doing so also makes the `dark:…-destructive/40` variants redundant — `--destructive` already carries its own dark value — so they were removed.

One finding recorded but **not** acted on: in dark mode the invalid *border* is `dark:aria-invalid:border-destructive/50`, which measures 1.98:1. The acceptance criterion is met because the ring alongside it measures 6.19:1, but the border is carrying almost nothing there. Worth its own look; it is a border, not a ring, so it sits outside this plan.

**Files touched:**

- `src/components/ui/button.tsx:7`, `:19`
- `src/components/ui/badge.tsx:8`, `:16`
- `src/components/ui/input.tsx:9`
- `src/components/ui/textarea.tsx:10`
- `src/components/ui/select.tsx:43`

**Acceptance criteria:**

- [x] The destructive button's focus ring measures at least 3:1 against the surface behind it, in both themes
- [x] A field in the `aria-invalid` state has at least one indicator (ring or border) clearing 3:1
- [x] The destructive variants remain visually distinguishable from the default variants

**Verification:**

- [x] `pnpm run test`
- [x] `pnpm run check:ci`
- [x] Manual: focus the delete-confirmation button in a dialog; focus a field after submitting an invalid form

**Dependencies:** Phase 1
**Estimated scope:** Medium (5 files)

## Phase 3: Controls with no focus style at all

**Description:** Some interactive elements paint no focus indicator, which fails SC 2.4.7 outright rather than failing on contrast. The known case is the password reveal button in `Input`, which is keyboard-reachable but invisible when focused. Audit for others before fixing.

**Corrected on inspection.** The premise above was wrong. The reveal button is *not* invisible when focused: it carries no `outline-none`, so the browser's own `outline-style: auto` still paints a ring, and the base-layer `outline-ring` supplies its colour. There is no SC 2.4.7 failure. The audit found no other case either — every other `<button>` and `<a>` under `src/` either carries `focus-visible:` classes or is styled through `buttonVariants()`, which carries them.

What was left was a consistency defect rather than a compliance one, and it was worth fixing on those terms: the reveal button was the only control in the app painting the *browser's* focus ring instead of the app's, and `outline-style: auto` is not obliged to honour `outline-color` in every engine. It now uses the same `focus-visible:ring-3 focus-visible:ring-ring` treatment as every other control. `aria-pressed` was added alongside, as this phase's criteria already called for.

**Found here, and fixed on request:** the reveal button's hit target was **16×32 px**, against the 24×24 that SC 2.5.8 Target Size (Minimum) asks for — a real AA failure, found while auditing this control. It is now 32×32, and the icon has not moved: the button was `right-2` at the icon's own 16px width, so the icon sat centred 16px from the input's right edge; it is now `right-0 w-8 justify-center`, which centres it at the same 16px. Only the hit area and the shape of the focus ring changed.

jsdom has no layout engine, so the target size cannot be asserted in a unit test. It was measured in the browser instead: 32×32, icon centre 16px from the input's right edge, button fully inside the input's `pr-8` padding.

**Files touched:**

- `src/components/ui/input.tsx` — the reveal `<button>` has `hover:text-foreground` but no `focus-visible:` class
- Any further cases the audit surfaces

**Acceptance criteria:**

- [x] The password reveal button shows a visible focus ring matching the app's treatment
- [x] Every `<button>` and `<a>` under `src/` either carries a `focus-visible:` treatment or inherits the base-layer `outline-ring`, with the exceptions listed and justified
- [x] The reveal button also carries `aria-pressed` reflecting its state

**Verification:**

- [x] `pnpm run test` — extend `src/components/ui/input.test.tsx` with a keyboard-focus assertion on the reveal button
- [x] Manual: tab into the password field, then once more; the reveal button is visibly focused

**Dependencies:** Phase 1
**Estimated scope:** Small (1–2 files)

### Checkpoint: AA compliance

- [x] Phases 1–3 merged; tests, typecheck, lint and build all green
- [ ] Keyboard walkthrough of login, donations list, donation form, users, reports and settings in both themes with no invisible focus stop — only `/login` and the dashboard were walked; the authenticated pages need someone who can sign in
- [x] Lighthouse accessibility run shows no focus-contrast findings (note: `pnpm run lighthouse` can only reach `/login` unauthenticated — see `MEMORY.md`)
- [ ] Review before proceeding to Phase 4

Lighthouse scored accessibility **98** on `/login`, with `color-contrast` and `target-size` both passing and nothing reported against the focus indicator. Read that last part narrowly: axe does not audit focus-indicator contrast at all, so a clean Lighthouse run is consistent with the fix but is not what proves it. The proof is the measured ratios in phases 1 and 2. What Lighthouse does independently confirm is `target-size`, which the phase 3 change moved from failing to passing.

Its one failure is out of scope here and belongs to `docs/plans/accessibility.md`: **`landmark-one-main` — the login page has no `<main>` landmark.**

At this checkpoint the application meets SC 1.4.11 and SC 2.4.7 for the focus indicator. Phase 4 is a robustness improvement, not a compliance requirement.

## Phase 4: `ring` → `outline` migration (investigate first)

**Description:** Tailwind's `ring-*` renders as a `box-shadow`, which is clipped by any ancestor with `overflow-hidden`. `Card` carries `overflow-hidden` (`src/components/ui/card.tsx`), so a focused control flush against a card edge can have its ring cut. An `outline` with `outline-offset` is not clipped.

Start with an investigation step — this may be a theoretical problem rather than an observed one, since `CardContent` has `px-4` padding that keeps a 3px ring clear of the edge in the common case. Do not migrate if no real clipping is found.

**Investigation:**

- [x] Identify controls that render flush against an `overflow-hidden` ancestor — check `CardFooter`, `Table` rows and the toast close button
- [x] Screenshot the focused state of each; confirm whether the ring is clipped
- [x] If nothing clips, close this phase and record the finding

**Closed — no migration, no code change.** Nothing in the app clips a focus ring. Every scroll or clip container was enumerated and checked against the 3px ring:

| Container | Computed overflow | Focusables inside | Smallest gap to the edge | Verdict |
| --- | --- | --- | --- | --- |
| `Card` | `hidden` | reached through `CardHeader`/`CardContent`/`CardFooter`, all `px-4`/`p-4` | **16px**, measured on `/login` | safe |
| `Table` container | `x: auto`, `y: auto` | `SortableTh`'s button, inside a `th` with `h-10 px-2` | **8px** left, 9.8px top, 10.8px bottom | safe |
| `DropdownMenu` content | `x: hidden`, `y: auto` | `DropdownMenuItem` | — | no ring: highlights with `focus:bg-accent`, and carries `outline-hidden` |
| `Select` content | `x: hidden`, `y: auto` | `SelectItem` | — | no ring, same pattern |
| `DonorPicker` dropdown | `hidden`, inner list `auto` | `<li role="option">` | — | no ring; highlight is `bg-accent` under `aria-activedescendant` |
| `app-layout` shells | `hidden` | header (`px-4`), `main` (`p-4 md:p-6`) | ≥16px | safe |
| `Badge` | `hidden` | none — its ring is painted on the badge itself, and `overflow-hidden` clips a box's children, not its own `box-shadow` | — | not applicable |

Two things worth keeping from the investigation. First, `overflow-x-auto` on the table container makes `overflow-y` compute to `auto` as well, so it clips on **both** axes, not just horizontally — the vertical gaps above are what matter there, and they hold. Second, the tightest margin in the app is the table header's 8px against a 3px ring; that is the number to re-check if the ring ever grows past `ring-3` or `th` padding shrinks below `px-2`.

The `Card` row was measured in the running app; the `Table` row was measured from a faithful reproduction built with the exact class strings from `table.tsx` and `sortable-th.tsx`, because reaching a real table needs a signed-in session.

**If it ever needs revisiting — acceptance criteria:**

- [ ] Focus indicators use `outline: 2px solid` with `outline-offset: 2px` in the shared component base classes
- [ ] No focus ring is clipped by an `overflow-hidden` ancestor anywhere in the app
- [ ] The indicator still clears 3:1 against both the control and the surface it offsets onto
- [ ] No layout shift is introduced (`outline` does not affect layout; confirm no `ring-offset-*` compensation is left behind)

**Dependencies:** Phase 1
**Estimated scope:** XS — the investigation closed it

---

## Phase 5: Regression guard

**Description:** Keep the alpha from coming back. The failure mode being fixed is a class string that looks reasonable and reads as intentional, so a lint rule is worth more than a test here.

**Closed — no code change needed.** All three criteria were already satisfied by work done in phases 1 and 2, which is why this phase produced nothing new:

- The guard is `tests/focus-ring.test.ts`, written as the RED step of phase 1 and widened in phase 2. It scans `src/` for `(?:ring|outline)-(?:ring|destructive)/<alpha>` and asserts both `--ring` values.
- It runs in CI already: `ci.yml` runs `pnpm run test`, and vitest's default discovery picks up `tests/` — no new workflow step.
- The contrast rationale sits next to both `--ring` declarations in `src/index.css`.

A lint rule was the original idea. A test turned out to be the better fit: it caught two real regressions during this work (the phase 1 RED, then the phase 2 RED), and it can assert the token *values* as well as the absence of the alpha, which a class-name lint rule cannot.

**Acceptance criteria:**

- [x] A check fails CI when `ring-ring/`, `outline-ring/` or `focus-visible:ring-destructive/` with an alpha suffix is reintroduced under `src/`
- [x] The check is wired into the existing CI workflow
- [x] The rationale (the contrast numbers) is recorded next to the `--ring` declarations in `src/index.css`

**Verification:**

- [x] Introduce `ring-ring/50` on a scratch branch and confirm the check fails
- [x] Remove it and confirm the check passes

Four regression vectors were reintroduced one at a time and reverted; the guard caught every one: `focus-visible:ring-ring/50` in `button.tsx`, `aria-invalid:ring-destructive/20` in `input.tsx`, `outline-ring/50` in the base layer, and lightening `--ring` back to `oklch(0.708 0 0)` without any alpha involved.

**Dependencies:** Phase 1
**Estimated scope:** XS — already delivered by phases 1 and 2

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

- ~~Is the `aria-invalid` ring intended as a focus indicator or as a decorative tint?~~ Resolved in phase 2: it is a state indicator, painted without focus.
- Should the ring width stay at `ring-3` (3px)? It is not a compliance factor at AA — SC 2.4.13 (Focus Appearance, AAA) sets a minimum area, but AAA is out of scope.
