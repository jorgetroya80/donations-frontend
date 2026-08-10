# Plan: Supabaze Design System Adoption

> Source PRD: docs/PRD-supabaze-design-system.md
> Design language reference: DESIGN.md

## Architectural decisions

- **Token values change, token names do not** — a grep across `src/**/*.tsx` finds zero hardcoded palette classes and zero color literals. Every color already resolves through a semantic CSS variable, so redefining `--primary`, `--background`, `--border` and friends in `src/index.css` repaints every screen with no component edits. This is the single fact that makes the work small.
- **Explicit radius scale replaces the multiplier chain** — `--radius: 0.625rem` with six `calc()` derivatives becomes five literal values (4/6/8/12/16px). `--radius-2xl` and `--radius-3xl` have no consumers and are deleted. `--radius-4xl` has exactly one consumer, `badge.tsx`, which moves to `rounded-full` per DESIGN.md's pill spec.
- **oklch, with the source hex in a trailing comment** — matches the existing file and makes review mechanical: a reviewer checks the comment against DESIGN.md rather than converting color spaces by hand.
- **Dark mode is derived, not invented** — `canvas-night` `#1c1c1c` and `canvas-night-soft` `#202020` are already in DESIGN.md for code blocks and inverted cards. Dark surfaces reuse them, so the dark theme stays inside the design language instead of being left at the old greyscale.
- **One emerald across both themes** — `#3ecf8e` on `#1c1c1c` measures approximately 8.9:1. A per-theme emerald variant would be more code for no legibility gain.
- **Vertical slices by rendering surface, not by property** — each phase takes a layer of the render tree from tokens outward and leaves it fully correct in both themes. Restyling all colors app-wide, then all radii app-wide, then all typography, would leave the app visibly half-done between phases and give no clean revert point.
- **Contrast is tested, geometry is not** — the color relationships encode decisions a future contributor could plausibly reverse (near-black on emerald looks like a bug until you measure it), so they get an automated test. Radius and font-size assertions would only verify that the class strings say what they say.

## Dependency graph

```
src/index.css tokens  (Task 1)
        │
        ├── typography scale  (Task 2)
        │           │
        │           └── page-header, card/dialog titles  (Task 5)
        │
        └── radius scale
                    │
                    ├── button.tsx  (Task 3)  ← highest blast radius, done first
                    ├── surface primitives: card, dialog, popover,
                    │   dropdown, select, toast, alert, badge  (Task 4)
                    ├── form primitives: input, textarea, calendar  (Task 4)
                    │
                    └── shared components + layouts  (Task 5)
                                │
                                └── feature screens  (Tasks 6-7)
```

Nothing above depends on anything below it. Tasks 3 and 4 could in principle run in parallel, but both touch `src/components/ui/` and would collide on review, so they stay sequential.

---

## Phase 1: Token foundation

### Task 1: Rewrite the token declarations in `src/index.css`

**User stories:** 1, 3, 4, 6, 7

**Description:** Replace the `@theme inline`, `:root` and `.dark` blocks with the DESIGN.md values. This is the highest-risk task in the plan — it repaints every screen at once — so it goes first, and its verification is a full visual sweep rather than a spot check.

**What to build**

Radius scale in `@theme inline`, replacing the six `calc()` derivatives:

```css
--radius-xs: 4px;   /* DESIGN.md rounded.xs — hairline tags        */
--radius-sm: 6px;   /* DESIGN.md rounded.sm — buttons, inputs      */
--radius-md: 8px;   /* DESIGN.md rounded.md — menu items, alerts   */
--radius-lg: 12px;  /* DESIGN.md rounded.lg — cards, popovers      */
--radius-xl: 16px;  /* DESIGN.md rounded.xl — dialogs              */
```

Delete `--radius`, `--radius-2xl`, `--radius-3xl`, `--radius-4xl`. The first three have no consumers; `--radius-4xl` is handled in Task 4.

Light palette in `:root`:

