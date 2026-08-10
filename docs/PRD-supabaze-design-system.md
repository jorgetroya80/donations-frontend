# PRD: Supabaze Design System Adoption

## Problem Statement

The application's visual language was assembled incrementally rather than designed. The primary color is achromatic (`oklch(0.205 0 0)` — near-black), so filled buttons read as neutral chrome and no color signals "this is the action to take." Border radii derive from a single `--radius: 0.625rem` base multiplied by arbitrary factors (`* 0.6`, `* 0.8`, `* 1.4`, `* 1.8`, `* 2.2`, `* 2.6`), producing seven radius steps with no design rationale and fractional pixel values. Typography has no defined display tier: headings use ad-hoc Tailwind sizes with default tracking, so large text renders loose and generic rather than deliberate.

A design language now exists as `DESIGN.md` in the repository root — a machine-readable token specification covering colors, typography, radii, spacing, elevation, and component treatments. Nothing in the application consumes it. The gap between the documented system and the shipped interface will widen with every new screen until the tokens are actually wired in.

## Solution

Adopt the `DESIGN.md` token system as the application's visual foundation by rewriting the token declarations in `src/index.css`, then correcting the component treatments that reference off-scale values.

`DESIGN.md` describes a marketing website — hero bands, pricing tiers, composited product screenshots, a site footer. This application is an authenticated CRUD dashboard. Only the token system and component treatments transfer; the marketing surfaces do not. No new pages, no hero sections, no decorative imagery.

The change is unusually contained because a grep across `src/**/*.tsx` finds zero hardcoded palette classes — every color in the application already resolves through a semantic CSS variable. Redefining those variables propagates the new palette to every screen without touching component code. The component work that remains is limited to radius and typography corrections, plus enforcing the emerald-scarcity rule on screens that currently render several filled buttons at once.

Four ambiguities in `DESIGN.md` were resolved with the product owner before this document was written:

| Question | Decision |
| --- | --- |
| `DESIGN.md` ships no dark palette, but the app has full dark mode | Keep dark mode. Derive dark surfaces from the `canvas-night` (`#1c1c1c`) and `canvas-night-soft` (`#202020`) tokens `DESIGN.md` already defines for code blocks and inverted cards |
| How far the restyle reaches | Tokens, UI primitives, and every feature screen |
| Emerald CTA label color | Near-black `#171717` on emerald, per `DESIGN.md`. Contrast is approximately 10:1 and passes WCAG AA. The white-on-emerald alternative measures approximately 2:1 and fails AA, so the `DESIGN.md` choice is both on-brand and the accessible one |
| Border radius scale | Adopt the `DESIGN.md` scale of 4/6/8/12/16px, replacing the multiplier chain |

## User Stories

1. As a treasurer scanning a donations screen, I want the primary action rendered in emerald against otherwise monochrome chrome, so that I can find the action I need without reading every button.
2. As an administrator moving between the dashboard, donors, and expenses, I want headings, cards, and buttons to share one visual rhythm, so that the application reads as a single product rather than a set of screens built at different times.
3. As a user with low vision, I want every text and control color pair to meet WCAG AA contrast, so that I can read the interface without assistive magnification.
4. As a user working in a dark room, I want the dark theme to keep working after the restyle, with surfaces derived from the same design language rather than left behind at the old values.
5. As a user on a phone, I want the restyled interface to hold up at 375px with touch targets at least 36×36px, so that I can record a donation from the hall rather than waiting to get to a desk.
6. As a developer adding a screen, I want one file that defines every color, radius, and type step, so that I can build consistently without inventing values or copying them between components.
7. As a reviewer, I want each token to carry the `DESIGN.md` hex it came from in a trailing comment, so that I can verify the implementation against the specification without converting color spaces by hand.

## Implementation Decisions

### Token foundation

- All tokens are declared in `src/index.css` — in the `@theme inline` block for Tailwind-facing names, and in the `:root` and `.dark` blocks for values. No `tailwind.config.js` is introduced; Tailwind v4 CSS-first configuration is already the established pattern.
- Existing semantic token names (`--primary`, `--card`, `--border`, `--muted-foreground`, and the rest) are preserved. Only their values change. This is what keeps the diff small and is the reason no component needs a color edit.
- Values stay expressed in `oklch()`, matching the existing file. Each declaration carries a trailing comment with the source `DESIGN.md` hex, for example `--primary: oklch(0.7817 0.1471 158.4); /* #3ecf8e */`.
- Any token added to `:root` is added to `.dark` in the same change. The two blocks stay structurally identical.

