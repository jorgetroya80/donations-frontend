# PRD: Design Tokens — Chart Colors

## Problem Statement

All five chart color tokens (`--chart-1` through `--chart-5`) in both light and dark mode are defined with zero chroma — pure grays at varying lightness levels. This means every data series rendered in charts (pie slices, bar segments) is a shade of gray. Users cannot reliably distinguish between donation categories, expense categories, or any other multi-series chart data by color alone. This violates WCAG 2.1 SC 1.4.1 (Use of Color: information must not be conveyed by color alone), produces visually dull charts, and makes the financial overview unreadable for users with low contrast sensitivity, color vision deficiency, or when printed in grayscale.

## Solution

Replace the five achromatic chart color tokens with distinct hues drawn from Notion's design system color palette, defined in the `oklch` color space. Use consistent perceptual lightness across all five hues (approximately 0.65 for light mode, 0.72 for dark mode) so that the hue carries the distinction — not lightness alone — which preserves readability in grayscale contexts. Define both light and dark mode variants. No component changes are required; charts already consume these tokens via CSS variable references.

## User Stories

1. As a user viewing the financial overview pie chart, I want each donation category (Tithe, Offering, Special Offering, Other) rendered in a visually distinct color, so that I can identify each slice at a glance.
2. As a user reading the dashboard on a monitor with poor contrast, I want chart colors to differ by hue — not just lightness — so that I can distinguish categories even when contrast is low.
3. As a user with red-green color vision deficiency, I want chart colors chosen from a palette that avoids red-green confusion pairs, so that the charts are readable for me.
4. As a user printing the dashboard or a report in grayscale, I want chart data to remain distinguishable by shape, label, and legend — not solely by color — so that printed output is useful.
5. As a user viewing the app in dark mode, I want chart colors to be legible against the dark background, so that the dashboard is usable in low-light environments.
6. As a developer, I want all chart colors defined as a single set of CSS tokens in one location, so that I can update the palette without touching any component code.
7. As a developer adding a new chart type, I want five pre-defined color tokens available, so that I can style new charts consistently without inventing colors ad hoc.

## Implementation Decisions

### Token definitions
- Replace `--chart-1` through `--chart-5` in the `:root` block with five distinct hues from the Notion palette using `oklch()`.
- Target lightness of approximately `0.65` for light mode across all five tokens to equalize perceptual lightness (minimizing lightness-based distinction and making hue the primary differentiator).
- Replace `--chart-1` through `--chart-5` in the `.dark` block with the same hues at lightness approximately `0.72` for sufficient contrast against dark backgrounds.
- Chroma values should be in the range `0.15–0.22` for vibrant but not garish saturation.

### Notion palette mapping
- Source hues from Notion's standard semantic colors: blue, green, amber/yellow, purple, and red/orange.
- Avoid pairing red and green as adjacent tokens (tokens 1 and 2, or 1 and 5) to reduce red-green CVD confusion.
- Recommended hue angles (approximate): blue ~230, green ~142, amber ~60, purple ~300, red-orange ~25.

### Scope
- Only `src/index.css` chart token values change.
- No changes to Recharts components, chart data mappings, or color prop assignments.
- No changes to non-chart design tokens (primary, secondary, destructive, muted, etc.).

### Validation
- Verify tokens render correctly in the `FinancialOverview` pie chart (light + dark mode).
- Verify contrast between each chart color and the chart background meets WCAG AA (4.5:1 for text labels, 3:1 for non-text graphical elements).
- Check all five colors against a red-green CVD simulation (e.g., Coblis or browser DevTools vision deficiency emulator).

## Testing Decisions

Chart color tokens are CSS values — they have no testable JavaScript behavior. Testing strategy is visual and manual:

- **Manual light mode**: open the Dashboard, verify pie chart shows five visually distinct, non-gray colors.
- **Manual dark mode**: toggle dark mode, verify chart colors remain legible and distinct.
- **CVD simulation**: use browser DevTools accessibility emulator (deuteranopia, protanopia) to verify all five colors remain distinguishable.
- **Grayscale print preview**: use browser print preview in grayscale to confirm that chart differentiation does not rely solely on color.

No automated unit tests are appropriate for CSS token values. If a visual regression testing tool (e.g., Chromatic, Percy) is added in the future, snapshot tests would be the right mechanism.

## Out of Scope

- Changing chart library (Recharts is kept as-is).
- Adding chart legends or data labels (separate UX decision).
- Changing non-chart design tokens (primary, accent, semantic colors).
- Adding more than five chart color tokens.
- Theming or white-labeling support.

## Further Notes

Using `oklch()` for all token definitions is already established in the codebase (`src/index.css` uses `oklch` throughout). New chart token values should follow the same format for consistency.

The `oklch` color space is perceptually uniform — equal steps in lightness `L` produce perceptually equal brightness changes — making it the right choice for maintaining consistent chart color lightness across hues.

When selecting the five hues from the Notion palette, prefer the "default" Notion color stops (not their lightest or darkest variants) as a starting point, then adjust lightness to `0.65` to normalize across hues.