| Token | Value | DESIGN.md source |
| --- | --- | --- |
| `--primary` | emerald | `primary` `#3ecf8e` |
| `--primary-deep` (new) | pressed emerald | `primary-deep` `#24b47e` |
| `--primary-foreground` | near-black | `on-primary` `#171717` |
| `--background`, `--card`, `--popover` | white | `canvas` `#ffffff` |
| `--foreground`, `--card-foreground`, `--popover-foreground` | near-black | `ink` `#171717` |
| `--secondary`, `--muted`, `--accent` | off-white | `canvas-soft` `#fafafa` |
| `--secondary-foreground`, `--accent-foreground` | near-black | `ink` `#171717` |
| `--muted-foreground` | grey | `ink-mute` `#707070` |
| `--border`, `--input` | hairline | `hairline` `#dfdfdf` |
| `--ring` | emerald | `primary` `#3ecf8e` |

Dark palette in `.dark`: `--background` to `canvas-night` `#1c1c1c`; `--card` and `--popover` to `canvas-night-soft` `#202020`; `--foreground` to `on-dark` `#ffffff`; `--muted-foreground` to `ink-mute-2` `#9a9a9a`; `--border` and `--input` stay as alpha-on-white (`oklch(1 0 0 / 10%)` and `/ 15%`), which is the correct treatment on a dark surface and has no DESIGN.md equivalent. `--primary` and `--primary-foreground` are unchanged from light — one emerald across both themes.

`--destructive` and `--chart-1` through `--chart-5` are not touched. See Out of Scope in the PRD.

**Acceptance criteria**

- [ ] `--primary` is emerald and `--primary-foreground` is near-black, in both `:root` and `.dark`
- [ ] `--primary-deep` exists in both blocks
- [ ] The five radius tokens are literal pixel values; no `calc()` remains in the radius scale
- [ ] `--radius`, `--radius-2xl`, `--radius-3xl` are gone
- [ ] Every `oklch()` declaration carries a trailing comment with its DESIGN.md hex
- [ ] `:root` and `.dark` declare an identical set of token names
- [ ] `--destructive` and `--chart-1..5` are byte-identical to before

**Verification**

- [ ] `pnpm run test` — full suite green
- [ ] `pnpm run typecheck && pnpm run check`
- [ ] Manual: every route walked in light and dark. Expect the palette to shift and radii to tighten; expect nothing to break. Note anything that looks wrong for the later tasks rather than fixing it here.

**Dependencies:** None

**Files:** `src/index.css`

**Scope:** S

---

### Task 2: Add the display typography scale

**User stories:** 2, 6

**Description:** DESIGN.md defines a display tier at weight 500 with negative tracking that the application has no equivalent of. Declare it as tokens now so Task 5 can apply it; applying it is deliberately separated so the token shape can be reviewed before it propagates.

**What to build**

Text-size tokens in `@theme inline` covering the DESIGN.md hierarchy — 64/48/36/28px display steps with tracking of -1.92px, -1.44px, -0.72px, -0.42px respectively, and 22/18px heading steps at zero tracking. Tailwind v4 `--text-*` tokens accept a paired `--tracking-*`, so each step declares both.

Add a base-layer rule setting `h1`–`h3` to weight 500. This is a real conflict with what ships today: `page-header.tsx`, `stat-card.tsx` and `user-stats.tsx` use `font-bold` (700), and several headings use `font-semibold` (600). DESIGN.md states the calibrated mid-weight breaks at 600 and above. The base rule establishes the floor; the per-component `font-bold` and `font-semibold` classes are removed in Task 5.

**Acceptance criteria**

- [ ] Display and heading steps are declared as tokens in `@theme inline`, each with its DESIGN.md size and tracking
- [ ] Base layer sets `h1`–`h3` to weight 500
- [ ] No component file is edited in this task
- [ ] `--font-sans` still resolves to Geist Variable; no font package added

**Verification**

- [ ] `pnpm run test && pnpm run typecheck && pnpm run check`
- [ ] Manual: headings render at weight 500 except where a component still overrides with `font-bold` or `font-semibold` — that residue is expected here and is Task 5's job

**Dependencies:** Task 1

**Files:** `src/index.css`

**Scope:** XS

---

### Task 3: Add the token contrast test

**User stories:** 3

