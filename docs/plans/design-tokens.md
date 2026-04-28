# Plan: Design Tokens — Chart Colors

> Source PRD: docs/PRD-design-tokens.md

## Architectural decisions

- **CSS-only change** — no component code changes; charts already consume tokens via `var(--chart-N)`
- **oklch color space** — consistent with existing token definitions throughout `index.css`
- **Equal perceptual lightness** — all five hues target `~0.65` lightness in light mode, `~0.72` in dark mode so hue carries distinction, not lightness alone
- **Notion palette as hue source** — blue (~230°), green (~142°), amber (~60°), purple (~300°), red-orange (~25°); red and green are not placed as adjacent tokens to reduce red-green CVD confusion
- **No new files** — only `index.css` changes

---

## Phase 1: Replace achromatic chart tokens with Notion palette hues

**User stories**: 1, 2, 3, 4, 5, 6, 7

### What to build

Replace the five `--chart-1` through `--chart-5` token values in both the `:root` (light mode) and `.dark` blocks of `index.css`. Current values are pure grays (`oklch(L 0 0)` — zero chroma). New values use five distinct hues from Notion's palette at consistent lightness with chroma in the `0.15–0.22` range.

Light mode target (`L ≈ 0.65`):
- `--chart-1`: blue `oklch(0.65 0.18 230)`
- `--chart-2`: green `oklch(0.65 0.18 142)`
- `--chart-3`: amber `oklch(0.65 0.20 60)`
- `--chart-4`: purple `oklch(0.65 0.18 300)`
- `--chart-5`: red-orange `oklch(0.65 0.20 25)`

Dark mode target (`L ≈ 0.72`): same hue angles, lightness raised for legibility against dark backgrounds.

Verify each color against:
- The chart background for non-text graphical contrast (≥ 3:1, WCAG SC 1.4.11)
- A deuteranopia/protanopia CVD simulation to confirm all five remain distinguishable
- A grayscale print preview to confirm data is not solely color-dependent

### Acceptance criteria

- [ ] All five `--chart-N` tokens in `:root` have non-zero chroma (distinct hues, not grays)
- [ ] All five `--chart-N` tokens in `.dark` have non-zero chroma
- [ ] Financial overview pie chart renders visually distinct colors for each donation type in light mode
- [ ] Financial overview pie chart renders visually distinct colors in dark mode
- [ ] All five chart colors have lightness within `±0.05` of each other (hue carries distinction, not lightness)
- [ ] No two adjacent tokens (1&2, 2&3, 3&4, 4&5) are a red-green pair
- [ ] Colors pass ≥ 3:1 contrast ratio against chart background (verified with browser DevTools or contrast checker)
- [ ] Colors remain distinguishable under deuteranopia simulation in browser DevTools
- [ ] No other design tokens (primary, secondary, muted, destructive, etc.) are changed