### Color mapping

- `--primary` becomes emerald `#3ecf8e`; `--primary-foreground` becomes near-black `#171717`.
- A `--primary-deep` token is added for the pressed and hover state, mapped to `#24b47e`.
- `--background` is `#ffffff` and `--foreground` is `#171717` in light mode. The near-black is deliberate — `DESIGN.md` never uses pure black for text.
- The muted and secondary surfaces map to `canvas-soft` `#fafafa`; `--border` and `--input` map to `hairline` `#dfdfdf`.
- Text hierarchy uses the ink ladder: `ink` `#171717` for body, `ink-mute` `#707070` for secondary text and helper copy, `ink-faint` `#b2b2b2` for disabled and placeholder text.
- Dark mode maps `--background` to `canvas-night` `#1c1c1c` and `--card` and `--popover` to `canvas-night-soft` `#202020`. Emerald stays at `#3ecf8e` in both themes — on `#1c1c1c` it measures approximately 8.9:1, which is comfortable, and a single emerald across both themes is simpler to reason about than a per-theme variant.

### Radius scale

- The `--radius` multiplier chain is removed and replaced with five explicit values: `--radius-xs: 4px`, `--radius-sm: 6px`, `--radius-md: 8px`, `--radius-lg: 12px`, `--radius-xl: 16px`.
- Buttons take `--radius-sm` (6px). The base class in `src/components/ui/button.tsx` currently reads `rounded-lg` and must change to `rounded-sm`. The `xs`, `sm`, `icon-xs`, and `icon-sm` size variants use `rounded-[min(var(--radius-md),10px)]` and `rounded-[min(var(--radius-md),12px)]` escape hatches, which become unnecessary once the scale is explicit and should be removed.
- Cards, feature containers, and popovers take `--radius-lg` (12px). Dialogs take `--radius-xl` (16px). Inputs take `--radius-sm` (6px). Badges and pills keep `rounded-full`.
- Pill-shaped buttons are not permitted anywhere; `DESIGN.md` is explicit that the button radius is square-ish.

### Typography

- The typeface stays Geist Variable. `@fontsource-variable/geist` is already a dependency, and `DESIGN.md` names Geist Sans as an accepted open-source substitute for the proprietary Circular. No font package is added.
- The display tier renders at weight 500 with negative tracking, scaling proportionally: -1.92px at 64px, -1.44px at 48px, -0.72px at 36px, -0.42px at 28px. Headings at 22px and below use zero tracking. Body text is weight 400.
- Display weight is never raised above 500. `DESIGN.md` states the calibrated mid-weight breaks at 600 and above.
- Type steps are declared as tokens in `src/index.css` and applied in the base layer and in `src/components/page-header.tsx`.

### Emerald scarcity

- At most one filled emerald button per viewport. On most screens this is the single primary action — "Add donation," "Save," "Create donor."
- Secondary actions move to the `outline` or `ghost` button variants. This is the one part of the work that changes component usage rather than component styling, so each screen's demotion is called out in the pull request description.

### Scope of the sweep

- `src/index.css` — all token declarations.
- `src/components/ui/` — 20 primitives, most importantly `button.tsx`, `card.tsx`, `input.tsx`, `textarea.tsx`, `dialog.tsx`, `badge.tsx`, `alert.tsx`, `table.tsx`.
- `src/components/` — `page-header.tsx`, `empty-state.tsx`, `skeleton.tsx`, `sortable-th.tsx`, `date-range-picker.tsx`.
- `src/layouts/` — app shell, sidebar, header.
- `src/features/` — 34 non-test components across auth, dashboard, donations, donors, expenses, reports, settings, and users, audited for off-scale radius and type utilities and for emerald scarcity.

### Sequencing

Six phases, each independently revertible and each ending with a green `pnpm run check && pnpm run typecheck && pnpm run test`:

1. Token foundation — rewrite `src/index.css`, add the contrast test.
2. Typography scale — display tier tokens and base layer application.
3. UI primitives — `src/components/ui/`.
4. Shared components and layouts.
5. Feature screens — radius and type audit, emerald scarcity.
6. Audit and close — grep for escaped literals, full build, coverage comparison.

## Testing Decisions

The existing 61 test files must stay green throughout. Coverage is captured with `pnpm run test:coverage` before the work starts and must not drop below that baseline.

### New automated test

The work introduces one genuinely new contract — a color relationship that a future well-meaning change could silently break — so it gets a test. `src/test/design-tokens.test.ts` parses the token values from `src/index.css` and asserts:

- `--primary-foreground` on `--primary` meets 4.5:1. This guards the near-black-on-emerald decision specifically. Someone "correcting" it to white would drop contrast to roughly 2:1, and this test fails loudly rather than shipping an inaccessible button.
- `--foreground` on `--background` meets 4.5:1, in both `:root` and `.dark`.
- `--muted-foreground` on `--background` meets 4.5:1, in both `:root` and `.dark`.

### What is deliberately not tested

Exact pixel radii and font sizes are not asserted. Tests that match Tailwind class strings break on every refactor without catching real defects — they verify that the code says what it says, not that it works. The token file is reviewed by eye against `DESIGN.md`, with the hex comments making that review mechanical.

### Manual verification

Each phase is checked in the browser preview at 375px, 768px, and 1280px, in both light and dark themes, before the next phase begins. Phase 5 additionally requires walking every route.

Touch targets are verified at 375px: buttons at least 36×36px and form fields at least 36px tall, per the `DESIGN.md` responsive section.

If a visual regression tool is added later, this is the work that would most benefit from snapshot coverage. Adding one is out of scope here.

## Out of Scope

- Marketing surfaces from `DESIGN.md` — hero bands, pricing tiers, composited product-UI mockups, customer logo strips, the multi-column site footer. This application has no marketing pages.
- Chart color tokens. `--chart-1` through `--chart-5` were deliberately set by [PRD-design-tokens.md](PRD-design-tokens.md) to a Notion-derived palette chosen for red-green color-vision-deficiency safety and equalized perceptual lightness. `DESIGN.md` supplies accent hues but no chart ordering and no CVD rationale, so overriding a considered accessibility decision with an unconsidered brand one would be a regression. The chart tokens stay as they are; revisiting them is separate work.
- The `--destructive` token. `DESIGN.md` defines no destructive or error color — its nearest value, `accent-tomato` `#ff2201`, is explicitly scoped to third-party logos. The existing `--destructive`, which is tuned for contrast in both themes, is kept. This deviation is recorded rather than resolved.
- Adding any dependency, including a font package.
- Replacing `@base-ui/react` or introducing a different component library.
- Copy changes, layout restructuring, and information-architecture changes.
- Promoting `accent-purple`, `accent-violet`, `accent-yellow`, `accent-pink`, `accent-indigo`, or `accent-crimson` to system colors. `DESIGN.md` reserves them for chart points and third-party logos.
- Editing `DESIGN.md`. It is the input to this work, not an output of it.

## Further Notes

The tension worth naming: `DESIGN.md` states that the white-canvas commitment is non-negotiable and ships no dark palette at all. This application has a shipped dark mode with existing users. Removing it to satisfy the specification literally would be a product regression to serve a document. The resolution — deriving dark surfaces from the `canvas-night` family that `DESIGN.md` already defines — extends the system in its own vocabulary rather than either abandoning dark mode or inventing values outside the language.

The near-black-on-emerald button will read as unusual to anyone expecting the conventional white-on-colored-fill. It is deliberate, it is the higher-contrast option by a wide margin, and `DESIGN.md` calls it out twice — once in the Do list and once in the Don't list. The contrast test exists specifically so this decision survives contact with future contributors who have not read this document.

`DESIGN.md` suggests running `npx @google/design.md lint DESIGN.md` after edits. Since this work does not edit `DESIGN.md`, that command is not part of the workflow here.

Commits follow Conventional Commits (`feat(ui):`, `style(ui):`, `refactor(ui):`) because release-please parses them to generate the changelog and version bump.