**Description:** Lock the color relationships that a future change could plausibly and silently reverse. Near-black on emerald reads as a mistake to anyone who has not measured it; this test is what stops someone "fixing" it to white and dropping contrast from roughly 10:1 to roughly 2:1.

**What to build**

`src/test/design-tokens.test.ts` reads `src/index.css`, parses the `oklch()` values out of the `:root` and `.dark` blocks, converts to relative luminance, and asserts WCAG AA:

- `--primary-foreground` on `--primary`, at least 4.5:1, both themes
- `--foreground` on `--background`, at least 4.5:1, both themes
- `--muted-foreground` on `--background`, at least 4.5:1, both themes

Parsing the real CSS rather than duplicating the values in the test is the point — a copy would drift and the test would pass against stale numbers.

**Acceptance criteria**

- [ ] All six assertions pass
- [ ] The test reads `src/index.css` rather than hardcoding token values
- [ ] Temporarily setting `--primary-foreground` to white makes the test fail (confirm, then revert)

**Verification**

- [ ] `pnpm run test src/test/design-tokens.test.ts`
- [ ] `pnpm run test` — full suite green

**Dependencies:** Task 1

**Files:** `src/test/design-tokens.test.ts`

**Scope:** S

---

### Checkpoint: Foundation

- [ ] `pnpm run check && pnpm run typecheck && pnpm run test` clean
- [ ] Contrast test passes, and was confirmed to fail on a deliberately wrong value
- [ ] Every route renders in both themes at 375px, 768px, 1280px
- [ ] Emerald appears on filled buttons; the rest of the interface is monochrome
- [ ] Screenshots of dashboard, donations list, and a form, in both themes, attached for review
- [ ] **Human review before Phase 2**

---

## Phase 2: UI primitives

### Task 4: Correct the button radius scale

**User stories:** 1, 2, 5

**Description:** `button.tsx` is the single highest-traffic component in the application and its base class currently reads `rounded-lg` — which under the new scale means 12px, where DESIGN.md wants 6px. It also carries four `rounded-[min(var(--radius-md),Npx)]` escape hatches that existed only to clamp the old multiplier chain and are now dead weight.

**What to build**

Base class `rounded-lg` becomes `rounded-sm` (6px). In the `xs`, `sm`, `icon-xs` and `icon-sm` size variants, replace `rounded-[min(var(--radius-md),10px)]` and `rounded-[min(var(--radius-md),12px)]` with `rounded-sm`, and replace the `in-data-[slot=button-group]:rounded-lg` overrides to match. No variant is pill-shaped.

Point the `default` variant's hover state at `--primary-deep` instead of `bg-primary/80`. Opacity on emerald washes toward the white canvas; DESIGN.md specifies a pressed state that darkens instead.

Confirm at 375px that the `default` (h-8, 32px) and `lg` (h-9, 36px) sizes still meet the DESIGN.md 36×36px touch-target floor. If `default` falls short on touch, raise its vertical padding at the mobile breakpoint rather than changing the desktop height.

**Acceptance criteria**

- [ ] Every button size renders at 6px radius
- [ ] No `rounded-[min(...)]` escape hatch remains in `button.tsx`
- [ ] `default` variant hover uses `--primary-deep`, not opacity
- [ ] Filled buttons render near-black labels on emerald
- [ ] Touch targets are at least 36×36px at 375px
- [ ] `link` and `ghost` variants are visually unchanged apart from the palette shift

**Verification**

- [ ] `pnpm run test` — full suite green
- [ ] Manual: every button variant and size, in both themes, hover and active states

**Dependencies:** Task 1

**Files:** `src/components/ui/button.tsx`

**Scope:** XS

---

### Task 5: Correct surface primitives

**User stories:** 2, 3

**Description:** Bring the container primitives onto the new radius scale. Several are already correct once the tokens change; the ones listed below are not.

**What to build**

