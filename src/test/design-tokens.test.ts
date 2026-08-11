/// <reference types="node" />
import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { cn } from '@/lib/utils'

// Read from disk rather than importing: vitest runs with `css: false`, which
// stubs every CSS import — including `?raw` — to an empty string. The path is
// resolved from the repo root because import.meta.url is an http:// URL under
// the jsdom environment.
const CSS = readFileSync(`${process.cwd()}/src/index.css`, 'utf8')

/**
 * Guards the colour contracts in DESIGN.md that are easy to reverse by
 * accident. The near-black-on-emerald primary button in particular reads as a
 * mistake to anyone who has not measured it — white text there would look
 * conventional and drop contrast from ~9:1 to ~2:1.
 *
 * Tokens are parsed out of the real stylesheet rather than duplicated here, so
 * this cannot pass against stale values.
 */

function parseBlock(selector: string): Record<string, string> {
  const start = CSS.indexOf(`${selector} {`)
  if (start === -1) throw new Error(`No ${selector} block in index.css`)
  const end = CSS.indexOf('\n}', start)
  const body = CSS.slice(start, end)

  const tokens: Record<string, string> = {}
  for (const match of body.matchAll(/(--[\w-]+):\s*(oklch\([^)]*\))/g)) {
    const name = match[1]
    const value = match[2]
    if (!name || !value) continue
    tokens[name] = value.replace(/\s+/g, ' ')
  }
  return tokens
}

/** oklch() -> linear sRGB, per the Oklab spec. */
function toLinearRgb(oklch: string): [number, number, number] {
  const match = oklch.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/)
  if (!match) throw new Error(`Cannot parse ${oklch}`)
  const [L, C, H] = [Number(match[1]), Number(match[2]), Number(match[3])] as [
    number,
    number,
    number,
  ]

  const hRad = (H * Math.PI) / 180
  const a = C * Math.cos(hRad)
  const b = C * Math.sin(hRad)

  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3

  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
}

function luminance(oklch: string): number {
  const clamp = (c: number) => Math.min(1, Math.max(0, c))
  const [r, g, b] = toLinearRgb(oklch)
  return 0.2126 * clamp(r) + 0.7152 * clamp(g) + 0.0722 * clamp(b)
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [
    number,
    number,
  ]
  return (hi + 0.05) / (lo + 0.05)
}

const AA = 4.5

describe('design tokens', () => {
  const themes = {
    light: parseBlock(':root'),
    dark: parseBlock('.dark'),
  }

  for (const [theme, tokens] of Object.entries(themes)) {
    describe(theme, () => {
      it('renders the primary button label at WCAG AA', () => {
        // DESIGN.md uses near-black on emerald, not white. If this fails,
        // check --primary-foreground before changing the assertion.
        expect(
          contrast(tokens['--primary-foreground']!, tokens['--primary']!)
        ).toBeGreaterThanOrEqual(AA)
      })

      it('renders body text at WCAG AA', () => {
        expect(
          contrast(tokens['--foreground']!, tokens['--background']!)
        ).toBeGreaterThanOrEqual(AA)
      })

      it('renders muted text at WCAG AA', () => {
        expect(
          contrast(tokens['--muted-foreground']!, tokens['--background']!)
        ).toBeGreaterThanOrEqual(AA)
      })

      // Skeletons, chart placeholders, card and dialog footers and calendar
      // ranges are all bg-muted. If the muted surface collapses into the
      // surface beneath it they stop being visible at all — which is what
      // happened when muted and card were first mapped to the same value.
      it.each([
        '--background',
        '--card',
      ] as const)('keeps the muted surface distinct from %s', (beneath) => {
        expect(contrast(tokens['--muted']!, tokens[beneath]!)).toBeGreaterThan(
          1.1
        )
      })
    })
  }

  it('defines the same token names in both themes', () => {
    expect(Object.keys(themes.dark).sort()).toEqual(
      Object.keys(themes.light).sort()
    )
  })

  // The text scale lives in index.css, but tailwind-merge needs the same names
  // listed again in cn(). If the two drift, a custom size stops overriding a
  // built-in one and the element silently keeps the wrong font-size while
  // still picking up the right tracking and weight. Nothing throws, so only
  // this test catches it.
  describe('text scale', () => {
    const declared = [...CSS.matchAll(/--text-([\w-]+):\s*\d/g)]
      .map((match) => match[1])
      .filter((name): name is string => !!name && !name.includes('--'))

    it('declares a scale to check', () => {
      expect(declared.length).toBeGreaterThan(0)
    })

    it.each(declared)('registers text-%s with tailwind-merge', (name) => {
      expect(cn('text-base', `text-${name}`)).toBe(`text-${name}`)
    })
  })
})