- `card.tsx` — `rounded-t-xl` and `rounded-b-xl` become the `lg` variants. DESIGN.md puts cards at 12px, not 16px. Three occurrences.
- `badge.tsx` — `rounded-4xl` becomes `rounded-full`. This is the only consumer of the deleted `--radius-4xl` token, and DESIGN.md specifies pills as fully rounded.
- `select.tsx` — the `rounded-[min(var(--radius-md),10px)]` trigger escape hatch becomes `rounded-sm`, matching inputs.
- `input.tsx`, `textarea.tsx` — `rounded-lg` becomes `rounded-sm` (6px). Note that DESIGN.md is internally inconsistent here: its radius table lists 4px for form inputs while its `text-input` component spec says 6px. The component spec is the more specific statement and wins.
- `dialog.tsx` — stays `rounded-xl`, now correctly 16px. Verify only.
- `popover.tsx`, `dropdown-menu.tsx`, `toast.tsx`, `alert.tsx` — stay `rounded-lg` and `rounded-md`, now 12px and 8px. Verify only.
- `chart.tsx`, `tooltip.tsx` — the `rounded-[2px]` values are arrow and swatch geometry, not container radius. Leave them.
- `calendar.tsx` — `--cell-radius` is a local variable; confirm it still resolves sensibly against the new scale.

**Acceptance criteria**

- [ ] Cards render at 12px, dialogs at 16px, inputs and select triggers at 6px, badges fully rounded
- [ ] No reference to `--radius-4xl`, `--radius-3xl`, `--radius-2xl` or `--radius` remains anywhere in `src/`
- [ ] Form fields are at least 36px tall at 375px
- [ ] Input borders use `--border` (hairline `#dfdfdf`) in light mode
- [ ] Calendar cells render correctly, including range start, middle and end

**Verification**

- [ ] `pnpm run test` — full suite green, including `calendar.test.tsx`, `input.test.tsx`, `tabs.test.tsx`, `toast.test.tsx`
- [ ] `grep -rn 'radius-\(2xl\|3xl\|4xl\)\|var(--radius)' src` returns nothing
- [ ] Manual: open a dialog, a select, a dropdown, the date picker, and a toast, in both themes

**Dependencies:** Task 4

**Files:** `src/components/ui/card.tsx`, `badge.tsx`, `select.tsx`, `input.tsx`, `textarea.tsx`, `calendar.tsx`

**Scope:** M

---

### Checkpoint: Primitives

- [ ] `pnpm run check && pnpm run typecheck && pnpm run test` clean
- [ ] No radius token references a deleted variable
- [ ] Every primitive checked in both themes
- [ ] **Human review before Phase 3**

---

## Phase 3: Shared components and layouts

### Task 6: Apply the display scale and correct shared components

**User stories:** 2, 5, 6

**Description:** Task 2 declared the display tier; this applies it, and removes the weight overrides that contradict DESIGN.md's 500 ceiling.

**What to build**

- `page-header.tsx` — the whole component is `<h1 className="text-2xl font-bold">`. It becomes a display-tier step at weight 500. This is the most visible single change in the phase: it is the title of every page.
- `error-boundary.tsx`, `empty-state.tsx`, `skeleton.tsx`, `sortable-th.tsx`, `date-range-picker.tsx` — audit for off-scale radius and type utilities. `date-range-picker.tsx` uses `rounded-lg` on a trigger button, which should follow the button scale at 6px.
- `src/layouts/sidebar.tsx` — nav items use `rounded-md` (now 8px), which is correct for a menu item; verify rather than change. The `font-semibold` on the app name drops to 500.
- `src/layouts/header.tsx`, `app-layout.tsx` — verify surfaces and borders read correctly against the new palette in both themes.

**Acceptance criteria**

- [ ] Page titles render at the display step, weight 500
- [ ] No `font-bold` or `font-semibold` remains on a heading in `src/components/` or `src/layouts/`
- [ ] The date-range trigger matches button radius
- [ ] Sidebar active and hover states are legible in both themes against the new surfaces
- [ ] App shell holds at 375px, 768px, 1280px

**Verification**

- [ ] `pnpm run test` — green, including `empty-state.test.tsx`, `error-boundary.test.tsx`, `skeleton.test.tsx`, `app-layout.test.tsx`, `header.test.tsx`, `sidebar.test.tsx`
- [ ] Manual: shell and sidebar at all three breakpoints, both themes, sidebar collapsed and expanded

**Dependencies:** Tasks 2, 5

**Files:** `src/components/page-header.tsx`, `date-range-picker.tsx`, `empty-state.tsx`, `error-boundary.tsx`, `sortable-th.tsx`, `src/layouts/sidebar.tsx`, `header.tsx`, `app-layout.tsx`

**Scope:** M

---

### Checkpoint: Shell

- [ ] `pnpm run check && pnpm run typecheck && pnpm run test` clean
- [ ] Navigation and page titles consistent across every route
- [ ] **Human review before Phase 4**

---

## Phase 4: Feature screens

Split in two so each task stays reviewable. Both are audits: find off-scale utilities, fix them, change nothing else.

### Task 7: Dashboard and reports

**User stories:** 1, 2, 5, 6

**Description:** The read-heavy screens. These carry the most ad-hoc typography — `stat-card.tsx` and `user-stats.tsx` both use `font-bold text-2xl` for figures, and `financial-overview.tsx` and `user-stats.tsx` use `font-semibold` section headings.

**What to build**

- `stat-card.tsx` — the figure moves to a display step at weight 500. Its `@max-3xs:text-lg` container-query variant moves to the corresponding scale step. Confirm `font-variant-numeric: tabular-nums` from the base layer still applies so figures stay column-aligned.
- `user-stats.tsx` — same treatment for its figure and its `text-lg font-semibold` heading.
- `financial-overview.tsx` — heading to the scale; verify chart tokens are untouched.
- `comparison-bar-chart.tsx` and its lazy wrapper — the `rounded-md` skeleton is fine at 8px; verify.
- `quick-actions.tsx` — three buttons, one filled. Confirm exactly one is `default` and the rest are `outline`.
- `src/features/reports/*` — three tab components using `font-bold` on total rows. Table totals are emphasis, not display type; drop to weight 500 and let the palette carry the emphasis.

**Acceptance criteria**

- [ ] No `font-bold` or `font-semibold` remains in `src/features/dashboard/` or `src/features/reports/`
- [ ] Figures use display steps and stay tabular-aligned
- [ ] At most one filled emerald button per viewport on every dashboard and reports route
- [ ] `--chart-1..5` untouched; charts render exactly as before
- [ ] Stat cards hold their layout at 375px without overflow

**Verification**

- [ ] `pnpm run test src/features/dashboard src/features/reports` — green
- [ ] Manual: dashboard and all three report tabs, both themes, all three breakpoints
- [ ] Confirm no layout shift on dashboard load — the fix from commit `60a3de5` must survive

**Dependencies:** Task 6

**Files:** `src/features/dashboard/stat-card.tsx`, `user-stats.tsx`, `financial-overview.tsx`, `quick-actions.tsx`, `src/features/reports/donation-summary-tab.tsx`, `expense-summary-tab.tsx`, `donor-statement-tab.tsx`

**Scope:** M

---

### Task 8: CRUD screens, forms, and auth

**User stories:** 1, 2, 5

**Description:** The list and form screens across donations, donors, expenses, users, settings, and auth. Mostly already correct — they consume primitives — so this is a verification pass with a small number of fixes.

**What to build**

- List pages (`donations-page.tsx`, `donors-page.tsx`, `expenses-page.tsx`, `users-page.tsx`) — each has one `default` button plus outline and secondary siblings, which already satisfies emerald scarcity. Verify per screen rather than trusting the grep: some counts include `buttonVariants()` calls, not just rendered buttons.
- Form pages and components — each has one filled submit and one outline cancel. Verify.
- `user-form.tsx` — two raw `<input type="checkbox">` elements with `rounded border-input accent-primary`. `accent-primary` now paints the checkbox emerald, which is correct and worth confirming visually. Bare `rounded` resolves to Tailwind's default 4px, not a token; move it to `rounded-xs`.
- `donor-picker.tsx` — `rounded-lg` on a popover surface is correct at 12px; verify.
- `login-page.tsx` — `CardTitle` overridden to `text-2xl`; move to the scale. This is the only unauthenticated screen and the first thing a user sees.
- `change-password-page.tsx` — verify.

**Acceptance criteria**

- [ ] Every route shows at most one filled emerald button per viewport
- [ ] Checkboxes render emerald when checked, in both themes, and use a token radius
- [ ] Login card title uses a scale step
- [ ] Form validation errors remain legible — `--destructive` was not changed, so confirm it still reads against the new surfaces
- [ ] Tables hold at 375px

**Verification**

- [ ] `pnpm run test src/features` — green
- [ ] Manual: create, edit, and delete flows for donations, donors, and expenses; login; change password; user management. Both themes.
- [ ] Trigger a validation error on each form and confirm the destructive color still meets contrast against `--background` and `--card`

**Dependencies:** Task 6

**Files:** `src/features/auth/login-page.tsx`, `src/features/users/user-form.tsx`, `src/features/donors/donor-picker.tsx`, plus verification across the remaining feature components

**Scope:** M

---

### Checkpoint: Feature screens

- [ ] `pnpm run check && pnpm run typecheck && pnpm run test` clean
- [ ] Every route walked in both themes at all three breakpoints
- [ ] Emerald scarcity holds everywhere
- [ ] **Human review before Phase 5**

---

## Phase 5: Close

### Task 9: Audit, build, and coverage comparison

**User stories:** 3, 6, 7

**Description:** Confirm nothing escaped the token system and that the work is shippable.

**What to build**

No new code. Run the audit greps, the full gate, and compare coverage against the baseline captured before Task 1.

**Acceptance criteria**

- [ ] `grep -rE '#[0-9a-fA-F]{3,8}' src --include='*.tsx'` returns no color literals
- [ ] `grep -rE '(bg|text|border|ring)-(gray|slate|zinc|neutral|stone|emerald|green|red|rose|blue|sky|amber|yellow|orange|purple|violet|indigo|pink)-[0-9]' src --include='*.tsx'` returns nothing
- [ ] `grep -rn 'font-bold\|font-semibold' src --include='*.tsx' | grep -v test` returns nothing on a heading or figure
- [ ] `pnpm run build` succeeds
- [ ] Coverage at or above the pre-Task-1 baseline
- [ ] `git diff --stat DESIGN.md` is empty

**Verification**

- [ ] `pnpm run check && pnpm run typecheck && pnpm run test && pnpm run build`
- [ ] `pnpm run test:coverage`, compared against the captured baseline
- [ ] Before and after screenshots of dashboard, donations list, a form, and login, in both themes, attached to the PR

**Dependencies:** Tasks 7, 8

**Files:** None

**Scope:** XS

---

### Checkpoint: Complete

- [ ] All nine PRD success criteria met
- [ ] Coverage not regressed
- [ ] Commits follow Conventional Commits so release-please can parse them
- [ ] Ready for PR

---

## Risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Task 1 repaints every screen at once; a bad token value is visible everywhere | High | Highest-risk task goes first, alone, with a full visual sweep and a clean revert point. One file, one commit. |
| A future contributor "fixes" near-black-on-emerald to white | High | Task 3's contrast test fails on it. The failure message should name the DESIGN.md decision, not just report a ratio. |
| Emerald `--ring` on focus rings may vibrate against emerald buttons | Medium | Check during Task 4. If it reads poorly, keep the neutral ring and record the deviation in the PRD. |
| Existing tests assert on class strings and break on radius changes | Medium | 61 test files run after every task. Any breakage surfaces within one task of its cause. If a test asserts a class string, that is a signal to fix the test's approach, not to revert the change. |
| `--destructive` was tuned against the old surfaces and may not hold against the new ones | Medium | Explicitly verified in Task 8 against both `--background` and `--card`. If it fails, that is new scope — raise it rather than absorbing it. |
| Removing `font-bold` reads as a loss of emphasis to reviewers used to the current look | Low | Expected. DESIGN.md is explicit that the mid-weight is calibrated and breaks at 600 and above. Screenshots at each checkpoint let the product owner judge before Phase 4 locks it in. |
| DESIGN.md contradicts itself on input radius (4px in the table, 6px in the component spec) | Low | Resolved in Task 5: the component spec wins as the more specific statement. Recorded here so it is not re-litigated. |

## Open questions

Both resolved during implementation.

1. **Focus ring color.** ~~Decide during Task 4.~~ **Resolved:** the emerald ring is effectively invisible against the emerald fill — confirmed by screenshot at Task 4. `--ring` stays emerald globally, since it reads well on inputs and every other control, and the filled button variant alone rings in `foreground`: near-black on the white canvas, white on canvas-night, visible in both.
2. **`--radius-xs` has no consumer.** ~~Keep or drop?~~ **Resolved:** kept. Task 8 gave it a consumer — the `user-form.tsx` checkboxes, which were on Tailwind's bare `rounded` rather than a token.

## Discovered during implementation

Two things the plan did not anticipate, both fixed in place:

- **tailwind-merge did not recognise the custom font sizes.** It only knows Tailwind's built-in size names, so it read `text-display-md` as a colour utility and left `CardTitle`'s `text-base` in place — the login title picked up the display tracking and weight but stayed at 16px. Fixed by registering the DESIGN.md scale via `extendTailwindMerge` in `src/lib/utils.ts`. Any component with a built-in `text-*` class would have hit this.
- **Touch targets were below the DESIGN.md floor.** Buttons and inputs were 32px, against a 36px requirement on mobile. Added `max-md` height variants to `button.tsx`, `input.tsx` and the default-size select trigger, leaving desktop heights alone.
- **A formatting change escaped the commit hook.** `lint-staged` runs `biome lint` on `ts/tsx`, not `biome check`, so a reflow caused by a shortened class only surfaced at `check:ci`. Same gap class as the known import-sorting issue; not fixed here.

Two further defects surfaced only once the app was walked with a real session, both invisible to the per-file audit:

- **`EmptyState` rendered a filled button.** Donations, donors, expenses and users each showed two emerald buttons in one viewport whenever the list was empty, because the empty-state CTA duplicates the page header action. The Task 8 audit counted buttons per file and missed the composed one. Fixed at the source: the CTA is now `outline`.
- **The touch-target fix was incomplete.** Task 4 raised only the `default` and `icon` sizes to 36px on mobile and the criterion was marked met on that basis. The `sm` size, used for list pagination, was still 28px and the column-sort control 20px. All button sizes and the sort control now meet the floor below 768px.

## Verification record

Walked with an authenticated `tesorero` session at 375 / 768 / 1280, in both themes.

| Check | Result |
| --- | --- |
| Dashboard tokens | h1 28px/500/-0.42px, cards 12px, stat figures 28px/500, h2 18px/500 |
| Emerald scarcity | exactly 1 filled button on every route reached |
| Table chrome | row borders resolve to hairline `#dfdfdf`, headers to ink |
| Badges | fully rounded |
| Form controls | inputs, selects and textareas at 6px |
| Touch targets at 375px | no control below 36px |
| `--destructive` on new surfaces | 4.76:1 on canvas and card, 4.56:1 on muted (light); 5.89:1 and 5.63:1 (dark) — all AA |
| Dashboard CLS on reload | 0.00001 — the commit `60a3de5` fix survives |

**Not verified:** `/users`, `/users/new` and `/users/:id/edit` are admin-gated and the session used was `tesorero`.

## Raised, not actioned

**Emerald status badges compete with the CTA.** `donors-page` and `users-page` render the active-status badge as `variant="default"`, which was near-black before and is now emerald. A populated donors list shows ten emerald pills alongside the single emerald CTA, against DESIGN.md's instruction that the primary "should appear sparingly". DESIGN.md does define a green pill, but scopes it to "new" or featured indicators, and offers `pill-tag-soft` for neutral pills. Every other badge in the app is already `secondary`.

Left alone deliberately: switching them changes what the colour *means* (green reads as healthy/active), and if both active and inactive became `secondary` they would stop being distinguishable — a working alternative is active `secondary` plus inactive `outline`. That is a product decision, not a styling one.

## Note on file location

The `agent-skills:plan` convention writes to `tasks/plan.md` and `tasks/todo.md`. This plan is in `docs/plans/` instead, matching the 44 existing plans in this repository, with the task checklist inline rather than in a separate file. The `/build` command expects the `tasks/` paths, so point it at this file explicitly.
